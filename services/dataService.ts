import { User, WeekData, ClassSession } from '../types';
import { COURSE_CONTENT } from '../constants';

// --- CLAVES DE ALMACENAMIENTO NATIVO ---
const DB_USERS_KEY = 'afri_db_users_native';
const DB_CONTENT_KEY = 'afri_db_content_native';

// --- USUARIO MASTER (INMUTABLE) ---
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

// --- ENGINE NATIVO ---
const getStorage = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch { return null; }
};

const setStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- API ---

export const seedDatabaseIfEmpty = async () => {
    // Inicializar Usuarios si está vacío
    let users = getStorage<User[]>(DB_USERS_KEY);
    if (!users || !Array.isArray(users) || users.length === 0) {
        setStorage(DB_USERS_KEY, [ROOT_ADMIN]);
    } else {
        // Asegurar que ROOT exista siempre
        if (!users.some(u => u.email === ROOT_ADMIN.email)) {
            users.push(ROOT_ADMIN);
            setStorage(DB_USERS_KEY, users);
        }
    }

    // Inicializar Contenido si está vacío
    let content = getStorage<WeekData[]>(DB_CONTENT_KEY);
    if (!content || !Array.isArray(content) || content.length === 0) {
        setStorage(DB_CONTENT_KEY, COURSE_CONTENT);
    }
    return true;
};

export const getUsers = async (): Promise<User[]> => {
    const users = getStorage<User[]>(DB_USERS_KEY);
    return users || [ROOT_ADMIN];
};

export const getContent = async (): Promise<WeekData[]> => {
    const content = getStorage<WeekData[]>(DB_CONTENT_KEY);
    return content || COURSE_CONTENT;
};

export const createUser = async (user: User) => {
    const users = await getUsers();
    // Evitar duplicados por email
    const index = users.findIndex(u => u.email === user.email);
    if (index >= 0) {
        users[index] = user; // Actualizar si existe
    } else {
        users.push(user);
    }
    setStorage(DB_USERS_KEY, users);
    return user;
};

export const updateUser = async (user: User) => createUser(user);

export const deleteUser = async (email: string) => {
    if (email === ROOT_ADMIN.email) throw new Error("No puedes eliminar al Root Master.");
    const users = await getUsers();
    const newUsers = users.filter(u => u.email !== email);
    setStorage(DB_USERS_KEY, newUsers);
};

export const updateSession = async (session: ClassSession) => {
    const content = await getContent();
    const week = content.find(w => w.id === session.weekId);
    if (week) {
        const index = week.sessions.findIndex(s => s.id === session.id);
        if (index >= 0) {
            week.sessions[index] = session;
            setStorage(DB_CONTENT_KEY, content);
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
