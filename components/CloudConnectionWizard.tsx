
import React, { useState } from 'react';
import { Database, ShieldCheck, Save, AlertTriangle, ExternalLink } from 'lucide-react';
import { saveCloudConfig } from '../firebaseConfig';

const CloudConnectionWizard: React.FC = () => {
    const [configInput, setConfigInput] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        try {
            // Intentar parsear como JSON
            let configJson;
            // Limpieza básica por si pegan código JS en vez de JSON puro
            const cleanInput = configInput.replace(/const firebaseConfig = /g, '').replace(/;/g, '');
            
            // Intento flexible de parseo (JSON estricto o JS object like string)
            // Para seguridad y simplicidad, esperamos JSON válido o el objeto copiado de Firebase
            // Si el usuario pega el objeto JS sin comillas en las claves, JSON.parse fallará.
            // Instruiremos al usuario pegar el JSON.
            
            // Fix simple para claves sin comillas (muy básico)
            const jsonFriendly = cleanInput.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
            
            configJson = JSON.parse(jsonFriendly);
            
            if (!configJson.apiKey || !configJson.projectId) {
                throw new Error("Faltan campos requeridos (apiKey, projectId)");
            }

            saveCloudConfig(configJson);
        } catch (e) {
            setError("Formato inválido. Asegúrate de copiar solo el objeto {...} de configuración.");
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono text-slate-200">
            <div className="bg-slate-900 border border-cobol/30 rounded-2xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(74,222,128,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-cobol"></div>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-cobol/20 p-4 rounded-full text-cobol animate-pulse">
                        <Database size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Conexión a Nube Requerida</h1>
                        <p className="text-cobol text-xs uppercase tracking-widest">Sincronización Global Inactiva</p>
                    </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-6 flex gap-3 items-start">
                    <AlertTriangle className="text-yellow-500 shrink-0 mt-1" size={18} />
                    <p className="text-sm text-yellow-200">
                        Para asegurar que los datos se guarden realmente en la base de datos y se vean en todos los dispositivos, necesitamos vincular este portal con tu proyecto de Google Firebase.
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <ExternalLink size={16} /> Instrucciones:
                    </h3>
                    <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2">
                        <li>Ve a la consola de <a href="https://console.firebase.google.com" target="_blank" className="text-primary underline">Firebase Console</a>.</li>
                        <li>Entra a tu Proyecto {'>'} Configuración del Proyecto (rueda dentada).</li>
                        <li>Baja hasta "Tus apps" y selecciona la Web App (`{'</>'}`).</li>
                        <li>Copia el contenido dentro de <code>const firebaseConfig = {'{ ... }'};</code></li>
                        <li>Pega ese objeto aquí abajo.</li>
                    </ol>
                </div>

                <textarea
                    className="w-full h-40 bg-black border border-slate-700 rounded-xl p-4 font-mono text-xs text-green-400 focus:border-cobol focus:outline-none mb-4"
                    placeholder={'{ \n  "apiKey": "AIzaSy...", \n  "authDomain": "...", \n  ... \n}'}
                    value={configInput}
                    onChange={(e) => setConfigInput(e.target.value)}
                />

                {error && (
                    <p className="text-red-400 text-xs font-bold mb-4 bg-red-900/20 p-2 rounded border border-red-900/50">
                        ❌ {error}
                    </p>
                )}

                <button 
                    onClick={handleSave}
                    className="w-full bg-cobol hover:bg-green-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cobol/20"
                >
                    <ShieldCheck size={20} />
                    GUARDAR Y CONECTAR A LA NUBE
                </button>
            </div>
        </div>
    );
};

export default CloudConnectionWizard;
