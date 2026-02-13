import { User } from '../types';

const SPREADSHEET_ID = '13rQdIhzb-Ve9GAClQwopVtS9u2CpGTj2aUy528a7YSw';
const API_KEY = 'AIzaSyCzPHhigfOD6oHw26JftVg3YyKLijwbyY4';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwxHzlEhCYVZaPSJl4V6ptxcDkefM_SUJbwqpgVB9gZV3SGVbWYB3EGMf6tHP0PfET62w/exec';

export interface VideoMap {
  [key: string]: string; 
}

// LOCAL STORAGE KEYS
const LS_PROGRESS_KEY = 'afri_local_progress_backup';

/**
 * Obtiene todos los datos. 
 * ESTRATEGIA: Combina datos de Google Sheets con la copia de seguridad local
 * para evitar que el retraso de la API borre el progreso del usuario.
 */
export const fetchAllData = async () => {
  const timestamp = new Date().getTime();
  try {
    const [usersRes, skillsRes, progressRes, videosRes] = await Promise.all([
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Usuarios3?key=${API_KEY}&t=${timestamp}`),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Habilidades3?key=${API_KEY}&t=${timestamp}`),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Progreso3?key=${API_KEY}&t=${timestamp}`),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Videos3?key=${API_KEY}&t=${timestamp}`)
    ]);

    const usersData = await usersRes.json();
    const skillsData = await skillsRes.json();
    const progressData = await progressRes.json();
    const videosData = await videosRes.json();

    return processData(usersData, skillsData, progressData, videosData);
  } catch (error) {
    console.error("Error crítico leyendo base de datos:", error);
    // En caso de error total, intentar recuperar del local storage
    return { users: [], videos: {}, progressJsonMap: {} };
  }
};

const processData = (usersData: any, skillsData: any, progressData: any, videosData: any) => {
  const users: User[] = [];
  const videos: VideoMap = {};
  const skillsMap: Record<string, any> = {};
  const progressMap: Record<string, any> = {};
  const progressJsonMap: Record<string, any> = {}; 

  // 1. Load Local Backup to override stale cloud data
  let localBackup: Record<string, any> = {};
  try {
    const stored = localStorage.getItem(LS_PROGRESS_KEY);
    if (stored) localBackup = JSON.parse(stored);
  } catch (e) {}

  if (skillsData.values) {
    skillsData.values.slice(1).forEach((row: any[]) => {
      if (row[0]) {
        skillsMap[row[0]] = {
          prompting: parseInt(row[3]) || 0,
          tools: parseInt(row[4]) || 0,
          analysis: parseInt(row[5]) || 0
        };
      }
    });
  }

  if (progressData.values) {
    progressData.values.slice(1).forEach((row: any[]) => {
      if (row[0]) { // Email
        const email = row[0];
        
        // Intentar parsear JSON de la nube
        let cloudDetails = {};
        if (row[7]) {
           try {
             const rawJson = row[7].toString().trim();
             if (rawJson.startsWith('{')) {
                cloudDetails = JSON.parse(rawJson);
             }
           } catch (e) { console.warn("Error JSON Cloud", e); }
        }

        // MERGE INTELLIGENT: 
        // Si tenemos un backup local para este email, mezclamos. 
        // Priorizamos 'true' (visto) sobre 'false' (no visto) para evitar reversiones.
        const localDetails = localBackup[email] || {};
        const mergedDetails = { ...cloudDetails, ...localDetails };
        
        // Calcular completadas reales basadas en el merge
        const completedCount = Object.values(mergedDetails).filter(v => v === true).length;

        progressMap[email] = {
          completed: completedCount,
          total: 12
        };
        progressJsonMap[email] = mergedDetails;
      }
    });
  }

  if (usersData.values) {
    usersData.values.slice(1).forEach((row: any[], index: number) => {
      if (row[0] && row[1]) {
        const email = row[0];
        users.push({
          id: `u-${index}`,
          email: email,
          name: row[1],
          role: row[2] || 'Estudiante',
          avatar: row[1].charAt(0).toUpperCase(),
          // Assume column 4 (index 3) is password, default to '1234'
          password: row[3] ? row[3].toString() : '1234', 
          stats: skillsMap[email] || { prompting: 0, tools: 0, analysis: 0 },
          progress: progressMap[email] || { completed: 0, total: 12 },
          progress_details: progressJsonMap[email] || {}
        });
      }
    });
  }

  if (videosData.values) {
    videosData.values.slice(1).forEach((row: any[]) => {
      if (row[1] && row[2]) {
        const key = `${row[1]}-${row[2].toString().toLowerCase().replace('clase', '').trim()}`;
        videos[key] = row[3] || '';
      }
    });
  }

  return { users, videos, progressJsonMap };
};

/**
 * Guarda el progreso en la nube Y en local storage.
 */
export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
  const completadas = Object.values(progressJson).filter(v => v === true).length;
  const jsonString = JSON.stringify(progressJson);

  // 1. SAVE LOCAL BACKUP IMMEDIATELY
  try {
      const stored = localStorage.getItem(LS_PROGRESS_KEY);
      const backup = stored ? JSON.parse(stored) : {};
      backup[user.email] = progressJson;
      localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(backup));
  } catch (e) { console.error("Local Backup Failed", e); }

  // 2. SEND TO CLOUD
  const payload = {
    action: 'updateProgress',
    email: user.email,
    nombre: user.name,
    rol: user.role,
    completadas: completadas,
    progresoJSON: jsonString
  };

  try {
    await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    });
    return true;
  } catch (error) {
    console.error("Error guardando en la nube:", error);
    return false;
  }
};

/**
 * Función ADMINISTRATIVA para que Armin edite datos directamente en Sheets.
 */
export const adminUpdateCell = async (sheetName: string, key: string, column: number, value: any) => {
    const payload = {
        action: 'adminUpdate',
        sheetName,
        key,
        column, // 1-based index
        value
    };

    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        return true;
    } catch (e) {
        console.error("Admin update failed", e);
        return false;
    }
};