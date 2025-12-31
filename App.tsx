import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Guide from './pages/Guide';
import { User } from './types';
import { fetchAllData, VideoMap } from './services/dataService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoMap>({});
  const [loading, setLoading] = useState(true);
  const [detailedProgress, setDetailedProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { users: fetchedUsers, videos: fetchedVideos, progressJsonMap } = await fetchAllData();
      setUsers(fetchedUsers);
      setVideos(fetchedVideos);
      setDetailedProgress(progressJsonMap || {});
      
      // Check local storage for persistent login session
      const storedUserEmail = localStorage.getItem('simpledata_user_email');
      if (storedUserEmail) {
        const foundUser = fetchedUsers.find(u => u.email === storedUserEmail);
        if (foundUser) {
           setUser(foundUser);
           // Also try to load detailed progress from sheet or local storage
           const sheetProgress = progressJsonMap && progressJsonMap[foundUser.email];
           if (sheetProgress) {
             localStorage.setItem('simpledata_progress', JSON.stringify(sheetProgress));
           }
        }
      }
      setLoading(false);
    };

    initData();
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('simpledata_user_email', newUser.email);
    
    // Set specific progress for this user
    if (detailedProgress[newUser.email]) {
         localStorage.setItem('simpledata_progress', JSON.stringify(detailedProgress[newUser.email]));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('simpledata_user_email');
    localStorage.removeItem('simpledata_progress');
  };

  const handleUpdateProgress = (count: number, progressJson: Record<string, boolean>) => {
    if (!user) return;

    // 1. Update Current User State (For Dashboard)
    const updatedUser = { 
        ...user, 
        progress: { 
            ...user.progress, 
            completed: count 
        } 
    };
    setUser(updatedUser);

    // 2. Update Users List State (For Students/Team Page)
    setUsers(prevUsers => 
        prevUsers.map(u => u.email === user.email ? updatedUser : u)
    );

    // 3. Update Local Storage for detailed tracking
    localStorage.setItem('simpledata_progress', JSON.stringify(progressJson));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center text-white flex-col gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 animate-pulse">Conectando con AFRI...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} users={users} /> : <Navigate to="/" />} />
          
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route 
            path="/classes" 
            element={user ? <Classes user={user} videos={videos} onUpdateProgress={handleUpdateProgress} /> : <Navigate to="/login" />} 
          />
          <Route path="/students" element={user ? <Students users={users} /> : <Navigate to="/login" />} />
          <Route path="/guide" element={user ? <Guide /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;