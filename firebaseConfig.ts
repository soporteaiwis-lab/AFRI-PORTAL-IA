
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- GESTIÓN DE CONFIGURACIÓN DINÁMICA ---
// Permite guardar la config en el navegador si no está en el código.

const CONFIG_KEY = 'afri_firebase_config';

// 1. Intentar leer config guardada localmente (Runtime)
const getStoredConfig = () => {
    try {
        const stored = localStorage.getItem(CONFIG_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
};

// 2. Configuración Hardcoded (Fallback o Default)
const defaultConfig = {
  apiKey: "TU_API_KEY_AQUI", 
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// 3. Determinar qué configuración usar
const storedConfig = getStoredConfig();
const activeConfig = storedConfig || defaultConfig;

let dbExport = null;
let isConfiguredExport = false;

try {
    // Validamos si la configuración parece real (no es el placeholder)
    if (activeConfig.apiKey && activeConfig.apiKey !== "TU_API_KEY_AQUI") {
        const app = initializeApp(activeConfig);
        dbExport = getFirestore(app);
        isConfiguredExport = true;
        console.log("✅ Firebase conectado exitosamente (Configuración Activa).");
    } else {
        console.warn("⚠️ Firebase no configurado. Se requiere configuración manual en Panel Admin.");
    }
} catch (e) {
    console.error("Error inicializando Firebase:", e);
    // Si falla la config guardada, quizás es inválida. Podríamos borrarla, pero mejor dejamos que el usuario la corrija.
}

// Exportamos la instancia y utilidades
export const db = dbExport;
export const isConfigured = isConfiguredExport;

/**
 * Guarda la nueva configuración y recarga la página para aplicar cambios.
 */
export const saveFirebaseConfig = (configJson: string) => {
    try {
        // Validar que sea JSON
        const parsed = JSON.parse(configJson);
        if(!parsed.apiKey || !parsed.projectId) {
            throw new Error("El JSON debe contener al menos apiKey y projectId");
        }
        localStorage.setItem(CONFIG_KEY, JSON.stringify(parsed));
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

/**
 * Borra la configuración local y restaura los valores por defecto
 */
export const resetFirebaseConfig = () => {
    localStorage.removeItem(CONFIG_KEY);
    window.location.reload();
};
