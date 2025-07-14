import { createBackArrowIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';

interface SettingsViewProps {
    back: () => void;
    openIgnoreList: () => void;
    openAppearance: () => void;
}

export class SettingsView {
    constructor(private container: HTMLElement, private props: SettingsViewProps) {
        this.render();
    }

    private render() {
        const header = document.createElement('div');
        header.className = 'yt-dm-chat-header';

        const backBtn = document.createElement('button');
        backBtn.className = 'yt-dm-icon-button';
        backBtn.appendChild(createBackArrowIcon());
        backBtn.onclick = (e) => { e.stopPropagation(); this.props.back() };

        const title = document.createElement('span');
        title.className = 'yt-dm-username';
        title.textContent = 'Settings';

        const leftGroup = document.createElement('div');
        leftGroup.className = 'yt-dm-chat-header-left';
        leftGroup.append(backBtn, title);

        header.append(leftGroup);

        const body = document.createElement('div');
        body.className = 'yt-dm-settings-menu';

        const createMenuItem = (text: string, onClick: (e: Event) => void) => {
            const item = document.createElement('div');
            item.className = 'yt-dm-settings-menu__item';
            item.textContent = text;
            item.onclick = onClick;
            return item;
        };

        body.append(
            createMenuItem('Appearance', (e) => { e.stopPropagation(); this.props.openAppearance(); }),
            createMenuItem('Ignore List', (e) => { e.stopPropagation(); this.props.openIgnoreList(); })
        );

        this.container.append(header, body);
    }

    public destroy(): void {
        clearElement(this.container);
    }
}