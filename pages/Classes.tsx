import React, { useState, useEffect } from 'react';
import { COURSE_CONTENT } from '../constants';
import { ClassSession, User } from '../types';
import { Play, CheckCircle, Lock, FileText, BrainCircuit, Circle, Calendar } from 'lucide-react';
import VideoModal from '../components/VideoModal';
import { saveUserProgress, VideoMap } from '../services/dataService';

interface ClassesProps {
  user: User;
  videos: VideoMap;
}

const Classes: React.FC<ClassesProps> = ({ user, videos }) => {
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(1); // 1 = Phase 1 (Weeks 1-3), 2 = Phase 2 (Weeks 4-6)
  const [activeWeekTab, setActiveWeekTab] = useState(1);
  const [localProgress, setLocalProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('simpledata_progress');
    if (saved) {
        try {
            setLocalProgress(JSON.parse(saved));
        } catch(e) { console.error("Error parsing local progress"); }
    }
  }, []);

  const handleMarkComplete = async (session: ClassSession, weekId: number) => {
     // Key format: "s{week}-c{sessionNumber}" e.g., "s1-c1"
     const progressKey = `s${weekId}-c${session.sessionNumber}`;
     
     const currentStatus = localProgress[progressKey] || false;
     const newStatus = !currentStatus;

     const newProgress = {
         ...localProgress,
         [progressKey]: newStatus
     };

     setLocalProgress(newProgress);
     localStorage.setItem('simpledata_progress', JSON.stringify(newProgress));
     
     if (selectedSession && selectedSession.id === session.id) {
         setSelectedSession({ ...selectedSession, isCompleted: newStatus });
     }
     
     await saveUserProgress(user, newProgress);
  };
  
  const extractVideoId = (url: string) => {
      if (!url) return '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : '';
  };

  const getResourceLinks = (weekId: number, sessionNum: number) => {
      // Logic for 12 classes total
      // (Week - 1) * 2 + SessionNum
      const classNumber = (weekId - 1) * 2 + sessionNum;
      const formattedNum = String(classNumber).padStart(2, '0');
      
      const baseUrl = "https://raw.githack.com/soporteaiwis-lab/simpledata/main";
      
      return {
          textUrl: `${baseUrl}/clase${formattedNum}.html`,
          quizUrl: `${baseUrl}/quiz${formattedNum}.html`
      };
  };

  // Determine weeks to show based on Phase
  const weeksToShow = activeTab === 1 ? [1, 2, 3] : [4, 5, 6];

  // Default active week logic
  useEffect(() => {
    setActiveWeekTab(weeksToShow[0]);
  }, [activeTab]);

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">Plan de Estudios AFRI</h2>
            <p className="text-slate-400">Programa de 12 sesiones intensivas.</p>
        </div>
        
        <div className="bg-slate-800/50 p-1.5 rounded-xl border border-slate-700 inline-flex">
            <button 
                onClick={() => setActiveTab(1)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 1 ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
                🚀 Fase 1 (Sem 1-3)
            </button>
            <button 
                onClick={() => setActiveTab(2)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 2 ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
                🎓 Fase 2 (Sem 4-6)
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
            {weeksToShow.map(weekNum => (
                <button
                    key={weekNum}
                    onClick={() => setActiveWeekTab(weekNum)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        activeWeekTab === weekNum 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-surface border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                    }`}
                >
                    Semana {weekNum}
                </button>
            ))}
      </div>

      <div className="space-y-12">
            {COURSE_CONTENT
                .filter(week => week.id === activeWeekTab)
                .map((week) => (
                <div key={week.id} className="relative animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 mb-6">
                        <h3 className="text-2xl font-bold text-white tracking-tight">{week.title}</h3>
                        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded border border-slate-700">2 Sesiones</span>
                    </div>
                    
                    {/* Grid for 2 cards per row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {week.sessions.map((session) => {
                            // Resolve Data
                            const videoMapKey = `${week.id}-${session.sessionNumber}`;
                            const realVideoUrl = videos[videoMapKey] || '';
                            const videoId = extractVideoId(realVideoUrl);
                            
                            const progressKey = `s${week.id}-c${session.sessionNumber}`;
                            const isCompleted = localProgress[progressKey] || false;
                            
                            const { textUrl, quizUrl } = getResourceLinks(week.id, session.sessionNumber);
                            
                            const sessionWithVideo = { ...session, videoUrl: videoId, isCompleted, day: `Clase ${session.sessionNumber}` };

                            return (
                                <div 
                                    key={session.id} 
                                    className="bg-surface border border-slate-800 rounded-2xl overflow-hidden hover:border-primary hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 group/card flex flex-col"
                                >
                                    {/* Thumbnail Area */}
                                    <div 
                                        className="h-56 bg-slate-900 relative overflow-hidden cursor-pointer"
                                        onClick={() => {
                                            setSelectedSession(sessionWithVideo);
                                            setSelectedWeekId(week.id);
                                        }}
                                    >
                                        {videoId ? (
                                            <img 
                                                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                                                alt={session.title}
                                                className="w-full h-full object-cover opacity-80 group-hover/card:opacity-100 group-hover/card:scale-105 transition-all duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-600">
                                                <span className="text-4xl mb-2 opacity-50">🎬</span>
                                                <span className="text-xs uppercase tracking-widest font-semibold">Próximamente</span>
                                            </div>
                                        )}
                                        
                                        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-90"></div>
                                        
                                        {/* Status & Date Badges */}
                                        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
                                             <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkComplete(session, week.id);
                                                }}
                                                className={`
                                                    flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg backdrop-blur-md border transition-all
                                                    ${isCompleted 
                                                        ? 'bg-green-500 text-white border-green-400 hover:bg-green-600' 
                                                        : 'bg-black/50 text-slate-300 border-slate-600 hover:bg-white hover:text-black hover:border-white'}
                                                `}
                                            >
                                                {isCompleted ? <CheckCircle size={12} className="fill-current" /> : <Circle size={12} />}
                                                {isCompleted ? 'VISTO' : 'MARCAR'}
                                            </button>

                                            {session.date && session.date !== 'Por definir' && (
                                                <div className="bg-black/60 backdrop-blur-md text-slate-200 border border-slate-700 px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {session.date}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="absolute bottom-4 left-5 right-5">
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">
                                                Sesión {session.sessionNumber}
                                            </span>
                                            <h4 className="font-bold text-white text-xl leading-tight drop-shadow-md">{session.title}</h4>
                                        </div>

                                        {videoId && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-dark shadow-xl transform scale-75 group-hover/card:scale-100 transition-transform">
                                                    <Play size={28} fill="currentColor" className="ml-1" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <p className="text-slate-400 line-clamp-3 mb-6 flex-1">{session.description}</p>
                                        
                                        <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-800">
                                            <a 
                                                href={textUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 py-3 text-xs font-bold bg-slate-800 hover:bg-primary/20 hover:text-primary hover:border-primary/50 text-slate-300 rounded-lg border border-slate-700 transition-all"
                                            >
                                                <FileText size={16} /> Material
                                            </a>
                                            <a 
                                                href={quizUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 py-3 text-xs font-bold bg-slate-800 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/50 text-slate-300 rounded-lg border border-slate-700 transition-all"
                                            >
                                                <BrainCircuit size={16} /> Quiz
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
      </div>

      <VideoModal 
        session={selectedSession} 
        weekId={selectedWeekId || 0}
        onClose={() => setSelectedSession(null)}
        onMarkComplete={(id) => {
            if (selectedSession && selectedWeekId) {
                handleMarkComplete(selectedSession, selectedWeekId);
            }
        }}
      />
    </div>
  );
};

export default Classes;