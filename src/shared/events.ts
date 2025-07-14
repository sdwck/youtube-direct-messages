import { User } from '../types/user';
import { Video } from '../types/video';

export enum DMEvents {
  AuthChanged = 'auth_changed',
  UIReady = 'ui_ready',
  FirebaseReady = 'firebase_ready',
  InitUI = 'init_ui',
  SHARE_INITIATED = 'share_initiated'
}

export type DMEventMap = {
  [DMEvents.AuthChanged]: User | null;
  [DMEvents.UIReady]: void;
  [DMEvents.FirebaseReady]: unknown;
  [DMEvents.InitUI]: void;
  [DMEvents.SHARE_INITIATED]: { videoData: Video };
};

type Callback<T> = (payload: T) => void;

const listeners = new Map<DMEvents, Function[]>();

export function emit<T extends DMEvents>(event: T, payload: DMEventMap[T]) {
  listeners.get(event)?.forEach(cb => cb(payload));
}

export function on<T extends DMEvents>(event: T, cb: Callback<DMEventMap[T]>) {
  const cbs = listeners.get(event) || [];
  cbs.push(cb);
  listeners.set(event, cbs);
}