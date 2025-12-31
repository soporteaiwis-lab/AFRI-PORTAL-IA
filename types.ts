export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  stats: {
    prompting: number;
    tools: number;
    analysis: number;
  };
  progress: {
    completed: number;
    total: number;
  };
  // Add this field to track individual classes status in DB
  progress_details?: Record<string, boolean>; 
}

export interface ClassSession {
  id: string;
  sessionNumber: number; // 1 or 2
  title: string;
  description: string;
  date?: string; // Optional date string (e.g., "12 Oct")
  videoUrl?: string; // YouTube ID or URL
  isCompleted: boolean;
  transcript?: string;
  resources?: {
    text: string;
    quiz: string;
  };
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