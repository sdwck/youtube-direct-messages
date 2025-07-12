import { initializeApp } from '../libs/firebase/firebase-app.js';
import { getFirestore, doc, setDoc } from '../libs/firebase/firebase-firestore.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from '../libs/firebase/firebase-auth.js';
import { emit, DMEvents } from '../events';
import { User } from '../types/user';
const firebaseConfig = {
    apiKey: "AIzaSyDdrsNQG_DuYEHnJYioECyxZNi96VnDBII",
    authDomain: "yt-dm-nl.firebaseapp.com",
    projectId: "yt-dm-nl",
    storageBucket: "yt-dm-nl.appspot.com",
    messagingSenderId: "249779124962",
    appId: "1:249779124962:web:88a5e6def6afb0a6e93cbb",
    measurementId: "G-T1MPNH5BBD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

firebaseOnAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
  if (firebaseUser) {
    const user: User = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      email: firebaseUser.email,
    };
    await setDoc(doc(db, "users", user.uid), user, { merge: true });
    emit(DMEvents.AuthChanged, user);
  } else {
    emit(DMEvents.AuthChanged, null);
  }
});

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}