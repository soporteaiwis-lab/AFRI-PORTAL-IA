import React from 'react';
import { User } from '../types';
import { Award, TrendingUp, BookOpen, Clock, Cpu, Terminal, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string; type?: 'retro' | 'modern' }> = ({ label, value, icon, color, type = 'modern' }) => (
  <div className={`relative overflow-hidden group p-6 rounded-2xl border transition-all duration-500 ${
      type === 'retro' 
      ? 'bg-black border-cobol/30 hover:border-cobol shadow-[0_0_10px_rgba(74,222,128,0.05)]' 
      : 'glass-panel hover:border-primary/50'
  }`}>
    {/* Background Glow */}
    <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-[40px] opacity-20 transition-opacity group-hover:opacity-40 ${color.replace('text-', 'bg-')}`}></div>
    
    <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'retro' ? 'bg-cobol/10 text-cobol border border-cobol/20' : 'bg-white/5 text-white border border-white/10'}`}>
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
            </div>
            {type === 'retro' && <div className="text-[10px] font-mono text-cobol animate-pulse">SYS_OK</div>}
        </div>
        
        <div>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${type === 'retro' ? 'text-slate-500 font-mono' : 'text-slate-400'}`}>{label}</p>
            <h3 className={`text-2xl font-bold ${type === 'retro' ? 'text-cobol font-mono' : 'text-white'}`}>{value}</h3>
        </div>
    </div>
  </div>
);

const SkillBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="mb-5 group">
        <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                <Sparkles size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                {label}
            </span>
            <span className="text-sm font-mono text-primary bg-primary/10 px-2 rounded border border-primary/20">{value}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 animate-pulse-slow"></div>
            <div className="bg-gradient-to-r from-primary via-purple-500 to-secondary h-full rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${value}%` }}>
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[2px]"></div>
            </div>
        </div>
    </div>
  );

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const percentage = Math.round((user.progress.completed / user.progress.total) * 100);

  return (
    <div className="animate-in fade-in duration-700">
      
      {/* Hero Section */}
      <div className="mb-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded bg-cobol/10 border border-cobol/20 text-cobol text-[10px] font-mono font-bold tracking-widest uppercase">
                        Usuario: {user.role}
                    </span>
                    <div className="h-px w-10 bg-cobol/20"></div>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                    Hola, <span className="ai-gradient-text">{user.name.split(' ')[0]}</span>
                </h2>
                <p className="text-slate-400 max-w-lg">
                    Bienvenido a tu portal de transformación. Estás cruzando el puente desde los sistemas legacy hacia la Inteligencia Artificial.
                </p>
            </div>
            
            <div className="hidden md:block">
                 <div className="text-right">
                    <p className="text-xs text-slate-500 font-mono mb-1">GLOBAL_PROGRESS</p>
                    <p className="text-3xl font-bold text-white font-mono">{percentage}% <span className="text-sm text-slate-600">COMPLETE</span></p>
                 </div>
            </div>
        </div>
      </div>

      {/* Grid Stats - Mixed Styles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         {/* Retro Card - Foundation */}
         <StatCard 
            label="Módulos COBOL" 
            value="LEGACY" 
            icon={<Terminal />} 
            color="text-cobol"
            type="retro"
         />
         
         {/* Modern Cards - AI Progress */}
         <StatCard 
            label="Sesiones IA" 
            value={`${user.progress.completed}/${user.progress.total}`} 
            icon={<BookOpen />} 
            color="text-blue-500" 
         />
         <StatCard 
            label="Tiempo Invertido" 
            value="12h 30m" 
            icon={<Clock />} 
            color="text-purple-500" 
         />
         <StatCard 
            label="Estado" 
            value="Evolucionando" 
            icon={<Cpu />} 
            color="text-pink-500" 
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Skills Chart */}
         <div className="lg:col-span-2 glass-panel rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Cpu size={200} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                Matriz de Habilidades
            </h3>
            
            <div className="space-y-8 relative z-10">
                <SkillBar label="Ingeniería de Prompts" value={user.stats.prompting} />
                <SkillBar label="Herramientas & Frameworks" value={user.stats.tools} />
                <SkillBar label="Análisis de Datos" value={user.stats.analysis} />
            </div>
            
            <div className="mt-8 p-1 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700">
                <div className="p-4 flex gap-4 items-start">
                    <div className="bg-primary/20 p-2 rounded-lg text-primary mt-1">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-white text-sm mb-1">Recomendación del Sistema</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Tu lógica estructurada (background técnico) es una ventaja. Enfócate ahora en la <strong>Semana 2: Herramientas</strong> para mapear esa lógica a flujos automatizados en N8N.
                        </p>
                    </div>
                </div>
            </div>
         </div>

         {/* Next Steps / CTA */}
         <div className="flex flex-col gap-6">
            <div className="glass-panel rounded-2xl p-6 flex flex-col h-full border-t-4 border-t-primary">
                <h3 className="text-lg font-bold text-white mb-6">Próxima Misión</h3>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/50 rounded-xl border border-dashed border-slate-700 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-black border border-slate-700 flex items-center justify-center mb-4 shadow-xl z-10 group-hover:scale-110 transition-transform">
                        <Terminal size={32} className="text-primary" />
                    </div>
                    
                    <h4 className="text-lg font-bold text-white mb-1 z-10">Automatización con N8N</h4>
                    <p className="text-xs text-slate-400 mb-6 font-mono z-10">NEXT_STEP_EXECUTION</p>
                    
                    <Link to="/classes" className="w-full z-10">
                        <button className="w-full py-3 bg-white text-black hover:bg-primary hover:text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                            Iniciar <ArrowRight size={16} />
                        </button>
                    </Link>
                </div>
            </div>

            <div className="bg-cobol/5 border border-cobol/20 rounded-2xl p-6 relative overflow-hidden">
                 <div className="scanline absolute inset-0 opacity-20"></div>
                 <p className="font-mono text-xs text-cobol mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-cobol rounded-full animate-pulse"></span>
                    SYSTEM_MESSAGE
                 </p>
                 <p className="text-sm text-cobol/80 font-mono leading-relaxed">
                    "El código es poesía lógica. La IA es su imaginación."
                 </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;