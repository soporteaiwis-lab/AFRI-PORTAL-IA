
import React, { useState } from 'react';
import { User } from '../types';
import { ChevronRight, Users as UsersIcon, Lock, AlertCircle, Database, ShieldCheck } from 'lucide-react';

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
    performLogin(identifier, password);
  };

  const performLogin = (idVal: string, passVal: string) => {
    const cleanId = idVal.toLowerCase().trim();

    // --- LOGICA DE ACCESO MASTER DE EMERGENCIA ---
    // Esto permite entrar incluso si Firebase no está conectado o la DB está vacía.
    if (cleanId === 'armin@aiwis.cl' || cleanId.includes('armin')) {
        setLoading(true);
        
        // Creamos el usuario Master en memoria "al vuelo"
        const masterUser: User = {
            id: 'root-master-emergency',
            email: 'armin@aiwis.cl',
            name: 'Armin W Salazar',
            role: 'Master Root',
            avatar: 'A',
            password: '1234',
            stats: { prompting: 100, tools: 100, analysis: 100 },
            progress: { completed: 0, total: 12 },
            progress_details: {}
        };

        // Bypass de contraseña solicitado (entra directo o con cualquier pass)
        setTimeout(() => {
            onLogin(masterUser);
        }, 500);
        return;
    }
    // ---------------------------------------------

    // Lógica normal para estudiantes (busca en la lista descargada de Firebase)
    const user = users.find(u => 
        u.email.toLowerCase() === cleanId || 
        u.name.toLowerCase() === cleanId
    );
    
    if (!user) {
        setError('Usuario no encontrado. Si eres administrador, usa tu correo root.');
        setLoading(false);
        return;
    }

    const validPass = user.password || '1234';

    if (passVal !== validPass) {
        setError('Contraseña incorrecta.');
        setLoading(false);
        return;
    }

    setLoading(true);
    setTimeout(() => {
        onLogin(user);
    }, 800);
  };

  const handleMasterAutoFill = () => {
      const masterEmail = "armin@aiwis.cl";
      setIdentifier(masterEmail);
      setPassword(""); // Dejamos vacío o ponemos cualquier cosa, ya no valida pass para Armin
  };

  return (
    <div className="min-h-screen bg-darker flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-surface/50 backdrop-blur-xl border border-slate-700 w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
             <span className="text-4xl">🌍</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AFRI PORTAL</h1>
          <p className="text-slate-400">Acceso Seguro Corporativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
              <div className="relative">
                  <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Correo (armin@aiwis.cl)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-colors"
                    required
                  />
              </div>
              <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña (Opcional para Root)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-colors"
                  />
              </div>
          </div>
          
          {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {error}
              </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${loading ? 'scale-95' : ''}`}
          >
             {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
                <>
                    <span>Entrar al Sistema</span>
                    <ChevronRight size={20} />
                </>
             )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-4">
            <button 
                onClick={handleMasterAutoFill}
                className="text-xs text-cobol hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto border border-cobol/20 px-3 py-1.5 rounded-full hover:bg-cobol/10"
            >
                <ShieldCheck size={12} />
                🔐 Autocompletar Root
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
