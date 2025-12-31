import React, { useState } from 'react';
import { User } from '../types';
import { Search, BookOpen, Clock, BarChart3 } from 'lucide-react';

interface StudentsProps {
  users: User[];
}

const SkillBar: React.FC<{ label: string; value: number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="mb-2">
        <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold mb-1">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-200">{value}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const Students: React.FC<StudentsProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">Comunidad SimpleData</h2>
            <p className="text-slate-400">Conecta con otros estudiantes y visualiza el progreso global ({users.length} activos).</p>
        </div>
        <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o rol..." 
                className="w-full bg-surface border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((student) => {
              const completed = student.progress.completed || 0;
              const total = student.progress.total || 20;
              const pending = Math.max(0, total - completed);
              const progressPercent = Math.round((completed / total) * 100) || 0;

              return (
                  <div key={student.id} className="bg-surface border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-blue-900/10 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] flex-shrink-0">
                              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-lg font-bold text-white uppercase">
                                  {student.avatar || student.name.charAt(0)}
                              </div>
                          </div>
                          <div className="min-w-0">
                              <h3 className="font-bold text-white truncate text-base">{student.name}</h3>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 mt-1 uppercase tracking-wide truncate max-w-full">
                                  {student.role}
                              </span>
                          </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-dark/50 rounded-lg p-3 text-center border border-slate-800">
                             <div className="flex justify-center mb-1 text-green-400"><BookOpen size={16} /></div>
                             <div className="text-lg font-bold text-white">{completed}</div>
                             <div className="text-[10px] text-slate-500 uppercase">Completadas</div>
                          </div>
                          <div className="bg-dark/50 rounded-lg p-3 text-center border border-slate-800">
                             <div className="flex justify-center mb-1 text-orange-400"><Clock size={16} /></div>
                             <div className="text-lg font-bold text-white">{pending}</div>
                             <div className="text-[10px] text-slate-500 uppercase">Pendientes</div>
                          </div>
                      </div>

                      {/* Skills Section */}
                      <div className="space-y-3 mb-6 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                             <BarChart3 size={14} className="text-primary" />
                             <span className="text-xs font-bold text-white uppercase">Habilidades IA</span>
                          </div>
                          <SkillBar label="Prompting" value={student.stats.prompting} colorClass="bg-blue-500" />
                          <SkillBar label="Herramientas" value={student.stats.tools} colorClass="bg-purple-500" />
                          <SkillBar label="Análisis" value={student.stats.analysis} colorClass="bg-pink-500" />
                      </div>

                      {/* Overall Progress */}
                      <div className="mt-auto pt-4 border-t border-slate-800">
                          <div className="flex justify-between text-xs mb-2">
                              <span className="text-slate-400 font-medium">Progreso Global</span>
                              <span className="text-white font-bold">{progressPercent}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                          </div>
                      </div>
                  </div>
              );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
             <div className="bg-slate-800/50 p-6 rounded-full mb-4">
                <Search size={32} />
             </div>
             <p className="text-lg font-medium">No se encontraron estudiantes.</p>
             <p className="text-sm">Intenta buscar con otro término.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;