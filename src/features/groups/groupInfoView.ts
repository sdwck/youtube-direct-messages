import { createBackArrowIcon, createMoreVertIcon } from '../../shared/components/icons';
import { clearElement } from '../../shared/dom';
import { Chat } from '../../types/chat';
import { User } from '../../types/user';
import { generateAvatarPlaceholder } from '../../shared/utils/avatar';
import { createSkeletonList, createUserItemSkeleton } from '../../shared/components/skeletonComponent';

export interface GroupInfoViewProps {
    chat: Chat;
    participants: User[];
    invited: User[];
    currentUser: User;
    back: () => void;
    isEditable: boolean;
    saveChanges: (newName: string, newPhotoURL: string) => Promise<void>;
    removeMember: (memberId: string) => Promise<void>;
    cancelInvite: (memberId: string) => Promise<void>;
    promoteToAdmin: (memberId: string) => Promise<void>;
    demoteFromAdmin: (memberId: string) => Promise<void>;
}

export class GroupInfoView {
    private props: GroupInfoViewProps | null = null;

    constructor(private container: HTMLElement) { }

    public render(props: GroupInfoViewProps) {
        this.props = props;
        clearElement(this.container);

        const header = this.createHeader();
        const body = document.createElement('div');
        body.className = 'yt-dm-settings-body';

        if (props.isEditable) {
            const formSection = this.createEditableForm();
            body.appendChild(formSection);
        } else {
            const nonEditableInfo = this.createNonEditableInfo();
            body.appendChild(nonEditableInfo);
        }

        const membersSection = this.createMembersSection();
        body.appendChild(membersSection);

        this.container.append(header, body);

        if (props.isEditable) {
            this.setupEventListeners();
        }
    }

    private createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'yt-dm-chat-header';

        const backBtn = document.createElement('button');
        backBtn.className = 'yt-dm-icon-button';
        backBtn.appendChild(createBackArrowIcon());
        backBtn.onclick = (e) => { e.stopPropagation(); this.props?.back(); };

        const title = document.createElement('span');
        title.className = 'yt-dm-username';
        title.textContent = 'Group Info';

        const leftGroup = document.createElement('div');
        leftGroup.className = 'yt-dm-chat-header-left';
        leftGroup.append(backBtn, title);
        header.append(leftGroup);
        return header;
    }

    private createEditableForm(): HTMLElement {
        const section = document.createElement('div');
        section.className = 'yt-dm-edit-group-section';

        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'yt-dm-avatar-preview-container';
        const previewAvatar = document.createElement('img');
        previewAvatar.className = 'yt-dm-avatar-preview';
        previewAvatar.src = this.props!.chat.photoURL || generateAvatarPlaceholder(this.props!.chat.name, 96);
        avatarContainer.appendChild(previewAvatar);

        const form = document.createElement('form');
        form.id = 'group-info-form';
        form.className = 'yt-dm-add-member-form';
        form.noValidate = true;

        const nameLabel = document.createElement('label');
        nameLabel.className = 'yt-dm-form-label';
        nameLabel.textContent = 'Group Name';
        const nameInputWrapper = document.createElement('div');
        nameInputWrapper.className = 'yt-dm-input-wrapper';
        const nameInput = document.createElement('input');
        nameInput.id = 'group-name-input';
        nameInput.type = 'text';
        nameInput.className = 'yt-dm-message-input';
        nameInput.value = this.props!.chat.name || '';
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
        photoInput.value = this.props!.chat.photoURL || '';
        photoInput.placeholder = generateAvatarPlaceholder(nameInput.value, 48);
        photoInputWrapper.append(photoInput);

        const submitButton = document.createElement('button');
        submitButton.id = 'group-info-save-btn';
        submitButton.type = 'submit';
        submitButton.className = 'yt-dm-button-primary';
        submitButton.textContent = 'Save Changes';

        form.append(nameLabel, nameInputWrapper, photoLabel, photoInputWrapper);
        section.append(avatarContainer, form, submitButton);
        return section;
    }

    private createNonEditableInfo(): HTMLElement {
        const section = document.createElement('div');
        section.className = 'yt-dm-edit-group-section';

        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'yt-dm-avatar-preview-container';
        const previewAvatar = document.createElement('img');
        previewAvatar.className = 'yt-dm-avatar-preview';
        previewAvatar.src = this.props!.chat.photoURL || generateAvatarPlaceholder(this.props!.chat.name, 96);
        avatarContainer.appendChild(previewAvatar);

        const nameDisplay = document.createElement('h3');
        nameDisplay.textContent = this.props!.chat.name || 'Group Chat';
        nameDisplay.style.textAlign = 'center';
        nameDisplay.style.marginTop = '16px';

        section.append(avatarContainer, nameDisplay);
        return section;
    }

    private createMembersSection(): HTMLElement {
        const section = document.createElement('div');

        const membersTitle = document.createElement('h3');
        membersTitle.textContent = `Members (${this.props!.participants.length})`;
        membersTitle.style.borderBottom = '1px solid var(--yt-spec-badge-chip-background)';
        membersTitle.style.paddingBottom = '8px';
        membersTitle.style.marginBottom = '8px';

        const membersList = document.createElement('div');
        membersList.className = 'settings-list';
        membersList.style.marginBottom = '0';
        this.props!.participants.forEach(p => {
            membersList.appendChild(this.createParticipantElement(p));
        });

        section.append(membersTitle, membersList);

        const invitedUsers = this.props!.invited;
        if (invitedUsers && invitedUsers.length > 0) {
            const invitedTitle = document.createElement('h3');
            invitedTitle.textContent = `Invited (${invitedUsers.length})`;
            invitedTitle.style.borderBottom = '1px solid var(--yt-spec-badge-chip-background)';
            invitedTitle.style.paddingBottom = '8px';
            invitedTitle.style.margin = '24px 0 8px 0';

            const invitedList = document.createElement('div');
            invitedList.className = 'settings-list';
            invitedList.style.marginBottom = '0';
            invitedUsers.forEach(user => {
                invitedList.appendChild(this.createInvitedUserElement(user));
            });

            section.append(invitedTitle, invitedList);
        }

        return section;
    }

    private createInvitedUserElement(user: User): HTMLElement {
        const item = document.createElement('div');
        item.className = 'settings-list-item';
        item.style.flexGrow = '1';

        const avatar = document.createElement('img');
        avatar.className = 'yt-dm-avatar-medium';
        avatar.src = user.photoURL || generateAvatarPlaceholder(user.displayName, 40);

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.flexDirection = 'column';

        const name = document.createElement('span');
        name.textContent = user.displayName || `User...${user.uid.slice(-4)}`;
        info.appendChild(name);

        const statusBadge = document.createElement('span');
        statusBadge.textContent = 'Invited';
        statusBadge.style.fontSize = '12px';
        statusBadge.style.color = 'var(--yt-spec-text-secondary)';
        statusBadge.style.fontWeight = '500';
        info.appendChild(statusBadge);

        item.append(avatar, info);

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.width = '100%';

        const menu = this.createInvitedUserMenu(user);
        wrapper.append(item, menu);

        return wrapper;
    }

    private createInvitedUserMenu(targetUser: User): HTMLElement {
        const menuContainer = document.createElement('div');
        menuContainer.style.position = 'relative';

        const { currentUser, chat } = this.props!;
        const isCurrentUserAdmin = chat.admins?.includes(currentUser.uid);

        if (!isCurrentUserAdmin) {
            return menuContainer;
        }

        const moreButton = document.createElement('button');
        moreButton.className = 'yt-dm-icon-button';
        moreButton.appendChild(createMoreVertIcon());

        const contextMenu = document.createElement('div');
        contextMenu.className = 'yt-dm-context-menu';

        const cancelInviteItem = this.createMenuItem('Cancel Invitation', () => this.props!.cancelInvite(targetUser.uid));
        cancelInviteItem.style.color = '#ff4d4d';
        contextMenu.appendChild(cancelInviteItem);

        moreButton.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.yt-dm-context-menu.visible').forEach(m => m.classList.remove('visible'));
            contextMenu.classList.toggle('visible');
            setTimeout(() => document.addEventListener('click', () => contextMenu.classList.remove('visible'), { once: true }), 0);
        };

        menuContainer.append(moreButton, contextMenu);
        return menuContainer;
    }

    private createParticipantElement(user: User): HTMLElement {
        const item = document.createElement('div');
        item.className = 'settings-list-item';

        const avatar = document.createElement('img');
        avatar.className = 'yt-dm-avatar-medium';
        avatar.src = user.photoURL || generateAvatarPlaceholder(user.displayName, 40);

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.flexDirection = 'column';

        const name = document.createElement('span');
        name.textContent = user.displayName || `User...${user.uid.slice(-4)}`;
        if (user.uid === this.props!.currentUser.uid) {
            name.textContent += ' (You)';
        }
        info.appendChild(name);

        const isCreator = user.uid === this.props!.chat.creator;
        const isAdmin = this.props!.chat.admins?.includes(user.uid);

        if (isCreator || isAdmin) {
            const roleBadge = document.createElement('span');
            roleBadge.textContent = isCreator ? 'Creator' : 'Admin';
            roleBadge.style.fontSize = '12px';
            roleBadge.style.color = 'var(--yt-spec-text-secondary)';
            roleBadge.style.fontWeight = '500';
            info.appendChild(roleBadge);
        }

        item.append(avatar, info);
        item.style.flexGrow = '1';

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.width = '100%';

        const menu = this.createParticipantMenu(user);
        wrapper.append(item, menu);

        return wrapper;
    }

    private createParticipantMenu(targetUser: User): HTMLElement {
        const menuContainer = document.createElement('div');
        menuContainer.style.position = 'relative';

        const { currentUser, chat } = this.props!;
        const isCurrentUserCreator = currentUser.uid === chat.creator;
        const isCurrentUserAdmin = chat.admins?.includes(currentUser.uid);
        const isTargetAdmin = chat.admins?.includes(targetUser.uid);
        const isTargetCreator = targetUser.uid === chat.creator;
        const isUserInvited = chat.invited?.includes(targetUser.uid);

        if (targetUser.uid === currentUser.uid) {
            return menuContainer;
        }

        const canKick = isCurrentUserCreator || (isCurrentUserAdmin && !isTargetAdmin && !isTargetCreator);
        const canPromote = isCurrentUserCreator && !isTargetAdmin;
        const canDemote = isCurrentUserCreator && isTargetAdmin && !isTargetCreator;

        if (!canKick && !canPromote && !canDemote) {
            return menuContainer;
        }

        const moreButton = document.createElement('button');
        moreButton.className = 'yt-dm-icon-button';
        moreButton.appendChild(createMoreVertIcon());

        const contextMenu = document.createElement('div');
        contextMenu.className = 'yt-dm-context-menu';

        if (canPromote) {
            contextMenu.appendChild(this.createMenuItem('Make Admin', () => this.props!.promoteToAdmin(targetUser.uid)));
        }
        if (canDemote) {
            contextMenu.appendChild(this.createMenuItem('Remove as Admin', () => this.props!.demoteFromAdmin(targetUser.uid)));
        }
        if (canKick) {
            const kickItem = this.createMenuItem('Remove from Group', () => this.props!.removeMember(targetUser.uid));
            kickItem.style.color = '#ff4d4d';
            contextMenu.appendChild(kickItem);
        }

        moreButton.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.yt-dm-context-menu.visible').forEach(m => m.classList.remove('visible'));
            contextMenu.classList.toggle('visible');
            setTimeout(() => document.addEventListener('click', () => contextMenu.classList.remove('visible'), { once: true }), 0);
        };

        menuContainer.append(moreButton, contextMenu);
        return menuContainer;
    }

    private createMenuItem(text: string, action: () => void): HTMLElement {
        const item = document.createElement('div');
        item.className = 'yt-dm-context-menu-item';
        item.textContent = text;
        item.onclick = (e) => { e.stopPropagation(); action(); };
        return item;
    }

    private setupEventListeners() {
        const form = this.container.querySelector<HTMLFormElement>('#group-info-form');
        const submitButton = this.container.querySelector<HTMLButtonElement>('#group-info-save-btn');
        const nameInput = this.container.querySelector<HTMLInputElement>('#group-name-input');
        const photoInput = this.container.querySelector<HTMLInputElement>('#group-photo-input');
        const previewAvatar = this.container.querySelector<HTMLImageElement>('.yt-dm-avatar-preview');

        if (!form || !submitButton || !nameInput || !photoInput || !previewAvatar) return;

        const handleSubmit = async (e: Event) => {
            e.preventDefault();
            const newName = nameInput.value.trim();
            if (!newName) return;
            const newPhotoURL = photoInput.value.trim();

            this.setLoading(true);
            try {
                await this.props!.saveChanges(newName, newPhotoURL);
            } finally {
                this.setLoading(false);
            }
        };

        form.addEventListener('submit', handleSubmit);
        submitButton.addEventListener('click', (e) => {
            if (form.checkValidity()) handleSubmit(e);
        });

        photoInput.addEventListener('input', () => {
            const url = photoInput.value.trim();
            if (url) {
                previewAvatar.src = url;
                previewAvatar.onerror = () => {
                    previewAvatar.src = generateAvatarPlaceholder(nameInput.value, 96);
                };
            } else {
                previewAvatar.src = generateAvatarPlaceholder(nameInput.value, 96);
            }
        });
    }

    public renderLoading(): void {
        clearElement(this.container);
        const header = this.createHeader();
        const body = document.createElement('div');
        body.className = 'yt-dm-settings-body';
        const skeletonItems = createSkeletonList(5, createUserItemSkeleton);
        body.append(...skeletonItems);
        this.container.append(header, body);
    }

    public setLoading(isLoading: boolean): void {
        const nameInput = this.container.querySelector<HTMLInputElement>('#group-name-input');
        const photoInput = this.container.querySelector<HTMLInputElement>('#group-photo-input');
        const submitButton = this.container.querySelector<HTMLButtonElement>('#group-info-save-btn');

        if (nameInput) nameInput.disabled = isLoading;
        if (photoInput) photoInput.disabled = isLoading;
        if (submitButton) {
            submitButton.disabled = isLoading;
            submitButton.textContent = isLoading ? 'Saving...' : 'Save Changes';
        }
    }

    public destroy(): void {
        clearElement(this.container);
    }
}