
export enum Difficulty {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced'
}

export type Role = 'student' | 'admin';
export type UserStatus = 'pending' | 'active' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatar?: string;
  completedLessonIds: string[];
  joinedAt?: any; // Firestore Timestamp or Date
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  content: string; // Markdown-like content
  initialCode: string;
  expectedOutput?: string;
  task: string;
  topics: string[];
  quiz?: QuizQuestion[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'system' | 'ai' | 'peer';
  senderName: string;
  text: string;
  timestamp: Date;
}

export interface CodeExecutionResult {
  output: string;
  error?: string;
  isCorrect?: boolean; // For auto-grading
  feedback?: string;
}
