import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Guide from './pages/Guide';
import AdminPanel from './pages/AdminPanel';
import { User } from './types';
import { fetchAllData, VideoMap, saveUserProgress } from './services/dataService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoMap>({});
  const [loading, setLoading] = useState(true);
  
  const loadDataFromCloud = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    
    // This now returns merged data (Cloud + Local Backup)
    const { users: fetchedUsers, videos: fetchedVideos } = await fetchAllData();
    
    setVideos(fetchedVideos);
    
    // Always update the full users list for the Students/Admin page
    setUsers(fetchedUsers);

    // If a user is logged in, refresh their own data while preserving optimistic UI
    const storedEmail = localStorage.getItem('simpledata_user_email');
    if (storedEmail) {
        const currentUserData = fetchedUsers.find(u => u.email === storedEmail);
        
        if (currentUserData) {
             // If we have a local user state (optimistic), we only update if the cloud data 
             // actually has MORE completions, or if it's the initial load.
             // This prevents "flashing" old data.
             if (!user || isInitial) {
                 setUser(currentUserData);
             } else {
                 // Subtle merge: Only take stats/roles, but trust local progress if newer
                 // (Ideally already handled by processData in dataService, but extra safety here)
                 if (currentUserData.progress.completed > user.progress.completed) {
                     setUser(currentUserData);
                 }
             }
        }
    }
    
    if (isInitial) setLoading(false);
  }, [user]);

  useEffect(() => {
    loadDataFromCloud(true);
    // Poll every 20 seconds to get updates from other students
    const interval = setInterval(() => loadDataFromCloud(false), 20000);
    return () => clearInterval(interval);
  }, [loadDataFromCloud]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('simpledata_user_email', newUser.email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('simpledata_user_email');
  };

  const handleUpdateProgress = async (count: number, progressJson: Record<string, boolean>) => {
    if (!user) return;

    // 1. Optimistic Update (Immediate UI feedback)
    const updatedUser = { 
        ...user, 
        progress: { ...user.progress, completed: count },
        progress_details: progressJson
    };
    
    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.email === user.email ? updatedUser : u));

    // 2. Persist (Local + Cloud) handled by service
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
            <p className="tracking-[0.3em] uppercase text-sm font-bold terminal-text">Conectando al Mainframe...</p>
            <p className="text-[10px] text-slate-500">SINCRONIZANDO BASE DE DATOS SEGURA</p>
        </div>
      </div>
    );
  }

  // Check master role for protected route
  const isMaster = user?.role.toLowerCase().includes('master') || user?.email.includes('armin');

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} users={users} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/classes" element={user ? <Classes user={user} videos={videos} onUpdateProgress={handleUpdateProgress} /> : <Navigate to="/login" />} />
          <Route path="/students" element={user ? <Students users={users} /> : <Navigate to="/login" />} />
          <Route path="/guide" element={user ? <Guide /> : <Navigate to="/login" />} />
          
          {/* Admin Route */}
          <Route path="/admin" element={user && isMaster ? <AdminPanel users={users} videos={videos} /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;