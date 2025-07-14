import { settingsService } from '../../services/settingsService';
import { chatService } from '../../services/chatService';
import { stateService, ViewType } from '../../services/stateService';
import { SettingsView, SettingsViewProps } from './settingsView';

export class SettingsController {
    private view: SettingsView;

    constructor(private container: HTMLElement) {
        const props: SettingsViewProps = {
            back: () => stateService.setView(ViewType.DIALOGS),
            removeUser: this.removeUser.bind(this)
        };
        this.view = new SettingsView(this.container, props);
        this.loadIgnoredUsers();
    }

    private async loadIgnoredUsers(): Promise<void> {
        this.view.renderLoading();
        const uids = await settingsService.getIgnoreList();
        if (uids.length === 0) {
            this.view.renderEmpty();
            return;
        }

        const userPromises = uids.map(uid => chatService.getUserProfile(uid));
        const users = await Promise.all(userPromises);
        this.view.renderList(users);
    }

    private async removeUser(uid: string): Promise<void> {
        await settingsService.removeFromIgnoreList(uid);
        this.loadIgnoredUsers();
    }

    public destroy(): void {
        this.view.destroy();
    }
}