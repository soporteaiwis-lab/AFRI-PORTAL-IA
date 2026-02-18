import React from 'react';
import { User } from '../types';
import { BookOpen, Clock, Terminal, Sparkles, ArrowRight, Zap, Database, ShieldAlert, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const percentage = Math.round((user.progress.completed / user.progress.total) * 100);
  const isMaster = user.role.toLowerCase().includes('master') || user.email.includes('armin');

  return (
    <div className="animate-in fade-in duration-700 relative">
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-cobol animate-pulse shadow-[0_0_10px_#4ade80]"></div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    Hola, <span className="ai-gradient-text">{user.name.split(' ')[0]}</span>
                </h1>
            </div>
            <p className="text-slate-400 font-medium max-w-xl">
                Tu evolución tecnológica está en marcha. Has completado el <span className="text-cobol font-mono">{percentage}%</span> de la transición al futuro.
            </p>
        </div>
        
        <div className="ai-glass p-6 rounded-2xl mainframe-border flex flex-col items-end">
            <p className="text-[10px] font-mono text-cobol mb-1 tracking-widest">CLOUD_STATUS</p>
            <div className="flex items-center gap-2 text-white">
                <Database size={16} className="text-cobol animate-pulse" />
                <span className="font-bold">CONECTADO</span>
            </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="ai-glass p-6 rounded-2xl mainframe-border group hover:bg-white/5 transition-all">
            <Terminal size={24} className="text-cobol mb-4" />
            <p className="text-xs text-slate-500 font-mono mb-1">LEGACY_CORE</p>
            <h3 className="text-2xl font-bold text-white group-hover:terminal-text transition-colors">MAINFRAME</h3>
        </div>
        <div className="ai-glass p-6 rounded-2xl mainframe-border group hover:bg-white/5 transition-all border-l-4 border-l-primary">
            <BookOpen size={24} className="text-primary mb-4" />
            <p className="text-xs text-slate-500 font-mono mb-1">AI_SESSIONS</p>
            <h3 className="text-2xl font-bold text-white">{user.progress.completed} / {user.progress.total}</h3>
        </div>
        <div className="ai-glass p-6 rounded-2xl mainframe-border group hover:bg-white/5 transition-all">
            <Clock size={24} className="text-secondary mb-4" />
            <p className="text-xs text-slate-500 font-mono mb-1">SYNC_TIME</p>
            <h3 className="text-2xl font-bold text-white">REAL_TIME</h3>
        </div>
        <div className="ai-glass p-6 rounded-2xl border-l-4 border-l-cobol overflow-hidden relative">
            <div className="absolute inset-0 scanline-effect opacity-30"></div>
            <Zap size={24} className="text-cobol mb-4 animate-bounce" />
            <p className="text-xs text-slate-500 font-mono mb-1">USR_STATUS</p>
            <h3 className="text-2xl font-bold text-white tracking-widest uppercase">{user.role}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 ai-glass p-8 rounded-3xl border border-white/5 relative group">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Sparkles size={20} className="text-primary" />
                    Habilidades de Nueva Era
                </h3>
            </div>
            
            <div className="space-y-10">
                <SkillSet label="Prompting" value={user.stats.prompting} color="bg-primary" />
                <SkillSet label="Tools & Frameworks" value={user.stats.tools} color="bg-secondary" />
                <SkillSet label="Data Intelligence" value={user.stats.analysis} color="bg-cobol" />
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 rounded-3xl border border-white/10 flex flex-col justify-between h-full group relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div>
                    <h3 className="text-2xl font-black text-white mb-2 italic tracking-tighter">PRÓXIMA MISIÓN</h3>
                    <p className="text-slate-400 text-sm mb-6">Continúa tu aprendizaje para desbloquear nuevas capacidades de IA.</p>
                </div>
                <Link to="/classes" className="w-full">
                    <button className="w-full py-4 bg-white text-dark rounded-xl font-black text-sm flex items-center justify-center gap-3 group-hover:gap-5 transition-all">
                        IR A CLASES <ArrowRight size={18} />
                    </button>
                </Link>
            </div>

            {/* Admin Shortcut Card */}
            {isMaster && (
                <div className="bg-red-900/10 p-6 rounded-3xl border border-red-500/30 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <ShieldAlert className="text-red-500" size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white mb-2">ADMIN_ZONE</h3>
                        <p className="text-slate-400 text-xs mb-4">Gestión de usuarios y base de datos.</p>
                    </div>
                    <Link to="/admin" className="w-full">
                        <button className="w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                           <Users size={16} /> ABRIR PANEL
                        </button>
                    </Link>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const SkillSet: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="group">
        <div className="flex justify-between items-end mb-3">
            <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">{label}</span>
            <span className="text-lg font-black font-mono text-white">{value}%</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full border border-white/5 relative">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ${color} shadow-[0_0_15px_rgba(255,255,255,0.1)]`} 
                style={{ width: `${value}%` }}
            >
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-sm"></div>
            </div>
        </div>
    </div>
);

export default Dashboard;
