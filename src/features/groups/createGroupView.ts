import { createBackArrowIcon, createCloseIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';
import { User } from '../../types/user';

export interface SelectableUser extends User {
    selected: boolean;
}

export interface CreateGroupViewProps {
    back: () => void;
    createGroup: (name: string, members: User[]) => Promise<void>;
}

export class CreateGroupView {
    private users: SelectableUser[] = [];
    private body!: HTMLElement;
    private userListContainer!: HTMLElement;
    private nameInput!: HTMLInputElement;
    private createButton!: HTMLButtonElement;

    constructor(private container: HTMLElement, private props: CreateGroupViewProps) {
        this.renderInitialLayout();
        this.setLoading(true);
    }

    public renderContent(users: SelectableUser[]) {
        this.users = users;
        this.setLoading(false);
    }

    public showError(message: string) {
        clearElement(this.body);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'yt-dm-state-message error';
        errorMessage.textContent = message;
        this.body.appendChild(errorMessage);
    }
    
    public destroy(): void {
        clearElement(this.container);
    }

    private setLoading(isLoading: boolean) {
        clearElement(this.body);
        if (isLoading) {
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'yt-dm-state-message';
            loadingMessage.textContent = 'Loading your contacts...';
            this.body.appendChild(loadingMessage);
        } else {
            this.renderForm();
            this.renderUserList();
            this.setupEventListeners();
        }
    }
    
    private renderInitialLayout() {
        clearElement(this.container);
        const header = document.createElement('div');
        header.className = 'yt-dm-chat-header';

        const backBtn = document.createElement('button');
        backBtn.className = 'yt-dm-icon-button';
        backBtn.appendChild(createBackArrowIcon());
        backBtn.onclick = (e) => { e.stopPropagation(); this.props.back(); };

        const title = document.createElement('span');
        title.className = 'yt-dm-username';
        title.textContent = 'Create New Group';

        const leftGroup = document.createElement('div');
        leftGroup.className = 'yt-dm-chat-header-left';
        leftGroup.append(backBtn, title);
        header.append(leftGroup);
        
        this.body = document.createElement('div');
        this.body.className = 'yt-dm-settings-body';

        this.container.append(header, this.body);
    }

    private renderForm() {
        const wrapper = document.createElement('div');
        const nameInputWrapper = document.createElement('div');
        nameInputWrapper.className = 'yt-dm-input-wrapper';
        this.nameInput = document.createElement('input');
        this.nameInput.id = 'group-name-input';
        this.nameInput.className = 'yt-dm-message-input';
        this.nameInput.placeholder = 'Group Name (required)';
        this.nameInput.required = true;
        nameInputWrapper.appendChild(this.nameInput);
        wrapper.appendChild(nameInputWrapper);
        
        const userListLabel = document.createElement('p');
        userListLabel.className = 'yt-dm-form-label';
        userListLabel.textContent = 'Select Members (at least 1 required)';
        this.userListContainer = document.createElement('div');
        this.userListContainer.className = 'yt-dm-user-selection-list';

        this.createButton = document.createElement('button');
        this.createButton.id = 'create-group-btn';
        this.createButton.className = 'yt-dm-button-primary';
        this.createButton.textContent = 'Create Group';
        
        this.body.append(wrapper, userListLabel, this.userListContainer, this.createButton);
    }

    private setupEventListeners() {
        this.nameInput.addEventListener('input', () => this.updateCreateButtonState());
        
        this.createButton.addEventListener('click', async () => {
            const name = this.nameInput.value.trim();
            const selectedMembers = this.users.filter(u => u.selected);
            
            this.createButton.disabled = true;
            this.createButton.textContent = 'Creating...';
            
            await this.props.createGroup(name, selectedMembers);
        });
    }

    private renderUserList() {
        clearElement(this.userListContainer);
        if (this.users.length === 0) {
            this.userListContainer.textContent = "You don't have any private chats to select users from.";
            this.userListContainer.className = 'yt-dm-state-message';
        } else {
            this.userListContainer.className = 'yt-dm-user-selection-list';
            this.users.forEach((user, i) => {
                const item = this.createUserItemElement(user, i === 0, i === this.users.length - 1);
                this.userListContainer.appendChild(item);
            });
        }
        this.updateCreateButtonState();
    }

    private createUserItemElement(user: SelectableUser, isFirst: boolean, isLast: boolean): HTMLElement {
        const item = document.createElement('label');
        item.className = 'yt-dm-user-selection-item';
        if (isFirst) item.classList.add('first');
        if (isLast) item.classList.add('last');

        const avatar = document.createElement('img');
        avatar.className = 'yt-dm-avatar-medium';
        avatar.src = user.photoURL || '';

        const name = document.createElement('span');
        name.textContent = user.displayName || `User...${user.uid.slice(-4)}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'yt-dm-checkbox';
        checkbox.checked = user.selected;
        
        checkbox.addEventListener('change', () => {
            user.selected = checkbox.checked;
            if (checkbox.checked) item.classList.add('selected');
            else item.classList.remove('selected');
            this.updateCreateButtonState();
        });

        item.append(checkbox, avatar, name);
        return item;
    }

    private updateCreateButtonState() {
        const selectedCount = this.users.filter(u => u.selected).length;
        const isReady = this.nameInput.value.trim().length > 0 && selectedCount > 0;
        this.createButton.disabled = !isReady;
    }
}