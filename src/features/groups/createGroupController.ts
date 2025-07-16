import { stateService, ViewType } from '../../services/stateService';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/authService';
import { CreateGroupView, SelectableUser } from './createGroupView';
import { User } from '../../types/user';
import { ChatType } from '../../types/chat';
import { settingsService } from '../../services/settingsService';
import { Chat } from '../../types/chat';
import { UserSelectionView } from './userSelectionView';

export class CreateGroupController {
    private view: UserSelectionView;

    constructor(private container: HTMLElement) {
        this.view = new UserSelectionView(container, {
            title: 'Create New Group',
            showGroupNameInput: true,
            actionButtonText: 'Create Group',
            back: () => stateService.setView(ViewType.DIALOGS),
            onAction: this.createGroup.bind(this)
        });

        this.loadUsers();
    }

    private async loadUsers(): Promise<void> {
        try {
            const chats = await new Promise<Chat[]>(resolve => {
                const unsubscribe = chatService.listenToChats(resolve);
                setTimeout(() => unsubscribe(), 1000);
            });

            const privateChats = chats.filter((chat: Chat) => chat.type !== ChatType.GROUP);
            const ignoredUids = await settingsService.getIgnoredUids();
            const unignoredChats = privateChats.filter((chat: Chat) => {
                const partnerUid = chat.participants.find(p => p !== authService.currentUser!.uid);
                return partnerUid && !ignoredUids.includes(partnerUid);
            });

            const userPromises = unignoredChats.map(async (chat): Promise<SelectableUser | null> => {
                const partnerUid = chat.participants.find((p: string) => p !== authService.currentUser!.uid);
                if (!partnerUid) return null;
                try {
                    const userProfile = await chatService.getUserProfile(partnerUid);
                    return { ...userProfile, selected: false };
                } catch {
                    return null;
                }
            });

            const users = (await Promise.all(userPromises)).filter(u => u !== null) as SelectableUser[];
            const uniqueUsers = Array.from(new Map(users.map(user => [user.uid, user])).values());

            this.view.renderContent(uniqueUsers);

        } catch (error) {
            console.error("Failed to load users for group creation:", error);
            this.view.showError("Could not load your contacts. Please try again.");
        }
    }

    public async createGroup(name: string | null, members: User[]): Promise<void> {
        if (!name) {
            this.view.showError("Group name cannot be empty.");
            return;
        }
        const memberUids = members.map(m => m.uid);
        try {
            const chatId = await chatService.createGroupChat(name, memberUids);
            const newChat = await chatService.getChat(chatId);
            if (newChat) {
                stateService.openChat(newChat);
            } else {
                throw new Error("Could not fetch newly created chat.");
            }
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('An error occurred while creating the group.');
        }
    }

    public destroy(): void {
        this.view.destroy();
    }
}