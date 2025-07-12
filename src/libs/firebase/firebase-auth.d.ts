export function getAuth(app?: any): any;
export function signInWithPopup(auth: any, provider: any): Promise<any>;
export class GoogleAuthProvider { constructor(); }

export interface User {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

export function onAuthStateChanged(auth: any, callback: (user: User | null) => void): () => void;