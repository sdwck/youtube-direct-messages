import { Timestamp } from '../libs/firebase/firebase-firestore.js';
import { Message } from './message';

export interface Chat {
  id: string;
  participants: string[];
  updatedAt: Timestamp;
  lastMessage: Message | null;
}