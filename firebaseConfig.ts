
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE ---
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto nuevo.
// 3. Ve a "Configuración del proyecto" -> "General" -> Agrega una app Web (</>).
// 4. Copia las credenciales aquí abajo:

const firebaseConfig = {
  // REEMPLAZA ESTO CON TUS DATOS REALES DE FIREBASE
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicializar Firebase solo si hay configuración válida, sino no romperá la app (pero no guardará datos)
let dbExport = null;
try {
    if (firebaseConfig.apiKey !== "TU_API_KEY_AQUI") {
        const app = initializeApp(firebaseConfig);
        dbExport = getFirestore(app);
        console.log("Firebase conectado exitosamente.");
    } else {
        console.warn("⚠️ FALTA CONFIGURAR FIREBASE EN firebaseConfig.ts");
    }
} catch (e) {
    console.error("Error inicializando Firebase:", e);
}

export const db = dbExport;
