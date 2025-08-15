import { Timestamp } from '../libs/firebase/firebase-firestore.js';
import { Message } from './message';

export enum ChatType {
    PRIVATE = 'private',
    GROUP = 'group'
}

export interface Chat {
  id: string;
  participants: string[];
  invited?: string[];
  updatedAt: Timestamp;
  lastMessage: Message | null;
  type: ChatType;
  name?: string;
  photoURL?: string;
  creator?: string;
  admins?: string[];
}