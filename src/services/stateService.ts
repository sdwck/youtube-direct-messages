import { User } from '../types/user';
import { Video } from '../types/video';

export enum ViewType {
    LOGIN,
    DIALOGS,
    CHAT,
    SETTINGS
}

export interface IActiveChatContext {
    chatId: string;
    partner: User;
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

    public openChat(context: IActiveChatContext): void {
        this.activeChatContext = context;
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