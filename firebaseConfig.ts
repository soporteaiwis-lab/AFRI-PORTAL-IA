
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// --- CONFIGURACIÓN DE BASE DE DATOS GOOGLE CLOUD ---
// PARA QUE LA APP SINCRONICE EN TODOS LOS DISPOSITIVOS,
// PEGA TUS CREDENCIALES DE FIREBASE AQUÍ ABAJO.
// ESTO ELIMINA EL "LOCAL STORAGE" Y USA LA NUBE REAL.

const firebaseConfig = {
  // REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "NUMERO_ID",
  appId: "TU_APP_ID"
};

// Inicialización
let app;
let db: any = null;
let isConfigured = false;

try {
    // Verificamos si se han ingresado las credenciales reales
    if (firebaseConfig.apiKey !== "TU_API_KEY_AQUI") {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        isConfigured = true;
        console.log("🟢 [GOOGLE_CLOUD] Conexión establecida con Firestore.");
    } else {
        console.warn("🔴 [GOOGLE_CLOUD] Faltan credenciales en firebaseConfig.ts");
    }
} catch (error) {
    console.error("🔴 [GOOGLE_CLOUD] Error de conexión:", error);
}

export { db, isConfigured };
