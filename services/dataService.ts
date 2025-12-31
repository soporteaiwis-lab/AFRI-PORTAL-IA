import { User } from '../types';

// IMPORTANT: The Apps Script connected to this URL must be updated to handle 'Progreso3'
const SPREADSHEET_ID = '13rQdIhzb-Ve9GAClQwopVtS9u2CpGTj2aUy528a7YSw';
// Public Read-Only Key for client-side fetching (Standard practice for public/semi-public sheets)
const API_KEY = 'AIzaSyCzPHhigfOD6oHw26JftVg3YyKLijwbyY4';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwxHzlEhCYVZaPSJl4V6ptxcDkefM_SUJbwqpgVB9gZV3SGVbWYB3EGMf6tHP0PfET62w/exec';

export interface VideoMap {
  [key: string]: string; // key: "week-sessionNumber", value: url
}

export const fetchAllData = async () => {
  try {
    const [usersRes, skillsRes, progressRes, videosRes] = await Promise.all([
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Usuarios3?key=${API_KEY}`),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Habilidades3?key=${API_KEY}`),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Progreso3?key=${API_KEY}`),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Videos3?key=${API_KEY}`)
    ]);

    const usersData = await usersRes.json();
    const skillsData = await skillsRes.json();
    const progressData = await progressRes.json();
    const videosData = await videosRes.json();

    return processData(usersData, skillsData, progressData, videosData);
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    return { users: [], videos: {}, progressJsonMap: {} };
  }
};

const processData = (usersData: any, skillsData: any, progressData: any, videosData: any) => {
  const users: User[] = [];
  const videos: VideoMap = {};

  // 1. Process Skills (Habilidades3)
  const skillsMap: Record<string, any> = {};
  if (skillsData.values) {
    skillsData.values.slice(1).forEach((row: string[]) => {
      if (row[0]) {
        skillsMap[row[0]] = {
          prompting: parseInt(row[3]) || 0,
          tools: parseInt(row[4]) || 0,
          analysis: parseInt(row[5]) || 0
        };
      }
    });
  }

  // 2. Process Progress (Progreso3)
  const progressMap: Record<string, any> = {};
  const progressJsonMap: Record<string, any> = {}; 
  
  if (progressData.values) {
    progressData.values.slice(1).forEach((row: string[]) => {
      if (row[0]) {
        progressMap[row[0]] = {
          completed: parseInt(row[5]) || 0,
          total: 12
        };
        
        if (row[7]) {
           try {
             const rawJson = row[7];
             progressJsonMap[row[0]] = JSON.parse(rawJson);
           } catch (e) {
             console.warn(`Failed to parse progress JSON for user ${row[0]}`);
           }
        }
      }
    });
  }

  // 3. Process Users (Usuarios3)
  if (usersData.values) {
    usersData.values.slice(1).forEach((row: string[], index: number) => {
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
        });
      }
    });
  }

  // 4. Process Videos (Videos3)
  if (videosData.values) {
    videosData.values.slice(1).forEach((row: string[]) => {
      if (row[1] && row[2]) {
        const week = row[1];
        let session = row[2].toString().toLowerCase().replace('clase', '').trim();
        const url = row[3] || '';
        videos[`${week}-${session}`] = url;
      }
    });
  }

  return { users, videos, progressJsonMap };
};

export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
  const completadas = Object.values(progressJson).filter(v => v === true).length;
  const jsonString = JSON.stringify(progressJson);

  console.log("Saving progress to cloud (AFRI)...", { email: user.email, completadas });

  try {
    // We use mode: 'no-cors' because Google Apps Script Web Apps don't strictly support CORS preflight
    // for simple POST requests in this context. 
    // This means we won't get a readable JSON response in the browser, 
    // but the request will execute on the server if the payload is correct.
    await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Important for Apps Script compatibility
        },
        body: JSON.stringify({
            portal: 'afri', 
            email: user.email,
            nombre: user.name,
            rol: user.role,
            completadas: completadas,
            progresoJSON: jsonString
        })
    });
    return true;
  } catch (error) {
    console.error("Error saving progress to Google Sheets:", error);
    return false;
  }
};