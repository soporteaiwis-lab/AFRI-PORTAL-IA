import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

const Guide: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary inline-block mb-2">Guía de Estudios AFRI</h2>
        <p className="text-slate-400">Ruta de transformación digital en 6 semanas (12 sesiones).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
            { 
                week: 1, 
                title: "Fundamentos & ChatGPT",
                days: ["Intro IA Corporativa", "Prompt Engineering"]
            },
            { 
                week: 2, 
                title: "Herramientas & Dev",
                days: ["Copilot & Cursor", "Automatización Básica"]
            },
            { 
                week: 3, 
                title: "Infraestructura Cloud",
                days: ["Azure Databricks", "Soluciones Enterprise"]
            },
            { 
                week: 4, 
                title: "Automatización Pro",
                days: ["Workflows N8N", "Agentes con LangChain"]
            },
            { 
                week: 5, 
                title: "Estrategia",
                days: ["IA en Finanzas/Ventas", "Detección Oportunidades"]
            },
            { 
                week: 6, 
                title: "Proyecto Final",
                days: ["Design Thinking", "Presentación Final"]
            }
        ].map((section, idx) => (
            <div key={idx} className="bg-surface border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-primary/10 text-primary p-3 rounded-xl shadow-lg shadow-blue-900/10">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Semana {section.week}</span>
                        <h3 className="text-lg font-bold text-white">{section.title}</h3>
                    </div>
                </div>

                <div className="space-y-3">
                    {section.days.map((day, dIdx) => (
                        <div key={dIdx} className="flex items-center gap-3 bg-dark/30 p-3 rounded-lg border border-slate-800/50">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {dIdx + 1}
                            </div>
                            <span className="text-slate-300 text-sm font-medium">{day}</span>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Guide;