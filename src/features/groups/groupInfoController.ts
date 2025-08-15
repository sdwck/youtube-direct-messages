import { stateService, ViewType } from '../../services/stateService';
import { chatService } from '../../services/chatService';
import { GroupInfoView } from './groupInfoView';
import { Chat, ChatType } from '../../types/chat';
import { authService } from '../../services/authService';
import { User } from '../../types/user';

export class GroupInfoController {
    private view: GroupInfoView | null = null;
    private chat: Chat;
    private participants: User[] = [];
    private invited: User[] = [];

    constructor(private container: HTMLElement) {
        if (!stateService.activeChatContext || stateService.activeChatContext.chat.type !== ChatType.GROUP) {
            throw new Error("GroupInfoController requires an active group chat context.");
        }
        this.chat = stateService.activeChatContext.chat;

        this.initialize();
    }

    private async initialize(): Promise<void> {
        this.view = new GroupInfoView(this.container);
        this.view.renderLoading();
        await this.loadParticipants();
        await this.loadInvitedUsers();
        this.renderView();
    }

    private renderView(): void {
        const currentUser = authService.currentUser!;
        const isEditable = this.chat.creator === currentUser.uid || (this.chat.admins?.includes(currentUser.uid) ?? false);

        this.view?.render({
            chat: this.chat,
            participants: this.participants,
            invited: this.invited,
            currentUser,
            isEditable,
            back: () => stateService.setView(ViewType.CHAT),
            saveChanges: this.saveChanges.bind(this),
            removeMember: this.removeMember.bind(this),
            cancelInvite: this.cancelInvite.bind(this),
            promoteToAdmin: this.promoteToAdmin.bind(this),
            demoteFromAdmin: this.demoteFromAdmin.bind(this),
        });
    }

    private async loadParticipants(): Promise<void> {
        const participantPromises = this.chat.participants.map(uid =>
            chatService.getUserProfile(uid).catch(err => {
                console.warn(`Could not fetch profile for UID: ${uid}`, err);
                return null;
            })
        );
        this.participants = (await Promise.all(participantPromises)).filter(p => p !== null) as User[];
    }

    private async loadInvitedUsers(): Promise<void> {
        const invitedPromises = this.chat.invited?.map(uid =>
            chatService.getUserProfile(uid).catch(err => {
                console.warn(`Could not fetch invited user profile for UID: ${uid}`, err);
                return null;
            })
        );
        if (!invitedPromises) {
            this.invited = [];
            return;
        }
        this.invited = (await Promise.all(invitedPromises)).filter(p => p !== null) as User[];
    }

    private async saveChanges(newName: string, newPhotoURL: string): Promise<void> {
        if (!newName) {
            alert("Group name cannot be empty.");
            throw new Error("Empty group name");
        }

        try {
            await chatService.updateChatDetails(this.chat.id, {
                name: newName,
                photoURL: newPhotoURL,
            });

            if (stateService.activeChatContext) {
                stateService.activeChatContext.chat.name = newName;
                stateService.activeChatContext.chat.photoURL = newPhotoURL;
            }

            stateService.setView(ViewType.CHAT);

        } catch (error) {
            console.error("Failed to update group info:", error);
            alert("Could not update group info. Please try again.");
            throw error;
        }
    }

    private async cancelInvite(memberId: string): Promise<void> {
        if (!this.chat.invited?.includes(memberId)) {
            alert("This user is not invited to the group.");
            return;
        }

        try {
            await chatService.cancelGroupInvitation(this.chat.id, memberId);
            this.invited = this.invited.filter(user => user.uid !== memberId);
            this.chat.invited = this.chat.invited?.filter(uid => uid !== memberId);
            this.renderView();
        } catch (error) {
            console.error("Failed to cancel invitation:", error);
            alert("Could not cancel the invitation. Please try again.");
        }
    }

    private async removeMember(memberId: string): Promise<void> {
        if (confirm('Are you sure you want to remove this member from the group?')) {
            try {
                await chatService.removeMemberFromChat(this.chat.id, memberId);
                this.chat.participants = this.chat.participants.filter(p => p !== memberId);
                this.chat.admins = this.chat.admins?.filter(a => a !== memberId);
                await this.loadParticipants();
                this.renderView();
            } catch (e) {
                console.error("Failed to remove member", e);
                alert("Could not remove member. Please try again.");
            }
        }
    }

    private async promoteToAdmin(memberId: string): Promise<void> {
        try {
            await chatService.promoteToAdmin(this.chat.id, memberId);
            this.chat.admins = [...(this.chat.admins || []), memberId];
            this.renderView();
        } catch (e) {
            console.error("Failed to promote member", e);
            alert("Could not promote member. Please try again.");
        }
    }

    private async demoteFromAdmin(memberId: string): Promise<void> {
        try {
            await chatService.demoteFromAdmin(this.chat.id, memberId);
            this.chat.admins = this.chat.admins?.filter(a => a !== memberId);
            this.renderView();
        } catch (e) {
            console.error("Failed to demote member", e);
            alert("Could not demote member. Please try again.");
        }
    }

    public destroy(): void {
        this.view?.destroy();
    }
}