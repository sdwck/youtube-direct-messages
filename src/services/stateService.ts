import { Video } from '../types/video';
import { Chat } from '../types/chat';

export enum ViewType {
    LOGIN,
    DIALOGS,
    CHAT,
    ADD_MEMBER,
    GROUP_INFO,
    CREATE_GROUP,
    SETTINGS_MAIN,
    SETTINGS_IGNORE_LIST,
    SETTINGS_APPEARANCE,
    SETTINGS_ABOUT
}

export interface IActiveChatContext {
    chat: Chat;
}

export interface IShareContext {
    videoData: Video;
}

type ViewChangeListener = (newView: ViewType) => void;
type PanelStateChangeListener = (isOpen: boolean) => void;

class StateService {
    private currentView: ViewType = ViewType.DIALOGS;
    private viewChangeListeners: ViewChangeListener[] = [];
    
    private panelOpen = false;
    private panelStateChangeListeners: PanelStateChangeListener[] = [];

    public activeChatContext: IActiveChatContext | null = null;
    public shareContext: IShareContext | null = null;

    public initialize(): void {
        this.activeChatContext = null;
        this.shareContext = null;
        this.panelOpen = false;
    }

    public setView(view: ViewType): void {
        if (this.currentView !== view) {
            this.currentView = view;
            this.notifyViewChange();
        }
    }
    
    public getView(): ViewType {
        return this.currentView;
    }

    public isPanelOpen(): boolean {
        return this.panelOpen;
    }

    public setPanelOpen(isOpen: boolean): void {
        if (this.panelOpen !== isOpen) {
            this.panelOpen = isOpen;
            this.notifyPanelStateChange();
        }
    }

    public onPanelStateChange(listener: PanelStateChangeListener): void {
        this.panelStateChangeListeners.push(listener);
    }

    private notifyPanelStateChange(): void {
        for (const listener of this.panelStateChangeListeners) {
            listener(this.panelOpen);
        }
    }

    public openChat(chat: Chat): void {
        this.activeChatContext = { chat };
        this.setView(ViewType.CHAT);
    }
    
    public closeChat(): void {
        this.activeChatContext = null;
        this.setView(ViewType.DIALOGS);
    }

    public enterShareMode(videoData: Video): void {
        this.shareContext = { videoData };
        this.setView(ViewType.DIALOGS);
    }
    
    public exitShareMode(): void {
        this.shareContext = null;
    }

    public onViewChange(listener: ViewChangeListener): void {
        this.viewChangeListeners.push(listener);
    }
    
    private notifyViewChange(): void {
        for (const listener of this.viewChangeListeners) {
            listener(this.currentView);
        }
    }
}

export const stateService = new StateService();