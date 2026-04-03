export interface User {
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any; // Firestore Timestamp
}

export interface HistoryItem {
  content: string;
  label: string;
  timestamp: any; // Firestore Timestamp or Date
}

export interface Post {
  id?: string;
  userId: string;
  topic: string;
  audience: string;
  tone: string;
  content: string;
  history: HistoryItem[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  copiedAt?: any; // When user copied to LinkedIn
  performance?: "hot" | "average" | "flopped" | null; // Post result feedback
}
