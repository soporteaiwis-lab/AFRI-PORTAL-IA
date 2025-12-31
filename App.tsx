import React, { useState, useEffect } from 'react';
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

  // Function to load data from the Cloud (Google Sheets)
  const loadData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    const { users: fetchedUsers, videos: fetchedVideos } = await fetchAllData();
    
    // Update Users List
    setUsers(fetchedUsers);
    
    if (fetchedVideos && Object.keys(fetchedVideos).length > 0) {
        setVideos(fetchedVideos);
    }
    
    if (isInitial) setLoading(false);

    // If a user is logged in, sync their data with the latest from the cloud
    // This ensures that if they updated on another device, it reflects here
    return fetchedUsers;
  };

  useEffect(() => {
    // 1. Initial Load
    loadData(true);

    // 2. "Live" Polling - Check for updates every 10 seconds
    // This replaces the Firebase socket connection for a simpler Sheets integration
    const interval = setInterval(async () => {
        const fetchedUsers = await loadData(false);
        
        // Sync current user state if logged in
        if (user) {
            const updatedCurrentUser = fetchedUsers.find(u => u.email === user.email);
            if (updatedCurrentUser) {
                // Only update if there are changes to avoid unnecessary re-renders
                if (JSON.stringify(updatedCurrentUser.progress) !== JSON.stringify(user.progress)) {
                    setUser(updatedCurrentUser);
                }
            }
        }
    }, 10000); 

    // Check for persistent login via email key only
    const storedUserEmail = localStorage.getItem('simpledata_user_email');
    if (storedUserEmail && !user) {
         // We wait for the first loadData to finish via the interval or initial load
         // But we can try to set it if users are already populated
         if (users.length > 0) {
             const found = users.find(u => u.email === storedUserEmail);
             if (found) setUser(found);
         }
    }

    return () => clearInterval(interval);
  }, [user?.email]); // Re-create interval if user changes to ensure closure has correct ref

  // Late binding for login persistence
  useEffect(() => {
    const storedUserEmail = localStorage.getItem('simpledata_user_email');
    if (storedUserEmail && !user && users.length > 0) {
        const found = users.find(u => u.email === storedUserEmail);
        if (found) setUser(found);
    }
  }, [users]);


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
        progress: { 
            ...user.progress, 
            completed: count 
        },
        progress_details: progressJson
    };
    
    setUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.email === user.email ? updatedUser : u));

    // 2. Persist to Cloud (Google Sheets)
    await saveUserProgress(updatedUser, progressJson);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center text-white flex-col gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 animate-pulse">Sincronizando con AFRI...</p>
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