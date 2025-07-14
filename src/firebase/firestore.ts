import {
  collection, query, where, getDocs, addDoc, onSnapshot, orderBy, doc, getDoc,
  Unsubscribe, QueryDocumentSnapshot, DocumentData, serverTimestamp,
  limitToLast, startAfter, writeBatch, limit, Timestamp
} from '../libs/firebase/firebase-firestore.js';
import { db, auth } from './firebaseConfig';
import { User } from '../types/user';
import { Message } from '../types/message';
import { Chat } from '../types/chat';

const MESSAGES_BATCH_SIZE = 25;

const userProfileCache = new Map<string, User>();

export async function getUserProfile(uid: string): Promise<User> {
  if (userProfileCache.has(uid)) {
    return userProfileCache.get(uid)!;
  }
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    const userData = userDocSnap.data() as User;
    userProfileCache.set(uid, userData);
    return userData;
  } else {
    throw new Error(`User profile not found for UID: ${uid}`);
  }
}

export async function getOrCreateChat(toUid: string): Promise<string> {
  const me = auth.currentUser;
  if (!me) throw new Error('Not authenticated');

  const chatsCol = collection(db, 'chats');
  const participants = [me.uid, toUid].sort();
  
  const q = query(chatsCol, where('participants', '==', participants));
  const snap = await getDocs(q);

  if (snap.docs.length > 0) {
    return snap.docs[0].id;
  } else {
    const newChatRef = await addDoc(chatsCol, {
      participants: participants,
      updatedAt: serverTimestamp(),
      lastMessage: null,
      createdAt: serverTimestamp()
    });
    return newChatRef.id;
  }
}

export async function addMessage(
  chatId: string,
  messageData: { text?: string; video?: any }
): Promise<void> {
  const me = auth.currentUser;
  if (!me) throw new Error('Not authenticated');
  
  const chatRef = doc(db, 'chats', chatId);
  const messagesCol = collection(chatRef, 'messages');

  const batch = writeBatch(db);

  const newMsgRef = doc(messagesCol);
  const messagePayload = {
    from: me.uid,
    timestamp: serverTimestamp(),
    ...messageData
  };

  batch.set(newMsgRef, messagePayload);
  batch.update(chatRef, {
    updatedAt: serverTimestamp(),
    lastMessage: messagePayload
  });

  await batch.commit();
}

export async function fetchInitialMessages(chatId: string): Promise<{ messages: Message[], oldestDoc: QueryDocumentSnapshot | null }> {
    const messagesCol = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesCol, orderBy('timestamp', 'desc'), limit(MESSAGES_BATCH_SIZE));
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Message)).reverse();
    const oldestDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    return { messages, oldestDoc };
}

export async function fetchOlderMessages(chatId: string, cursor: QueryDocumentSnapshot): Promise<{ messages: Message[], oldestDoc: QueryDocumentSnapshot | null }> {
    const messagesCol = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesCol, orderBy('timestamp', 'desc'), startAfter(cursor), limit(MESSAGES_BATCH_SIZE));
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
    const oldestDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    return { messages, oldestDoc };
}

export function listenToChats(callback: (chats: Chat[]) => void): Unsubscribe {
  const me = auth.currentUser;
  if (!me) return () => {};

  const chatsCol = collection(db, 'chats');
  const q = query(chatsCol, where('participants', 'array-contains', me.uid), orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snap) => {
    const chats: Chat[] = [];
    snap.forEach(doc => {
      const data = doc.data() as DocumentData;
      if (data.lastMessage) {
        chats.push({ id: doc.id, ...data } as Chat);
      }
    });
    callback(chats);
  });
}

export function listenToNewMessages(
  chatId: string,
  latestMessageTimestamp: Timestamp | null,
  callback: (messages: Message[]) => void
): Unsubscribe {
  if (!auth.currentUser) return () => {};

  const messagesCol = collection(db, `chats/${chatId}/messages`);
  const q = latestMessageTimestamp
    ? query(messagesCol, orderBy('timestamp', 'asc'), startAfter(latestMessageTimestamp))
    : query(messagesCol, orderBy('timestamp', 'asc'), startAfter(Timestamp.now()));

  return onSnapshot(q, (snapshot) => {
    const newMessages: Message[] = [];
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        newMessages.push({ ...change.doc.data(), id: change.doc.id } as Message);
      }
    });

    if (newMessages.length > 0) {
      callback(newMessages);
    }
  });
}