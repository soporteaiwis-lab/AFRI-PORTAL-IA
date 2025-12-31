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

    return fetchedUsers;
  };

  useEffect(() => {
    // 1. Initial Load
    loadData(true);

    // 2. "Live" Polling - Check for updates every 10 seconds
    const interval = setInterval(async () => {
        const fetchedUsers = await loadData(false);
        
        // Sync current user state if logged in
        if (user) {
            const updatedCurrentUser = fetchedUsers.find(u => u.email === user.email);
            if (updatedCurrentUser) {
                // Check deep equality effectively for progress
                if (JSON.stringify(updatedCurrentUser.progress) !== JSON.stringify(user.progress) || 
                    JSON.stringify(updatedCurrentUser.progress_details) !== JSON.stringify(user.progress_details)) {
                    setUser(updatedCurrentUser);
                }
            }
        }
    }, 10000); 

    return () => clearInterval(interval);
  }, [user?.email]);

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

    // 1. Create the updated user object
    const updatedUser = { 
        ...user, 
        progress: { 
            ...user.progress, 
            completed: count 
        },
        progress_details: progressJson
    };
    
    // 2. Update Current User State (Dashboard)
    setUser(updatedUser);

    // 3. CRITICAL FIX: Immediately update the 'users' array so 'Students' page sees the change
    setUsers(prevUsers => prevUsers.map(u => u.email === user.email ? updatedUser : u));

    // 4. Persist to Cloud (Google Sheets) in background
    await saveUserProgress(updatedUser, progressJson);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center text-cobol flex-col gap-4 font-mono">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-cobol/30 border-t-cobol rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs animate-pulse">
                &gt;_
            </div>
        </div>
        <p className="tracking-widest animate-pulse">ESTABLECIENDO ENLACE MAINFRAME...</p>
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