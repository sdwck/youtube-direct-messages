import { Timestamp } from '../libs/firebase/firebase-firestore.js';

export interface Chat {
  id: string;
  participants: string[];
  updatedAt: Timestamp;
  lastMessage: {
    from: string;
    text?: string;
    video?: any;
    timestamp: Timestamp;
  };
}