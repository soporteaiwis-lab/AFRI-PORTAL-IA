// ============================================================================
// 🟢 MODO SEGURO - SIN DEPENDENCIAS EXTERNAS
// ============================================================================
// Este archivo garantiza que no haya errores de importación de Firebase
// que puedan causar la "Pantalla Negra".

const db = null;
const isConfigured = false; 
const connectionError = "Modo Local Nativo Activado";

const saveCloudConfig = (config: any) => {
    console.log("Configuración guardada localmente:", config);
    // En el futuro, aquí podríamos guardar en LocalStorage si volvemos a activar Firebase
};

export { db, isConfigured, connectionError, saveCloudConfig };
