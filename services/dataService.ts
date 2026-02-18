import { User, WeekData, ClassSession } from '../types';
import { COURSE_CONTENT } from '../constants';

// CONSTANTES DB NATIVA
const DB_USERS_KEY = 'afri_db_users_v2';
const DB_CONTENT_KEY = 'afri_db_content_v2';

// USUARIO ADMIN MAESTRO
const ROOT_ADMIN: User = {
    id: 'root-master',
    email: 'soporte.aiwis@gmail.com',
    name: 'Soporte AIWIS',
    role: 'Master Root',
    avatar: 'S',
    password: '1234',
    stats: { prompting: 100, tools: 100, analysis: 100 },
    progress: { completed: 0, total: 12 },
    progress_details: {}
};

// ==========================================
// 🚀 MOTOR DE BASE DE DATOS NATIVO (LOCAL)
// ==========================================

// Helper privado para simular latencia de red (opcional, para realismo)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getLocalData = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Error lectura DB local", e);
        return null;
    }
};

const setLocalData = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Error escritura DB local", e);
    }
};

// --- INICIALIZACIÓN ---
export const seedDatabaseIfEmpty = async () => {
    // 1. Usuarios
    let users = getLocalData<User[]>(DB_USERS_KEY);
    if (!users || users.length === 0) {
        console.log("⚡ [DB NATIVA] Inicializando tabla Usuarios...");
        setLocalData(DB_USERS_KEY, [ROOT_ADMIN]);
    } else {
        // Asegurar que el admin exista siempre
        if (!users.some(u => u.email === ROOT_ADMIN.email)) {
             users.push(ROOT_ADMIN);
             setLocalData(DB_USERS_KEY, users);
        }
    }

    // 2. Contenido
    let content = getLocalData<WeekData[]>(DB_CONTENT_KEY);
    if (!content || content.length === 0) {
        console.log("⚡ [DB NATIVA] Inicializando tabla Contenidos...");
        setLocalData(DB_CONTENT_KEY, COURSE_CONTENT);
    }
    
    return true;
};

// --- CRUD USUARIOS ---
export const getUsers = async (): Promise<User[]> => {
    // await delay(100); // Simular micro-latencia
    const users = getLocalData<User[]>(DB_USERS_KEY);
    return users || [ROOT_ADMIN];
};

export const createUser = async (user: User) => {
    const users = await getUsers();
    const existingIndex = users.findIndex(u => u.email === user.email);
    
    if (existingIndex >= 0) {
        users[existingIndex] = user;
    } else {
        users.push(user);
    }
    setLocalData(DB_USERS_KEY, users);
    return user;
};

export const updateUser = async (user: User) => createUser(user);

export const deleteUser = async (email: string) => {
    if (email === ROOT_ADMIN.email) throw new Error("No se puede eliminar al Root.");
    
    const users = await getUsers();
    const newUsers = users.filter(u => u.email !== email);
    setLocalData(DB_USERS_KEY, newUsers);
};

// --- CRUD CONTENIDO ---
export const getContent = async (): Promise<WeekData[]> => {
    // await delay(100);
    const content = getLocalData<WeekData[]>(DB_CONTENT_KEY);
    return content || COURSE_CONTENT;
};

export const updateSession = async (session: ClassSession) => {
    const content = await getContent();
    const week = content.find(w => w.id === session.weekId);
    
    if (week) {
        const sIdx = week.sessions.findIndex(s => s.id === session.id);
        if (sIdx >= 0) {
            week.sessions[sIdx] = session;
            setLocalData(DB_CONTENT_KEY, content);
            return true;
        }
    }
    return false;
};

// --- PROGRESO ---
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
