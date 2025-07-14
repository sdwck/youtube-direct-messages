import * as api from '../firebase/api';
import { Unsubscribe, QueryDocumentSnapshot, Timestamp } from '../libs/firebase/firebase-firestore';
import { Message } from '../types/message';
import { User } from '../types/user';
import { Chat } from '../types/chat';

interface IChatService {
    getUserProfile(uid: string): Promise<User>;
    getOrCreateChat(toUid: string): Promise<string>;
    addMessage(chatId: string, messageData: { text?: string; video?: any }): Promise<void>;
    fetchInitialMessages(chatId: string): Promise<{ messages: Message[], oldestDoc: QueryDocumentSnapshot | null }>;
    fetchOlderMessages(chatId: string, cursor: QueryDocumentSnapshot): Promise<{ messages: Message[], oldestDoc: QueryDocumentSnapshot | null }>;
    listenToChats(callback: (chats: Chat[]) => void): Unsubscribe;
    listenToNewMessages(chatId: string, latestMessageTimestamp: Timestamp | null, callback: (messages: Message[]) => void): Unsubscribe;
}

export const chatService: IChatService = {
    getUserProfile: api.getUserProfile,
    getOrCreateChat: api.getOrCreateChat,
    addMessage: api.addMessage,
    fetchInitialMessages: api.fetchInitialMessages,
    fetchOlderMessages: api.fetchOlderMessages,
    listenToChats: api.listenToChats,
    listenToNewMessages: api.listenToNewMessages
};