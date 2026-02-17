
import { User, ClassSession, WeekData } from '../types';
import { COURSE_CONTENT } from '../constants';

// --- MOTOR DE BASE DE DATOS INTERNO (INTERNAL DB ENGINE) ---
// Este servicio gestiona toda la persistencia de datos localmente.
// No requiere API Keys externas.

const DB_KEYS = {
    USERS: 'afri_sys_users_v1',
    CONTENT: 'afri_sys_content_v1'
};

// --- DATA SEEDING (SEMILLA INICIAL) ---
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
// INTERNAL CONTROLLERS
// ==========================================

const _loadUsers = (): User[] => {
    try {
        const data = localStorage.getItem(DB_KEYS.USERS);
        if (!data) return [ROOT_ADMIN];
        return JSON.parse(data);
    } catch (e) {
        return [ROOT_ADMIN];
    }
};

const _saveUsers = (users: User[]) => {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
};

const _loadContent = (): WeekData[] => {
    try {
        const data = localStorage.getItem(DB_KEYS.CONTENT);
        if (!data) return COURSE_CONTENT;
        
        // Rehidratar datos: Mezclar estructura base con cambios guardados
        const savedSessions: ClassSession[] = JSON.parse(data);
        const contentClone = JSON.parse(JSON.stringify(COURSE_CONTENT)) as WeekData[];
        
        savedSessions.forEach(savedS => {
            contentClone.forEach(week => {
                const idx = week.sessions.findIndex(s => s.id === savedS.id);
                if (idx !== -1) {
                    week.sessions[idx] = { ...week.sessions[idx], ...savedS };
                }
            });
        });
        return contentClone;
    } catch (e) {
        return COURSE_CONTENT;
    }
};

const _saveSessionUpdate = (session: ClassSession) => {
    const data = localStorage.getItem(DB_KEYS.CONTENT);
    let savedSessions: ClassSession[] = data ? JSON.parse(data) : [];
    
    const index = savedSessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
        savedSessions[index] = session;
    } else {
        savedSessions.push(session);
    }
    
    localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(savedSessions));
};

// ==========================================
// PUBLIC API SERVICES
// ==========================================

export const seedDatabaseIfEmpty = async () => {
    // Inicialización silenciosa del motor interno
    if (!localStorage.getItem(DB_KEYS.USERS)) {
        _saveUsers([ROOT_ADMIN]);
        console.log("⚡ [INTERNAL_DB] Sistema inicializado correctamente.");
    }
};

export const getUsers = async (): Promise<User[]> => {
    // Simular latencia de red mínima para realismo
    return new Promise(resolve => {
        setTimeout(() => resolve(_loadUsers()), 100);
    });
};

export const getContent = async (): Promise<WeekData[]> => {
    return new Promise(resolve => {
        setTimeout(() => resolve(_loadContent()), 100);
    });
};

export const createUser = async (user: User) => {
    const users = _loadUsers();
    if (users.find(u => u.email === user.email)) {
        throw new Error("El usuario ya existe.");
    }
    users.push(user);
    _saveUsers(users);
};

export const updateUser = async (user: User) => {
    const users = _loadUsers();
    const index = users.findIndex(u => u.email === user.email);
    if (index !== -1) {
        users[index] = user;
        _saveUsers(users);
    }
};

export const deleteUser = async (email: string) => {
    const users = _loadUsers().filter(u => u.email !== email);
    _saveUsers(users);
};

export const updateSession = async (session: ClassSession) => {
    try {
        const safeSession = {
            ...session,
            videoUrl: session.videoUrl || '',
            transcript: session.transcript || '',
            description: session.description || '',
            quiz: session.quiz || [],
            date: session.date || 'Por definir'
        };
        _saveSessionUpdate(safeSession);
        return true;
    } catch (e) {
        return false;
    }
};

export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
    const count = Object.values(progressJson).filter(v => v).length;
    const updatedUser = { 
        ...user, 
        progress: { completed: count, total: 12 },
        progress_details: progressJson
    };
    updateUser(updatedUser);
};
