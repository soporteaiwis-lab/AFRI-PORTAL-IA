import React from 'react';
import { User } from '../types';
import { Award, TrendingUp, BookOpen, Clock } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-surface border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        {icon}
    </div>
    <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} bg-opacity-20 text-white`}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24, className: 'opacity-100' }) : icon}
        </div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
    </div>
  </div>
);

const SkillBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="mb-4">
        <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-slate-300">{label}</span>
            <span className="text-sm font-medium text-primary">{value}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-1000" style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const percentage = Math.round((user.progress.completed / user.progress.total) * 100);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Hola, {user.name.split(' ')[0]} 👋</h2>
        <p className="text-slate-400">Aquí está tu resumen de progreso en el programa de adopción de IA.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         <StatCard 
            label="Progreso Total" 
            value={`${percentage}%`} 
            icon={<TrendingUp />} 
            color="bg-green-500" 
         />
         <StatCard 
            label="Clases Completadas" 
            value={`${user.progress.completed}/${user.progress.total}`} 
            icon={<BookOpen />} 
            color="bg-blue-500" 
         />
         <StatCard 
            label="Horas Estimadas" 
            value="12h" 
            icon={<Clock />} 
            color="bg-purple-500" 
         />
         <StatCard 
            label="Nivel Actual" 
            value="Iniciado" 
            icon={<Award />} 
            color="bg-orange-500" 
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Progress Chart */}
         <div className="lg:col-span-2 bg-surface border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Tus Habilidades IA</h3>
            <div className="space-y-6">
                <SkillBar label="Ingeniería de Prompts" value={user.stats.prompting} />
                <SkillBar label="Herramientas & Frameworks" value={user.stats.tools} />
                <SkillBar label="Análisis de Datos" value={user.stats.analysis} />
            </div>
            
            <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <h4 className="font-semibold text-white mb-2">💡 Recomendación del Tutor IA</h4>
                <p className="text-sm text-slate-400">
                    Basado en tus estadísticas, te sugiero enfocar tus esfuerzos en la <strong>Semana 2</strong> para mejorar tu dominio de herramientas empresariales. ¡Vas por buen camino!
                </p>
            </div>
         </div>

         {/* Quick Actions / Next Class */}
         <div className="bg-surface border border-slate-800 rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-4">Siguiente Clase</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-slate-800 to-transparent rounded-xl border border-slate-700/50">
                <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
                    <BookOpen size={32} />
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">Automatización con N8N</h4>
                <p className="text-sm text-slate-400 mb-6">Semana 2 • Miércoles</p>
                <button className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium transition-colors">
                    Continuar Aprendizaje
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;