
// --- MOTOR DE BASE DE DATOS INTERNO ACTIVADO ---
// Se ha eliminado la dependencia de Firebase Cloud.
// El sistema ahora utiliza almacenamiento persistente local.

export const db = null;
export const isConfigured = false;

// Funciones dummy para mantener compatibilidad de imports sin romper la app
export const saveFirebaseConfig = () => false;
export const resetFirebaseConfig = () => {};
