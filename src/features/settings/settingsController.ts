import { stateService, ViewType } from '../../services/stateService';
import { settingsService } from '../../services/settingsService';
import { SettingsView } from './settingsView';
import { IgnoreListView } from './ignoreListView';
import { AppearanceView } from './appearanceView';

export class SettingsController {
    private view: SettingsView | IgnoreListView | AppearanceView;
    private currentSettingsView: ViewType;

    constructor(private container: HTMLElement) {
        this.currentSettingsView = stateService.getView();
        
        switch (this.currentSettingsView) {
            case ViewType.SETTINGS_IGNORE_LIST:
                this.view = new IgnoreListView(container, {
                    back: () => stateService.setView(ViewType.SETTINGS_MAIN),
                    removeUser: this.removeIgnoredUser.bind(this),
                });
                this.loadIgnoredUsers();
                break;

            case ViewType.SETTINGS_APPEARANCE:
                this.view = new AppearanceView(container, {
                    back: () => stateService.setView(ViewType.SETTINGS_MAIN),
                    getSettings: settingsService.getAppSettings,
                    saveSettings: settingsService.saveAppSettings,
                });
                break;

            default:
                this.view = new SettingsView(container, {
                    back: () => stateService.setView(ViewType.DIALOGS),
                    openIgnoreList: () => stateService.setView(ViewType.SETTINGS_IGNORE_LIST),
                    openAppearance: () => stateService.setView(ViewType.SETTINGS_APPEARANCE),
                });
        }
    }

    private async loadIgnoredUsers() {
        if (this.view instanceof IgnoreListView) {
            this.view.renderLoading();
            const users = await settingsService.getIgnoredUsers();
            if (users.length > 0) {
                this.view.renderList(users);
            } else {
                this.view.renderEmpty();
            }
        }
    }
    
    private async removeIgnoredUser(uid: string) {
        await settingsService.removeFromIgnoreList(uid);
        await this.loadIgnoredUsers();
    }

    public destroy(): void {
        this.view.destroy();
    }
}