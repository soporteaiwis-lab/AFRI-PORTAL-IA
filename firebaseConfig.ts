// CONFIGURACIÓN ROBUSTA DE FIREBASE
// Si los módulos no cargan, la app no se rompe.

let app: any = null;
let db: any = null;
let isConfigured = false;
let connectionError = "";

// Función placeholder para compatibilidad
const saveCloudConfig = (config: any) => {
    console.log("Config guardada en memoria temp:", config);
};

// Intentamos cargar Firebase dinámicamente o usar los imports globales si existen
try {
    // @ts-ignore
    const { initializeApp } = await import("firebase/app");
    // @ts-ignore
    const { getFirestore } = await import("firebase/firestore");

    const firebaseConfig = {
        // Pega tus credenciales aquí cuando estés listo para producción
        // apiKey: "...",
        // projectId: "...",
    };

    // @ts-ignore
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        isConfigured = true;
        console.log("🔥 [CLOUD] Conectado a Firebase.");
    } else {
        console.log("☁️ [SYSTEM] Modo Local/RAM Activo (Sin credenciales de nube)");
    }

} catch (e: any) {
    console.warn("⚠️ [SYSTEM] Firebase no disponible o error de red. Usando Memoria RAM.");
    connectionError = e.message;
    db = null; // Fallback explícito a null
}

export { db, isConfigured, connectionError, saveCloudConfig };
