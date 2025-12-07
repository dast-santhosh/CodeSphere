
export enum Difficulty {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced'
}

export type Role = 'student' | 'admin';
export type UserStatus = 'pending' | 'active' | 'rejected';

export interface LessonProgress {
  completedAt: string; // ISO String
  score?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatar?: string;
  completedLessonIds: string[];
  progress?: Record<string, LessonProgress>; // Map of lessonId -> Progress
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

export interface ScheduledClass {
  id: string;
  title: string;
  date: string; // ISO String for date/time
  durationMinutes: number;
  instructorName: string;
  meetingLink?: string; // Optional, can default to internal Live room
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

export interface Poll {
  id: string;
  question: string;
  options: { id: number; text: string; votes: number }[];
  isActive: boolean;
  createdAt: any;
}
