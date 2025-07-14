import { User } from '../../types/user';
import { createCloseIcon, createBackArrowIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';

interface IgnoreListViewProps {
    back: () => void;
    removeUser: (uid: string) => void;
}

export class IgnoreListView {
    private list: HTMLElement;

    constructor(private container: HTMLElement, private props: IgnoreListViewProps) {
        this.renderShell();
        this.list = this.container.querySelector('.settings-list')!;
    }

    private renderShell() {
        const header = document.createElement('div');
        header.className = 'yt-dm-chat-header';

        const backBtn = document.createElement('button');
        backBtn.className = 'yt-dm-icon-button';
        backBtn.appendChild(createBackArrowIcon());
        backBtn.onclick = (e) => { e.stopPropagation(); this.props.back(); };

        const title = document.createElement('span');
        title.className = 'yt-dm-username';
        title.textContent = 'Ignore List';

        const leftGroup = document.createElement('div');
        leftGroup.className = 'yt-dm-chat-header-left';
        leftGroup.append(backBtn, title);

        header.append(leftGroup);

        const body = document.createElement('div');
        body.className = 'yt-dm-settings-body';
        const list = document.createElement('div');
        list.className = 'settings-list';
        body.appendChild(list);

        this.container.append(header, body);
    }

    public renderList(users: User[]) {
        clearElement(this.list);
        this.list.className = 'settings-list';
        users.forEach(user => this.list.appendChild(this.createUserElement(user)));
    }

    private createUserElement(user: User): HTMLElement {
        const item = document.createElement('div');
        item.className = 'settings-list-item';

        const avatar = document.createElement('img');
        avatar.className = 'yt-dm-avatar-medium';
        avatar.src = user.photoURL || '';

        const name = document.createElement('span');
        name.textContent = user.displayName || `User...${user.uid.slice(-4)}`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'yt-dm-icon-button remove-ignore-btn';
        removeBtn.onclick = (e) => { e.stopPropagation(); this.props.removeUser(user.uid) };
        removeBtn.appendChild(createCloseIcon());

        item.append(avatar, name, removeBtn);
        return item;
    }

    public renderLoading(): void { this.renderStateMessage('Loading...'); }
    public renderEmpty(): void { this.renderStateMessage('Your ignore list is empty.'); }

    private renderStateMessage(text: string) {
        clearElement(this.list);
        this.list.className = 'yt-dm-state-message';
        this.list.textContent = text;
    }

    public destroy(): void {
        clearElement(this.container);
    }
}