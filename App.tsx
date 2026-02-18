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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [content, setContent] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('simpledata_user_email', newUser.email);
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('simpledata_user_email');
  }, []);
  
  const initSystem = useCallback(async () => {
    try {
        console.log("🚀 [SYSTEM] Iniciando DB Nativa...");
        await seedDatabaseIfEmpty();
        
        const [loadedUsers, loadedContent] = await Promise.all([
            getUsers(),
            getContent()
        ]);
        
        setUsers(loadedUsers);
        setContent(loadedContent);
        
        // Auto-login si hay sesión previa
        const storedEmail = localStorage.getItem('simpledata_user_email');
        if (storedEmail) {
            const found = loadedUsers.find(u => u.email === storedEmail);
            if (found) setUser(found);
        }
    } catch (e) {
        console.error("Critical Init Error:", e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    initSystem();
  }, [initSystem]);

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

  // Renderizado de carga minimalista
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-cobol font-mono">
         <div className="flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-cobol border-t-transparent rounded-full animate-spin"></div>
             <p className="text-sm tracking-widest">CARGANDO...</p>
         </div>
      </div>
    );
  }

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
              ? <AdminPanel users={users} content={content} onRefresh={initSystem} /> 
              : <Navigate to="/" />
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
