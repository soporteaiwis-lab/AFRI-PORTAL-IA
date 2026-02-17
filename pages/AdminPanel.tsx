import React, { useState, useEffect } from 'react';
import { User, WeekData, ClassSession } from '../types';
import { updateUser, deleteUser, createUser, updateSession } from '../services/dataService';
import { saveFirebaseConfig, isConfigured, resetFirebaseConfig } from '../firebaseConfig';
import { Save, Search, Database, Lock, Edit2, Users, Trash2, Plus, X, Video, Check, Loader2, Settings, AlertTriangle, LogOut } from 'lucide-react';

interface AdminPanelProps {
  users: User[]; 
  content: WeekData[]; 
  onRefresh: () => void; 
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, content, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'config'>('users');
  
  // USER STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
      name: '', email: '', role: 'Estudiante', password: '1234', stats: { prompting: 0, tools: 0, analysis: 0 }
  });

  // CONTENT STATE
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // CONFIG STATE
  const [configJson, setConfigJson] = useState('');

  useEffect(() => {
      if (!isConfigured) {
          setActiveTab('config');
      }
  }, []);

  // --- CONFIG LOGIC ---
  const handleSaveConfig = () => {
      if (!configJson) return;
      const success = saveFirebaseConfig(configJson);
      if (success) {
          alert("Configuración guardada. El sistema se reiniciará.");
          window.location.reload();
      } else {
          alert("JSON Inválido. Asegúrate de copiar todo el objeto de configuración.");
      }
  };

  // --- USER LOGIC ---
  const handleSaveUser = async (u: User) => {
      if(!confirm("¿Guardar cambios en usuario?")) return;
      try {
          await updateUser(u);
          onRefresh();
          alert("Usuario actualizado.");
      } catch (e: any) {
          alert("Error: " + e.message);
      }
  };

  const handleDeleteUser = async (email: string) => {
      if(!confirm(`¿ELIMINAR USUARIO ${email}? Esta acción no se puede deshacer.`)) return;
      try {
          await deleteUser(email);
          onRefresh();
      } catch (e: any) {
          alert("Error: " + e.message);
      }
  };

  const handleCreateUser = async () => {
      if(!newUser.email || !newUser.name) return alert("Faltan datos");
      try {
          const u: User = {
              id: newUser.email,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role || 'Estudiante',
              password: newUser.password || '1234',
              avatar: (newUser.name || 'A').charAt(0).toUpperCase(),
              stats: { prompting: 50, tools: 50, analysis: 50 },
              progress: { completed: 0, total: 12 },
              progress_details: {}
          };
          await createUser(u);
          setIsAddingUser(false);
          setNewUser({ name: '', email: '', role: 'Estudiante', password: '1234' });
          onRefresh();
          alert("Usuario creado correctamente");
      } catch (e: any) {
          alert("Error: " + e.message);
      }
  };

  // --- CONTENT LOGIC ---
  const handleSaveSession = async () => {
      if(!editingSession) return;
      
      setIsSaving(true);
      
      const success = await updateSession(editingSession);
      
      setIsSaving(false);
      
      if (success) {
          setEditingSession(null);
          onRefresh(); 
          alert("✅ Contenido guardado en la Nube correctamente.");
      } else {
          alert("❌ ERROR AL GUARDAR. Verifica la configuración en la pestaña 'Configuración'.");
      }
  };

  const filteredUsers = (users || []).filter(u => 
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in pb-20 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-red-500/30 p-8 rounded-b-3xl mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]"></div>
            <h1 className="text-4xl font-black text-red-500 mb-2 flex items-center gap-3 relative z-10">
                <Database className="animate-pulse" /> PANEL MASTER ROOT
            </h1>
            <p className="text-slate-400 relative z-10 flex items-center gap-2">
                Estado DB: 
                {isConfigured ? (
                    <span className="text-green-400 font-bold bg-green-500/10 px-2 rounded flex items-center gap-1"><Check size={14}/> CONECTADO</span>
                ) : (
                    <span className="text-red-400 font-bold bg-red-500/10 px-2 rounded flex items-center gap-1 animate-pulse"><AlertTriangle size={14}/> DESCONECTADO</span>
                )}
            </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
            <button 
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${activeTab === 'users' ? 'bg-primary text-white scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <Users size={18} /> Usuarios
            </button>
            <button 
                onClick={() => setActiveTab('content')}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${activeTab === 'content' ? 'bg-secondary text-white scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <Video size={18} /> Contenidos
            </button>
            <button 
                onClick={() => setActiveTab('config')}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${activeTab === 'config' ? 'bg-white text-dark scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <Settings size={18} className={!isConfigured ? "animate-spin" : ""} /> Configuración
            </button>
        </div>

        {/* --- TAB: CONFIGURACIÓN --- */}
        {activeTab === 'config' && (
            <div className="bg-surface border border-slate-700 rounded-2xl p-8 max-w-3xl mx-auto shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="text-cobol" /> Configuración de Base de Datos
                </h2>
                
                {!isConfigured && (
                    <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl mb-6 text-red-200 flex items-start gap-3">
                        <AlertTriangle className="shrink-0 mt-1" />
                        <div>
                            <p className="font-bold">¡Atención! Firebase no está configurado.</p>
                            <p className="text-sm mt-1">El sistema no puede guardar datos. Pega tus credenciales abajo para conectar.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">Pegar Objeto JSON de Firebase Config</label>
                        <p className="text-xs text-slate-500 mb-2">Ve a Console Firebase {'>'} Project Settings {'>'} General {'>'} Your Apps {'>'} SDK Setup and Configuration (Config) y copia el objeto `const firebaseConfig = ...` (solo lo que está entre llaves).</p>
                        <textarea 
                            className="w-full bg-black border border-slate-700 rounded-xl p-4 font-mono text-xs text-green-400 h-48 focus:border-cobol outline-none"
                            placeholder={'{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "..."\n}'}
                            value={configJson}
                            onChange={(e) => setConfigJson(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={handleSaveConfig}
                            className="bg-cobol hover:bg-green-400 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-green-500/20"
                        >
                            <Save size={20} /> Guardar y Conectar
                        </button>
                        
                        {isConfigured && (
                            <button 
                                onClick={() => { if(confirm("¿Borrar configuración local?")) resetFirebaseConfig(); }}
                                className="bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 font-bold py-3 px-6 rounded-xl flex items-center gap-2"
                            >
                                <LogOut size={20} /> Resetear Config
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- TAB: USUARIOS --- */}
        {activeTab === 'users' && (
            <div className="bg-surface border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center flex-wrap gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o correo..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-black border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddingUser(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"
                    >
                        <Plus size={16} /> Agregar Usuario
                    </button>
                </div>
                
                {/* User Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Contraseña</th>
                                <th className="p-4">Progreso</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white border border-slate-700">
                                                {u.avatar}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{u.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <select 
                                            value={u.role}
                                            onChange={(e) => handleSaveUser({...u, role: e.target.value})}
                                            className="bg-black border border-slate-700 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                                        >
                                            <option value="Estudiante">Estudiante</option>
                                            <option value="Master Root">Master Root</option>
                                            <option value="Profesor">Profesor</option>
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Lock size={12} className="text-slate-500" />
                                            <input 
                                                type="text" 
                                                value={u.password || ''}
                                                onChange={() => {}} 
                                                onBlur={(e) => {
                                                    if(e.target.value !== u.password) handleSaveUser({...u, password: e.target.value});
                                                }}
                                                className="bg-transparent border-b border-transparent focus:border-primary outline-none w-24 text-slate-400 focus:text-white"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="w-full bg-slate-800 rounded-full h-1.5 w-24">
                                            <div className="bg-primary h-1.5 rounded-full" style={{width: `${(u.progress.completed/12)*100}%`}}></div>
                                        </div>
                                        <span className="text-[10px] text-slate-500">{u.progress.completed}/12</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDeleteUser(u.email)}
                                            className="text-slate-500 hover:text-red-500 p-2 transition-colors"
                                            title="Eliminar Usuario"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Create User Modal */}
                {isAddingUser && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-surface border border-slate-600 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6">Nuevo Usuario</h3>
                            <div className="space-y-4">
                                <input 
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" 
                                    placeholder="Nombre Completo" 
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                />
                                <input 
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" 
                                    placeholder="Email" 
                                    value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                />
                                <select 
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white"
                                    value={newUser.role}
                                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                                >
                                    <option>Estudiante</option>
                                    <option>Master Root</option>
                                </select>
                                <input 
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" 
                                    placeholder="Contraseña (Default: 1234)" 
                                    value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                />
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => handleCreateUser()} className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:opacity-90">Crear</button>
                                    <button onClick={() => setIsAddingUser(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- TAB: CONTENIDOS --- */}
        {activeTab === 'content' && (
            <div className="space-y-8">
                {content.map(week => (
                    <div key={week.id} className="bg-surface border border-slate-700 rounded-2xl overflow-hidden">
                        <div className="bg-slate-900/80 p-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-white text-lg">Semana {week.id}: {week.title}</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {week.sessions.map(session => (
                                <div key={session.id} className="bg-black/40 border border-slate-800 p-4 rounded-xl hover:border-slate-600 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-[10px] uppercase text-primary font-bold">Sesión {session.sessionNumber}</span>
                                            <h4 className="font-bold text-white">{session.title}</h4>
                                        </div>
                                        <button 
                                            onClick={() => setEditingSession(session)}
                                            className="p-2 bg-slate-800 hover:bg-primary hover:text-white rounded-lg text-slate-400 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono truncate mb-2">
                                        URL: {session.videoUrl || '--- VACÍO ---'}
                                    </div>
                                    <div className="flex gap-2">
                                        {session.transcript ? (
                                            <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] rounded border border-green-500/20">Transcripción OK</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] rounded border border-red-500/20">Sin Transcripción</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- EDIT SESSION MODAL --- */}
        {editingSession && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
                <div className="bg-surface border border-slate-600 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Edit2 size={20} /> Editar Sesión {editingSession.sessionNumber}
                        </h3>
                        <button onClick={() => setEditingSession(null)} className="text-slate-400 hover:text-white"><X /></button>
                    </div>
                    
                    <div className="p-8 overflow-y-auto space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título de la Clase</label>
                            <input 
                                className="w-full bg-black border border-slate-700 p-3 rounded-lg text-white focus:border-primary outline-none" 
                                value={editingSession.title}
                                onChange={e => setEditingSession({...editingSession, title: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Video ID (YouTube) o URL</label>
                            <div className="flex gap-2">
                                <div className="bg-slate-800 p-3 rounded-lg text-slate-500"><Video size={18} /></div>
                                <input 
                                    className="w-full bg-black border border-slate-700 p-3 rounded-lg text-white focus:border-primary outline-none font-mono text-sm" 
                                    value={editingSession.videoUrl}
                                    placeholder="Ej: dQw4w9WgXcQ"
                                    onChange={e => setEditingSession({...editingSession, videoUrl: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción</label>
                            <textarea 
                                className="w-full bg-black border border-slate-700 p-3 rounded-lg text-white focus:border-primary outline-none h-24 text-sm" 
                                value={editingSession.description}
                                onChange={e => setEditingSession({...editingSession, description: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex justify-between">
                                <span>Transcripción (Markdown / Texto)</span>
                                <span className="text-[10px] bg-slate-800 px-2 rounded text-slate-300">Pegar aquí el texto completo</span>
                            </label>
                            <textarea 
                                className="w-full bg-black border border-slate-700 p-3 rounded-lg text-white focus:border-primary outline-none h-48 font-mono text-xs leading-relaxed" 
                                value={editingSession.transcript || ''}
                                placeholder="# Título de la clase&#10;Aquí va el texto de lo que se habló en el video..."
                                onChange={e => setEditingSession({...editingSession, transcript: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-700 bg-slate-900 flex justify-end gap-3">
                         <button onClick={() => setEditingSession(null)} className="px-6 py-2 rounded-lg text-slate-400 hover:text-white font-bold">Cancelar</button>
                         <button 
                             onClick={handleSaveSession} 
                             disabled={isSaving}
                             className={`px-8 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                             {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                             {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                         </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminPanel;