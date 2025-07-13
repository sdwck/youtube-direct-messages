import { on, DMEvents } from '../events';
import { auth } from '../firebase/firebase-config';
import { User } from '../types/user';
import { Unsubscribe } from '../libs/firebase/firebase-firestore.js';
import { createToggleButton } from './components/toggleButton';
import { createBackArrowIcon, createStrokedMessageIcon, createFilledMessageIcon, createSettingsIcon, createMoreVertIcon } from './components/icons';
import { renderLoginView } from './views/loginView';
import { renderDialogsView } from './views/dialogsView';
import { renderChatView } from './views/chatView';
import { getUserProfile, getOrCreateChat, addMessage, listenToChats } from '../firebase/firestore';
import { Message } from '../types/message';
import { getReadTimestamps } from '../storage';
import { Chat } from '../types/chat';
import { Timestamp } from '../libs/firebase/firebase-firestore.js';
import { updateReadTimestamp } from '../storage';
import { getIgnoreList } from '../firebase/settings';
import { renderSettingsView } from './views/settingsView';
import { addToIgnoreList } from '../firebase/settings';

let panelOpen = false;
let currentChatPartner: User | null = null;
let currentChatId: string | null = null;
let unsubscribeFromView: Unsubscribe | null = null;

let isSharingMode = false;
let pendingVideoData: Message['video'] | null = null;

let isSettingUp = false;

let unreadChatIds = new Set<string>();
let unreadListenerUnsubscribe: Unsubscribe | null = null;

let isAuthReady = false;
let isUIReady = false;
let hasProcessedLink = false;

let currentView: 'login' | 'dialogs' | 'chat' | 'settings' = 'dialogs';

function clearElement(el: HTMLElement) {
    while (el.firstChild) { el.removeChild(el.firstChild); }
}

const panel = document.createElement('div');
panel.id = 'yt-dm-chat-panel';
panel.style.display = 'none';

const header = document.createElement('div');
header.className = 'yt-dm-chat-header';
const bodyContainer = document.createElement('div');
bodyContainer.className = 'yt-dm-message-list';
bodyContainer.style.cssText = 'flex-grow: 1; overflow-y: auto;';
const footer = document.createElement('div');
footer.className = 'yt-dm-chat-footer';
panel.append(header, bodyContainer, footer);

function openPanel(anchorElement: HTMLElement) {
    const rect = anchorElement.getBoundingClientRect();
    const top = rect.bottom;
    const right = window.innerWidth - rect.right;
    panel.style.top = `${top}px`;
    panel.style.right = `${right}px`;
    panel.style.left = 'auto';
    panel.style.display = 'flex';
    panelOpen = true;
    updateView();
    updateNotificationDot();
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
}

function closePanel() {
    panel.style.display = 'none';
    panelOpen = false;
    if (unsubscribeFromView) {
        unsubscribeFromView();
        unsubscribeFromView = null;
    }
    document.removeEventListener('click', handleClickOutside);
    isSharingMode = false;
    pendingVideoData = null;
}

function updateToggleButtonIcon(button: HTMLElement, newIcon: SVGElement) {
    const iconContainer = button.querySelector('.yt-dm-icon-container');
    if (iconContainer instanceof HTMLElement) {
        clearElement(iconContainer);
        iconContainer.appendChild(newIcon);
    }
}

function updateNotificationDot() {
    const dot = document.querySelector('#yt-dm-toggle .yt-dm-notification-dot');
    if (dot) {
        dot.classList.toggle('visible', unreadChatIds.size > 0);
    }
}

function setupPersistentListeners() {
    if (unreadListenerUnsubscribe) unreadListenerUnsubscribe();
    if (!auth.currentUser) return;

    unreadListenerUnsubscribe = listenToChats(async (chats: Chat[]) => {
        const ignoredUids = await getIgnoreList();
        const readTimestamps = getReadTimestamps();

        const filteredChats = chats.filter(chat => {
            const partnerUid = chat.participants.find(p => p !== auth.currentUser?.uid);
            return partnerUid && !ignoredUids.includes(partnerUid);
        });

        const newUnreadIds = new Set<string>();
        for (const chat of filteredChats) {
            let lastMessageTime = 0;
            if (chat.updatedAt instanceof Timestamp) {
                lastMessageTime = chat.updatedAt.toDate().getTime();
            }

            if (panelOpen && currentChatId === chat.id) {
                updateReadTimestamp(chat.id);
            } else {
                const lastReadTime = readTimestamps[chat.id] || 0;
                if (lastMessageTime > lastReadTime) {
                    newUnreadIds.add(chat.id);
                }
            }
        }

        unreadChatIds = newUnreadIds;
        updateNotificationDot();

        if (panelOpen && !currentChatId) {
            updateView();
        }
    });
}

function cleanupPersistentListeners() {
    if (unreadListenerUnsubscribe) {
        unreadListenerUnsubscribe();
        unreadListenerUnsubscribe = null;
    }
    unreadChatIds.clear();
    updateNotificationDot();
}

function openChatWithUser(partner: User, chatId: string) {
    currentChatPartner = partner;
    currentChatId = chatId;
    updateView();
}

async function onDialogSelected(partner: User, chatId: string, event: MouseEvent) {
    event.stopPropagation();
    if (isSharingMode && pendingVideoData) {
        try {
            await addMessage(chatId, { video: pendingVideoData });
            isSharingMode = false;
            pendingVideoData = null;
            openChatWithUser(partner, chatId);
        } catch (error) {
            console.error("Failed to share video:", error);
            alert("Could not share the video.");
        }
    } else {
        openChatWithUser(partner, chatId);
    }
}

function updateView() {
    if (unsubscribeFromView) {
        unsubscribeFromView();
        unsubscribeFromView = null;
    }
    clearElement(header);
    clearElement(bodyContainer);
    clearElement(footer);
    const user = auth.currentUser;
    if (!user) {
        currentView = 'login';
    } else if (isSharingMode) {
        currentView = 'dialogs';
    } else if (currentChatPartner && currentChatId) {
        currentView = 'chat';
    } else if (isSettingUp) {
        currentView = 'settings';
    } else {
        currentView = 'dialogs';
    }

    switch (currentView) {
        case 'login': {
            const title = document.createElement('span');
            title.className = 'yt-dm-username';
            title.textContent = 'Messages';
            header.appendChild(title);
            renderLoginView(bodyContainer);
            break;
        }
        case 'dialogs': {
            const title = document.createElement('span');
            title.className = 'yt-dm-username';
            title.textContent = isSharingMode ? 'Share to...' : 'Messages';
            header.appendChild(title);
            const settingsButton = document.createElement('button');
            settingsButton.className = 'yt-dm-icon-button';
            settingsButton.title = 'Settings';
            settingsButton.appendChild(createSettingsIcon());
            settingsButton.onclick = (event) => {
                event.stopPropagation();
                isSettingUp = true;
                currentView = 'settings';
                updateView();
            };
            const headerControls = document.createElement('div');
            headerControls.className = 'yt-dm-header-controls';
            headerControls.appendChild(settingsButton);

            header.append(title, headerControls);
            unsubscribeFromView = renderDialogsView(bodyContainer, onDialogSelected, isSharingMode, unreadChatIds);
            break;
        }
        case 'chat': {
            if (!currentChatPartner || !currentChatId) return;
            const messageList = document.createElement('div');
            bodyContainer.appendChild(messageList);
            const backBtn = document.createElement('button');
            backBtn.className = 'yt-dm-icon-button';
            backBtn.appendChild(createBackArrowIcon());
            backBtn.onclick = (event) => {
                event.stopPropagation();
                currentChatPartner = null;
                currentChatId = null;
                updateView();
            };
            const title = document.createElement('span');
            title.className = 'yt-dm-username';
            title.textContent = currentChatPartner.displayName || 'Chat';
            const avatar = document.createElement('img');
            avatar.className = 'yt-dm-avatar';
            avatar.style.cssText = 'width:32px; height:32px; border-radius:50%;';
            avatar.src = currentChatPartner.photoURL || '';

            const moreButton = document.createElement('button');
            moreButton.className = 'yt-dm-icon-button';
            moreButton.appendChild(createMoreVertIcon());

            const contextMenu = document.createElement('div');
            contextMenu.className = 'yt-dm-context-menu';

            const ignoreOption = document.createElement('div');
            ignoreOption.textContent = 'Add to Ignore List';
            ignoreOption.onclick = async (e) => {
                e.stopPropagation();
                await addToIgnoreList(currentChatPartner!.uid);
                contextMenu.classList.remove('visible');
                currentView = 'dialogs';
                currentChatPartner = null;
                currentChatId = null;
                updateView();
            };
            contextMenu.appendChild(ignoreOption);

            moreButton.onclick = (e) => {
                e.stopPropagation();
                contextMenu.classList.toggle('visible');
            };

            const closeMenuListener = (e: MouseEvent) => {
                if (!contextMenu.contains(e.target as Node)) {
                    contextMenu.classList.remove('visible');
                    document.removeEventListener('click', closeMenuListener);
                }
            };
            moreButton.addEventListener('click', () => {
                setTimeout(() => document.addEventListener('click', closeMenuListener), 0);
            });

            const headerControls = document.createElement('div');
            headerControls.className = 'yt-dm-header-controls';
            headerControls.append(moreButton, contextMenu);

            const leftHeader = document.createElement('div');
            leftHeader.className = 'yt-dm-chat-header-left';
            leftHeader.append(backBtn, avatar, title);
            header.append(leftHeader, headerControls);

            updateReadTimestamp(currentChatId);
            unreadChatIds.delete(currentChatId);
            updateNotificationDot();
            unsubscribeFromView = renderChatView(
                messageList,
                footer,
                currentChatPartner,
                currentChatId
            );
            break;
        }
        case 'settings': {
            const title = document.createElement('span');
            title.className = 'yt-dm-username';
            title.textContent = 'Settings';
            const backBtn = document.createElement('button');
            backBtn.className = 'yt-dm-icon-button';
            backBtn.appendChild(createBackArrowIcon());
            backBtn.onclick = (event) => {
                event.stopPropagation();
                isSettingUp = false;
                currentView = 'dialogs';
                updateView();
            };
            header.appendChild(backBtn);
            header.appendChild(title);
            renderSettingsView(bodyContainer);
            break;
        }
    }
}

function handleClickOutside(event: MouseEvent) {
    if (!panelOpen) return;
    const toggleBtn = document.getElementById('yt-dm-toggle');
    if (panel.contains(event.target as Node) || (toggleBtn && toggleBtn.contains(event.target as Node))) return;

    if (toggleBtn) {
        updateToggleButtonIcon(toggleBtn, createStrokedMessageIcon());
    }

    closePanel();
}

async function checkAndProcessIncomingLink() {
    if (!isAuthReady || !isUIReady || hasProcessedLink) {
        return;
    }
    hasProcessedLink = true;

    const recipientUid = sessionStorage.getItem('yt-dm-pending-chat-uid');
    if (!auth.currentUser || !recipientUid) {
        return;
    }

    sessionStorage.removeItem('yt-dm-pending-chat-uid');
    if (recipientUid === auth.currentUser.uid) return;

    try {
        const toggleBtn = document.getElementById('yt-dm-toggle');

        if (!panelOpen && toggleBtn) {
            updateToggleButtonIcon(toggleBtn, createFilledMessageIcon());
            openPanel(toggleBtn);
        }

        const partnerProfile = await getUserProfile(recipientUid);
        const chatId = await getOrCreateChat(recipientUid);
        openChatWithUser(partnerProfile, chatId);
    } catch (error) {
        console.error("Failed to open chat from link:", error);
        alert("Could not start a chat. The user's UID may be invalid.");
    }
}

function initialize() {
    document.body.appendChild(panel);

    const dmToggleButton = createToggleButton((clickedButton) => {
        const pendingShareJSON = sessionStorage.getItem('yt-dm-pending-share');
        if (pendingShareJSON) {
            sessionStorage.removeItem('yt-dm-pending-share');
            isSharingMode = true;
            pendingVideoData = JSON.parse(pendingShareJSON);
            console.log('Pending video data:', pendingVideoData);
        } else {
            isSharingMode = false;
            pendingVideoData = null;
        }

        panelOpen = !panelOpen;

        if (panelOpen) {
            updateToggleButtonIcon(clickedButton, createFilledMessageIcon());
            openPanel(clickedButton);
        } else {
            updateToggleButtonIcon(clickedButton, createStrokedMessageIcon());
            closePanel();
        }
    });

    on(DMEvents.AuthChanged, (user) => {
        isAuthReady = true;
        currentChatPartner = null;
        currentChatId = null;

        if (user) {
            setupPersistentListeners();
        } else {
            cleanupPersistentListeners();
        }

        checkAndProcessIncomingLink();
        if (panelOpen) updateView();
    });

    on(DMEvents.UIReady, () => {
        isUIReady = true;
        checkAndProcessIncomingLink();
    });
}

initialize();