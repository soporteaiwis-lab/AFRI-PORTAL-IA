import React, { useState, useEffect } from 'react';
import { X, PlayCircle, FileText, CheckCircle, AlignLeft, BrainCircuit, RotateCcw, Award } from 'lucide-react';
import { ClassSession } from '../types';
import { generateQuizFromText, QuizQuestion } from '../services/geminiService';

interface VideoModalProps {
  session: ClassSession | null;
  onClose: () => void;
  onMarkComplete: (id: string) => void;
  weekId: number;
}

const VideoModal: React.FC<VideoModalProps> = ({ session, onClose, onMarkComplete, weekId }) => {
  const [activeTab, setActiveTab] = useState<'description' | 'transcript' | 'quiz'>('description');
  const [transcriptHtml, setTranscriptHtml] = useState<string>('');
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  
  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (session) {
        // Reset state on open
        setActiveTab('description');
        setQuizQuestions([]);
        setQuizStarted(false);
        setShowResults(false);
        setUserAnswers([]);
    }
  }, [session]);

  useEffect(() => {
    if (session && (activeTab === 'transcript' || activeTab === 'quiz')) {
      if (!rawTranscript) {
          loadTranscript();
      }
    }
  }, [session, activeTab]);

  const loadTranscript = async () => {
    if (!session || !weekId) return;
    
    setLoadingTranscript(true);
    const dayName = session.day.toLowerCase().trim();
    const url = `https://raw.githubusercontent.com/soporteaiwis-lab/simpledata/main/transcripts/fase1-semana${weekId}-${dayName}.md`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        setRawTranscript(text); // Store raw for AI
        
        // HTML Formatting for display
        const html = text
          .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-primary mt-6 mb-2">$1</h3>')
          .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-8 mb-4 border-b border-slate-700 pb-2">$1</h2>')
          .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-2 mb-6">$1</h1>')
          .replace(/\*\*(.*)\*\*/gim, '<strong class="text-white">$1</strong>')
          .replace(/\n\n/g, '</p><p class="mb-4 text-slate-300 leading-relaxed">')
          .replace(/\n/g, '<br />');
        
        setTranscriptHtml(`<div class="transcript-content"><p class="mb-4 text-slate-300 leading-relaxed">${html}</p></div>`);
      } else {
        setTranscriptHtml('ERROR_NOT_FOUND');
      }
    } catch (error) {
      setTranscriptHtml('ERROR_FETCH');
    } finally {
      setLoadingTranscript(false);
    }
  };

  const startQuiz = async () => {
      setQuizLoading(true);
      try {
          // If we don't have transcript yet, wait for it (unlikely due to UI flow, but safe)
          let textToAnalyze = rawTranscript;
          if (!textToAnalyze) {
             // Try fetching if user went straight to quiz without loading transcript tab
             await loadTranscript();
             textToAnalyze = rawTranscript; 
          }

          if (textToAnalyze) {
              const questions = await generateQuizFromText(textToAnalyze);
              setQuizQuestions(questions);
              setQuizStarted(true);
              setUserAnswers(new Array(questions.length).fill(-1));
          } else {
              alert("No se pudo cargar la transcripción para generar el quiz.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setQuizLoading(false);
      }
  };

  const handleAnswer = (qIndex: number, optionIndex: number) => {
      const newAnswers = [...userAnswers];
      newAnswers[qIndex] = optionIndex;
      setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
      return userAnswers.reduce((acc, ans, idx) => {
          return ans === quizQuestions[idx].correctAnswerIndex ? acc + 1 : acc;
      }, 0);
  };

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-5xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/90 backdrop-blur">
          <div>
            <h3 className="text-xl font-bold text-white">{session.title}</h3>
            <div className="flex gap-2 text-sm mt-1">
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{session.day}</span>
                <span className="text-slate-400">Semana {weekId}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="bg-black aspect-video w-full shrink-0 max-h-[40vh] lg:max-h-[50vh] relative group">
            {session.videoUrl ? (
               <iframe 
               width="100%" 
               height="100%" 
               src={`https://www.youtube.com/embed/${session.videoUrl}`} 
               title="Video Player"
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
               allowFullScreen
             ></iframe>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50">
                    <PlayCircle size={48} className="mb-2 opacity-30" />
                    <p>Video no disponible</p>
                </div>
            )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800/80">
            <button 
                onClick={() => setActiveTab('description')}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'description' ? 'border-primary text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
                <div className="flex items-center justify-center gap-2">
                    <AlignLeft size={16} /> Descripción
                </div>
            </button>
            <button 
                onClick={() => setActiveTab('transcript')}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-primary text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
                <div className="flex items-center justify-center gap-2">
                    <FileText size={16} /> Transcripción
                </div>
            </button>
            <button 
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'quiz' ? 'border-primary text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
                <div className="flex items-center justify-center gap-2">
                    <BrainCircuit size={16} /> Quiz IA
                </div>
            </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface">
            {activeTab === 'description' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Acerca de esta clase</h4>
                        <p className="text-slate-300 leading-relaxed text-lg">{session.description}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-700 mt-8">
                        <button 
                            onClick={() => onMarkComplete(session.id)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all font-bold shadow-lg w-full md:w-auto justify-center ${
                                session.isCompleted 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/50 hover:bg-green-500/20' 
                                : 'bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white'
                            }`}
                        >
                            <CheckCircle size={20} /> 
                            {session.isCompleted ? 'Clase Completada' : 'Marcar como Vista'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'transcript' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    {loadingTranscript ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <div className="w-8 h-8 border-4 border-slate-600 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p>Cargando transcripción...</p>
                        </div>
                    ) : transcriptHtml === 'ERROR_NOT_FOUND' ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="bg-slate-800 p-4 rounded-full mb-4">
                                <FileText size={32} class="text-slate-500" />
                            </div>
                            <p className="text-slate-400 text-lg font-medium">Transcripción no disponible</p>
                            <p className="text-slate-500 text-sm mt-1">Aún no se ha subido el archivo para esta clase.</p>
                        </div>
                    ) : (
                        <div 
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: transcriptHtml }}
                        />
                    )}
                </div>
            )}

            {activeTab === 'quiz' && (
                <div className="animate-in zoom-in-95 duration-300 h-full">
                    {!quizStarted ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                                <BrainCircuit size={40} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Quiz Generado con IA</h3>
                            <p className="text-slate-400 max-w-md mb-8">
                                La Inteligencia Artificial analizará la transcripción de esta clase y generará 3 preguntas clave para evaluar tu aprendizaje.
                            </p>
                            <button 
                                onClick={startQuiz}
                                disabled={quizLoading}
                                className="px-8 py-3 bg-white text-dark font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {quizLoading ? <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin"></div> : <BrainCircuit size={20} />}
                                {quizLoading ? 'Generando...' : 'Generar Quiz Ahora'}
                            </button>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto pb-8">
                            {showResults ? (
                                <div className="text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700">
                                    <div className="w-20 h-20 mx-auto bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
                                        <Award size={40} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-2">
                                        Tu Puntaje: {calculateScore()} / {quizQuestions.length}
                                    </h3>
                                    <p className="text-slate-400 mb-8">
                                        {calculateScore() === quizQuestions.length ? '¡Excelente! Has dominado este tema.' : 'Buen intento, revisa la transcripción para mejorar.'}
                                    </p>
                                    <button 
                                        onClick={() => {
                                            setQuizStarted(false);
                                            setShowResults(false);
                                            setUserAnswers([]);
                                        }}
                                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        <RotateCcw size={16} /> Intentar de nuevo
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {quizQuestions.map((q, idx) => (
                                        <div key={idx} className="bg-slate-800/30 p-6 rounded-xl border border-slate-800">
                                            <h4 className="text-lg font-bold text-white mb-4 flex gap-3">
                                                <span className="text-slate-500">0{idx + 1}.</span> {q.question}
                                            </h4>
                                            <div className="space-y-2">
                                                {q.options.map((opt, optIdx) => (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => handleAnswer(idx, optIdx)}
                                                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                                                            userAnswers[idx] === optIdx 
                                                            ? 'bg-primary/20 border-primary text-white' 
                                                            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-end pt-4">
                                        <button 
                                            onClick={() => setShowResults(true)}
                                            disabled={userAnswers.includes(-1)}
                                            className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-primary/20 transition-all"
                                        >
                                            Ver Resultados
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VideoModal;