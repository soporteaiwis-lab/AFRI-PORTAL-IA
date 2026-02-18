import React, { useState } from 'react';
import { User } from '../types';
import { ChevronRight, Users as UsersIcon, Lock, AlertCircle, Shield, Database } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Simular pequeño delay de red para realismo UI
    setLoading(true);

    setTimeout(() => {
        const cleanId = identifier.toLowerCase().trim();

        // 1. Verificar Master Root Hardcoded (Acceso Garantizado)
        if (cleanId === 'soporte.aiwis@gmail.com' && password === '1234') {
            const masterUser: User = {
                id: 'root-master',
                email: 'soporte.aiwis@gmail.com',
                name: 'Soporte AIWIS',
                role: 'Master Root',
                avatar: 'S',
                password: '1234',
                stats: { prompting: 100, tools: 100, analysis: 100 },
                progress: { completed: 0, total: 12 },
                progress_details: {}
            };
            onLogin(masterUser);
            return;
        }

        // 2. Verificar Usuarios en Base de Datos Local
        const user = users.find(u => 
            u.email.toLowerCase() === cleanId || 
            u.name.toLowerCase() === cleanId
        );

        if (user && user.password === password) {
            onLogin(user);
        } else {
            setLoading(false);
            setError('Credenciales inválidas. Intente nuevamente.');
        }
    }, 600);
  };

  const autoFillMaster = () => {
      setIdentifier('soporte.aiwis@gmail.com');
      setPassword('1234');
      setError('');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative font-sans">
      {/* Background FX */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cobol/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-cobol rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/20">
             <Database className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">AFRI PORTAL</h1>
          <p className="text-slate-500 text-sm">Sistema de Gestión Académica</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
              <div className="relative group">
                  <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Correo o ID de Usuario"
                    className="w-full bg-black/50 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                  />
              </div>
              <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full bg-black/50 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                  />
              </div>
          </div>
          
          {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-xs font-bold animate-in slide-in-from-top-2">
                  <AlertCircle size={14} />
                  {error}
              </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-white text-black hover:bg-slate-200 font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-white/10 ${loading ? 'opacity-80 scale-[0.98]' : 'hover:scale-[1.02]'}`}
          >
             {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
             ) : (
                <>
                    <span>Iniciar Sesión</span>
                    <ChevronRight size={18} />
                </>
             )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <button 
                onClick={autoFillMaster}
                className="text-xs font-mono text-slate-600 hover:text-cobol transition-colors flex items-center justify-center gap-2 mx-auto py-2 px-4 rounded hover:bg-cobol/5 group"
            >
                <Shield size={12} className="group-hover:text-cobol transition-colors" />
                [ROOT_MASTER_ACCESS]
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
