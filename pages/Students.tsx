import React, { useState } from 'react';
import { User } from '../types';
import { Search, Database, User as UserIcon, CheckCircle, Clock } from 'lucide-react';

interface StudentsProps {
  users: User[];
}

const Students: React.FC<StudentsProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
            <div className="flex items-center gap-2 text-cobol font-mono text-xs mb-2">
                <Database size={14} />
                <span>SYNC_ACTIVE: {users.length} NODES</span>
            </div>
            <h2 className="text-4xl font-black text-white">Equipo AFRI</h2>
            <p className="text-slate-400">Progreso consolidado en tiempo real desde la nube.</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cobol transition-colors" size={20} />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nombre o rol..." 
                className="w-full bg-surface/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-cobol/50 focus:ring-1 focus:ring-cobol/20 transition-all font-medium"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsers.map((student) => {
            const completed = student.progress.completed || 0;
            const progressPercent = Math.round((completed / 12) * 100);

            return (
                <div key={student.id} className="ai-glass p-6 rounded-3xl border border-white/5 hover:border-cobol/30 transition-all group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center text-xl font-black text-white shadow-xl">
                            {student.avatar || student.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-white truncate text-lg">{student.name}</h3>
                            <p className="text-[10px] font-mono text-cobol uppercase tracking-tighter opacity-70">{student.role}</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle size={14} />
                                <span className="font-bold">{completed} Vistas</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                                <Clock size={14} />
                                <span>{12 - completed} Pend.</span>
                            </div>
                        </div>
                        
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-primary to-cobol transition-all duration-1000" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-right text-slate-500 font-mono">{progressPercent}% SYNC</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center py-2 bg-white/5 rounded-lg border border-white/5">
                            <p className="text-[8px] text-slate-500 mb-1">PROMPT</p>
                            <p className="text-xs font-bold text-primary">{student.stats.prompting}%</p>
                        </div>
                        <div className="text-center py-2 bg-white/5 rounded-lg border border-white/5">
                            <p className="text-[8px] text-slate-500 mb-1">TOOLS</p>
                            <p className="text-xs font-bold text-secondary">{student.stats.tools}%</p>
                        </div>
                        <div className="text-center py-2 bg-white/5 rounded-lg border border-white/5">
                            <p className="text-[8px] text-slate-500 mb-1">DATA</p>
                            <p className="text-xs font-bold text-cobol">{student.stats.analysis}%</p>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default Students;