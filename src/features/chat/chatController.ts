import { Unsubscribe, QueryDocumentSnapshot, Timestamp } from '../../libs/firebase/firebase-firestore.js';
import { chatService } from '../../services/chatService';
import { stateService } from '../../services/stateService';
import { authService } from '../../services/authService';
import { settingsService } from '../../services/settingsService';
import { ChatView, ChatViewProps } from './chatView';
import { Message } from '../../types/message';
import { updateReadTimestamp } from '../../shared/storage';
import { fetchYouTubeVideoDetails, parseVideoIdFromUrl } from '../../shared/utils/youtube';
import { User } from '../../types/user';
import { Chat, ChatType } from '../../types/chat';
import { ViewType } from '../../services/stateService';

export class ChatController {
    private view: ChatView | null = null;
    private messages: Message[] = [];
    private oldestMessageDoc: QueryDocumentSnapshot | null = null;
    private isLoadingOlder = false;
    private listeners: Unsubscribe[] = [];
    private readonly chat: Chat;
    private partner: User | null = null;

    constructor(private container: HTMLElement) {
        const context = stateService.activeChatContext;
        if (!context) {
            throw new Error("ChatController initialized without an active chat context.");
        }
        this.chat = context.chat;
        updateReadTimestamp(this.chat.id);

        this.initializeController();
    }

    private async initializeController(): Promise<void> {
        if (this.chat.type !== ChatType.GROUP) {
            const partnerUid = this.chat.participants.find(p => p !== authService.currentUser!.uid);
            if (partnerUid) {
                this.partner = await chatService.getUserProfile(partnerUid);
            }
        }

        const props: ChatViewProps = {
            chat: this.chat,
            partner: this.partner,
            back: () => stateService.closeChat(),
            sendMessage: this.sendMessage.bind(this),
            shareVideo: this.shareVideo.bind(this),
            loadOlderMessages: this.loadOlderMessages.bind(this),
            getVideoId: () => parseVideoIdFromUrl(window.location.href),
            ignoreUser: this.chat.type !== ChatType.GROUP && this.partner ? this.ignoreUser.bind(this, this.partner.uid) : undefined,
            leaveGroup: this.chat.type === ChatType.GROUP ? this.leaveGroup.bind(this) : undefined,
            addMember: this.chat.type === ChatType.GROUP ? this.addMember.bind(this) : undefined,
            editGroupInfo: this.chat.type === ChatType.GROUP ? this.editGroupInfo.bind(this) : undefined,
            deleteGroup: this.chat.type === ChatType.GROUP ? this.deleteGroup.bind(this) : undefined,
        };

        this.view = new ChatView(this.container, props);
        this.view.renderSkeleton();
        await this.fetchInitialMessages();
    }

    private editGroupInfo(): void {
        if (this.chat.type !== ChatType.GROUP) {
            throw new Error("Edit group info is only available for group chats.");
        }
        stateService.setView(ViewType.EDIT_GROUP_INFO);
    }

    private addMember(): void {
        if (this.chat.type !== ChatType.GROUP) {
            throw new Error("Add member is only available for group chats.");
        }
        stateService.setView(ViewType.ADD_MEMBER);
    }

    private async fetchInitialMessages(): Promise<void> {
        if (!this.view) return;
        const { messages, oldestDoc } = await chatService.fetchInitialMessages(this.chat.id);
        this.messages = messages;
        this.oldestMessageDoc = oldestDoc;
        this.view.renderMessages(this.messages, this.chat.type, 'bottom');
        this.view.scrollToBottom();
        this.listenForNewMessages();
    }

    private listenForNewMessages(): void {
        const latestMessage = this.messages[this.messages.length - 1];
        const lastTimestamp = (latestMessage && latestMessage.timestamp instanceof Timestamp) ? latestMessage.timestamp : null;

        const newMessagesListener = chatService.listenToNewMessages(
            this.chat.id,
            lastTimestamp,
            (newMsgs) => {
                if (!this.view) return;
                const trulyNewMsgs = newMsgs.filter(msg => msg.from !== authService.currentUser?.uid);

                if (trulyNewMsgs.length > 0) {
                    this.messages.push(...trulyNewMsgs);
                    this.view.renderMessages(trulyNewMsgs, this.chat.type, 'bottom', true);
                    updateReadTimestamp(this.chat.id);
                }
            }
        );
        this.listeners.push(newMessagesListener);
    }

    private async sendMessage(text: string): Promise<void> {
        this.addOptimisticMessage({ text });
        await chatService.addMessage(this.chat.id, { text });
    }

    private async shareVideo(includeTimestamp: boolean): Promise<void> {
        if (!this.view) return;
        const videoId = parseVideoIdFromUrl(window.location.href);
        if (!videoId) return;

        this.view.setShareButtonState(false);
        try {
            const player = document.getElementById("movie_player") as any;
            const timestamp = includeTimestamp && player ? parseInt(player.getCurrentTime().toFixed(0)) : undefined;
            const videoData = await fetchYouTubeVideoDetails(videoId, timestamp);

            this.addOptimisticMessage({ video: videoData });
            await chatService.addMessage(this.chat.id, { video: videoData });
        } catch (error) {
            console.error("Failed to share video:", error);
            alert("Could not share video.");
        } finally {
            this.view.setShareButtonState(true);
        }
    }

    private addOptimisticMessage(data: { text?: string; video?: any }): void {
        if (!this.view) return;
        const myUid = authService.currentUser!.uid;
        const optimisticMessage: Message = {
            id: `optimistic_${Date.now()}`,
            from: myUid,
            timestamp: Timestamp.now(),
            ...data,
        };
        this.messages.push(optimisticMessage);
        this.view.renderMessages([optimisticMessage], this.chat.type, 'bottom', true);
    }

    private async loadOlderMessages(): Promise<void> {
        if (!this.view || this.isLoadingOlder || !this.oldestMessageDoc) return;
        this.isLoadingOlder = true;

        const { messages: olderMessages, oldestDoc: newOldestDoc } = await chatService.fetchOlderMessages(this.chat.id, this.oldestMessageDoc);

        if (olderMessages.length > 0) {
            this.messages = [...olderMessages, ...this.messages];
            this.oldestMessageDoc = newOldestDoc;
            this.view.renderMessages(olderMessages, this.chat.type, 'top');
        } else {
            this.oldestMessageDoc = null;
        }

        this.isLoadingOlder = false;
    }

    private async ignoreUser(uid: string): Promise<void> {
        await settingsService.addToIgnoreList(uid);
        stateService.closeChat();
    }

    private async leaveGroup(): Promise<void> {
        if (confirm('Are you sure you want to leave this group?')) {
            try {
                await chatService.leaveChat(this.chat.id);
                stateService.setView(ViewType.DIALOGS);
            } catch (error) {
                console.error("Failed to leave group:", error);
                alert("Could not leave the group. Please try again.");
            }
        }
    }

    private async deleteGroup(): Promise<void> {
        const userInput = prompt(`This action cannot be undone. All messages will be permanently deleted. To confirm, please type the group name "${this.chat.name}".`);
        
        if (userInput === this.chat.name) {
            try {
                await chatService.deleteGroup(this.chat.id);
                stateService.setView(ViewType.DIALOGS);
            } catch (error) {
                console.error("Failed to delete group:", error);
                alert("Could not delete the group. Please try again.");
            }
        } else if (userInput !== null) {
            alert('Confirmation text did not match. Deletion canceled.');
        }
    }

    public destroy(): void {
        this.view?.destroy();
        this.view = null;
        this.listeners.forEach(unsub => unsub());
        this.listeners = [];
    }
}