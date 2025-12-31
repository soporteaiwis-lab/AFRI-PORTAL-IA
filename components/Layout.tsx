import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Users, FileText, LogOut, Terminal, Cpu } from 'lucide-react';
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
    { to: '/', icon: Home, label: 'CMD_DASHBOARD' },
    { to: '/classes', icon: BookOpen, label: 'EXEC_CLASSES' },
    { to: '/students', icon: Users, label: 'LIST_TEAM' },
    { to: '/guide', icon: FileText, label: 'READ_MANUAL' },
  ];

  return (
    <div className="min-h-screen bg-darker flex text-slate-200 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cobol/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Sidebar Desktop - The "Mainframe" */}
      <aside className="hidden lg:flex flex-col w-72 bg-black border-r border-cobol/20 h-screen sticky top-0 z-20 shadow-[0_0_20px_rgba(74,222,128,0.05)] font-mono">
        <div className="p-6 border-b border-cobol/20 bg-darker/50 backdrop-blur">
          <div className="flex items-center gap-3">
             <div className="bg-cobol/10 p-2 rounded border border-cobol/30 text-cobol">
                <Terminal size={24} />
             </div>
             <div>
                <h1 className="font-bold text-cobol tracking-widest text-lg retro-glow">AFRI_SYS</h1>
                <p className="text-[10px] text-slate-500 uppercase">v2.0.25 [COBOL_CORE]</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-none border-l-2 transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'border-cobol bg-cobol/10 text-cobol' 
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} />
              <span className="text-sm tracking-wider">{item.label}</span>
              {/* Hover glitch effect line */}
              <div className="absolute inset-0 bg-cobol/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-cobol/20 bg-darker">
           <div className="flex items-center gap-3 mb-4 px-2 p-3 rounded border border-slate-800 bg-slate-900/50">
              <div className="w-8 h-8 rounded bg-cobol text-black flex items-center justify-center font-bold">
                 {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-bold text-cobol truncate">USR: {user.name.toUpperCase()}</p>
                 <p className="text-[10px] text-slate-500 truncate">STATUS: ONLINE</p>
              </div>
           </div>
           <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-900/50 text-red-500 hover:bg-red-900/20 hover:text-red-400 transition-all text-xs font-bold uppercase tracking-widest"
           >
             <LogOut size={14} /> [EXIT_SYSTEM]
           </button>
        </div>
      </aside>

      {/* Main Content - The "Cloud/AI Future" */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0 relative z-10">
         {/* Mobile Header */}
         <div className="lg:hidden bg-black/80 backdrop-blur-md sticky top-0 z-30 border-b border-cobol/20 px-4 py-3 flex justify-between items-center font-mono">
            <div className="flex items-center gap-2">
                <Terminal size={20} className="text-cobol" />
                <h1 className="font-bold text-cobol tracking-widest">AFRI_SYS</h1>
            </div>
            <button onClick={onLogout} className="text-slate-400 p-2">
                <LogOut size={20} />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto relative">
            {/* AI Decorator Top Right */}
            <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none hidden md:block">
                <div className="flex items-center gap-2 text-xs text-primary/60 font-mono">
                    <Cpu size={14} className="animate-spin-slow" />
                    <span>AI_PROCESSOR: ACTIVE</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 lg:p-8">
               {children}
            </div>
         </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-cobol/20 pb-safe z-30 font-mono">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 transition-colors ${
                  isActive ? 'text-cobol' : 'text-slate-600'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-[10px] font-bold">{item.label.split('_')[1]}</span>
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