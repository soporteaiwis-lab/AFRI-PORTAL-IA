
import { db, isConfigured } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, updateDoc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { User, WeekData, ClassSession } from '../types';
import { COURSE_CONTENT } from '../constants';

// --- DATA SERVICE: PURE CLOUD (NO CACHE FALLBACK) ---
// Este servicio ahora exige conexión a internet y configuración válida.
// Si no hay nube, lanza error. Esto garantiza que si guarda, guarda en la DB.

const USERS_COLLECTION = 'users';
const CONTENT_COLLECTION = 'content';

// --- SEMILLA INICIAL ---
const ROOT_ADMIN: User = {
    id: 'root-admin',
    email: 'armin@aiwis.cl',
    name: 'Armin W Salazar',
    role: 'Master Root',
    avatar: 'A',
    password: '1234',
    stats: { prompting: 100, tools: 100, analysis: 100 },
    progress: { completed: 0, total: 12 },
    progress_details: {}
};

// ==========================================
// SERVICIOS PÚBLICOS (CLOUD ONLY)
// ==========================================

const ensureConnection = () => {
    if (!isConfigured || !db) {
        throw new Error("⛔ ERROR CRÍTICO: No hay conexión a la Base de Datos Google Cloud. Configure las credenciales.");
    }
};

export const seedDatabaseIfEmpty = async () => {
    ensureConnection();
    try {
        const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
        
        if (usersSnap.empty) {
            console.log("⚡ [CLOUD] Inicializando base de datos vacía en la nube...");
            const batch = writeBatch(db);
            
            // Crear Admin por defecto
            const adminRef = doc(db, USERS_COLLECTION, ROOT_ADMIN.email);
            batch.set(adminRef, ROOT_ADMIN);
            
            // Crear Estructura del Curso
            COURSE_CONTENT.forEach(week => {
                const weekRef = doc(db, CONTENT_COLLECTION, `week-${week.id}`);
                batch.set(weekRef, week);
            });
            
            await batch.commit();
            console.log("✅ [CLOUD] Estructura base creada correctamente.");
        }
    } catch (e) {
        console.error("❌ [CLOUD] Error al sembrar base de datos:", e);
        throw e;
    }
};

export const getUsers = async (): Promise<User[]> => {
    if (!isConfigured) return []; 
    try {
        const snapshot = await getDocs(collection(db, USERS_COLLECTION));
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => doc.data() as User);
    } catch (e) {
        console.error("Error obteniendo usuarios de Cloud:", e);
        throw e;
    }
};

export const getContent = async (): Promise<WeekData[]> => {
    if (!isConfigured) return [];
    try {
        const snapshot = await getDocs(collection(db, CONTENT_COLLECTION));
        if (snapshot.empty) return []; // Retornar vacío para forzar seed si es necesario
        const data = snapshot.docs.map(doc => doc.data() as WeekData);
        return data.sort((a, b) => a.id - b.id);
    } catch (e) {
        console.error("Error obteniendo contenido de Cloud:", e);
        throw e;
    }
};

export const createUser = async (user: User) => {
    ensureConnection();
    // Guardado directo en Firestore
    await setDoc(doc(db, USERS_COLLECTION, user.email), user);
};

export const updateUser = async (user: User) => {
    ensureConnection();
    // Actualización directa en Firestore
    await setDoc(doc(db, USERS_COLLECTION, user.email), user, { merge: true });
};

export const deleteUser = async (email: string) => {
    ensureConnection();
    // Borrado directo en Firestore
    await deleteDoc(doc(db, USERS_COLLECTION, email));
};

export const updateSession = async (session: ClassSession) => {
    ensureConnection();
    try {
        const weekRef = doc(db, CONTENT_COLLECTION, `week-${session.weekId}`);
        const weekSnap = await getDoc(weekRef);
        
        if (weekSnap.exists()) {
            const weekData = weekSnap.data() as WeekData;
            const sessionIndex = weekData.sessions.findIndex(s => s.id === session.id);
            
            if (sessionIndex !== -1) {
                // Actualizar array en memoria
                weekData.sessions[sessionIndex] = {
                        ...session,
                        videoUrl: session.videoUrl || '',
                        transcript: session.transcript || ''
                };
                // Sobrescribir documento semana en la nube
                await setDoc(weekRef, weekData);
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("Error actualizando sesión en Cloud:", e);
        throw e;
    }
};

export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
    ensureConnection();
    const count = Object.values(progressJson).filter(v => v).length;
    
    const userRef = doc(db, USERS_COLLECTION, user.email);
    await updateDoc(userRef, {
        "progress.completed": count,
        "progress_details": progressJson
    });
};
