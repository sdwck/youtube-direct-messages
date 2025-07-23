import {
  collection, query, where, getDocs, addDoc, onSnapshot, orderBy, doc, getDoc,
  Unsubscribe, QueryDocumentSnapshot, DocumentData, serverTimestamp,
  limitToLast, startAfter, writeBatch, limit, Timestamp, arrayUnion, arrayRemove, updateDoc,
  setDoc, deleteDoc
} from '../libs/firebase/firebase-firestore.js';
import { db, auth } from './firebaseConfig';
import { User } from '../types/user';
import { Message } from '../types/message';
import { Chat, ChatType } from '../types/chat';

const MESSAGES_BATCH_SIZE = 25;
const userProfileCache = new Map<string, User>();
const IGNORE_LIST_DOC_ID = 'ignoreList';

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

  const q = query(chatsCol,
    where('type', '==', ChatType.PRIVATE),
    where('participants', '==', participants)
  );
  const snap = await getDocs(q);

  if (snap.docs.length > 0) {
    return snap.docs[0].id;
  } else {
    const newChatRef = await addDoc(chatsCol, {
      participants: participants,
      type: ChatType.PRIVATE,
      updatedAt: serverTimestamp(),
      lastMessage: null,
      createdAt: serverTimestamp()
    });
    return newChatRef.id;
  }
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const chatDoc = await getDoc(doc(db, 'chats', chatId));
  if (chatDoc.exists()) {
    return { id: chatDoc.id, ...chatDoc.data() } as Chat;
  }
  return null;
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
  if (!me) return () => { };

  const chatsCol = collection(db, 'chats');
  const q = query(chatsCol, where('participants', 'array-contains', me.uid), orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snap) => {
    const chats: Chat[] = [];
    snap.forEach(doc => {
      const data = doc.data() as DocumentData;
      chats.push({ id: doc.id, ...data } as Chat);
    });
    callback(chats);
  });
}

export function listenToNewMessages(
  chatId: string,
  latestMessageTimestamp: Timestamp | null,
  callback: (messages: Message[]) => void
): Unsubscribe {
  if (!auth.currentUser) return () => { };

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

export async function createGroupChat(name: string, initialParticipantUids: string[]): Promise<string> {
  const me = auth.currentUser;
  if (!me) throw new Error('Not authenticated');

  const allParticipants = [...new Set([me.uid, ...initialParticipantUids])];

  const newChatData = {
    type: 'group' as const,
    name: name,
    photoURL: '',
    creator: me.uid,
    admins: [me.uid],
    participants: allParticipants,
    updatedAt: serverTimestamp(),
    lastMessage: null,
  };

  const newChatRef = await addDoc(collection(db, 'chats'), newChatData);
  return newChatRef.id;
}

export async function addMembersToChat(chatId: string, uidsToAdd: string[]): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    participants: arrayUnion(...uidsToAdd)
  });
}

export async function leaveChat(chatId: string): Promise<void> {
  const me = auth.currentUser;
  if (!me) throw new Error('Not authenticated');

  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    participants: arrayRemove(me.uid)
  });
}

export async function updateChatDetails(chatId: string, details: { name?: string; photoURL?: string }): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, details);
}

export async function getIgnoreListUids(): Promise<string[]> {
  const me = auth.currentUser;
  if (!me) return [];

  const settingsRef = doc(db, 'users', me.uid, 'settings', IGNORE_LIST_DOC_ID);
  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists() && docSnap.data().uids) {
    return docSnap.data().uids;
  }
  return [];
}

export async function addUserToIgnoreList(uidToIgnore: string): Promise<void> {
  const me = auth.currentUser;
  if (!me || me.uid === uidToIgnore) return;

  const settingsRef = doc(db, 'users', me.uid, 'settings', IGNORE_LIST_DOC_ID);
  await setDoc(settingsRef, { uids: arrayUnion(uidToIgnore) }, { merge: true });
}

export async function removeUserFromIgnoreList(uidToRemove: string): Promise<void> {
  const me = auth.currentUser;
  if (!me) return;

  const settingsRef = doc(db, 'users', me.uid, 'settings', IGNORE_LIST_DOC_ID);
  await updateDoc(settingsRef, { uids: arrayRemove(uidToRemove) });
}

export async function deleteGroup(chatId: string): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  const messagesColRef = collection(chatRef, 'messages');

  const messagesQuery = query(messagesColRef);
  const messagesSnapshot = await getDocs(messagesQuery);

  const batch = writeBatch(db);
  messagesSnapshot.forEach(messageDoc => {

    const messageDocRef = doc(messagesColRef, messageDoc.id);
    batch.delete(messageDocRef);
  });

  if (!messagesSnapshot.empty) {
    await batch.commit();
  }

  await deleteDoc(chatRef);
}

export async function getAllChats(): Promise<Chat[]> {
    const me = auth.currentUser;
    if (!me) return [];

    const chatsCol = collection(db, 'chats');
    const q = query(chatsCol, where('participants', 'array-contains', me.uid));
    
    const snapshot = await getDocs(q);
    
    const chats: Chat[] = [];
    snapshot.forEach(doc => {
        chats.push({ id: doc.id, ...doc.data() } as Chat);
    });

    return chats;
}

export async function removeMemberFromChat(chatId: string, memberId: string): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        participants: arrayRemove(memberId),
        admins: arrayRemove(memberId)
    });
}

export async function promoteToAdmin(chatId: string, memberId: string): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        admins: arrayUnion(memberId)
    });
}

export async function demoteFromAdmin(chatId: string, memberId: string): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        admins: arrayRemove(memberId)
    });
}


export async function isUserGroupAdmin(chatId: string, userId: string): Promise<boolean> {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        return chatData.creator === userId || (chatData.admins || []).includes(userId);
    }
    return false;
}