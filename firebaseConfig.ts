
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Clave para almacenamiento local de configuración (Bridge)
const CONFIG_STORAGE_KEY = 'afri_firebase_credentials_v1';

// Configuración por defecto (Placeholders)
const defaultProjectConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "NUMERO_ID",
  appId: "TU_APP_ID"
};

let app = null;
let db: any = null;
let isConfigured = false;

// INTENTO DE INICIALIZACIÓN
try {
    // 1. Buscamos si el usuario ya inyectó la config vía UI
    const storedConfigStr = localStorage.getItem(CONFIG_STORAGE_KEY);
    let activeConfig = defaultProjectConfig;

    if (storedConfigStr) {
        try {
            activeConfig = JSON.parse(storedConfigStr);
            console.log("🟢 [CLOUD] Credenciales cargadas desde almacenamiento seguro.");
        } catch (e) {
            console.error("Error parseando config guardada");
        }
    }

    // 2. Validamos si la config es real (no tiene placeholders)
    if (activeConfig.apiKey && activeConfig.apiKey !== "TU_API_KEY_AQUI" && !activeConfig.apiKey.includes("TU_API_KEY")) {
        app = initializeApp(activeConfig);
        db = getFirestore(app);
        isConfigured = true;
        console.log("🟢 [CLOUD] CONEXIÓN A BASE DE DATOS EXITOSA.");
    } else {
        console.warn("🔴 [CLOUD] Sistema en espera de credenciales reales.");
        isConfigured = false;
    }

} catch (error) {
    console.error("🔴 [CLOUD] Error crítico de inicialización:", error);
    isConfigured = false;
}

// Helper para guardar la config desde la UI
export const saveCloudConfig = (configJson: any) => {
    if (!configJson || !configJson.apiKey) throw new Error("Configuración inválida");
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configJson));
    window.location.reload(); // Recargar para conectar
};

export const resetCloudConfig = () => {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    window.location.reload();
};

export { db, isConfigured };
