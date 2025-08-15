import * as api from '../firebase/api';
import { Unsubscribe, QueryDocumentSnapshot, Timestamp } from '../libs/firebase/firebase-firestore';
import { Message } from '../types/message';
import { User } from '../types/user';
import { Chat } from '../types/chat';

interface IChatService {
    getUserProfile(uid: string): Promise<User>;
    getOrCreateChat(toUid: string): Promise<string>;
    getChat(chatId: string): Promise<Chat | null>;
    addMessage(chatId: string, messageData: { text?: string; video?: any }): Promise<void>;
    fetchInitialMessages(chatId: string): Promise<{ messages: Message[], oldestDoc: QueryDocumentSnapshot | null }>;
    fetchOlderMessages(chatId: string, cursor: QueryDocumentSnapshot): Promise<{ messages: Message[], oldestDoc: QueryDocumentSnapshot | null }>;
    listenToChats(callback: (chats: Chat[]) => void): Unsubscribe;
    listenToNewMessages(chatId: string, latestMessageTimestamp: Timestamp | null, callback: (messages: Message[]) => void): Unsubscribe;
    createGroupChat(name: string, initialParticipantUids: string[]): Promise<string>;
    inviteUsersToChat(chatId: string, uidsToInvite: string[]): Promise<void>;
    isUserInvitedToChat(chatId: string, uid: string): Promise<boolean>;
    joinGroupChat(chatId: string): Promise<void>;
    cancelGroupInvitation(chatId: string, uid: string): Promise<void>;
    leaveChat(chatId: string): Promise<void>;
    updateChatDetails(chatId: string, details: { name?: string; photoURL?: string }): Promise<void>;
    getIgnoreListUids(): Promise<string[]>;
    addUserToIgnoreList(uid: string): Promise<void>;
    removeUserFromIgnoreList(uid: string): Promise<void>;
    deleteGroup(chatId: string): Promise<void>;
    getAllChats(): Promise<Chat[]>;
    removeMemberFromChat(chatId: string, memberId: string): Promise<void>;
    promoteToAdmin(chatId: string, memberId: string): Promise<void>;
    demoteFromAdmin(chatId: string, memberId: string): Promise<void>;
    isUserGroupAdmin(chatId: string, userId: string): Promise<boolean>;
}

export const chatService: IChatService = {
    getUserProfile: api.getUserProfile,
    getOrCreateChat: api.getOrCreateChat,
    getChat: api.getChat,
    addMessage: api.addMessage,
    fetchInitialMessages: api.fetchInitialMessages,
    fetchOlderMessages: api.fetchOlderMessages,
    listenToChats: api.listenToChats,
    listenToNewMessages: api.listenToNewMessages,
    createGroupChat: api.createGroupChat,
    inviteUsersToChat: api.inviteUsersToChat,
    isUserInvitedToChat: api.isUserInvitedToChat,
    joinGroupChat: api.joinGroupChat,
    cancelGroupInvitation: api.cancelGroupInvitation,
    leaveChat: api.leaveChat,
    updateChatDetails: api.updateChatDetails,
    getIgnoreListUids: api.getIgnoreListUids,
    addUserToIgnoreList: api.addUserToIgnoreList,
    removeUserFromIgnoreList: api.removeUserFromIgnoreList,
    deleteGroup: api.deleteGroup,
    getAllChats: api.getAllChats,
    removeMemberFromChat: api.removeMemberFromChat,
    promoteToAdmin: api.promoteToAdmin,
    demoteFromAdmin: api.demoteFromAdmin,
    isUserGroupAdmin: api.isUserGroupAdmin,
};