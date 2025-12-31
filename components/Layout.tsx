import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Users, FileText, Menu, LogOut, Code } from 'lucide-react';
import { User } from '../types';
import AITutor from './AITutor';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  if (!user) return <>{children}</>;

  const navItems = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/classes', icon: BookOpen, label: 'Clases' },
    { to: '/students', icon: Users, label: 'Equipo' },
    { to: '/guide', icon: FileText, label: 'Guía' },
  ];

  return (
    <div className="min-h-screen bg-darker flex text-slate-200 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-slate-800 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
                <span className="text-xl">🌍</span>
             </div>
             <div>
                <h1 className="font-bold text-white tracking-tight">AFRI</h1>
                <p className="text-xs text-slate-500">Portal Educativo</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center font-bold text-white">
                 {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-white truncate">{user.name}</p>
                 <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
           </div>
           <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 rounded-lg hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all text-sm text-slate-400"
           >
             <LogOut size={16} /> Cerrar Sesión
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
         {/* Mobile Header */}
         <div className="lg:hidden bg-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-primary to-secondary p-1.5 rounded-lg">
                    <span className="text-lg">🌍</span>
                </div>
                <h1 className="font-bold text-white">AFRI</h1>
            </div>
            <button onClick={onLogout} className="text-slate-400 p-2">
                <LogOut size={20} />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
               {children}
            </div>
         </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-slate-800 pb-safe z-30">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-500'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* AI Tutor Integration */}
      <AITutor />
    </div>
  );
};

export default Layout;