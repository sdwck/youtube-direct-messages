import { stateService, ViewType } from '../../services/stateService';
import { chatService } from '../../services/chatService';
import { EditGroupInfoView } from './editGroupInfoView';
import { Chat, ChatType } from '../../types/chat';

export class EditGroupInfoController {
    private view: EditGroupInfoView;
    private chat: Chat;

    constructor(private container: HTMLElement) {
        if (!stateService.activeChatContext || stateService.activeChatContext.chat.type !== ChatType.GROUP) {
            throw new Error("EditGroupInfoController requires an active group chat context.");
        }
        this.chat = stateService.activeChatContext.chat;
        
        this.view = new EditGroupInfoView(container, {
            chat: this.chat,
            back: () => stateService.setView(ViewType.CHAT),
            saveChanges: this.saveChanges.bind(this),
        });
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

    public destroy(): void {
        this.view.destroy();
    }
}