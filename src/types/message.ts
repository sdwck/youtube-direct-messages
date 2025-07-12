import { Timestamp } from '../libs/firebase/firebase-firestore.js';

export interface Message {
  id: string;
  from: string;
  text?: string;
  video?: VideoDetails;
  timestamp: Timestamp;
}