import * as firebaseApp from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// ============================================================================
// 🟢 CONFIGURACIÓN HÍBRIDA (ROBUSTA)
// ============================================================================

const CUSTOM_CONFIG_KEY = 'afri_firebase_custom_config';

// 1. Configuración por defecto
const defaultFirebaseConfig = {
  apiKey: "AIzaSyDJbnvOYPKmYQV-tfOxwOcuKs8nfleo6JU",
  authDomain: "afri-portal-ia.firebaseapp.com",
  projectId: "afri-portal-ia",
  storageBucket: "afri-portal-ia.firebasestorage.app",
  messagingSenderId: "729525336557",
  appId: "1:729525336557:web:997734e254066984420fe4"
};

// ============================================================================
// ⚙️ INICIALIZACIÓN SEGURA (NON-BLOCKING)
// ============================================================================

let app: any = null;
let db: Firestore | null = null;
let isConfigured = false;
let connectionError = "";

const getConfig = () => {
    try {
        const stored = localStorage.getItem(CUSTOM_CONFIG_KEY);
        if (stored) return JSON.parse(stored);
    } catch(e) {
        console.warn("Invalid stored config");
    }
    return defaultFirebaseConfig;
};

try {
    // Intentamos inicializar con la configuración por defecto o la guardada
    // Usamos 'any' para soportar tanto modulos v9 como compatibilidad v8/types incorrectos
    const fb: any = firebaseApp;
    // Check for named export (v9) or default export (v8/compat)
    const initFunc = fb.initializeApp || (fb.default && fb.default.initializeApp);
    
    if (initFunc) {
        app = initFunc(getConfig());
        db = getFirestore(app);
        isConfigured = true;
        console.log("✅ [SYSTEM] Intento de conexión a Firebase iniciado.");
    } else {
        throw new Error("No se encontró la función initializeApp de Firebase.");
    }

} catch (error: any) {
    console.warn("⚠️ [SYSTEM] Modo Offline Activado. Error Firebase:", error.message);
    isConfigured = false;
    connectionError = error.message;
    db = null;
}

const saveCloudConfig = (config: any) => {
    try {
        localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config));
        window.location.reload();
    } catch (e) {
        console.error("Error saving config", e);
    }
};

// Exportamos 'db' como nullable. Los servicios verificarán si existe antes de usarlo.
export { db, isConfigured, connectionError, saveCloudConfig };