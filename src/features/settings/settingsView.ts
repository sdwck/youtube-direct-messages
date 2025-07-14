import { User } from '../../types/user';
import { createCloseIcon, createBackArrowIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';

export interface SettingsViewProps {
    back: () => void;
    removeUser: (uid: string) => void;
}

export class SettingsView {
    private header: HTMLElement;
    private body: HTMLElement;
    private list: HTMLElement;

    constructor(private container: HTMLElement, private props: SettingsViewProps) {
        this.header = document.createElement('div');
        this.header.className = 'yt-dm-chat-header';
        
        this.body = document.createElement('div');
        this.body.className = 'yt-dm-settings-body';

        const title = document.createElement('h2');
        title.textContent = 'Ignore List';
        
        this.list = document.createElement('div');
        this.list.className = 'settings-list';

        this.body.append(title, this.list);
        this.container.append(this.header, this.body);
        
        this.renderHeader();
    }

    private renderHeader(): void {
        const backBtn = document.createElement('button');
        backBtn.className = 'yt-dm-icon-button';
        backBtn.appendChild(createBackArrowIcon());
        backBtn.onclick = (e) => { e.stopPropagation(); this.props.back(); };
        
        const title = document.createElement('span');
        title.className = 'yt-dm-username';
        title.textContent = 'Settings';

        this.header.append(backBtn, title);
    }

    public renderList(users: User[]): void {
        clearElement(this.list);
        this.list.className = 'settings-list';
        users.forEach(user => {
            this.list.appendChild(this.createUserElement(user));
        });
    }

    private createUserElement(user: User): HTMLElement {
        const item = document.createElement('div');
        item.className = 'settings-list-item';
        
        const avatar = document.createElement('img');
        avatar.src = user.photoURL || 'https://via.placeholder.com/40';
        
        const name = document.createElement('span');
        name.textContent = user.displayName || `User...${user.uid.slice(-4)}`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'yt-dm-icon-button remove-ignore-btn';
        removeBtn.title = 'Remove from ignore list';
        removeBtn.appendChild(createCloseIcon());
        removeBtn.onclick = () => this.props.removeUser(user.uid);
        
        item.append(avatar, name, removeBtn);
        return item;
    }
    
    public renderLoading(): void {
        clearElement(this.list);
        this.list.className = 'yt-dm-state-message';
        this.list.textContent = 'Loading...';
    }
    
    public renderEmpty(): void {
        clearElement(this.list);
        this.list.className = 'yt-dm-state-message';
        this.list.textContent = 'Your ignore list is empty.';
    }

    public destroy(): void {
        clearElement(this.container);
    }
}