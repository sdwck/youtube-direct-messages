import { createBackArrowIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';

interface SettingsViewProps {
    back: () => void;
    openIgnoreList: () => void;
    openAppearance: () => void;
    openAbout: () => void;
    logOut: () => void;
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

        const createMenuItem = (text: string, isExpandable: boolean, onClick: (e: MouseEvent) => void): HTMLElement => {
            const item = document.createElement('div');
            item.className = `yt-dm-settings-menu__item ${isExpandable ? 'expandable' : ''}`;
            if (text === 'Log Out')
                item.style.color = '#ff4d4d';
            item.textContent = text;
            item.onclick = onClick;
            return item;
        };

        body.append(
            createMenuItem('Appearance', true, (e) => { e.stopPropagation(); this.props.openAppearance(); }),
            createMenuItem('Ignore List', true, (e) => { e.stopPropagation(); this.props.openIgnoreList(); }),
            createMenuItem('About', true, (e) => { e.stopPropagation(); this.props.openAbout(); }),
            createMenuItem('Log Out', false, (e) => { e.stopPropagation(); this.props.logOut(); })
        );

        this.container.append(header, body);
    }

    public destroy(): void {
        clearElement(this.container);
    }
}