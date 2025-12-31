import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2, Sparkles, Zap } from 'lucide-react';
import { generateTutorResponse } from '../services/geminiService';
import { ChatMessage, MessageRole } from '../types';
import { useLocation } from 'react-router-dom';

const AITutor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: MessageRole.MODEL, text: "¡Hola! Soy AFRI-AI. Estoy aquí para ayudarte a traducir tus conocimientos de Legacy a la Nueva Era. ¿En qué trabajamos hoy?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Proactive Tip System based on route
  useEffect(() => {
      let timeout: ReturnType<typeof setTimeout>;
      // Show tip 3 seconds after route change, but only if chat is closed
      if (!isOpen) {
          timeout = setTimeout(() => {
             setShowTip(true);
             // Hide tip automatically after 8 seconds
             setTimeout(() => setShowTip(false), 8000);
          }, 3000);
      }
      return () => clearTimeout(timeout);
  }, [location.pathname, isOpen]);

  const getTipMessage = () => {
      switch(location.pathname) {
          case '/classes': return "💡 Tip: Usa el botón 'Resumen IA' dentro de las clases para obtener las ideas clave en segundos.";
          case '/students': return "👀 Dato: Puedes ver las habilidades de tus compañeros para formar grupos de estudio.";
          case '/': return "🚀 Estado: Tu progreso se sincroniza en tiempo real con la nube.";
          default: return "✨ Estoy aquí si necesitas ayuda con algún término técnico.";
      }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: MessageRole.USER, text: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await generateTutorResponse(history, userMsg);
      setMessages(prev => [...prev, { role: MessageRole.MODEL, text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: MessageRole.MODEL, text: "Error de conexión neuronal. Reintentando..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Tip Bubble */}
      <div className={`fixed bottom-24 right-4 lg:bottom-10 lg:right-24 z-40 transition-all duration-500 transform ${showTip ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
          <div className="bg-surface/90 backdrop-blur border border-primary/30 p-4 rounded-2xl shadow-xl max-w-xs relative animate-float">
              <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-surface border-r border-b border-primary/30 rotate-45 hidden lg:block"></div>
              <div className="flex gap-3 items-start">
                  <div className="bg-primary/20 p-1.5 rounded-lg text-primary shrink-0">
                      <Sparkles size={16} />
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{getTipMessage()}</p>
              </div>
              <button onClick={() => setShowTip(false)} className="absolute top-1 right-1 text-slate-500 hover:text-white">
                  <X size={12} />
              </button>
          </div>
      </div>

      {/* Floating Button (The "Orb") */}
      <button
        onClick={() => { setIsOpen(true); setShowTip(false); }}
        className={`fixed bottom-20 right-4 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all transform hover:scale-110 z-50 flex items-center justify-center group overflow-hidden ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-secondary animate-spin-slow opacity-80 group-hover:opacity-100"></div>
        <div className="absolute inset-[2px] bg-darker rounded-full flex items-center justify-center">
            <Bot size={28} className="text-white group-hover:text-primary transition-colors" />
        </div>
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-0 right-0 lg:bottom-8 lg:right-8 w-full lg:w-[400px] h-[100vh] lg:h-[600px] glass-panel lg:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 transform origin-bottom-right z-50 overflow-hidden ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none translate-y-20'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 flex justify-between items-center border-b border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-2 h-2 bg-green-400 rounded-full absolute -top-1 -right-1 animate-pulse"></div>
                <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-lg shadow-lg">
                    <Bot size={20} className="text-white" />
                </div>
            </div>
            <div>
                <h3 className="font-bold text-white text-sm tracking-wide">AFRI_AI <span className="text-[10px] text-primary bg-primary/10 px-1 rounded border border-primary/20">BETA</span></h3>
                <p className="text-[10px] text-slate-400">Asistente de Transición Tecnológica</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors text-slate-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${
                msg.role === MessageRole.USER ? 'bg-slate-700 border border-slate-600' : 'bg-gradient-to-br from-primary to-secondary text-white'
              }`}>
                {msg.role === MessageRole.USER ? <UserIcon size={14} /> : <Zap size={14} fill="currentColor" />}
              </div>
              <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-md ${
                msg.role === MessageRole.USER 
                  ? 'bg-slate-800 text-white rounded-tr-none border border-slate-700' 
                  : 'bg-primary/10 backdrop-blur-md text-slate-100 border border-primary/20 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center flex-shrink-0">
                 <Bot size={14} />
               </div>
               <div className="bg-primary/5 border border-primary/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                 <Loader2 size={16} className="animate-spin text-primary" />
                 <span className="text-xs text-primary font-medium animate-pulse">Procesando respuesta...</span>
               </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-darker/80 border-t border-white/5 backdrop-blur">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu consulta aquí..."
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white p-1.5 rounded-lg transition-all shadow-lg shadow-primary/20"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="text-center mt-2">
              <span className="text-[10px] text-slate-600 uppercase tracking-widest">Powered by Google Gemini</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AITutor;