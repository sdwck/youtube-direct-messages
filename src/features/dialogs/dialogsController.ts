import { Unsubscribe } from '../../libs/firebase/firebase-firestore.js';
import { chatService } from '../../services/chatService';
import { settingsService } from '../../services/settingsService';
import { authService } from '../../services/authService';
import { stateService, ViewType } from '../../services/stateService';
import { notificationService } from '../../services/notificationService';
import { DialogsView, DialogsViewProps, DialogItem } from './dialogsView';
import { User } from '../../types/user';

export class DialogsController {
    private view: DialogsView;
    private chatListenerUnsubscribe: Unsubscribe | null = null;

    constructor(private container: HTMLElement) {
        const props: DialogsViewProps = {
            isSharing: !!stateService.shareContext,
            selectDialog: this.selectDialog.bind(this),
            openSettings: () => stateService.setView(ViewType.SETTINGS_MAIN),
            copyMyLink: this.copyMyLink.bind(this),
        };
        this.view = new DialogsView(this.container, props);
        this.listenToChats();
    }

    private listenToChats(): void {
        this.view.renderLoading();
        this.chatListenerUnsubscribe = chatService.listenToChats(async (chats) => {
            if (!authService.currentUser) return;
            
            const ignoredUids = await settingsService.getIgnoredUids();
            const unreadIds = notificationService.getUnreadIds();

            const filteredChats = chats.filter(chat => {
                const partnerUid = chat.participants.find((p: string) => p !== authService.currentUser!.uid);
                return partnerUid && !ignoredUids.includes(partnerUid);
            });

            if (filteredChats.length === 0) {
                this.view.renderEmpty();
                return;
            }

            const dialogItemsPromises = filteredChats.map(async (chat): Promise<DialogItem> => {
                const partnerUid = chat.participants.find((p: string) => p !== authService.currentUser!.uid)!;
                const partner = await chatService.getUserProfile(partnerUid);
                return {
                    id: chat.id,
                    partner,
                    lastMessage: chat.lastMessage,
                    updatedAt: chat.updatedAt,
                    isUnread: unreadIds.has(chat.id)
                };
            });
            
            const dialogItems = await Promise.all(dialogItemsPromises);
            this.view.renderDialogs(dialogItems);
        });
    }

    private async selectDialog(partner: User, chatId: string): Promise<void> {
        if (stateService.shareContext) {
            await chatService.addMessage(chatId, { video: stateService.shareContext.videoData });
            stateService.exitShareMode();
        }
        stateService.openChat({ chatId, partner });
    }

    private copyMyLink(): string | null {
        if (authService.currentUser) {
            return `https://www.youtube.com/?dm_user=${authService.currentUser.uid}`;
        }
        return null;
    }

    public destroy(): void {
        this.chatListenerUnsubscribe?.();
        this.view.destroy();
    }
}