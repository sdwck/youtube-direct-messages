import { doc, getDoc, setDoc, updateDoc, arrayRemove, arrayUnion } from '../libs/firebase/firebase-firestore.js';
import { db, auth } from './firebase-config';

const IGNORE_LIST_DOC = 'ignoreList';

export async function getIgnoreList(): Promise<string[]> {
    const me = auth.currentUser;
    if (!me) return [];

    const settingsRef = doc(db, 'users', me.uid, 'settings', IGNORE_LIST_DOC);
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists() && docSnap.data().uids) {
        return docSnap.data().uids;
    }
    return [];
}

export async function addToIgnoreList(uidToIgnore: string): Promise<void> {
    const me = auth.currentUser;
    if (!me || me.uid === uidToIgnore) return;

    const settingsRef = doc(db, 'users', me.uid, 'settings', IGNORE_LIST_DOC);
    await setDoc(settingsRef, { uids: arrayUnion(uidToIgnore) }, { merge: true });
}

export async function removeFromIgnoreList(uidToRemove: string): Promise<void> {
    const me = auth.currentUser;
    if (!me) return;

    const settingsRef = doc(db, 'users', me.uid, 'settings', IGNORE_LIST_DOC);
    await updateDoc(settingsRef, { uids: arrayRemove(uidToRemove) });
}