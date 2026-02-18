// ============================================================================
// 🟢 CONFIGURACIÓN NATIVA LOCAL (SIMULACIÓN CLOUD)
// ============================================================================
// Se ha desactivado la conexión externa para garantizar carga inmediata.
// El sistema ahora usa el almacenamiento local del navegador como base de datos primaria.

const db = null;
const isConfigured = false; // Forzamos modo local
const connectionError = "";

const saveCloudConfig = (config: any) => {
    console.log("Config saved (simulation)", config);
};

export { db, isConfigured, connectionError, saveCloudConfig };
