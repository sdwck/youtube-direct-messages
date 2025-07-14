import { AppSettings, NotificationStyle } from '../../types/settings';
import { createBackArrowIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';
import { notificationService } from '../../services/notificationService';

interface AppearanceViewProps {
    back: () => void;
    getSettings: () => AppSettings;
    saveSettings: (settings: AppSettings) => void;
}

export class AppearanceView {
    constructor(private container: HTMLElement, private props: AppearanceViewProps) {
        this.render();
    }

    private render() {
        const header = document.createElement('div');
        header.className = 'yt-dm-chat-header';

        const backBtn = document.createElement('button');
        backBtn.className = 'yt-dm-icon-button';
        backBtn.appendChild(createBackArrowIcon());
        backBtn.onclick = (e) => { e.stopPropagation(); this.props.back(); };

        const title = document.createElement('span');
        title.className = 'yt-dm-username';
        title.textContent = 'Appearance';
        
        const leftGroup = document.createElement('div');
        leftGroup.className = 'yt-dm-chat-header-left';
        leftGroup.append(backBtn, title);

        header.append(leftGroup);

        const body = document.createElement('div');
        body.className = 'yt-dm-settings-body';

        body.appendChild(this.createNotificationsSection());
        
        this.container.append(header, body);
    }

    private createNotificationsSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = 'yt-dm-settings-section';
        
        const title = document.createElement('h3');
        title.textContent = 'Notification Style';

        const form = document.createElement('form');
        const currentSettings = this.props.getSettings();

        const createRadio = (label: string, value: NotificationStyle): HTMLElement => {
            const wrapper = document.createElement('label');
            wrapper.className = 'yt-dm-radio-label';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'notificationStyle';
            input.value = value;
            input.checked = currentSettings.notificationStyle === value;
            input.className = 'yt-dm-radio-input';
            
            input.onchange = () => {
                this.props.saveSettings({
                    ...this.props.getSettings(),
                    notificationStyle: value
                });
                notificationService.updateDotVisibility();
            };

            const customRadio = document.createElement('span');
            customRadio.className = 'yt-dm-radio-custom';

            const span = document.createElement('span');
            span.className = 'yt-dm-radio-text';
            span.textContent = label;
            
            wrapper.append(input, customRadio, span); 
            return wrapper;
        };
        
        form.append(
            createRadio('Count (Default)', NotificationStyle.COUNT),
            createRadio('Dot (Minimal)', NotificationStyle.MINIMAL)
        );

        section.append(title, form);
        return section;
    }
    
    public destroy(): void {
        clearElement(this.container);
    }
}