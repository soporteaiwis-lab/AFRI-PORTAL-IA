import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Guide from './pages/Guide';
import { User } from './types';
import { fetchAllData, VideoMap, saveUserProgress } from './services/dataService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoMap>({});
  const [loading, setLoading] = useState(true);
  
  // Reference to track when the user last performed an action.
  // We use this to prevent stale data from the cloud overwriting local optimistic updates immediately.
  const lastActionTimeRef = useRef<number>(0);

  const loadDataFromCloud = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    const { users: fetchedUsers, videos: fetchedVideos } = await fetchAllData();
    
    // Always update videos as they are static content
    if (fetchedVideos) setVideos(fetchedVideos);

    const storedEmail = localStorage.getItem('simpledata_user_email');
    
    // LOGIC TO PROTECT LOCAL USER STATE
    // If the user performed an action less than 20 seconds ago, 
    // we trust the local state MORE than the cloud state (because cloud lags).
    const timeSinceLastAction = Date.now() - lastActionTimeRef.current;
    const isProtectingLocalState = timeSinceLastAction < 20000; // 20 seconds protection window

    if (storedEmail) {
        const cloudUserData = fetchedUsers.find(u => u.email === storedEmail);
        
        if (cloudUserData) {
             // Only overwrite local user if we are NOT protecting local state, or if it's the initial load
             if (isInitial || !isProtectingLocalState) {
                 setUser(cloudUserData);
             }
        }
    }
    
    // Update the 'users' list (for Students page)
    // If we are protecting local state, we must patch the current user in this list 
    // so the Students page shows the immediate change too.
    if (user && isProtectingLocalState) {
        setUsers(fetchedUsers.map(u => u.email === user.email ? user : u));
    } else {
        setUsers(fetchedUsers);
    }
    
    if (isInitial) setLoading(false);
  }, [user]);

  useEffect(() => {
    loadDataFromCloud(true);
    
    // Polling every 15 seconds
    const interval = setInterval(() => loadDataFromCloud(false), 15000);
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

    // 1. Set protection flag (timestamp)
    lastActionTimeRef.current = Date.now();

    // 2. Optimistic Update (Immediate UI feedback)
    const updatedUser = { 
        ...user, 
        progress: { ...user.progress, completed: count },
        progress_details: progressJson
    };
    
    setUser(updatedUser);
    // Immediately reflect in the team list
    setUsers(prev => prev.map(u => u.email === user.email ? updatedUser : u));

    // 3. Persist to Cloud
    // This runs in background. Even if it takes 5 seconds, the UI is already updated.
    // The 'loadDataFromCloud' polling will respect our 'lastActionTimeRef' and won't revert this change.
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
            <p className="text-[10px] text-slate-500">SINCRONIZANDO BASE DE DATOS GOOGLE</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} users={users} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/classes" element={user ? <Classes user={user} videos={videos} onUpdateProgress={handleUpdateProgress} /> : <Navigate to="/login" />} />
          <Route path="/students" element={user ? <Students users={users} /> : <Navigate to="/login" />} />
          <Route path="/guide" element={user ? <Guide /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;