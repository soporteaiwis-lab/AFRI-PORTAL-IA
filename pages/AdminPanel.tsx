
import React, { useState, useRef } from 'react';
import { User, WeekData, ClassSession } from '../types';
import { updateUser, deleteUser, createUser, updateSession } from '../services/dataService';
import { Save, Search, Database, Lock, Edit2, Users, Trash2, Plus, X, Video, Loader2, HardDrive, Download, Upload, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  users: User[]; 
  content: WeekData[]; 
  onRefresh: () => void; 
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, content, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'backup'>('users');
  
  // USER STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
      name: '', email: '', role: 'Estudiante', password: '1234', stats: { prompting: 0, tools: 0, analysis: 0 }
  });

  // CONTENT STATE
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // BACKUP STATE
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- USER LOGIC ---
  const handleSaveUser = async (u: User) => {
      if(!confirm("¿Guardar cambios en usuario?")) return;
      try {
          await updateUser(u);
          onRefresh();
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
          alert("Usuario creado correctamente.");
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
          alert("✅ Contenido guardado en Base de Datos Interna.");
      } else {
          alert("❌ Error al guardar.");
      }
  };

  // --- BACKUP LOGIC ---
  const handleExportDB = () => {
      const data = {
          users: localStorage.getItem('afri_sys_users_v1'),
          content: localStorage.getItem('afri_sys_content_v1'),
          timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AFRI_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (data.users && data.content) {
                  if(confirm("⚠ ADVERTENCIA: Esto sobrescribirá TODOS los datos actuales con la copia de seguridad. ¿Estás seguro?")) {
                      localStorage.setItem('afri_sys_users_v1', data.users);
                      localStorage.setItem('afri_sys_content_v1', data.content);
                      alert("✅ Base de Datos Restaurada con Éxito. El sistema se recargará.");
                      window.location.reload();
                  }
              } else {
                  alert("❌ Archivo de respaldo inválido.");
              }
          } catch (err) {
              alert("❌ Error leyendo el archivo.");
          }
      };
      reader.readAsText(file);
  };

  const filteredUsers = (users || []).filter(u => 
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in pb-20 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-cobol/30 p-8 rounded-b-3xl mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cobol/5 rounded-full blur-[80px]"></div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3 relative z-10">
                <Database className="text-cobol" /> PANEL MASTER ROOT
            </h1>
            <p className="text-slate-400 relative z-10 flex items-center gap-2 font-mono text-sm">
                <HardDrive size={14} className="text-cobol"/> BASE DE DATOS INTERNA: <span className="text-cobol font-bold">ACTIVA</span>
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
                onClick={() => setActiveTab('backup')}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ml-auto ${activeTab === 'backup' ? 'bg-cobol text-black scale-105' : 'bg-slate-800 text-cobol border border-cobol/30 hover:bg-slate-700'}`}
            >
                <Database size={18} /> Copia de Seguridad
            </button>
        </div>

        {/* --- TAB: BACKUP --- */}
        {activeTab === 'backup' && (
            <div className="bg-surface border border-slate-700 rounded-2xl p-8 shadow-xl max-w-3xl mx-auto">
                <div className="flex items-start gap-4 mb-8">
                     <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/30 text-yellow-500">
                         <AlertTriangle size={32} />
                     </div>
                     <div>
                         <h3 className="text-xl font-bold text-white mb-2">Gestión de Persistencia de Datos</h3>
                         <p className="text-slate-400 leading-relaxed">
                             Al usar la Base de Datos Interna de Google (Local Storage), los datos viven en el navegador. 
                             Si realizas un nuevo deploy en Google Cloud, es recomendable <strong>Exportar</strong> tu base de datos antes y <strong>Restaurarla</strong> después para no perder cambios recientes.
                         </p>
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex flex-col items-center text-center hover:border-cobol/50 transition-colors">
                        <Download size={48} className="text-cobol mb-4" />
                        <h4 className="font-bold text-white text-lg mb-2">Exportar Base de Datos</h4>
                        <p className="text-sm text-slate-500 mb-6">Descarga un archivo JSON con todos los usuarios y contenidos actuales.</p>
                        <button onClick={handleExportDB} className="w-full py-3 bg-cobol hover:bg-green-400 text-black font-bold rounded-lg transition-colors">
                            Descargar Respaldo
                        </button>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                        <Upload size={48} className="text-primary mb-4" />
                        <h4 className="font-bold text-white text-lg mb-2">Restaurar Base de Datos</h4>
                        <p className="text-sm text-slate-500 mb-6">Sube un archivo JSON previamente exportado para recuperar tus datos.</p>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImportDB} 
                            accept=".json" 
                            className="hidden" 
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-colors">
                            Subir Respaldo
                        </button>
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
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Video URL (YouTube, Drive, Meet)</label>
                            <div className="flex gap-2">
                                <div className="bg-slate-800 p-3 rounded-lg text-slate-500"><Video size={18} /></div>
                                <input 
                                    className="w-full bg-black border border-slate-700 p-3 rounded-lg text-white focus:border-primary outline-none font-mono text-sm" 
                                    value={editingSession.videoUrl}
                                    placeholder="Pegar link de YouTube o Google Drive aquí"
                                    onChange={e => setEditingSession({...editingSession, videoUrl: e.target.value})}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">* Si es Google Drive, asegúrate de que el permiso sea "Cualquiera con el enlace puede ver".</p>
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
