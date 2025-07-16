import { createBackArrowIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';
import { Chat } from '../../types/chat';
import { generateAvatarPlaceholder } from '../../shared/utils/avatar';

export interface EditGroupInfoViewProps {
    chat: Chat;
    back: () => void;
    saveChanges: (newName: string, newPhotoURL: string) => Promise<void>;
}

export class EditGroupInfoView {
    private form: HTMLFormElement;
    private nameInput: HTMLInputElement;
    private photoInput: HTMLInputElement;
    private submitButton: HTMLButtonElement;
    private previewAvatar: HTMLImageElement;

    constructor(private container: HTMLElement, private props: EditGroupInfoViewProps) {
        this.render();
        this.form = this.container.querySelector('form')!;
        this.nameInput = this.container.querySelector('#group-name-input')!;
        this.photoInput = this.container.querySelector('#group-photo-input')!;
        this.submitButton = this.container.querySelector('button[type="submit"]')!;
        this.previewAvatar = this.container.querySelector('.yt-dm-avatar-preview')!;
        this.setupEventListeners();
    }

    private render() {
        clearElement(this.container);

        const header = document.createElement('div');
        header.className = 'yt-dm-chat-header';

        const backBtn = document.createElement('button');
        backBtn.className = 'yt-dm-icon-button';
        backBtn.appendChild(createBackArrowIcon());
        backBtn.onclick = (e) => { e.stopPropagation(); this.props.back(); };

        const title = document.createElement('span');
        title.className = 'yt-dm-username';
        title.textContent = 'Group Info';

        const leftGroup = document.createElement('div');
        leftGroup.className = 'yt-dm-chat-header-left';
        leftGroup.append(backBtn, title);
        header.append(leftGroup);

        const body = document.createElement('div');
        body.className = 'yt-dm-settings-body';

        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'yt-dm-avatar-preview-container';
        this.previewAvatar = document.createElement('img');
        this.previewAvatar.className = 'yt-dm-avatar-preview';
        this.previewAvatar.src = this.props.chat.photoURL || generateAvatarPlaceholder(this.props.chat.name, 40);
        avatarContainer.appendChild(this.previewAvatar);

        const form = document.createElement('form');
        form.className = 'yt-dm-add-member-form';

        const nameLabel = document.createElement('label');
        nameLabel.className = 'yt-dm-form-label';
        nameLabel.textContent = 'Group Name';
        const nameInputWrapper = document.createElement('div');
        nameInputWrapper.className = 'yt-dm-input-wrapper';
        const nameInput = document.createElement('input');
        nameInput.id = 'group-name-input';
        nameInput.type = 'text';
        nameInput.className = 'yt-dm-message-input';
        nameInput.value = this.props.chat.name || '';
        nameInput.required = true;
        nameInput.maxLength = 50;
        nameInputWrapper.append(nameInput);

        const photoLabel = document.createElement('label');
        photoLabel.className = 'yt-dm-form-label';
        photoLabel.textContent = 'Group Photo URL (optional)';
        const photoInputWrapper = document.createElement('div');
        photoInputWrapper.className = 'yt-dm-input-wrapper';
        const photoInput = document.createElement('input');
        photoInput.id = 'group-photo-input';
        photoInput.type = 'url';
        photoInput.className = 'yt-dm-message-input';
        photoInput.value = this.props.chat.photoURL || '';
        photoInput.placeholder = 'https://example.com/image.png';
        photoInputWrapper.append(photoInput);
        const invisibleSubmit = document.createElement('input');
        invisibleSubmit.type = 'submit';
        invisibleSubmit.style.display = 'none';

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'yt-dm-button-primary';
        submitButton.textContent = 'Save Changes';
        
        form.append(nameLabel, nameInputWrapper, photoLabel, photoInputWrapper, invisibleSubmit);
        body.append(avatarContainer, form, submitButton);
        
        this.container.append(header, body);
    }

    private setupEventListeners() {
        const handleSubmit = async (e: Event) => {
            e.preventDefault();
            const newName = this.nameInput.value.trim();
            const newPhotoURL = this.photoInput.value.trim();
            if (!newName) return;

            this.setLoading(true);
            try {
                await this.props.saveChanges(newName, newPhotoURL);
            } finally {
                this.setLoading(false);
            }
        };
        this.form.addEventListener('submit', handleSubmit);
        this.submitButton.addEventListener('click', handleSubmit);
        
        this.photoInput.addEventListener('input', () => {
            const url = this.photoInput.value.trim();
            if (url) {
                this.previewAvatar.src = url;
            } else {

                this.previewAvatar.src = 'https://placehold.co/40/808080/FFFFFF?text=G';
            }
        });
    }

    public setLoading(isLoading: boolean): void {
        this.nameInput.disabled = isLoading;
        this.photoInput.disabled = isLoading;
        this.submitButton.disabled = isLoading;
        this.submitButton.textContent = isLoading ? 'Saving...' : 'Save Changes';
    }

    public destroy(): void {
        clearElement(this.container);
    }
}