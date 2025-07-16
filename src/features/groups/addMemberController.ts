import { stateService, ViewType } from '../../services/stateService';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/authService';
import { UserSelectionView, SelectableUser } from '../groups/userSelectionView';
import { User } from '../../types/user';
import { Chat, ChatType } from '../../types/chat';
import { settingsService } from '../../services/settingsService';

export class AddMemberController {
    private view: UserSelectionView;
    private chat: Chat;

    constructor(private container: HTMLElement) {
        if (!stateService.activeChatContext || stateService.activeChatContext.chat.type !== 'group') {
            throw new Error("AddMemberController requires an active group chat context.");
        }
        this.chat = stateService.activeChatContext.chat;
        
        this.view = new UserSelectionView(container, {
            title: 'Add New Members',
            showGroupNameInput: false,
            actionButtonText: 'Add to Group',
            back: () => stateService.setView(ViewType.CHAT),
            onAction: this.addMembers.bind(this),
        });

        this.loadUsers();
    }

    private async loadUsers(): Promise<void> {
        try {
            const allChats = await chatService.getAllChats();
            if (allChats.length === 0) {
                this.view.renderContent([]);
                return;
            }

            const privateChats = allChats.filter((chat: Chat) => chat.type !== ChatType.GROUP);
            const ignoredUids = await settingsService.getIgnoredUids();
            const existingMemberUids = new Set(this.chat.participants);
            const userPromises = privateChats.map(async (chat: Chat): Promise<SelectableUser | null> => {
                const partnerUid = chat.participants.find(p => p !== authService.currentUser!.uid);
                
                if (!partnerUid) {
                    return null;
                }
                if (existingMemberUids.has(partnerUid)) {
                    return null;
                }
                if (ignoredUids.includes(partnerUid)) {
                    return null;
                }
                
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
            console.error("Failed to load users to add:", error);
            this.view.showError("Could not load available users.");
        }
    }


    private async addMembers(_name: string | null, members: User[]): Promise<void> {
        const uidsToAdd = members.map(m => m.uid);
        if (uidsToAdd.length === 0) {
            alert("Please select at least one user to add.");
            return;
        }

        try {
            await chatService.addMembersToChat(this.chat.id, uidsToAdd);
            
            if (stateService.activeChatContext) {
                stateService.activeChatContext.chat.participants.push(...uidsToAdd);
            }
            
            stateService.setView(ViewType.CHAT);

        } catch (error) {
            console.error("Failed to add members:", error);
            alert("Could not add members. Please try again.");
        }
    }

    public destroy(): void {
        this.view.destroy();
    }
}