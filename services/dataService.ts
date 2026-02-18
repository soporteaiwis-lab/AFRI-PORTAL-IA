import { User, WeekData, ClassSession } from '../types';
import { COURSE_CONTENT } from '../constants';

// --- CLAVES DE BASE DE DATOS LOCAL ---
const DB_USERS_KEY = 'afri_sys_users_v4';
const DB_CONTENT_KEY = 'afri_sys_content_v4';

// --- USUARIO MASTER (Siempre existe) ---
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

// --- HELPERS DB ---
const getDB = <T>(key: string): T | null => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
};

const setDB = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(e);
    }
};

// --- INICIALIZACIÓN ---
export const seedDatabaseIfEmpty = async () => {
    // 1. Usuarios
    let users = getDB<User[]>(DB_USERS_KEY);
    if (!users || !Array.isArray(users)) {
        users = [ROOT_ADMIN];
        setDB(DB_USERS_KEY, users);
    } else {
        // Asegurar admin
        const hasAdmin = users.some(u => u.email === ROOT_ADMIN.email);
        if (!hasAdmin) {
            users.push(ROOT_ADMIN);
            setDB(DB_USERS_KEY, users);
        }
    }

    // 2. Contenido
    let content = getDB<WeekData[]>(DB_CONTENT_KEY);
    if (!content || !Array.isArray(content)) {
        setDB(DB_CONTENT_KEY, COURSE_CONTENT);
    }
    
    return true;
};

// --- CRUD API ---

export const getUsers = async (): Promise<User[]> => {
    const users = getDB<User[]>(DB_USERS_KEY);
    return users || [ROOT_ADMIN];
};

export const getContent = async (): Promise<WeekData[]> => {
    const content = getDB<WeekData[]>(DB_CONTENT_KEY);
    return content || COURSE_CONTENT;
};

export const createUser = async (user: User) => {
    const users = await getUsers();
    const idx = users.findIndex(u => u.email === user.email);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    setDB(DB_USERS_KEY, users);
};

export const updateUser = async (user: User) => createUser(user);

export const deleteUser = async (email: string) => {
    if (email === ROOT_ADMIN.email) return;
    const users = await getUsers();
    setDB(DB_USERS_KEY, users.filter(u => u.email !== email));
};

export const updateSession = async (session: ClassSession) => {
    const content = await getContent();
    const week = content.find(w => w.id === session.weekId);
    if (week) {
        const sIdx = week.sessions.findIndex(s => s.id === session.id);
        if (sIdx >= 0) {
            week.sessions[sIdx] = session;
            setDB(DB_CONTENT_KEY, content);
            return true;
        }
    }
    return false;
};

export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
    const updatedUser = {
        ...user,
        progress: {
            completed: Object.values(progressJson).filter(Boolean).length,
            total: 12
        },
        progress_details: progressJson
    };
    await updateUser(updatedUser);
};
