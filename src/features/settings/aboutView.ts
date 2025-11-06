import { createBackArrowIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';

interface AboutViewProps {
    back: () => void;
}

export class AboutView {
    constructor(private container: HTMLElement, private props: AboutViewProps) {
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
        title.textContent = 'About';

        const leftGroup = document.createElement('div');
        leftGroup.className = 'yt-dm-chat-header-left';
        leftGroup.append(backBtn, title);

        header.append(leftGroup);

        const body = document.createElement('div');
        body.className = 'yt-dm-settings-body';

        body.appendChild(this.createAboutSection());

        this.container.append(header, body);
    }

    private createAboutSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = 'yt-dm-settings-section';

        const container = document.createElement('div');
        container.className = 'yt-dm-copy-link-container';

        const github = document.createElement('button');
        github.type = 'button';
        github.className = 'yt-dm-copy-link-button';
        github.onclick = () => {
            window.open('https://github.com/sdwck/youtube-direct-messages', '_blank');
        };

        const span = document.createElement('span');
        span.textContent = 'Open GitHub repository';
        span.className = 'yt-dm-copy-link-text';

        github.append(span);

        const textMessage = document.createElement('p');
        textMessage.textContent = 'Thank you for using my extension!';
        textMessage.classList.add('yt-dm-state-message');
        
        container.append(github);
        section.append(container, textMessage);
        
        return section;
    }

    public destroy(): void {
        clearElement(this.container);
    }
}