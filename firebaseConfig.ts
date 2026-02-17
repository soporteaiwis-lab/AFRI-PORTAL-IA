import firebase from 'firebase/compat/app';
import { getFirestore } from 'firebase/firestore';

// ============================================================================
// 🟢 CONFIGURACIÓN DINÁMICA
// ============================================================================

const LOCAL_STORAGE_KEY = 'afri_firebase_config';

// 1. Configuración por defecto (Placeholder)
// Se usa 'let' para permitir que sea sobrescrita por localStorage si existe
let firebaseConfig = {
  apiKey: "AIzaSyDJbnvOYPKmYQV-tfOxwOcuKs8nfleo6JU",
  authDomain: "afri-portal-ia.firebaseapp.com",
  projectId: "afri-portal-ia",
  storageBucket: "afri-portal-ia.firebasestorage.app",
  messagingSenderId: "729525336557",
  appId: "1:729525336557:web:997734e254066984420fe4"
};

// 2. Intentar cargar configuración guardada localmente (si el usuario usó el Wizard)
try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey) {
            firebaseConfig = parsed;
        }
    }
} catch (e) {
    console.warn("Error loading config from storage", e);
}

// ============================================================================
// ⚙️ INICIALIZACIÓN DEL SISTEMA
// ============================================================================

let app;
let db: any;
let isConfigured = false;

try {
    // Validamos que exista una apiKey
    if (firebaseConfig.apiKey) {
        // Initialize using compat to resolve import issues
        app = firebase.initializeApp(firebaseConfig);
        // Get the default modular Firestore instance (compatible with dataService.ts)
        db = getFirestore(); 
        isConfigured = true;
        console.log("✅ [SYSTEM] Base de Datos Google Cloud CONECTADA.");
    } else {
        console.warn("⚠️ [SYSTEM] Credenciales no detectadas. El sistema funcionará en modo limitado.");
        isConfigured = false; 
    }
} catch (error) {
    console.error("❌ [SYSTEM] Error crítico de conexión a Firebase:", error);
    isConfigured = false;
}

// Función para guardar configuración desde el Wizard UI
export const saveCloudConfig = (config: any) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
        window.location.reload();
    } catch (e) {
        console.error("Error saving config", e);
        alert("No se pudo guardar la configuración localmente.");
    }
};

export { db, isConfigured };