import { authService } from '../services/authService';
import { stateService, ViewType } from '../services/stateService';
import { deeplinkService } from '../services/deeplinkService';
import { notificationService } from '../services/notificationService';
import { createToggleButton } from '../shared/components/toggleButton';
import { createFilledMessageIcon, createStrokedMessageIcon } from '../shared/components/icons';
import { clearElement } from '../shared/dom';
import { PanelView } from '../ui/panelView';
import { LoginView } from '../features/login/loginView';
import { DialogsController } from '../features/dialogs/dialogsController';
import { ChatController } from '../features/chat/chatController';
import { SettingsController } from '../features/settings/settingsController';
import { Chat } from '../types/chat';
import { AddMemberController } from '../features/groups/addMemberController';
import { GroupInfoController } from '../features/groups/groupInfoController';
import { CreateGroupController } from '../features/groups/createGroupController';

export class PanelController {
    private panel: HTMLElement;
    private viewContainer: HTMLElement;
    private toggleButton: HTMLButtonElement;

    private activeViewController: DialogsController | ChatController | SettingsController | AddMemberController | GroupInfoController | CreateGroupController | null = null;

    constructor() {
        const { shell, viewContainer } = PanelView.createShell();
        this.panel = shell;
        this.viewContainer = viewContainer;
        this.toggleButton = createToggleButton(() => this.togglePanel());

        document.body.appendChild(this.panel);

        this.initializeServices();
        this.subscribeToStateChanges();
    }

    private initializeServices(): void {
        stateService.initialize();
        authService.initialize();
        notificationService.initialize(this.toggleButton);
        deeplinkService.initialize({
            onTrigger: (chat: Chat) => {
                if (!stateService.isPanelOpen()) this.togglePanel(true);
                stateService.openChat(chat);
            }
        });
    }

    private subscribeToStateChanges(): void {
        stateService.onPanelStateChange((isOpen) => !isOpen && stateService.exitShareMode());
        stateService.onViewChange(this.renderView.bind(this));
    }

    private togglePanel(forceOpen = false): void {
        const currentOpenState = stateService.isPanelOpen();
        const newOpenState = forceOpen || !currentOpenState;
        stateService.setPanelOpen(newOpenState);

        this.updateToggleButtonIcon();

        if (newOpenState) {
            this.openPanel();
        } else {
            this.closePanel();
        }
    }

    private openPanel(): void {
        const rect = this.toggleButton.getBoundingClientRect();
        this.panel.style.top = `${rect.bottom}px`;
        this.panel.style.right = `${window.innerWidth - rect.right}px`;
        this.panel.style.display = 'flex';
        this.renderView(stateService.getView());
        document.addEventListener('click', this.handleClickOutside);
    }

    private closePanel(): void {
        this.panel.style.display = 'none';
        this.activeViewController?.destroy();
        this.activeViewController = null;
        document.removeEventListener('click', this.handleClickOutside);
    }

    private renderView(view: ViewType): void {
        if (!stateService.isPanelOpen() && view !== ViewType.LOGIN) return;

        this.activeViewController?.destroy();
        this.activeViewController = null;
        clearElement(this.viewContainer);

        switch (view) {
            case ViewType.LOGIN:
                LoginView.render(this.viewContainer);
                break;
            case ViewType.DIALOGS:
                this.activeViewController = new DialogsController(this.viewContainer);
                break;
            case ViewType.CHAT:
                this.activeViewController = new ChatController(this.viewContainer);
                break;
            case ViewType.ADD_MEMBER:
                this.activeViewController = new AddMemberController(this.viewContainer);
                break;
            case ViewType.GROUP_INFO:
                this.activeViewController = new GroupInfoController(this.viewContainer);
                break;
            case ViewType.CREATE_GROUP:
                this.activeViewController = new CreateGroupController(this.viewContainer);
                break;
            case ViewType.SETTINGS_MAIN:
            case ViewType.SETTINGS_IGNORE_LIST:
            case ViewType.SETTINGS_APPEARANCE:
                this.activeViewController = new SettingsController(this.viewContainer);
                break;
        }
    }

    private updateToggleButtonIcon(): void {
        const iconContainer = this.toggleButton.querySelector('.yt-dm-icon-container');
        if (iconContainer instanceof HTMLElement) {
            clearElement(iconContainer);
            const newIcon = stateService.isPanelOpen() ? createFilledMessageIcon() : createStrokedMessageIcon();
            iconContainer.appendChild(newIcon);
        }
    }

    private handleClickOutside = (event: MouseEvent): void => {
        const target = event.target as Node;
        if (!this.panel.contains(target) && !this.toggleButton.contains(target)) {
            this.togglePanel();
        }
    }
}