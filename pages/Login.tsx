import React, { useState } from 'react';
import { User } from '../types';
import { ChevronRight, Users as UsersIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [loading, setLoading] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');

  const handleLogin = () => {
    if (!selectedUserEmail) return;
    
    const user = users.find(u => u.email === selectedUserEmail);
    if (!user) return;

    setLoading(true);
    // Simulate API delay for UX
    setTimeout(() => {
        onLogin(user);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-darker flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-surface/50 backdrop-blur-xl border border-slate-700 w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
             <span className="text-4xl">🌍</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AFRI</h1>
          <p className="text-slate-400">Portal Educativo Corporativo</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium ml-1">Selecciona tu usuario</label>
              <div className="relative">
                  <select 
                    value={selectedUserEmail}
                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="">-- Seleccionar --</option>
                    {users.map(u => (
                        <option key={u.id} value={u.email}>
                            {u.name} - {u.role}
                        </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <ChevronRight size={20} className="rotate-90" />
                  </div>
              </div>
          </div>
          
          <button 
            onClick={handleLogin}
            disabled={!selectedUserEmail || loading}
            className={`w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${loading ? 'scale-95' : ''}`}
          >
             {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
                <>
                    <span>Ingresar a AFRI</span>
                    <ChevronRight size={20} />
                </>
             )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
             <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
                <UsersIcon size={16} />
                <span className="text-sm">{users.length} Colaboradores Activos</span>
             </div>
            <p className="text-xs text-slate-600">
                Powered by SimpleData Technology
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;