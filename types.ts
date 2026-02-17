
export interface User {
  id: string; // Email o Firebase ID
  email: string;
  name: string;
  role: string; // 'Estudiante' | 'Master Root' | 'Profesor'
  avatar: string;
  password?: string; 
  stats: {
    prompting: number;
    tools: number;
    analysis: number;
  };
  progress: {
    completed: number;
    total: number;
  };
  // Mapa de progreso: 'w1-s1': true
  progress_details?: Record<string, boolean>; 
}

export interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ClassSession {
  id: string; // Format: w1-s1
  weekId: number;
  sessionNumber: number; 
  title: string;
  description: string;
  videoUrl?: string; 
  meetLink?: string;
  transcript?: string; // Markdown content
  quiz?: QuizItem[]; // Estructura formal del Quiz
  resources?: { title: string; url: string }[];
  date?: string;
  day?: string;
  // UI helper props
  isCompleted?: boolean; 
}

export interface WeekData {
  id: number;
  title: string;
  sessions: ClassSession[];
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  role: MessageRole;
  text: string;
}
