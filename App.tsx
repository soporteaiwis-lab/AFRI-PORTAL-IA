
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
import { Database, AlertTriangle, WifiOff } from 'lucide-react';
import CloudConnectionWizard from './components/CloudConnectionWizard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [content, setContent] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');

  // 🔴 PANTALLA DE BLOQUEO SI NO HAY CREDENCIALES
  if (!isConfigured) {
      return <CloudConnectionWizard />;
  }

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('simpledata_user_email', newUser.email);
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('simpledata_user_email');
  }, []);
  
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setInitError('');
    
    // TEMPORIZADOR DE SEGURIDAD: Si Firebase no responde en 8 segundos, desbloquear la app.
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Tiempo de espera agotado. Verifica tu conexión.")), 8000)
    );

    try {
        console.log("📡 [APP] Iniciando conexión a datos...");
        
        // Ejecutamos la carga de datos compitiendo contra el timeout
        await Promise.race([
            (async () => {
                await seedDatabaseIfEmpty();
                const [fetchedUsers, fetchedContent] = await Promise.all([
                    getUsers(),
                    getContent()
                ]);
                setUsers(fetchedUsers);
                setContent(fetchedContent);
                console.log("✅ [APP] Datos cargados exitosamente.");
            })(),
            timeoutPromise
        ]);

        // Restaurar sesión
        const storedEmail = localStorage.getItem('simpledata_user_email');
        if (storedEmail) {
            const currentUserData = users.find(u => u.email === storedEmail) || 
                                    (await getUsers()).find(u => u.email === storedEmail); // Doble chequeo
            if (currentUserData) {
                 setUser(currentUserData);
            } else {
                 handleLogout();
            }
        }
    } catch (e: any) {
        console.error("❌ [APP] Error cargando datos:", e);
        setInitError(e.message || "Error de conexión con la base de datos."); 
    } finally {
        if (isInitial) setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const handleUpdateProgress = async (count: number, progressJson: Record<string, boolean>) => {
    if (!user) return;
    const updatedUser = { 
        ...user, 
        progress: { ...user.progress, completed: count },
        progress_details: progressJson
    };
    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.email === user.email ? updatedUser : u));
    await saveUserProgress(updatedUser, progressJson);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-cobol flex-col gap-6 font-mono relative overflow-hidden">
        <div className="scanline-effect"></div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 border-4 border-cobol/20 border-t-cobol rounded-full animate-spin mb-4"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+8px)] text-xs font-bold animate-pulse text-white">AFRI</div>
            <p className="tracking-[0.3em] uppercase text-sm font-bold terminal-text animate-pulse">Conectando Nube...</p>
            <p className="text-[10px] text-slate-500 mt-2">Google Cloud Firestore</p>
        </div>
      </div>
    );
  }

  // PANTALLA DE ERROR DE CONEXIÓN (Reintentar)
  if (initError && !user && users.length === 0) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono">
              <div className="bg-slate-900 border border-red-900/50 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
                  <WifiOff className="mx-auto text-red-500 mb-6" size={48} />
                  <h2 className="text-2xl font-bold text-white mb-2">Error de Conexión</h2>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                      No se pudo establecer comunicación con la base de datos de AFRI.
                      <br/>
                      <span className="text-[10px] opacity-70 mt-2 block font-mono bg-black/30 p-2 rounded text-red-300">{initError}</span>
                  </p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-900/20"
                  >
                    REINTENTAR AHORA
                  </button>
              </div>
          </div>
      );
  }

  const isMaster = user?.role.toLowerCase().includes('master') || user?.email.includes('armin');
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
              ? <AdminPanel users={users} content={content} onRefresh={() => loadData(false)} /> 
              : <Navigate to="/" />
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
