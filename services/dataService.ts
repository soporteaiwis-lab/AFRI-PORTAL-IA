import { User, WeekData, ClassSession } from '../types';
import { COURSE_CONTENT } from '../constants';
import { db } from '../firebaseConfig';
// Importamos funciones de firestore dinámicamente o usamos any para evitar crash en build estático sin los módulos
import * as Firestore from 'firebase/firestore'; 

// ============================================================================
// 🧠 MEMORIA RAM (Volátil - Garantiza acceso inmediato)
// ============================================================================

let MEMORY_USERS: User[] = [
    {
        id: 'root-master',
        email: 'soporte.aiwis@gmail.com',
        name: 'Soporte AIWIS',
        role: 'Master Root',
        avatar: 'S',
        password: '1234',
        stats: { prompting: 100, tools: 100, analysis: 100 },
        progress: { completed: 0, total: 12 },
        progress_details: {}
    }
];

let MEMORY_CONTENT: WeekData[] = JSON.parse(JSON.stringify(COURSE_CONTENT));

// Helper seguro para saber si usar nube
const canUseCloud = () => !!db;

// ============================================================================
// ☁️ SERVICIOS
// ============================================================================

export const seedDatabaseIfEmpty = async () => {
    console.log(`[DATA] Iniciando servicio. Modo Nube: ${canUseCloud() ? 'ON' : 'OFF'}`);
    return true;
};

export const getUsers = async (): Promise<User[]> => {
    if (canUseCloud()) {
        try {
            // @ts-ignore
            const querySnapshot = await Firestore.getDocs(Firestore.collection(db, "users"));
            const users: User[] = [];
            querySnapshot.forEach((doc: any) => users.push(doc.data() as User));
            if (users.length > 0) return users;
        } catch (e) {
            console.error("Error leyendo nube, usando RAM:", e);
        }
    }
    return MEMORY_USERS;
};

export const getContent = async (): Promise<WeekData[]> => {
    // Por simplicidad y velocidad, el contenido estructura se mantiene en código/RAM
    // En una versión futura completa, esto leería de Firestore
    return MEMORY_CONTENT;
};

export const createUser = async (user: User) => {
    // Actualizar RAM primero (UI Instantánea)
    const idx = MEMORY_USERS.findIndex(u => u.email === user.email);
    if (idx >= 0) MEMORY_USERS[idx] = user;
    else MEMORY_USERS.push(user);

    // Intentar Nube en segundo plano
    if (canUseCloud()) {
        try {
            // @ts-ignore
            await Firestore.setDoc(Firestore.doc(db, "users", user.email), user);
        } catch (e) { console.error("Cloud Write Error:", e); }
    }
};

export const updateUser = async (user: User) => createUser(user);

export const deleteUser = async (email: string) => {
    if (email === 'soporte.aiwis@gmail.com') throw new Error("Acceso Denegado: Root es intocable.");
    
    MEMORY_USERS = MEMORY_USERS.filter(u => u.email !== email);

    if (canUseCloud()) {
        try {
            // @ts-ignore
            await Firestore.deleteDoc(Firestore.doc(db, "users", email));
        } catch (e) { console.error("Cloud Delete Error:", e); }
    }
};

export const updateSession = async (session: ClassSession) => {
    const week = MEMORY_CONTENT.find(w => w.id === session.weekId);
    if (week) {
        const idx = week.sessions.findIndex(s => s.id === session.id);
        if (idx >= 0) {
            week.sessions[idx] = session;
            return true;
        }
    }
    return false;
};

export const saveUserProgress = async (user: User, progressDetails: Record<string, boolean>) => {
    const updatedUser = {
        ...user,
        progress: {
            completed: Object.values(progressDetails).filter(Boolean).length,
            total: 12
        },
        progress_details: progressDetails
    };
    await updateUser(updatedUser);
};
