import { Unsubscribe, Timestamp } from '../libs/firebase/firebase-firestore.js';
import { getReadTimestamps, updateReadTimestamp } from '../shared/storage';
import { chatService } from './chatService';
import { settingsService } from './settingsService';
import { authService } from './authService';
import { stateService, ViewType } from './stateService';
import { Chat } from '../types/chat';
import { NotificationStyle } from '../types/settings';

class NotificationService {
    private listenerUnsubscribe: Unsubscribe | null = null;
    private unreadChatIds = new Set<string>();
    private toggleButton: HTMLButtonElement | null = null;

    public initialize(toggleButton: HTMLButtonElement): void {
        this.toggleButton = toggleButton;
        authService.onAuthChange((user) => {
            if (user) {
                this.startListening();
            } else {
                this.stopListening();
            }
        });

        stateService.onViewChange(() => {
            if (stateService.getView() === ViewType.CHAT && stateService.activeChatContext && stateService.isPanelOpen()) {
                this.markChatAsRead(stateService.activeChatContext.chatId);
            }
        });

        stateService.onPanelStateChange((isOpen) => {
            if (stateService.getView() === ViewType.CHAT && stateService.activeChatContext && isOpen) {
                this.markChatAsRead(stateService.activeChatContext.chatId);
            }
        });
    }

    private startListening(): void {
        this.stopListening();
        this.listenerUnsubscribe = chatService.listenToChats(this.processChats.bind(this));
    }

    private stopListening(): void {
        this.listenerUnsubscribe?.();
        this.unreadChatIds.clear();
        this.updateDotVisibility();
    }

    private async processChats(chats: Chat[]): Promise<void> {
        if (!authService.currentUser) return;

        const ignoredUids = await settingsService.getIgnoredUids();
        const readTimestamps = getReadTimestamps();

        const filteredChats = chats.filter(chat => {
            const partnerUid = chat.participants.find(p => p !== authService.currentUser!.uid);
            return partnerUid && !ignoredUids.includes(partnerUid);
        });

        const newUnreadIds = new Set<string>();
        for (const chat of filteredChats) {
            if (chat.lastMessage?.from === authService.currentUser.uid) continue;
            const lastMessageTime = chat.updatedAt instanceof Timestamp ? chat.updatedAt.toDate().getTime() : 0;
            const lastReadTime = readTimestamps[chat.id] || 0;

            if (lastMessageTime > lastReadTime) {
                if (stateService.activeChatContext?.chatId !== chat.id || !stateService.isPanelOpen()) {
                    newUnreadIds.add(chat.id);
                } else {
                    updateReadTimestamp(chat.id);
                }
            }
        }
        this.unreadChatIds = newUnreadIds;
        this.updateDotVisibility();
    }

    private markChatAsRead(chatId: string): void {
        updateReadTimestamp(chatId);
        if (this.unreadChatIds.has(chatId)) {
            this.unreadChatIds.delete(chatId);
            this.updateDotVisibility();
        }
    }

     public updateDotVisibility(): void {
        const dotElement = this.toggleButton?.querySelector('.yt-dm-notification-dot') || this.toggleButton?.querySelector('.yt-dm-notification-dot-countable');
        if (!dotElement) return;

        const { notificationStyle } = settingsService.getAppSettings();
        const unreadCount = this.unreadChatIds.size;

        dotElement.classList.toggle('visible', unreadCount > 0);

        if (notificationStyle === NotificationStyle.COUNT) {
            dotElement.classList.add('yt-dm-notification-dot-countable');
            dotElement.classList.remove('yt-dm-notification-dot');
        } else if (notificationStyle === NotificationStyle.MINIMAL) {
            dotElement.classList.add('yt-dm-notification-dot');
            dotElement.classList.remove('yt-dm-notification-dot-countable');
        }

        if (notificationStyle === NotificationStyle.COUNT && unreadCount > 0) {
            dotElement.textContent = unreadCount > 9 ? '9' : String(unreadCount);
        } else {
            dotElement.textContent = '';
        }
    }

    public getUnreadIds(): Set<string> {
        return this.unreadChatIds;
    }
}

export const notificationService = new NotificationService();