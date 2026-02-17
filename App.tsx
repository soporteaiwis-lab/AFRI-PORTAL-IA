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
import { Database, AlertTriangle } from 'lucide-react';
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
    
    try {
        // Intento de conexión y sembrado de datos
        await seedDatabaseIfEmpty();

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
            } else {
                 handleLogout();
            }
        }
    } catch (e: any) {
        console.error("Error cargando datos:", e);
        setInitError("Verificando conexión a base de datos..."); 
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
        <div className="relative">
            <div className="w-20 h-20 border-2 border-cobol/20 border-t-cobol rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs animate-pulse">AFRI</div>
        </div>
        <div className="text-center space-y-2">
            <p className="tracking-[0.3em] uppercase text-sm font-bold terminal-text">Conectando...</p>
            <p className="text-[10px] text-slate-500">Google Cloud Firestore</p>
        </div>
      </div>
    );
  }

  // Si hay error de inicialización
  if (initError && !user) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
              <div className="bg-red-900/10 border border-red-500/50 p-6 rounded-xl text-center max-w-md">
                  <AlertTriangle className="mx-auto text-red-500 mb-4" size={32} />
                  <h2 className="text-xl font-bold text-white mb-2">Error de Conexión</h2>
                  <p className="text-slate-400 text-sm mb-4">{initError}</p>
                  <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold">Reintentar</button>
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
