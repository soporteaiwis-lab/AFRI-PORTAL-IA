
import { db } from '../firebaseConfig';
import { User, ClassSession, WeekData } from '../types';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { COURSE_CONTENT } from '../constants';

// Colecciones
const USERS_COL = 'users';
const CONTENT_COL = 'content';

// USUARIO DE RESPALDO (FALLBACK)
const FALLBACK_ADMIN: User = {
    id: 'admin-root-fallback',
    email: 'armin@aiwis.cl',
    name: 'Armin W Salazar',
    role: 'Master Root',
    avatar: 'A',
    password: '1234',
    stats: { prompting: 100, tools: 100, analysis: 100 },
    progress: { completed: 0, total: 12 },
    progress_details: {}
};

export const seedDatabaseIfEmpty = async () => {
    if (!db) return;

    try {
        const usersSnap = await getDocs(collection(db, USERS_COL));
        if (usersSnap.empty) {
            console.log("Sembrando base de datos inicial...");
            await setDoc(doc(db, USERS_COL, FALLBACK_ADMIN.email), FALLBACK_ADMIN);

            for (const week of COURSE_CONTENT) {
                for (const session of week.sessions) {
                    const sessionData: ClassSession = {
                        ...session,
                        weekId: week.id,
                        videoUrl: session.videoUrl || '',
                        transcript: session.transcript || '',
                        description: session.description || ''
                    };
                    const docId = `w${week.id}-s${session.sessionNumber}`;
                    await setDoc(doc(db, CONTENT_COL, docId), sessionData);
                }
            }
            console.log("Base de datos sembrada.");
        }
    } catch (e) {
        console.error("Error sembrando DB:", e);
    }
};

export const getUsers = async (): Promise<User[]> => {
    // Si no hay DB (clave API faltante), devolvemos Admin local para que el login funcione
    if (!db) return [FALLBACK_ADMIN]; 

    try {
        const snapshot = await getDocs(collection(db, USERS_COL));
        if (snapshot.empty) {
            // Si la colección existe pero está vacía, devolvemos el fallback para permitir login inicial
            return [FALLBACK_ADMIN];
        }
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (e) {
        console.error("Error obteniendo usuarios, usando fallback:", e);
        // En caso de error de red o permisos, permitir acceso local al Admin
        return [FALLBACK_ADMIN];
    }
};

export const getContent = async (): Promise<WeekData[]> => {
    if (!db) return COURSE_CONTENT; 
    try {
        const snapshot = await getDocs(query(collection(db, CONTENT_COL), orderBy('weekId'), orderBy('sessionNumber')));
        
        if (snapshot.empty) return COURSE_CONTENT;

        const sessions = snapshot.docs.map(doc => doc.data() as ClassSession);
        
        const weeksMap = new Map<number, WeekData>();
        
        sessions.forEach(session => {
            if (!weeksMap.has(session.weekId)) {
                weeksMap.set(session.weekId, {
                    id: session.weekId,
                    title: getWeekTitle(session.weekId),
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

export const updateUser = async (user: User) => {
    if (!db) return;
    await setDoc(doc(db, USERS_COL, user.email), user, { merge: true });
};

export const deleteUser = async (email: string) => {
    if (!db) return;
    await deleteDoc(doc(db, USERS_COL, email));
};

export const createUser = async (user: User) => {
    if (!db) return;
    const docRef = doc(db, USERS_COL, user.email);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        throw new Error("El usuario ya existe");
    }
    await setDoc(docRef, user);
};

export const updateSession = async (session: ClassSession) => {
    if (!db) return;
    const docId = `w${session.weekId}-s${session.sessionNumber}`;
    await setDoc(doc(db, CONTENT_COL, docId), session, { merge: true });
};

export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
    if (!db) return;
    const count = Object.values(progressJson).filter(v => v).length;
    const userRef = doc(db, USERS_COL, user.email);
    await updateDoc(userRef, {
        progress: { completed: count, total: 12 },
        progress_details: progressJson
    });
};
