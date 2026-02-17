
import { db } from '../firebaseConfig';
import { User, ClassSession, WeekData } from '../types';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { COURSE_CONTENT } from '../constants'; // Usado para semilla inicial

// Colecciones
const USERS_COL = 'users';
const CONTENT_COL = 'content'; // Guardaremos las sesiones aquí

/**
 * Inicializa la base de datos con datos por defecto si está vacía.
 * Esto asegura que al conectar Firebase por primera vez, no esté todo en blanco.
 */
export const seedDatabaseIfEmpty = async () => {
    if (!db) return;

    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (usersSnap.empty) {
        console.log("Sembrando base de datos inicial...");
        
        // 1. Crear Usuario Admin
        const adminUser: User = {
            id: 'admin-root',
            email: 'armin@aiwis.cl',
            name: 'Armin W Salazar',
            role: 'Master Root',
            avatar: 'A',
            password: '1234',
            stats: { prompting: 100, tools: 100, analysis: 100 },
            progress: { completed: 0, total: 12 },
            progress_details: {}
        };
        await setDoc(doc(db, USERS_COL, adminUser.email), adminUser);

        // 2. Crear Contenido (Flattened sessions)
        for (const week of COURSE_CONTENT) {
            for (const session of week.sessions) {
                const sessionData: ClassSession = {
                    ...session,
                    weekId: week.id,
                    // Aseguramos campos opcionales
                    videoUrl: session.videoUrl || '',
                    transcript: session.transcript || '',
                    description: session.description || ''
                };
                // ID compuesto para fácil acceso: w1-s1
                const docId = `w${week.id}-s${session.sessionNumber}`;
                await setDoc(doc(db, CONTENT_COL, docId), sessionData);
            }
        }
        console.log("Base de datos sembrada.");
    }
};

/**
 * Obtiene usuarios desde Firestore
 */
export const getUsers = async (): Promise<User[]> => {
    if (!db) return []; // Fallback empty
    try {
        const snapshot = await getDocs(collection(db, USERS_COL));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (e) {
        console.error("Error obteniendo usuarios:", e);
        return [];
    }
};

/**
 * Obtiene el contenido (Clases) desde Firestore y lo estructura en Semanas
 */
export const getContent = async (): Promise<WeekData[]> => {
    if (!db) return COURSE_CONTENT; // Fallback to constants if no DB
    try {
        const snapshot = await getDocs(query(collection(db, CONTENT_COL), orderBy('weekId'), orderBy('sessionNumber')));
        
        if (snapshot.empty) return COURSE_CONTENT;

        const sessions = snapshot.docs.map(doc => doc.data() as ClassSession);
        
        // Reconstruir estructura de semanas
        const weeksMap = new Map<number, WeekData>();
        
        sessions.forEach(session => {
            if (!weeksMap.has(session.weekId)) {
                weeksMap.set(session.weekId, {
                    id: session.weekId,
                    title: getWeekTitle(session.weekId), // Helper simple
                    sessions: []
                });
            }
            weeksMap.get(session.weekId)?.sessions.push(session);
        });

        return Array.from(weeksMap.values()).sort((a, b) => a.id - b.id);
    } catch (e) {
        console.error("Error obteniendo contenido:", e);
        return COURSE_CONTENT;
    }
};

// Helper para títulos de semanas (Hardcoded o podría guardarse en DB también)
const getWeekTitle = (id: number) => {
    const titles = [
        "Fundamentos de IA y Productividad",
        "Herramientas y Desarrollo Asistido",
        "Infraestructura Cloud e IA",
        "Automatización Avanzada",
        "Estrategia y Negocio",
        "Proyecto Final"
    ];
    return titles[id - 1] || `Semana ${id}`;
};

/**
 * CRUD USUARIOS
 */
export const updateUser = async (user: User) => {
    if (!db) return;
    try {
        // Usamos el email como ID del documento para unicidad fácil
        await setDoc(doc(db, USERS_COL, user.email), user, { merge: true });
    } catch (e) {
        console.error("Error actualizando usuario:", e);
        throw e;
    }
};

export const deleteUser = async (email: string) => {
    if (!db) return;
    await deleteDoc(doc(db, USERS_COL, email));
};

export const createUser = async (user: User) => {
    if (!db) return;
    // Verificar si existe
    const docRef = doc(db, USERS_COL, user.email);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        throw new Error("El usuario ya existe");
    }
    await setDoc(docRef, user);
};

/**
 * CRUD CONTENIDO
 */
export const updateSession = async (session: ClassSession) => {
    if (!db) return;
    const docId = `w${session.weekId}-s${session.sessionNumber}`;
    await setDoc(doc(db, CONTENT_COL, docId), session, { merge: true });
};

/**
 * Guardar Progreso (Simplificado)
 */
export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
    if (!db) return;
    const count = Object.values(progressJson).filter(v => v).length;
    
    const userRef = doc(db, USERS_COL, user.email);
    await updateDoc(userRef, {
        progress: { completed: count, total: 12 },
        progress_details: progressJson
    });
};
