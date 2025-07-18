import { createBackArrowIcon, createCloseIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';
import { User } from '../../types/user';
import { createUserItemSkeleton, createSkeletonList } from '../../shared/components/skeletonComponent';

export interface SelectableUser extends User {
    selected: boolean;
}

export interface UserSelectionViewProps {
    title: string;
    showGroupNameInput: boolean;
    actionButtonText: string;
    back: () => void;
    onAction: (name: string | null, members: User[]) => Promise<void>;
}

export class UserSelectionView {
    private users: SelectableUser[] = [];
    private body!: HTMLElement;
    private userListContainer!: HTMLElement;
    private nameInput: HTMLInputElement | null = null;
    private actionButton!: HTMLButtonElement;

    constructor(private container: HTMLElement, private props: UserSelectionViewProps) {
        this.renderLayout();
        this.setLoading(true);
    }

    public renderContent(users: SelectableUser[]) {
        this.users = users;
        this.renderUserList();
    }

    public showError(message: string) {
        clearElement(this.userListContainer);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'yt-dm-state-message error';
        errorMessage.textContent = message;
        this.userListContainer.appendChild(errorMessage);
    }

    public destroy(): void {
        clearElement(this.container);
    }

    private setLoading(isLoading: boolean) {
        clearElement(this.userListContainer);
        if (isLoading) {
            const skeletonItems = createSkeletonList(6, createUserItemSkeleton);
            this.userListContainer.append(...skeletonItems);
        }
    }
    
    private renderLayout() {
        clearElement(this.container);

        const header = document.createElement('div');
        header.className = 'yt-dm-chat-header';
        const backBtn = document.createElement('button');
        backBtn.className = 'yt-dm-icon-button';
        backBtn.appendChild(createBackArrowIcon());
        backBtn.onclick = (e) => { e.stopPropagation(); this.props.back(); };
        const title = document.createElement('span');
        title.className = 'yt-dm-username';
        title.textContent = this.props.title;
        const leftGroup = document.createElement('div');
        leftGroup.className = 'yt-dm-chat-header-left';
        leftGroup.append(backBtn, title);
        header.append(leftGroup);
        
        this.body = document.createElement('div');
        this.body.className = 'yt-dm-settings-body';

        if (this.props.showGroupNameInput) {
            const wrapper = document.createElement('div');
            const nameInputWrapper = document.createElement('div');
            nameInputWrapper.className = 'yt-dm-input-wrapper';
            this.nameInput = document.createElement('input');
            this.nameInput.id = 'group-name-input';
            this.nameInput.className = 'yt-dm-message-input';
            this.nameInput.placeholder = 'Group Name (required)';
            this.nameInput.required = true;
            nameInputWrapper.appendChild(this.nameInput);
            wrapper.append(nameInputWrapper);
            this.body.appendChild(wrapper);
        }
        
        const userListLabel = document.createElement('p');
        userListLabel.className = 'yt-dm-form-label';
        userListLabel.textContent = 'Select Members (at least 1 required)';
        
        this.userListContainer = document.createElement('div');
        this.userListContainer.className = 'yt-dm-user-selection-list';

        this.actionButton = document.createElement('button');
        this.actionButton.className = 'yt-dm-button-primary';
        this.actionButton.textContent = this.props.actionButtonText;
        
        this.body.append(userListLabel, this.userListContainer, this.actionButton);
        
        this.container.append(header, this.body);

        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.nameInput?.addEventListener('input', () => this.updateActionButtonState());
        
        this.actionButton.addEventListener('click', async () => {
            const name = this.nameInput ? this.nameInput.value.trim() : null;
            const selectedMembers = this.users.filter(u => u.selected);
            
            this.actionButton.disabled = true;
            this.actionButton.textContent = 'Processing...';
            
            await this.props.onAction(name, selectedMembers);
            
            this.actionButton.disabled = false;
            this.actionButton.textContent = this.props.actionButtonText;
        });
    }

    private renderUserList() {
        clearElement(this.userListContainer);
        if (this.users.length === 0) {
            this.userListContainer.textContent = "No available users to select.";
            this.userListContainer.className = 'yt-dm-state-message';
        } else {
            this.userListContainer.className = 'yt-dm-user-selection-list';
            this.users.forEach(user => {
                const item = this.createUserItemElement(user);
                this.userListContainer.appendChild(item);
            });
        }
        this.updateActionButtonState();
    }

    private createUserItemElement(user: SelectableUser): HTMLElement {
        const item = document.createElement('label');
        item.className = 'yt-dm-user-selection-item';

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
            this.updateActionButtonState();
        });

        item.append(checkbox, avatar, name);
        return item;
    }

    private updateActionButtonState() {
        const selectedCount = this.users.filter(u => u.selected).length;
        let isReady = selectedCount > 0;
        if (this.props.showGroupNameInput && this.nameInput) {
            isReady = isReady && this.nameInput.value.trim().length > 0;
        }
        this.actionButton.disabled = !isReady;
    }
}