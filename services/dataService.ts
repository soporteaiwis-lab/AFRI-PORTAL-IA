import { User } from '../types';

const SPREADSHEET_ID = '13rQdIhzb-Ve9GAClQwopVtS9u2CpGTj2aUy528a7YSw';
const API_KEY = 'AIzaSyCzPHhigfOD6oHw26JftVg3YyKLijwbyY4';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwxHzlEhCYVZaPSJl4V6ptxcDkefM_SUJbwqpgVB9gZV3SGVbWYB3EGMf6tHP0PfET62w/exec';

export interface VideoMap {
  [key: string]: string; // key: "week-sessionNumber", value: url
}

export const fetchAllData = async () => {
  try {
    // UPDATED: Fetching from sheets ending in '3'
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
          total: 12 // UPDATED: Total classes is now 12
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
  // Assumed Structure: Col B (Week), Col C (Session Number like "1" or "2"), Col D (URL)
  if (videosData.values) {
    videosData.values.slice(1).forEach((row: string[]) => {
      if (row[1] && row[2]) {
        const week = row[1];
        // Clean session input to ensure it maps to "1" or "2"
        let session = row[2].toString().toLowerCase().replace('clase', '').trim();
        const url = row[3] || '';
        
        // Key format: "1-1", "1-2", "2-1", etc.
        videos[`${week}-${session}`] = url;
      }
    });
  }

  return { users, videos, progressJsonMap };
};

export const saveUserProgress = async (user: User, progressJson: Record<string, boolean>) => {
  const completadas = Object.values(progressJson).filter(v => v === true).length;
  const jsonString = JSON.stringify(progressJson);

  console.log("Saving progress to cloud (AFRI)...", { email: user.email, completadas, jsonString });

  try {
    // Note: The Apps Script needs to be updated on Google side to write to 'Progreso3'
    await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            portal: 'afri', // Updated portal identifier
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