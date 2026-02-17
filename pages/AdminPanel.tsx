
import React, { useState, useRef } from 'react';
import { User, WeekData, ClassSession } from '../types';
import { updateUser, deleteUser, createUser, updateSession } from '../services/dataService';
import { Save, Search, Database, Lock, Edit2, Users, Trash2, Plus, X, Video, Loader2, HardDrive, Download, Upload, AlertTriangle, ShieldCheck, Mail, Type } from 'lucide-react';

interface AdminPanelProps {
  users: User[]; 
  content: WeekData[]; 
  onRefresh: () => void; 
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, content, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'backup'>('users');
  
  // --- USER MANAGEMENT STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<Partial<User>>({});
  const [isProcessingUser, setIsProcessingUser] = useState(false);

  // --- CONTENT MANAGEMENT STATE ---
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);

  // --- BACKUP STATE ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================
  // USER FUNCTIONS
  // ============================

  const openAddUser = () => {
      setCurrentUserData({
          name: '', email: '', role: 'Estudiante', password: '1234',
          stats: { prompting: 0, tools: 0, analysis: 0 },
          progress: { completed: 0, total: 12 }
      });
      setIsEditingUser(false);
      setUserModalOpen(true);
  };

  const openEditUser = (user: User) => {
      setCurrentUserData({ ...user });
      setIsEditingUser(true);
      setUserModalOpen(true);
  };

  const handleDeleteUser = async (email: string) => {
      if (!confirm(`¿Estás seguro de ELIMINAR al usuario ${email}? Esta acción es irreversible.`)) return;
      try {
          await deleteUser(email);
          onRefresh();
          // alert("Usuario eliminado."); // Feedback visual suficiente con refresh
      } catch (e: any) {
          alert("Error: " + e.message);
      }
  };

  const handleUserSubmit = async () => {
      if (!currentUserData.email || !currentUserData.name) {
          alert("El nombre y el correo son obligatorios.");
          return;
      }

      setIsProcessingUser(true);
      try {
          if (isEditingUser) {
              // Update existing
              await updateUser(currentUserData as User);
          } else {
              // Create new
              const newUser: User = {
                  id: currentUserData.email!, // Email as ID
                  email: currentUserData.email!,
                  name: currentUserData.name!,
                  role: currentUserData.role || 'Estudiante',
                  password: currentUserData.password || '1234',
                  avatar: (currentUserData.name || 'A').charAt(0).toUpperCase(),
                  stats: currentUserData.stats || { prompting: 50, tools: 50, analysis: 50 },
                  progress: currentUserData.progress || { completed: 0, total: 12 },
                  progress_details: {}
              };
              await createUser(newUser);
          }
          setUserModalOpen(false);
          onRefresh();
      } catch (e: any) {
          alert("Error al guardar usuario: " + e.message);
      } finally {
          setIsProcessingUser(false);
      }
  };

  // ============================
  // CONTENT FUNCTIONS
  // ============================

  const handleSaveSession = async () => {
      if (!editingSession) return;
      setIsSavingSession(true);
      
      const success = await updateSession(editingSession);
      
      setIsSavingSession(false);
      if (success) {
          setEditingSession(null);
          onRefresh(); 
          alert("✅ Contenido guardado correctamente.");
      } else {
          alert("❌ Error al guardar. Intente nuevamente.");
      }
  };

  // ============================
  // BACKUP FUNCTIONS
  // ============================
  const handleExportDB = () => {
      const data = {
          users: localStorage.getItem('afri_sys_users_backup'),
          content: localStorage.getItem('afri_sys_content_backup'),
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
              if (data.users || data.content) {
                  if(confirm("⚠ ADVERTENCIA: Esto sobrescribirá TODOS los datos LOCALES. ¿Estás seguro?")) {
                      if(data.users) localStorage.setItem('afri_sys_users_backup', data.users);
                      if(data.content) localStorage.setItem('afri_sys_content_backup', data.content);
                      alert("✅ Datos restaurados. La página se recargará.");
                      window.location.reload();
                  }
              } else {
                  alert("❌ Archivo inválido.");
              }
          } catch (err) {
              alert("❌ Error leyendo archivo.");
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
                <HardDrive size={14} className="text-cobol"/> BASE DE DATOS: <span className="text-cobol font-bold">CONTROL TOTAL</span>
            </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
            <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${activeTab === 'users' ? 'bg-primary text-white scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                <Users size={18} /> Usuarios
            </button>
            <button onClick={() => setActiveTab('content')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${activeTab === 'content' ? 'bg-secondary text-white scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                <Video size={18} /> Contenidos
            </button>
            <button onClick={() => setActiveTab('backup')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ml-auto ${activeTab === 'backup' ? 'bg-cobol text-black scale-105' : 'bg-slate-800 text-cobol border border-cobol/30 hover:bg-slate-700'}`}>
                <Database size={18} /> Respaldo
            </button>
        </div>

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
                    <button onClick={openAddUser} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-transform hover:scale-105">
                        <Plus size={16} /> Agregar Usuario
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Password</th>
                                <th className="p-4">Progreso</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {filteredUsers.map(u => (
                                <tr key={u.email} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
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
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'Master Root' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-500">
                                        {u.password || '****'}
                                    </td>
                                    <td className="p-4">
                                        <div className="w-full bg-slate-800 rounded-full h-1.5 w-24">
                                            <div className="bg-primary h-1.5 rounded-full" style={{width: `${(u.progress.completed/12)*100}%`}}></div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => openEditUser(u)}
                                                className="p-2 bg-slate-800 hover:bg-blue-600 hover:text-white rounded-lg text-slate-400 transition-colors"
                                                title="Editar Usuario Completo"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(u.email)}
                                                className="p-2 bg-slate-800 hover:bg-red-600 hover:text-white rounded-lg text-slate-400 transition-colors"
                                                title="Eliminar Usuario"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- USER MODAL (ADD & EDIT) --- */}
        {userModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-surface border border-slate-600 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative">
                    <button onClick={() => setUserModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X /></button>
                    
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        {isEditingUser ? <Edit2 className="text-primary"/> : <Plus className="text-green-500"/>}
                        {isEditingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                            <div className="relative">
                                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    className="w-full bg-black border border-slate-700 p-3 pl-10 rounded-lg text-white focus:border-primary outline-none" 
                                    value={currentUserData.name}
                                    onChange={e => setCurrentUserData({...currentUserData, name: e.target.value})}
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo Electrónico (ID)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    className={`w-full bg-black border border-slate-700 p-3 pl-10 rounded-lg text-white focus:border-primary outline-none ${isEditingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    value={currentUserData.email}
                                    onChange={e => setCurrentUserData({...currentUserData, email: e.target.value})}
                                    placeholder="usuario@aiwis.cl"
                                    disabled={isEditingUser} // ID cannot be changed in simple mode
                                />
                            </div>
                            {isEditingUser && <p className="text-[10px] text-yellow-500 mt-1">El email es el identificador único y no se puede cambiar.</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rol</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <select 
                                        className="w-full bg-black border border-slate-700 p-3 pl-10 rounded-lg text-white focus:border-primary outline-none appearance-none"
                                        value={currentUserData.role}
                                        onChange={e => setCurrentUserData({...currentUserData, role: e.target.value})}
                                    >
                                        <option value="Estudiante">Estudiante</option>
                                        <option value="Master Root">Master Root</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input 
                                        className="w-full bg-black border border-slate-700 p-3 pl-10 rounded-lg text-white focus:border-primary outline-none" 
                                        value={currentUserData.password}
                                        onChange={e => setCurrentUserData({...currentUserData, password: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-slate-700 mt-4">
                            <button onClick={() => setUserModalOpen(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition-colors">Cancelar</button>
                            <button 
                                onClick={handleUserSubmit} 
                                disabled={isProcessingUser}
                                className="flex-1 bg-gradient-to-r from-primary to-blue-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-colors flex justify-center items-center gap-2"
                            >
                                {isProcessingUser && <Loader2 className="animate-spin" size={18} />}
                                {isProcessingUser ? 'Guardando...' : 'Guardar Usuario'}
                            </button>
                        </div>
                    </div>
                </div>
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
                             disabled={isSavingSession}
                             className={`px-8 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 ${isSavingSession ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                             {isSavingSession ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                             {isSavingSession ? 'Guardando...' : 'Guardar Cambios'}
                         </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- TAB: BACKUP --- */}
        {activeTab === 'backup' && (
            <div className="bg-surface border border-slate-700 rounded-2xl p-8 shadow-xl max-w-3xl mx-auto">
                 <div className="flex items-start gap-4 mb-8">
                     <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/30 text-yellow-500">
                         <AlertTriangle size={32} />
                     </div>
                     <div>
                         <h3 className="text-xl font-bold text-white mb-2">Gestión de Respaldo</h3>
                         <p className="text-slate-400 leading-relaxed">
                             Descarga una copia de seguridad local. Útil si vas a migrar o reiniciar el sistema.
                         </p>
                     </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex flex-col items-center text-center hover:border-cobol/50 transition-colors">
                        <Download size={48} className="text-cobol mb-4" />
                        <h4 className="font-bold text-white text-lg mb-2">Exportar</h4>
                        <button onClick={handleExportDB} className="w-full py-3 bg-cobol hover:bg-green-400 text-black font-bold rounded-lg transition-colors">
                            Descargar JSON
                        </button>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                        <Upload size={48} className="text-primary mb-4" />
                        <h4 className="font-bold text-white text-lg mb-2">Importar</h4>
                        <input type="file" ref={fileInputRef} onChange={handleImportDB} accept=".json" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-colors">
                            Subir JSON
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminPanel;
