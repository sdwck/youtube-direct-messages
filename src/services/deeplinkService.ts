import { stateService, IActiveChatContext } from './stateService';
import { authService } from './authService';
import { chatService } from './chatService';
import { Chat } from '../types/chat';

interface IDeepLinkCallbacks {
    onTrigger: (chat: Chat) => void;
}

class DeepLinkService {
    private hasProcessed = false;
    private callbacks: IDeepLinkCallbacks | null = null;
    
    public initialize(callbacks: IDeepLinkCallbacks): void {
        this.callbacks = callbacks;
        this.processQueryParam();
        authService.onAuthChange(() => this.tryProcessPendingLink());
    }
    
    private processQueryParam(): void {
        try {
            const url = new URL(window.location.href);
            const dmUser = url.searchParams.get('dm_user');
            if (dmUser) {
                sessionStorage.setItem('yt-dm-pending-chat-uid', dmUser);
                url.searchParams.delete('dm_user');
                window.history.replaceState({}, document.title, url.toString());
            }
        } catch (e) {
            console.error('YT-DM: Error processing incoming chat link.', e);
        }
    }
    
    private async tryProcessPendingLink(): Promise<void> {
        if (this.hasProcessed || !authService.currentUser) return;

        const recipientUid = sessionStorage.getItem('yt-dm-pending-chat-uid');
        if (!recipientUid || recipientUid === authService.currentUser.uid) {
            if (recipientUid) sessionStorage.removeItem('yt-dm-pending-chat-uid');
            return;
        }

        this.hasProcessed = true;
        sessionStorage.removeItem('yt-dm-pending-chat-uid');

        try {
            const partner = await chatService.getUserProfile(recipientUid);
            const chatId = await chatService.getOrCreateChat(recipientUid);
            const chat = await chatService.getChat(chatId);
            if (chat) {
                this.callbacks?.onTrigger(chat);
            } else {
                throw new Error(`Could not retrieve chat with ID: ${chatId}`);
            }
        } catch (error) {
            console.error("Failed to open chat from link:", error);
            alert("Could not start a chat. The user's UID may be invalid.");
        }
    }
}

export const deeplinkService = new DeepLinkService();