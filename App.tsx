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

  // BOOTSTRAP RAPIDO
  useEffect(() => {
    const init = async () => {
        await seedDatabaseIfEmpty();
        const [u, c] = await Promise.all([getUsers(), getContent()]);
        setUsers(u);
        setContent(c);

        // Restaurar sesión
        const savedEmail = localStorage.getItem('simpledata_user_email');
        if (savedEmail) {
            const found = u.find(x => x.email === savedEmail);
            if (found) setUser(found);
        }

        // ELIMINAR LOADER HTML (CRÍTICO)
        const loader = document.getElementById('app-loader');
        if (loader) loader.style.display = 'none';
    };
    init();
  }, []);

  const handleLogin = (u: User) => {
      setUser(u);
      localStorage.setItem('simpledata_user_email', u.email);
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('simpledata_user_email');
  };

  const updateProgress = async (count: number, details: Record<string, boolean>) => {
      if (!user) return;
      const newUser = { ...user, progress: { ...user.progress, completed: count }, progress_details: details };
      setUser(newUser);
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
          <Route path="/admin" element={user && isMaster ? <AdminPanel users={users} content={content} onRefresh={() => window.location.reload()} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
