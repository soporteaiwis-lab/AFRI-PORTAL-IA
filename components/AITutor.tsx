import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { generateTutorResponse } from '../services/geminiService';
import { ChatMessage, MessageRole } from '../types';

const AITutor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: MessageRole.MODEL, text: "¡Hola! Soy tu tutor IA de SimpleData. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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
      setMessages(prev => [...prev, { role: MessageRole.MODEL, text: "Lo siento, ocurrió un error. Intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 lg:bottom-8 lg:right-8 p-4 rounded-full shadow-lg transition-all transform hover:scale-110 z-40 ${
          isOpen ? 'scale-0 opacity-0' : 'bg-gradient-to-r from-primary to-secondary text-white scale-100 opacity-100'
        }`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-20 right-4 lg:bottom-8 lg:right-8 w-[90vw] lg:w-96 bg-surface border border-slate-700 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 transform origin-bottom-right z-50 overflow-hidden ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-primary to-secondary p-1.5 rounded-lg">
                <Bot size={20} className="text-white" />
            </div>
            <div>
                <h3 className="font-bold text-white text-sm">Tutor IA</h3>
                <p className="text-xs text-slate-400">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark/50" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === MessageRole.USER ? 'bg-slate-700' : 'bg-primary/20 text-primary'
              }`}>
                {msg.role === MessageRole.USER ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                msg.role === MessageRole.USER 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                 <Bot size={14} />
               </div>
               <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex items-center gap-2">
                 <Loader2 size={16} className="animate-spin text-slate-400" />
                 <span className="text-xs text-slate-400">Pensando...</span>
               </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pregunta sobre la clase..."
              className="flex-1 bg-dark border border-slate-600 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AITutor;