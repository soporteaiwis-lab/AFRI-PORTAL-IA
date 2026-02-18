import React, { useState, useEffect } from 'react';
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [content, setContent] = useState<WeekData[]>([]);

  // BOOTSTRAP DEL SISTEMA
  useEffect(() => {
    const init = async () => {
        try {
            await seedDatabaseIfEmpty();
            const [u, c] = await Promise.all([getUsers(), getContent()]);
            setUsers(u);
            setContent(c);
            console.log("✅ Sistema Iniciado Correctamente");
        } catch (e) {
            console.error("❌ Error en arranque:", e);
        } finally {
            // ELIMINAR PANTALLA DE CARGA (CRÍTICO)
            // Este bloque se ejecuta SIEMPRE, haya error o no.
            const loader = document.getElementById('app-loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    // Doble seguridad: eliminar del DOM
                    loader.remove();
                }, 500);
            }
        }
    };
    
    // Pequeño delay artificial para asegurar que el DOM esté listo
    setTimeout(init, 100);
  }, []);

  const handleLogin = (u: User) => {
      setUser(u);
  };

  const handleLogout = () => {
      setUser(null);
  };

  const updateProgress = async (count: number, details: Record<string, boolean>) => {
      if (!user) return;
      const newUser = { ...user, progress: { ...user.progress, completed: count }, progress_details: details };
      setUser(newUser);
      // Actualización optimista
      setUsers(prev => prev.map(u => u.email === newUser.email ? newUser : u));
      await saveUserProgress(newUser, details);
  };

  const isMaster = user?.role === 'Master Root' || user?.email === 'soporte.aiwis@gmail.com';
  const videoMap = {}; 

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} users={users} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/classes" element={user ? <Classes user={user} videos={videoMap} onUpdateProgress={updateProgress} /> : <Navigate to="/login" />} />
          <Route path="/students" element={user ? <Students users={users} /> : <Navigate to="/login" />} />
          <Route path="/guide" element={user ? <Guide /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && isMaster ? <AdminPanel users={users} content={content} onRefresh={() => { /* RAM refresh is instant */ }} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
