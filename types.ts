
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  password?: string; // New field for auth
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
  sessionNumber: number; // 1 or 2
  title: string;
  description: string;
  date?: string; // Optional date string (e.g., "12 Oct")
  videoUrl?: string; // YouTube ID or URL
  meetLink?: string; // New: Google Meet recording link
  isCompleted: boolean;
  transcript?: string;
  resources?: {
    text: string;
    quiz: string;
  };
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
