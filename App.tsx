import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Guide from './pages/Guide';
import AdminPanel from './pages/AdminPanel';
import { User, WeekData } from './types';
import { getUsers, getContent, saveUserProgress, seedDatabaseIfEmpty } from './services/dataService';
import { isConfigured } from './firebaseConfig';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [content, setContent] = useState<WeekData[]>([]);
  // Iniciamos loading en false para renderizar rápido, el useEffect manejará el estado real
  const [loading, setLoading] = useState(true);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('simpledata_user_email', newUser.email);
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('simpledata_user_email');
  }, []);
  
  const loadData = useCallback(async () => {
    try {
        console.log("🚀 [APP] Iniciando sistema...");
        
        // Sembrar datos (asegura que localStorage tenga info si es la primera vez)
        await seedDatabaseIfEmpty();

        // Cargar datos (Esto traerá LocalStorage inmediatamente si Cloud falla)
        const [fetchedUsers, fetchedContent] = await Promise.all([
            getUsers(),
            getContent()
        ]);
        
        setUsers(fetchedUsers);
        setContent(fetchedContent);
        
        // Restaurar sesión
        const storedEmail = localStorage.getItem('simpledata_user_email');
        if (storedEmail) {
            const currentUserData = fetchedUsers.find(u => u.email === storedEmail);
            if (currentUserData) {
                 setUser(currentUserData);
            }
        }
    } catch (e) {
        console.error("❌ [APP] Error general:", e);
        // Incluso si falla todo, intentamos no bloquear la UI
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intentar cargar datos
    loadData();

    // FAILSAFE: Si por alguna razón (firewall, error de red silencioso) la carga
    // se queda pegada más de 3 segundos, forzamos la entrada para evitar pantalla negra.
    const safetyTimer = setTimeout(() => {
        setLoading((currentLoading) => {
            if (currentLoading) {
                console.warn("⚠️ [APP] Carga lenta detectada. Forzando inicio de UI.");
                return false;
            }
            return false;
        });
    }, 3000);

    return () => clearTimeout(safetyTimer);
  }, [loadData]);

  const handleUpdateProgress = async (count: number, progressJson: Record<string, boolean>) => {
    if (!user) return;
    const updatedUser = { 
        ...user, 
        progress: { ...user.progress, completed: count },
        progress_details: progressJson
    };
    setUser(updatedUser);
    // Actualizar también la lista general de usuarios para que se refleje en tiempo real
    setUsers(prev => prev.map(u => u.email === user.email ? updatedUser : u));
    await saveUserProgress(updatedUser, progressJson);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-cobol flex-col gap-6 font-mono relative overflow-hidden">
        <div className="scanline-effect"></div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-cobol/20 border-t-cobol rounded-full animate-spin mb-4"></div>
            <p className="tracking-[0.3em] uppercase text-sm font-bold terminal-text animate-pulse">INICIANDO SISTEMA...</p>
        </div>
      </div>
    );
  }

  // Lógica de seguridad para Master Root
  const isMaster = user?.role.toLowerCase().includes('master') || user?.email === 'soporte.aiwis@gmail.com';
  const videoMap: Record<string, string> = {}; 

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} users={users} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/classes" element={user ? <Classes user={user} videos={videoMap} onUpdateProgress={handleUpdateProgress} /> : <Navigate to="/login" />} />
          <Route path="/students" element={user ? <Students users={users} /> : <Navigate to="/login" />} />
          <Route path="/guide" element={user ? <Guide /> : <Navigate to="/login" />} />
          
          <Route path="/admin" element={
              user && isMaster 
              ? <AdminPanel users={users} content={content} onRefresh={loadData} /> 
              : <Navigate to="/" />
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;