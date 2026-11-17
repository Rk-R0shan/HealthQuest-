/**
 * HealthQuest — Database Models and Types
 *
 * Defines TypeScript interfaces for all Cloud Firestore collections.
 * Uses Firestore serverTimestamp field compatibility.
 */

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface UserSettings {
  notificationsEnabled: boolean;
  voiceEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export interface UserDocument {
  id?: string;
  email: string;
  role: UserRole;
  createdAt: any; // Firestore Timestamp
  isOnboarded: boolean;
  settings: UserSettings;
}

export interface AvatarConfig {
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  expression: string; // e.g. 'smile', 'happy', 'determined'
  clothing: string;
  accessory: string;
}

export interface ProfileDocument {
  id?: string; // matches userId
  nickname: string;
  avatar: AvatarConfig;
  grade: string; // e.g. 'Preschool', 'Kindergarten', 'Grade 1', etc.
  interests: string[]; // e.g. ['nutrition', 'fitness']
  dailyGoalXP: number;
  totalXP: number;
  level: number;
  coins: number;
  energy: number; // 0 - 100
  streakCount: number;
  lastStreakActiveDate: string | null; // YYYY-MM-DD
  updatedAt: any; // Firestore Timestamp
}

export interface LessonSection {
  id: string;
  type: 'video' | 'text' | 'interactive';
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number; // seconds
}

export type LessonCategory = 'nutrition' | 'fitness' | 'hygiene' | 'sleep';

export interface LessonDocument {
  id?: string;
  title: string;
  description: string;
  category: LessonCategory;
  grade: string;
  xpReward: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number; // total duration in seconds
  sections: LessonSection[];
  createdAt: any; // Firestore Timestamp
}

export interface LessonProgressDocument {
  id?: string; // userId_lessonId
  userId: string;
  lessonId: string;
  completed: boolean;
  durationWatched: number; // seconds
  lastAccessedAt: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp
}

export interface QuizOptionItem {
  text: string;
  visual: string; // Emoji or picture icon (e.g. 🍌, 🍎, 👍, 🪥)
  subtitle?: string;
  color?: string; // Pastel accent
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'tf' | 'scenario';
  question: string;
  options?: (string | QuizOptionItem)[];
  correctAnswer: string; // Text representation matching option
  explanation: string;
  visual?: string; // Header topic emoji/badge
  soundPrompt?: string; // Custom read-aloud text
}

export interface QuizDocument {
  id?: string;
  lessonId: string;
  title: string;
  energyCost: number;
  rewardsXP: number;
  rewardsCoins: number;
  questions: QuizQuestion[];
  createdAt: any; // Firestore Timestamp
}

export interface QuizAttemptDocument {
  id?: string; // userId_quizId_attemptId
  userId: string;
  quizId: string;
  score: number; // percentage (e.g. 80) or raw score
  passed: boolean;
  xpEarned: number;
  coinsEarned: number;
  timestamp: any; // Firestore Timestamp
}

export type DailyChallengeType = 'hydration' | 'steps' | 'lessons' | 'exercise';

export interface DailyChallengeDocument {
  id?: string;
  title: string;
  description: string;
  type: DailyChallengeType;
  targetValue: number;
  rewardXP: number;
  rewardCoins: number;
  activeDate: string; // YYYY-MM-DD
}

export interface ChallengeProgressDocument {
  id?: string; // userId_challengeId
  userId: string;
  challengeId: string;
  currentValue: number;
  completed: boolean;
  date: string; // YYYY-MM-DD
  updatedAt: any; // Firestore Timestamp
}

export interface AchievementDocument {
  id?: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  unlockedAt?: any;
}

export interface BadgeDocument {
  id?: string;
  title: string;
  description: string;
  iconUrl: string;
  criteriaType: 'xp' | 'streak' | 'quizzes' | 'lessons' | 'hydration';
  criteriaValue: number;
}

export interface UserBadgeDocument {
  id?: string; // userId_badgeId
  userId: string;
  badgeId: string;
  unlockedAt: any; // Firestore Timestamp
}

export interface SchoolDocument {
  id?: string;
  name: string;
  address?: string;
}

export interface ClassDocument {
  id?: string;
  schoolId: string | null;
  teacherId: string;
  name: string;
  grade: string;
  accessCode: string; // alphanumeric invite code
  studentIds: string[]; // pointers to userIds
  createdAt: any; // Firestore Timestamp
}

export interface TeacherDocument {
  id?: string; // matches userId
  fullName: string;
  schoolId: string | null;
  classIds: string[];
}

export interface ParentDocument {
  id?: string; // matches userId
  fullName: string;
  childrenIds: string[]; // pointers to profileIds (student userIds)
}

export type NotificationType = 'streak' | 'assignment' | 'portal';

export interface NotificationDocument {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: any; // Firestore Timestamp
}
