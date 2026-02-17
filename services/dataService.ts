
import { db, isConfigured } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { User, WeekData, ClassSession } from '../types';
import { COURSE_CONTENT } from '../constants';

// --- DATA SERVICE: GOOGLE CLOUD FIRESTORE ---
// Este servicio ahora ignora la memoria caché y lee directamente de la nube.

const USERS_COLLECTION = 'users';
const CONTENT_COLLECTION = 'content';

// SEMILLA INICIAL (Solo si la nube está vacía)
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
// CLOUD SERVICES (FIRESTORE)
// ==========================================

export const seedDatabaseIfEmpty = async () => {
    if (!isConfigured || !db) return;

    try {
        const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
        
        // Si no hay usuarios, creamos el Admin y el Contenido Base
        if (usersSnap.empty) {
            console.log("⚡ [CLOUD] Inicializando base de datos vacía...");
            const batch = writeBatch(db);

            // 1. Crear Admin
            const adminRef = doc(db, USERS_COLLECTION, ROOT_ADMIN.email);
            batch.set(adminRef, ROOT_ADMIN);

            // 2. Crear Contenido
            // Guardamos cada semana como un documento separado para mejor escalabilidad
            COURSE_CONTENT.forEach(week => {
                const weekRef = doc(db, CONTENT_COLLECTION, `week-${week.id}`);
                batch.set(weekRef, week);
            });

            await batch.commit();
            console.log("✅ [CLOUD] Datos semilla creados exitosamente.");
        }
    } catch (e) {
        console.error("❌ [CLOUD] Error al inicializar DB:", e);
    }
};

export const getUsers = async (): Promise<User[]> => {
    if (!isConfigured || !db) return [ROOT_ADMIN]; // Fallback solo si no hay config
    
    try {
        const snapshot = await getDocs(collection(db, USERS_COLLECTION));
        return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        return [];
    }
};

export const getContent = async (): Promise<WeekData[]> => {
    if (!isConfigured || !db) return COURSE_CONTENT;

    try {
        const snapshot = await getDocs(collection(db, CONTENT_COLLECTION));
        if (snapshot.empty) return COURSE_CONTENT;
        
        // Ordenar por ID de semana
        const data = snapshot.docs.map(doc => doc.data() as WeekData);
        return data.sort((a, b) => a.id - b.id);
    } catch (error) {
        console.error("Error obteniendo contenido:", error);
        return COURSE_CONTENT;
    }
};

export const createUser = async (user: User) => {
    if (!isConfigured || !db) throw new Error("No hay conexión a la nube");
    await setDoc(doc(db, USERS_COLLECTION, user.email), user);
};

export const updateUser = async (user: User) => {
    if (!isConfigured || !db) throw new Error("No hay conexión a la nube");
    await setDoc(doc(db, USERS_COLLECTION, user.email), user, { merge: true });
};

export const deleteUser = async (email: string) => {
    if (!isConfigured || !db) throw new Error("No hay conexión a la nube");
    // Nota: Firestore client SDK no tiene deleteDoc directo en import simple a veces, 
    // pero setDoc con merge false o deleteDoc standard funciona.
    // Usamos una actualización lógica o delete directo si importado.
    // Como no importé deleteDoc arriba, lo agrego ahora o uso un workaround.
    // Mejor importo deleteDoc arriba (se asume agregado en imports).
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, USERS_COLLECTION, email));
};

export const updateSession = async (session: ClassSession) => {
    if (!isConfigured || !db) return false;

    try {
        // En Firestore, la sesión está dentro de un documento "Week".
        // Necesitamos leer la semana, modificar la sesión y guardar la semana.
        const weekRef = doc(db, CONTENT_COLLECTION, `week-${session.weekId}`);
        const weekSnap = await getDoc(weekRef);
        
        if (weekSnap.exists()) {
            const weekData = weekSnap.data() as WeekData;
            const sessionIndex = weekData.sessions.findIndex(s => s.id === session.id);
            
            if (sessionIndex !== -1) {
                // Asegurar campos limpios
                const safeSession = {
                    ...session,
                    videoUrl: session.videoUrl || '',
                    transcript: session.transcript || '',
                    description: session.description || '',
                    quiz: session.quiz || [],
                    date: session.date || 'Por definir'
                };

                weekData.sessions[sessionIndex] = safeSession;
                await setDoc(weekRef, weekData);
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("Error updating session:", e);
        return false;
    }
};

export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
    if (!isConfigured || !db) return;

    const count = Object.values(progressJson).filter(v => v).length;
    const userRef = doc(db, USERS_COLLECTION, user.email);
    
    await updateDoc(userRef, {
        "progress.completed": count,
        "progress_details": progressJson
    });
};
