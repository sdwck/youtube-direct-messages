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
            const groupInvitationId = url.searchParams.get('group_invitation');

            if (dmUser) {
                sessionStorage.setItem('yt-dm-pending-chat-uid', dmUser);
                url.searchParams.delete('dm_user');
                window.history.replaceState({}, document.title, url.toString());
            } else if (groupInvitationId) {
                sessionStorage.setItem('yt-dm-pending-group-invitation-id', groupInvitationId);
                url.searchParams.delete('group_invitation');
                window.history.replaceState({}, document.title, url.toString());
            }
        } catch (e) {
            console.error('YT-DM: Error processing incoming link.', e);
        }
    }
    
    private async tryProcessPendingLink(): Promise<void> {
        if (this.hasProcessed || !authService.currentUser) return;

        const recipientUid = sessionStorage.getItem('yt-dm-pending-chat-uid');
        const groupInvitationId = sessionStorage.getItem('yt-dm-pending-group-invitation-id');

        if (recipientUid) {
            if (recipientUid === authService.currentUser.uid) {
                sessionStorage.removeItem('yt-dm-pending-chat-uid');
                return;
            }

            this.hasProcessed = true;
            sessionStorage.removeItem('yt-dm-pending-chat-uid');

            try {
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
        } else if (groupInvitationId) {
            this.hasProcessed = true;
            sessionStorage.removeItem('yt-dm-pending-group-invitation-id');

            try {
                if (!await chatService.isUserInvitedToChat(groupInvitationId, authService.currentUser.uid)) {
                    alert("You are not invited to this group chat.");
                    return;
                }
                console.log("Joining group chat from link:", groupInvitationId);

                await chatService.joinGroupChat(groupInvitationId);
                console.log("Successfully joined group chat:", groupInvitationId);
                const chat = await chatService.getChat(groupInvitationId);
                console.log("Retrieved chat:", chat);
                if (chat) {
                    this.callbacks?.onTrigger(chat);
                } else {
                    throw new Error(`Could not retrieve chat with ID: ${groupInvitationId}`);
                }
            } catch (error) {
                console.error("Failed to join group chat from link:", error);
                alert("Could not join the group chat. The invitation link may be invalid or expired.");
            }
        }
    }
}

export const deeplinkService = new DeepLinkService();