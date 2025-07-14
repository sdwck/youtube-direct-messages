import { Timestamp } from '../libs/firebase/firebase-firestore.js';
import { Video } from './video';

export interface Message {
  id: string;
  from: string;
  text?: string;
  video?: Video;
  timestamp: Timestamp;
}