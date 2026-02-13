import React, { useState } from 'react';
import { User } from '../types';
import { VideoMap, adminUpdateCell } from '../services/dataService';
import { Save, Search, Database, PlayCircle, Lock, Edit2, Users, Grid } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  videos: VideoMap;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, videos }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'videos'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [tempValue, setTempValue] = useState('');

  // --- LOGIC FOR USERS ---
  const handleUserEdit = async (email: string, field: 'name' | 'role' | 'password', newValue: string) => {
      // Optimistic update logic would go here if we had global state access easily, 
      // but for admin panel we just push to cloud.
      
      let colIndex = 0;
      if (field === 'name') colIndex = 2; // Col B
      if (field === 'role') colIndex = 3; // Col C
      if (field === 'password') colIndex = 4; // Col D (Assuming Pass is here)

      if (colIndex > 0) {
          await adminUpdateCell('Usuarios3', email, colIndex, newValue);
          alert(`Dato actualizado. La sincronización puede tardar unos segundos.`);
          setEditingCell(null);
      }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- LOGIC FOR VIDEOS ---
  // Transform VideoMap to Array for editing
  const videoList = Object.entries(videos).map(([key, url]) => ({ key, url }));
  
  const handleVideoEdit = async (key: string, newUrl: string) => {
      // Key format: Week-Session (e.g. "1-1")
      // We need to match this in the Sheet Videos3. 
      // Assuming Videos3 structure: Col A=ID(empty), Col B=Week, Col C=Class, Col D=URL
      
      // Since we don't have row ID easily mapped here without reading full sheet again, 
      // we rely on the Apps Script loop finding the Week+Class combo.
      // This is a simplification.
      
      await adminUpdateCell('Videos3', key, 4, newUrl); // Col D is 4
      alert("URL de video actualizada.");
      setEditingCell(null);
  };

  return (
    <div className="animate-in fade-in pb-20 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-red-900/20 to-slate-900 border border-red-500/20 p-6 rounded-2xl mb-8">
            <h1 className="text-3xl font-black text-red-500 mb-2 flex items-center gap-3">
                <Database /> PANEL MASTER
            </h1>
            <p className="text-slate-400">Administración de Base de Datos en Tiempo Real. Ten cuidado, los cambios afectan a todos.</p>
        </div>

        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-black' : 'bg-slate-800 text-slate-400'}`}
            >
                <Users size={18} /> Usuarios ({users.length})
            </button>
            <button 
                onClick={() => setActiveTab('videos')}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${activeTab === 'videos' ? 'bg-white text-black' : 'bg-slate-800 text-slate-400'}`}
            >
                <PlayCircle size={18} /> Videos / Clases
            </button>
        </div>

        {activeTab === 'users' && (
            <div className="bg-surface border border-slate-700 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar usuario..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-black border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 border-b border-slate-800">Avatar</th>
                                <th className="p-4 border-b border-slate-800">Email (ID)</th>
                                <th className="p-4 border-b border-slate-800">Nombre</th>
                                <th className="p-4 border-b border-slate-800">Rol</th>
                                <th className="p-4 border-b border-slate-800">Password</th>
                                <th className="p-4 border-b border-slate-800">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300 font-mono">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-white/5">
                                    <td className="p-4">
                                        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-white">
                                            {u.avatar}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-500">{u.email}</td>
                                    
                                    {/* NAME EDIT */}
                                    <td className="p-4">
                                        {editingCell?.id === u.id && editingCell.field === 'name' ? (
                                            <div className="flex gap-2">
                                                <input 
                                                    autoFocus
                                                    className="bg-black border border-primary p-1 rounded w-32"
                                                    value={tempValue} 
                                                    onChange={e => setTempValue(e.target.value)} 
                                                />
                                                <button onClick={() => handleUserEdit(u.email, 'name', tempValue)} className="text-green-500"><Save size={16}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingCell({id: u.id, field: 'name'}); setTempValue(u.name); }}>
                                                {u.name} <Edit2 size={12} className="opacity-0 group-hover:opacity-50" />
                                            </div>
                                        )}
                                    </td>

                                    {/* ROLE EDIT */}
                                    <td className="p-4">
                                        {editingCell?.id === u.id && editingCell.field === 'role' ? (
                                            <div className="flex gap-2">
                                                <input 
                                                    className="bg-black border border-primary p-1 rounded w-32"
                                                    value={tempValue} 
                                                    onChange={e => setTempValue(e.target.value)} 
                                                />
                                                <button onClick={() => handleUserEdit(u.email, 'role', tempValue)} className="text-green-500"><Save size={16}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingCell({id: u.id, field: 'role'}); setTempValue(u.role); }}>
                                                <span className="bg-slate-800 px-2 py-1 rounded text-xs">{u.role}</span>
                                                <Edit2 size={12} className="opacity-0 group-hover:opacity-50" />
                                            </div>
                                        )}
                                    </td>

                                    {/* PASSWORD EDIT */}
                                    <td className="p-4">
                                         {editingCell?.id === u.id && editingCell.field === 'password' ? (
                                            <div className="flex gap-2">
                                                <input 
                                                    className="bg-black border border-primary p-1 rounded w-24"
                                                    value={tempValue} 
                                                    onChange={e => setTempValue(e.target.value)} 
                                                />
                                                <button onClick={() => handleUserEdit(u.email, 'password', tempValue)} className="text-green-500"><Save size={16}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group cursor-pointer text-slate-600" onClick={() => { setEditingCell({id: u.id, field: 'password'}); setTempValue(u.password || '1234'); }}>
                                                •••••• <Edit2 size={12} className="opacity-0 group-hover:opacity-50" />
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-4">
                                        <button className="text-slate-500 hover:text-white" title="Simular usuario">
                                            <PlayCircle size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'videos' && (
             <div className="bg-surface border border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                         <tr className="bg-slate-900 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 border-b border-slate-800">Semana-Clase</th>
                            <th className="p-4 border-b border-slate-800">YouTube URL / ID</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-300 font-mono">
                        {videoList.map((v) => (
                            <tr key={v.key} className="border-b border-slate-800/50 hover:bg-white/5">
                                <td className="p-4 font-bold text-white">{v.key}</td>
                                <td className="p-4">
                                    {editingCell?.id === v.key ? (
                                        <div className="flex gap-2 w-full">
                                            <input 
                                                className="bg-black border border-primary p-2 rounded flex-1"
                                                value={tempValue} 
                                                onChange={e => setTempValue(e.target.value)} 
                                            />
                                            <button onClick={() => handleVideoEdit(v.key, tempValue)} className="bg-primary text-white px-3 rounded font-bold">GUARDAR</button>
                                            <button onClick={() => setEditingCell(null)} className="text-slate-500 px-2">X</button>
                                        </div>
                                    ) : (
                                        <div 
                                            className="flex items-center gap-2 group cursor-pointer hover:bg-white/5 p-2 rounded border border-transparent hover:border-slate-700" 
                                            onClick={() => { setEditingCell({id: v.key, field: 'url'}); setTempValue(v.url); }}
                                        >
                                            <span className="truncate max-w-md block text-slate-400">{v.url || '--- SIN VIDEO ---'}</span>
                                            <Edit2 size={12} className="text-primary opacity-0 group-hover:opacity-100" />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        )}
    </div>
  );
};

export default AdminPanel;