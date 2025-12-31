import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Note: In a real production app, never expose the key on the client side without restrictions.
const apiKey = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
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
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("🤖 Modo Demo: Para respuestas reales de IA, por favor configura tu API KEY de Google Gemini. Mientras tanto: ¡Esa es una excelente pregunta sobre el curso! Te recomiendo revisar la clase del Martes de la Semana 1.");
            }, 1000);
        });
    }

    try {
        const model = 'gemini-3-flash-preview';
        const systemInstruction = "Eres un tutor experto y amigable del programa de educación 'SimpleData'. Ayudas a los estudiantes a entender conceptos de IA, Python, y Automatización. Tus respuestas son concisas, motivadoras y usan emojis ocasionalmente.";

        const context = history.slice(-5).map(h => `${h.role}: ${h.text}`).join('\n');
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

export const generateQuizFromText = async (transcriptText: string): Promise<QuizQuestion[]> => {
    if (!ai) {
        // Fallback demo quiz if no API key
        return [
            {
                question: "¿Cuál es el componente principal mencionado en la clase (Modo Demo)?",
                options: ["Python", "JavaScript", "Excel", "PowerPoint"],
                correctAnswerIndex: 0,
                explanation: "Python es el lenguaje base para la IA (Respuesta simulada)."
            },
            {
                question: "¿Qué es un prompt?",
                options: ["Un comando de voz", "Una instrucción de texto para la IA", "Un error de código", "Una base de datos"],
                correctAnswerIndex: 1,
                explanation: "Los prompts son las instrucciones que guían a los modelos de lenguaje."
            }
        ];
    }

    try {
        const prompt = `
            Basado en el siguiente texto de transcripción de una clase, genera 3 preguntas de opción múltiple para evaluar la comprensión del estudiante.
            
            Texto: "${transcriptText.substring(0, 8000)}..." (recortado para brevedad)

            Devuelve UNICAMENTE un array JSON válido con este formato, sin markdown extra:
            [
                {
                    "question": "Pregunta aquí",
                    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
                    "correctAnswerIndex": 0,
                    "explanation": "Breve explicación de por qué es correcta"
                }
            ]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text || "[]";
        return JSON.parse(text);

    } catch (error) {
        console.error("Error generating quiz:", error);
        return [];
    }
};