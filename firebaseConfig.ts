// ============================================================================
// 🟢 CONFIGURACIÓN LOCAL (MODO SEGURO)
// ============================================================================
// Se ha desactivado la nube temporalmente para garantizar acceso inmediato.

const db = null;
const isConfigured = false; 
const connectionError = "";

const saveCloudConfig = (config: any) => {
    console.log("Config saved locally", config);
};

export { db, isConfigured, connectionError, saveCloudConfig };
