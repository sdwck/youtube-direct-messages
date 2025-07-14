import { Unsubscribe, QueryDocumentSnapshot, Timestamp } from '../../libs/firebase/firebase-firestore.js';
import { chatService } from '../../services/chatService';
import { stateService } from '../../services/stateService';
import { authService } from '../../services/authService';
import { settingsService } from '../../services/settingsService';
import { ChatView, ChatViewProps } from './chatView';
import { Message } from '../../types/message';
import { updateReadTimestamp } from '../../shared/storage';
import { fetchYouTubeVideoDetails, parseVideoIdFromUrl } from '../../shared/utils/youtube';

export class ChatController {
    private view: ChatView;
    private messages: Message[] = [];
    private oldestMessageDoc: QueryDocumentSnapshot | null = null;
    private isLoadingOlder = false;
    private listeners: Unsubscribe[] = [];
    private readonly chatId: string;

    constructor(private container: HTMLElement) {
        const context = stateService.activeChatContext;
        if (!context) {
            throw new Error("ChatController initialized without an active chat context.");
        }
        this.chatId = context.chatId;
        updateReadTimestamp(this.chatId);

        const props: ChatViewProps = {
            partner: context.partner,
            back: () => stateService.closeChat(),
            sendMessage: this.sendMessage.bind(this),
            shareVideo: this.shareVideo.bind(this),
            loadOlderMessages: this.loadOlderMessages.bind(this),
            ignoreUser: this.ignoreUser.bind(this),
            getVideoId: () => parseVideoIdFromUrl(window.location.href),
        };

        this.view = new ChatView(this.container, props);
        this.fetchInitialMessages();
    }

    private async fetchInitialMessages(): Promise<void> {
        const { messages, oldestDoc } = await chatService.fetchInitialMessages(this.chatId);
        this.messages = messages;
        this.oldestMessageDoc = oldestDoc;
        this.view.renderMessages(this.messages, 'bottom');
        this.view.scrollToBottom();
        this.listenForNewMessages();
    }

    private listenForNewMessages(): void {
        const latestMessage = this.messages[this.messages.length - 1];
        const lastTimestamp = (latestMessage && latestMessage.timestamp instanceof Timestamp) ? latestMessage.timestamp : null;

        const newMessagesListener = chatService.listenToNewMessages(
            this.chatId,
            lastTimestamp,
            (newMsgs) => {
                const trulyNewMsgs = newMsgs.filter(msg => msg.from !== authService.currentUser?.uid);
                
                if (trulyNewMsgs.length > 0) {
                    this.messages.push(...trulyNewMsgs);
                    this.view.renderMessages(trulyNewMsgs, 'bottom', true);
                    updateReadTimestamp(this.chatId);
                }
            }
        );
        this.listeners.push(newMessagesListener);
    }

    private async sendMessage(text: string): Promise<void> {
        this.addOptimisticMessage({ text });
        await chatService.addMessage(this.chatId, { text });
    }

    private async shareVideo(includeTimestamp: boolean): Promise<void> {
        const videoId = parseVideoIdFromUrl(window.location.href);
        if (!videoId) return;

        this.view.setShareButtonState(false);
        try {
            const player = document.getElementById("movie_player") as any;
            const timestamp = includeTimestamp && player ? parseInt(player.getCurrentTime().toFixed(0)) : undefined;
            const videoData = await fetchYouTubeVideoDetails(videoId, timestamp);
            
            this.addOptimisticMessage({ video: videoData });
            await chatService.addMessage(this.chatId, { video: videoData });
        } catch (error) {
            console.error("Failed to share video:", error);
            alert("Could not share video.");
        } finally {
            this.view.setShareButtonState(true);
        }
    }

    private addOptimisticMessage(data: { text?: string; video?: any }): void {
        const myUid = authService.currentUser!.uid;
        const optimisticMessage: Message = {
            id: `optimistic_${Date.now()}`,
            from: myUid,
            timestamp: Timestamp.now(),
            ...data,
        };
        this.messages.push(optimisticMessage);
        this.view.renderMessages([optimisticMessage], 'bottom', true);
    }
    
    private async loadOlderMessages(): Promise<void> {
        if (this.isLoadingOlder || !this.oldestMessageDoc) return;
        this.isLoadingOlder = true;
        
        const { messages: olderMessages, oldestDoc: newOldestDoc } = await chatService.fetchOlderMessages(this.chatId, this.oldestMessageDoc);
        
        if (olderMessages.length > 0) {
            this.messages = [...olderMessages, ...this.messages];
            this.oldestMessageDoc = newOldestDoc;
            this.view.renderMessages(olderMessages, 'top');
        } else {
            this.oldestMessageDoc = null;
        }
        
        this.isLoadingOlder = false;
    }

    private async ignoreUser(uid: string): Promise<void> {
        await settingsService.addToIgnoreList(uid);
        stateService.closeChat();
    }

    public destroy(): void {
        this.view.destroy();
        this.listeners.forEach(unsub => unsub());
    }
}