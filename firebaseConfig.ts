import { initializeApp } from '@firebase/app';
import { getFirestore } from 'firebase/firestore';

// ============================================================================
// 🟢 CONFIGURACIÓN FIREBASE (MODULAR)
// ============================================================================

const LOCAL_STORAGE_KEY = 'afri_firebase_config';

// 1. Credenciales fijas (Las que proporcionaste)
let firebaseConfig = {
  apiKey: "AIzaSyDJbnvOYPKmYQV-tfOxwOcuKs8nfleo6JU",
  authDomain: "afri-portal-ia.firebaseapp.com",
  projectId: "afri-portal-ia",
  storageBucket: "afri-portal-ia.firebasestorage.app",
  messagingSenderId: "729525336557",
  appId: "1:729525336557:web:997734e254066984420fe4"
};

// 2. Sobrescribir si hay configuración manual guardada (opcional)
try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey) {
            console.log("⚡ [SYSTEM] Usando configuración personalizada desde LocalStorage");
            firebaseConfig = parsed;
        }
    }
} catch (e) {
    console.warn("Error loading config from storage", e);
}

// ============================================================================
// ⚙️ INICIALIZACIÓN
// ============================================================================

let app;
let db: any;
let isConfigured = false;

try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSyDJbnvOYPKmYQV-tfOxwOcuKs8nfleo6JU") {
        // Inicialización Modular Estándar
        app = initializeApp(firebaseConfig);
        db = getFirestore(app); 
        isConfigured = true;
        console.log("✅ [SYSTEM] Firebase Modular SDK Inicializado correctamente.");
    } else {
        console.warn("⚠️ [SYSTEM] Falta API Key válida.");
        isConfigured = false; 
    }
} catch (error) {
    console.error("❌ [SYSTEM] Fallo crítico al inicializar Firebase:", error);
    isConfigured = false;
}

export const saveCloudConfig = (config: any) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
        window.location.reload();
    } catch (e) {
        alert("Error guardando configuración local.");
    }
};

export { db, isConfigured };