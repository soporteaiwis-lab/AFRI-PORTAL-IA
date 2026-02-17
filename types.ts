
export interface User {
  id: string; // Firebase Document ID
  email: string;
  name: string;
  role: string;
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
  progress_details?: Record<string, boolean>; 
}

export interface ClassSession {
  id: string;
  weekId: number;
  sessionNumber: number; 
  title: string;
  description: string;
  videoUrl?: string; 
  meetLink?: string;
  isCompleted?: boolean; // UI state
  transcript?: string; // Stored directly in DB
  quizJson?: string; // Stored directly in DB as stringified JSON
  date?: string;
  day?: string;
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
