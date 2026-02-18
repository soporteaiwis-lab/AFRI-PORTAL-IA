import { GoogleGenAI, Type } from "@google/genai";

// Inicialización segura para entornos de navegador donde 'process' no existe
const getApiKey = () => {
    try {
        // @ts-ignore
        return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
    } catch (e) {
        return '';
    }
};

const apiKey = getApiKey();
let ai: GoogleGenAI | null = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
} else {
    console.warn("⚠️ [AI SERVICE] No API Key found. AI features will be disabled.");
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number; // 0-3
    explanation: string;
}

export const generateTutorResponse = async (
    history: { role: string; text: string }[], 
    userMessage: string
): Promise<string> => {
    
    if (!ai) {
        return "El servicio de IA no está activo (Falta API Key). Contacta al administrador.";
    }

    try {
        const model = 'gemini-3-flash-preview';
        const systemInstruction = "Eres un tutor experto y amigable del programa de educación 'AFRI'. Ayudas a los estudiantes a entender conceptos de IA, Python, y Automatización. Tus respuestas son concisas, motivadoras y usan emojis ocasionalmente. Responde siempre en español.";

        // Format history for Gemini
        // Note: The history logic here is simplified for the prompt. 
        // In a full chat implementation, we would use ai.chats.create()
        const context = history.map(h => `${h.role}: ${h.text}`).join('\n');
        const prompt = `${context}\nuser: ${userMessage}`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text || "Lo siento, no pude generar una respuesta en este momento.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Tuve un problema conectando con mi cerebro digital. Por favor intenta de nuevo.";
    }
};

export const generateSummaryFromText = async (transcriptText: string): Promise<string> => {
    if (!ai) return "Servicio de IA no disponible.";

    try {
        const prompt = `
            Analiza la siguiente transcripción de una clase de tecnología/IA y genera un resumen estructurado que incluya:
            1. 🎯 Objetivo Principal de la clase.
            2. 🔑 3 Conceptos Clave explicados.
            3. 💡 Una conclusión práctica.
            
            Usa formato Markdown con emojis. Sé directo y educativo.
            
            Transcripción: "${transcriptText.substring(0, 10000)}..."
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        return response.text || "No se pudo generar el resumen.";
    } catch (error) {
        console.error("Error generating summary:", error);
        return "Error al generar el resumen.";
    }
};

export const generateQuizFromText = async (transcriptText: string): Promise<QuizQuestion[]> => {
    if (!ai) {
        // Fallback demo quiz
        return [
            {
                question: "Demo: ¿Qué herramienta se menciona para la automatización?",
                options: ["Excel", "N8N", "Paint", "Notepad"],
                correctAnswerIndex: 1,
                explanation: "N8N es la herramienta de automatización de flujos de trabajo mencionada."
            }
        ];
    }

    try {
        const prompt = `
            Basado en el siguiente texto de transcripción, genera un QUIZ de 5 preguntas de selección múltiple.
            El nivel debe ser intermedio.
            
            Texto: "${transcriptText.substring(0, 10000)}..."

            Formato de respuesta esperado (JSON Array):
            [
              {
                "question": "Texto de la pregunta",
                "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
                "correctAnswerIndex": 0, // índice de la respuesta correcta (0-3)
                "explanation": "Por qué es la correcta"
              }
            ]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctAnswerIndex: { type: Type.INTEGER },
                            explanation: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);

    } catch (error) {
        console.error("Error generating quiz:", error);
        return [];
    }
};
