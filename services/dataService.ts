
import { db, isConfigured } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { User, WeekData, ClassSession } from '../types';
import { COURSE_CONTENT } from '../constants';

// --- DATA SERVICE: DUAL ENGINE (CLOUD + LOCAL FAILOVER) ---
// 1. Intenta conectar a Google Cloud Firestore (Nube).
// 2. Si fallan las credenciales o la red, usa almacenamiento local silencioso para no detener el uso.

const USERS_COLLECTION = 'users';
const CONTENT_COLLECTION = 'content';
const LOCAL_KEYS = {
    USERS: 'afri_sys_users_backup',
    CONTENT: 'afri_sys_content_backup'
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

// --- INTERNAL HELPERS (FAILOVER SYSTEM) ---
const _localLoadUsers = (): User[] => {
    try {
        const data = localStorage.getItem(LOCAL_KEYS.USERS);
        return data ? JSON.parse(data) : [ROOT_ADMIN];
    } catch { return [ROOT_ADMIN]; }
};

const _localSaveUsers = (users: User[]) => {
    localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(users));
};

const _localLoadContent = (): WeekData[] => {
    try {
        const data = localStorage.getItem(LOCAL_KEYS.CONTENT);
        if (!data) return COURSE_CONTENT;
        // Merge logic simplificada
        return JSON.parse(data);
    } catch { return COURSE_CONTENT; }
};

const _localSaveContent = (content: WeekData[]) => {
    localStorage.setItem(LOCAL_KEYS.CONTENT, JSON.stringify(content));
};

// ==========================================
// PUBLIC API SERVICES
// ==========================================

export const seedDatabaseIfEmpty = async () => {
    // Intento Cloud
    if (isConfigured && db) {
        try {
            const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
            if (usersSnap.empty) {
                console.log("⚡ [CLOUD] Inicializando base de datos vacía...");
                const batch = writeBatch(db);
                const adminRef = doc(db, USERS_COLLECTION, ROOT_ADMIN.email);
                batch.set(adminRef, ROOT_ADMIN);
                COURSE_CONTENT.forEach(week => {
                    const weekRef = doc(db, CONTENT_COLLECTION, `week-${week.id}`);
                    batch.set(weekRef, week);
                });
                await batch.commit();
            }
            return;
        } catch (e) {
            console.warn("⚠️ [CLOUD] Fallo en seed, usando local.", e);
        }
    }
    // Fallback Local
    if (!localStorage.getItem(LOCAL_KEYS.USERS)) {
        _localSaveUsers([ROOT_ADMIN]);
    }
};

export const getUsers = async (): Promise<User[]> => {
    // 1. Intentar Cloud
    if (isConfigured && db) {
        try {
            const snapshot = await getDocs(collection(db, USERS_COLLECTION));
            if (!snapshot.empty) {
                return snapshot.docs.map(doc => doc.data() as User);
            }
        } catch (e) {
            console.error("Cloud Error (getUsers):", e);
        }
    }
    // 2. Fallback Local
    return _localLoadUsers();
};

export const getContent = async (): Promise<WeekData[]> => {
    if (isConfigured && db) {
        try {
            const snapshot = await getDocs(collection(db, CONTENT_COLLECTION));
            if (!snapshot.empty) {
                const data = snapshot.docs.map(doc => doc.data() as WeekData);
                return data.sort((a, b) => a.id - b.id);
            }
        } catch (e) {
            console.error("Cloud Error (getContent):", e);
        }
    }
    return _localLoadContent();
};

export const createUser = async (user: User) => {
    // 1. Cloud
    if (isConfigured && db) {
        try {
            await setDoc(doc(db, USERS_COLLECTION, user.email), user);
            return; // Éxito en nube
        } catch (e) {
            console.error("Cloud Create Error:", e);
            // Si falla nube, seguimos a local para no bloquear al usuario
        }
    }
    
    // 2. Local
    const users = _localLoadUsers();
    if (users.find(u => u.email === user.email)) throw new Error("Usuario ya existe (Local DB)");
    users.push(user);
    _localSaveUsers(users);
};

export const updateUser = async (user: User) => {
    // 1. Cloud
    if (isConfigured && db) {
        try {
            await setDoc(doc(db, USERS_COLLECTION, user.email), user, { merge: true });
            return;
        } catch (e) {
             console.error("Cloud Update Error:", e);
        }
    }

    // 2. Local
    const users = _localLoadUsers();
    const idx = users.findIndex(u => u.email === user.email);
    if (idx !== -1) {
        users[idx] = user;
        _localSaveUsers(users);
    }
};

export const deleteUser = async (email: string) => {
    // 1. Cloud
    if (isConfigured && db) {
        try {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, USERS_COLLECTION, email));
            return;
        } catch (e) {
             console.error("Cloud Delete Error:", e);
        }
    }

    // 2. Local
    const users = _localLoadUsers().filter(u => u.email !== email);
    _localSaveUsers(users);
};

export const updateSession = async (session: ClassSession) => {
    let success = false;

    // 1. Cloud
    if (isConfigured && db) {
        try {
            const weekRef = doc(db, CONTENT_COLLECTION, `week-${session.weekId}`);
            const weekSnap = await getDoc(weekRef);
            
            if (weekSnap.exists()) {
                const weekData = weekSnap.data() as WeekData;
                const sessionIndex = weekData.sessions.findIndex(s => s.id === session.id);
                
                if (sessionIndex !== -1) {
                    weekData.sessions[sessionIndex] = {
                         ...session,
                         videoUrl: session.videoUrl || '', // Asegurar string
                         transcript: session.transcript || ''
                    };
                    await setDoc(weekRef, weekData);
                    success = true;
                }
            }
        } catch (e) {
            console.error("Cloud Session Update Error:", e);
        }
    }

    if (success) return true;

    // 2. Local Fallback
    const content = _localLoadContent();
    const week = content.find(w => w.id === session.weekId);
    if (week) {
        const sIdx = week.sessions.findIndex(s => s.id === session.id);
        if (sIdx !== -1) {
            week.sessions[sIdx] = session;
            _localSaveContent(content);
            return true;
        }
    }
    return false;
};

export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
    // 1. Cloud
    if (isConfigured && db) {
        try {
            const count = Object.values(progressJson).filter(v => v).length;
            const userRef = doc(db, USERS_COLLECTION, user.email);
            await updateDoc(userRef, {
                "progress.completed": count,
                "progress_details": progressJson
            });
            return;
        } catch (e) {
            console.error("Progress Save Cloud Error", e);
        }
    }

    // 2. Local
    const count = Object.values(progressJson).filter(v => v).length;
    const updatedUser = { 
        ...user, 
        progress: { ...user.progress, completed: count },
        progress_details: progressJson
    };
    updateUser(updatedUser);
};
