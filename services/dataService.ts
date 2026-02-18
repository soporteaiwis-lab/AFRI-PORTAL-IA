import { db, isConfigured } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { User, WeekData, ClassSession } from '../types';
import { COURSE_CONTENT } from '../constants';

// CONSTANTES LOCALES
const LOCAL_USERS_KEY = 'afri_local_users';
const LOCAL_CONTENT_KEY = 'afri_local_content';

// USUARIO ADMIN POR DEFECTO (Para inicio inmediato)
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
// 🧠 CEREBRO DE DATOS HÍBRIDO
// ==========================================

// Helper para guardar en localStorage
const saveToLocal = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Error guardando en LocalStorage", e);
    }
};

// Helper para leer de localStorage
const getFromLocal = (key: string): any | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};

// --- INICIALIZACIÓN DE DATOS ---
export const seedDatabaseIfEmpty = async () => {
    // 1. Asegurar datos locales MÍNIMOS para que la app arranque
    let localUsers = getFromLocal(LOCAL_USERS_KEY);
    if (!localUsers || localUsers.length === 0) {
        console.log("⚡ [DATA] Sembrando datos locales por defecto...");
        localUsers = [ROOT_ADMIN];
        saveToLocal(LOCAL_USERS_KEY, localUsers);
        saveToLocal(LOCAL_CONTENT_KEY, COURSE_CONTENT);
    }

    // 2. Intentar sincronizar nube si hay conexión
    if (isConfigured && db) {
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            if (usersSnap.empty) {
                console.log("☁️ [CLOUD] Subiendo semilla a la nube...");
                const batch = writeBatch(db);
                batch.set(doc(db, 'users', ROOT_ADMIN.email), ROOT_ADMIN);
                COURSE_CONTENT.forEach(week => {
                    batch.set(doc(db, 'content', `week-${week.id}`), week);
                });
                await batch.commit();
            }
        } catch (e) {
            console.warn("⚠️ [DATA] No se pudo conectar a la nube. Usando modo local.");
        }
    }
};

// --- OBTENER USUARIOS ---
export const getUsers = async (): Promise<User[]> => {
    // Prioridad 1: Intentar Nube
    if (isConfigured && db) {
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            if (!snapshot.empty) {
                const cloudUsers = snapshot.docs.map(doc => doc.data() as User);
                // Actualizar caché local
                saveToLocal(LOCAL_USERS_KEY, cloudUsers);
                return cloudUsers;
            }
        } catch (e) {
            console.warn("⚠️ Error leyendo nube, cayendo a local.");
        }
    }

    // Prioridad 2: LocalStorage
    const local = getFromLocal(LOCAL_USERS_KEY);
    return local || [ROOT_ADMIN];
};

// --- OBTENER CONTENIDO ---
export const getContent = async (): Promise<WeekData[]> => {
    if (isConfigured && db) {
        try {
            const snapshot = await getDocs(collection(db, 'content'));
            if (!snapshot.empty) {
                const cloudContent = snapshot.docs.map(doc => doc.data() as WeekData);
                const sorted = cloudContent.sort((a, b) => a.id - b.id);
                saveToLocal(LOCAL_CONTENT_KEY, sorted);
                return sorted;
            }
        } catch (e) {
             console.warn("⚠️ Error leyendo nube, cayendo a local.");
        }
    }
    const local = getFromLocal(LOCAL_CONTENT_KEY);
    return local || COURSE_CONTENT;
};

// --- CREAR / ACTUALIZAR USUARIO ---
export const createUser = async (user: User) => {
    // 1. Guardar Localmente (Instantáneo)
    const users = await getUsers();
    const existingIdx = users.findIndex(u => u.email === user.email);
    if (existingIdx >= 0) {
        users[existingIdx] = user;
    } else {
        users.push(user);
    }
    saveToLocal(LOCAL_USERS_KEY, users);

    // 2. Guardar en Nube (Asíncrono)
    if (isConfigured && db) {
        try {
            await setDoc(doc(db, 'users', user.email), user);
        } catch (e) {
            console.error("Error sync nube (create user)", e);
        }
    }
};

export const updateUser = async (user: User) => createUser(user);

// --- BORRAR USUARIO ---
export const deleteUser = async (email: string) => {
    // 1. Local
    const users = await getUsers();
    const filtered = users.filter(u => u.email !== email);
    saveToLocal(LOCAL_USERS_KEY, filtered);

    // 2. Nube
    if (isConfigured && db) {
        try {
            await deleteDoc(doc(db, 'users', email));
        } catch (e) {
            console.error("Error sync nube (delete user)", e);
        }
    }
};

// --- ACTUALIZAR SESIÓN (CONTENIDO) ---
export const updateSession = async (session: ClassSession) => {
    // 1. Local
    const content = await getContent();
    const week = content.find(w => w.id === session.weekId);
    if (week) {
        const sIdx = week.sessions.findIndex(s => s.id === session.id);
        if (sIdx >= 0) {
            week.sessions[sIdx] = session;
            saveToLocal(LOCAL_CONTENT_KEY, content);
            
            // 2. Nube
            if (isConfigured && db) {
                try {
                    await setDoc(doc(db, 'content', `week-${week.id}`), week);
                } catch (e) {
                    console.error("Error sync nube (update session)", e);
                }
            }
            return true;
        }
    }
    return false;
};

// --- GUARDAR PROGRESO ---
export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
    const updatedUser = {
        ...user,
        progress: {
            completed: Object.values(progressJson).filter(v => v).length,
            total: 12
        },
        progress_details: progressJson
    };
    await updateUser(updatedUser);
};
