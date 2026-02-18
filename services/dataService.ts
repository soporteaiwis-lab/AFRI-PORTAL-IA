import { db, isConfigured } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { User, WeekData, ClassSession } from '../types';
import { COURSE_CONTENT } from '../constants';

// CONSTANTES LOCALES
const LOCAL_USERS_KEY = 'afri_local_users';
const LOCAL_CONTENT_KEY = 'afri_local_content';

// USUARIO ADMIN POR DEFECTO (MASTER ROOT - SOPORTE AIWIS)
const ROOT_ADMIN: User = {
    id: 'root-admin-master',
    email: 'soporte.aiwis@gmail.com',
    name: 'Soporte AIWIS',
    role: 'Master Root',
    avatar: 'S',
    password: '1234', // Contraseña inicial por defecto
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
    
    // Verificamos si el admin correcto existe en los datos locales, si no, forzamos la actualización
    const adminExists = localUsers && localUsers.some((u: User) => u.email === ROOT_ADMIN.email);

    if (!localUsers || localUsers.length === 0 || !adminExists) {
        console.log("⚡ [DATA] Sembrando datos locales con cuenta MAESTRA: soporte.aiwis@gmail.com...");
        
        // Si ya había usuarios pero no estaba el admin, lo agregamos conservando los otros
        if (localUsers && localUsers.length > 0) {
             localUsers.push(ROOT_ADMIN);
        } else {
             localUsers = [ROOT_ADMIN];
        }
        
        saveToLocal(LOCAL_USERS_KEY, localUsers);
        
        // Si no hay contenido, lo creamos
        const localContent = getFromLocal(LOCAL_CONTENT_KEY);
        if (!localContent) {
            saveToLocal(LOCAL_CONTENT_KEY, COURSE_CONTENT);
        }
    }

    // 2. Intentar sincronizar nube si hay conexión
    if (isConfigured && db) {
        try {
            // Verificar si el usuario Master existe en la nube
            const masterDoc = await getDocs(collection(db, 'users'));
            let masterFound = false;
            masterDoc.forEach(doc => {
                if (doc.id === ROOT_ADMIN.email) masterFound = true;
            });

            if (!masterFound) {
                console.log("☁️ [CLOUD] Inicializando cuenta Master Root en Firebase...");
                await setDoc(doc(db, 'users', ROOT_ADMIN.email), ROOT_ADMIN);
            }
            
            // Verificar contenido base
            const contentSnap = await getDocs(collection(db, 'content'));
            if (contentSnap.empty) {
                console.log("☁️ [CLOUD] Subiendo estructura del curso...");
                const batch = writeBatch(db);
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
    // Evitar borrar al Master Root
    if (email === ROOT_ADMIN.email) {
        throw new Error("No se puede eliminar al usuario Master Root del sistema.");
    }

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