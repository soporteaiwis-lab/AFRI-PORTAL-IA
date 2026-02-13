import { User } from '../types';

const SPREADSHEET_ID = '13rQdIhzb-Ve9GAClQwopVtS9u2CpGTj2aUy528a7YSw';
const API_KEY = 'AIzaSyCzPHhigfOD6oHw26JftVg3YyKLijwbyY4';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwxHzlEhCYVZaPSJl4V6ptxcDkefM_SUJbwqpgVB9gZV3SGVbWYB3EGMf6tHP0PfET62w/exec';

export interface VideoMap {
  [key: string]: string; 
}

/**
 * Obtiene todos los datos actualizados desde las Hojas de Google.
 * Se añade un parámetro de tiempo para evitar que el navegador use caché vieja.
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
    return { users: [], videos: {}, progressJsonMap: {} };
  }
};

const processData = (usersData: any, skillsData: any, progressData: any, videosData: any) => {
  const users: User[] = [];
  const videos: VideoMap = {};
  const skillsMap: Record<string, any> = {};
  const progressMap: Record<string, any> = {};
  const progressJsonMap: Record<string, any> = {}; 

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
      if (row[0]) {
        progressMap[row[0]] = {
          completed: parseInt(row[5]) || 0,
          total: 12
        };
        
        if (row[7]) {
           try {
             const rawJson = row[7].toString().trim();
             if (rawJson.startsWith('{')) {
                progressJsonMap[row[0]] = JSON.parse(rawJson);
             }
           } catch (e) {
             console.warn("Error parseando progreso de:", row[0]);
           }
        }
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
 * Guarda el progreso en la nube. 
 * IMPORTANTE: Usamos 'text/plain' para evitar preflight CORS errors.
 */
export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
  const completadas = Object.values(progressJson).filter(v => v === true).length;
  const jsonString = JSON.stringify(progressJson);

  // Payload structure matching Apps Script expectations
  const payload = {
    email: user.email,
    nombre: user.name,
    rol: user.role,
    completadas: completadas,
    progresoJSON: jsonString
  };

  try {
    // Usamos mode: 'no-cors' y Content-Type: 'text/plain'
    // Esto es crucial para que el navegador permita el envío a scripts de Google.
    await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 
            'Content-Type': 'text/plain;charset=utf-8' 
        },
        body: JSON.stringify(payload)
    });
    console.log("Datos enviados al servidor correctamente.");
    return true;
  } catch (error) {
    console.error("Error guardando en la nube:", error);
    return false;
  }
};