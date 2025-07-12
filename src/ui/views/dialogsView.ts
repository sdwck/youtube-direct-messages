import { auth } from '../../firebase/firebase-config';
import { listenToChats, getUserProfile } from '../../firebase/firestore';
import { User } from '../../types/user';
import { Chat } from '../../types/chat';
import { Unsubscribe } from '../../libs/firebase/firebase-firestore.js';
import { formatTime } from '../utils/time';
import { getIgnoreList } from '../../firebase/settings';

let unsubscribeFromChats: Unsubscribe | null = null;

function clearElement(el: HTMLElement) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

function renderStateMessage(container: HTMLElement, text: string, className: string) {
    clearElement(container);
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    div.style.textAlign = 'center';
    div.style.padding = '20px';
    container.appendChild(div);
}

async function renderDialogItem(
    chat: Chat,
    onSelectDialog: (partner: User, chatId: string, event: MouseEvent) => void,
    isUnread: boolean
): Promise<HTMLElement | null> {
    const myUid = auth.currentUser?.uid;
    if (!myUid) return null;

    const partnerUid = chat.participants.find(p => p !== myUid);
    if (!partnerUid) return null;

    const partner = await getUserProfile(partnerUid);
    const dialogItem = document.createElement('div');
    dialogItem.className = 'yt-dm-dialog-item';
    dialogItem.setAttribute('data-chat-id', chat.id);

    if (isUnread) {
        dialogItem.classList.add('unread');
    }

    const avatar = document.createElement('img');
    avatar.src = partner.photoURL || 'https://via.placeholder.com/40';
    avatar.alt = partner.displayName || 'User';
    avatar.style.cssText = 'width: 40px; height: 40px; border-radius: 50%;';

    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'display: flex; flex-direction: column; overflow: hidden; flex-grow: 1;';

    const topRow = document.createElement('div');
    topRow.className = 'yt-dm-dialog-top-row';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = partner.displayName || 'User';

    const chatTimestampSpan = document.createElement('span');
    chatTimestampSpan.className = 'yt-dm-chat-timestamp';
    chatTimestampSpan.textContent = formatTime(chat.updatedAt);
    topRow.append(nameSpan, chatTimestampSpan);

    const lastMessageSpan = document.createElement('span');
    let lastMessageText = chat.lastMessage?.text || chat.lastMessage?.video?.title || '...';
    lastMessageSpan.textContent = lastMessageText;
    lastMessageSpan.className = 'yt-dm-last-message';

    textContainer.append(topRow, lastMessageSpan);
    dialogItem.append(avatar, textContainer);

    dialogItem.onclick = (event) => {
        event.stopPropagation();
        onSelectDialog(partner, chat.id, event);
    };

    return dialogItem;
}

function createCopyIcon(): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('height', '18');
    svg.setAttribute('width', '18');
    svg.setAttribute('fill', 'currentColor');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z');
    svg.appendChild(path);
    return svg;
}

export function renderDialogsView(
    container: HTMLElement,
    onSelectDialog: (partner: User, chatId: string, event: MouseEvent) => void,
    isSharing: boolean,
    unreadIds: Set<string>
): Unsubscribe {
    clearElement(container);

    if (isSharing) {
        const shareHeader = document.createElement('div');
        shareHeader.textContent = 'Select a conversation to share with';
        shareHeader.className = 'yt-dm-share-header';
        container.appendChild(shareHeader);
    } else {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; padding: 8px;';

        const copyLinkButton = document.createElement('button');
        const copyButtonSpan = document.createElement('span');
        copyButtonSpan.textContent = 'Copy My Link';
        copyButtonSpan.style.cssText = 'display: flex; align-items: center;';
        const copyIcon = createCopyIcon();
        copyIcon.style.marginLeft = '8px';
        copyButtonSpan.appendChild(copyIcon);
        copyLinkButton.appendChild(copyButtonSpan);
        buttonContainer.append(copyLinkButton);

        copyLinkButton.className = 'yt-dm-copy-link-button';

        copyLinkButton.onclick = () => {
            const myUid = auth.currentUser?.uid;
            if (!myUid) return;
            const link = `https://www.youtube.com/?dm_user=${myUid}`;
            navigator.clipboard.writeText(link).then(() => {
                copyButtonSpan.textContent = 'Copied!';
                copyLinkButton.className = 'yt-dm-copy-link-button copied';
                setTimeout(() => {
                    copyButtonSpan.textContent = 'Copy My Link';
                    copyLinkButton.className = 'yt-dm-copy-link-button';
                    copyButtonSpan.appendChild(copyIcon);
                }, 2000);
            });
        };

        buttonContainer.appendChild(copyLinkButton);
        container.appendChild(buttonContainer);
    }

    const dialogsList = document.createElement('div');
    container.appendChild(dialogsList);

    renderStateMessage(dialogsList, 'Loading conversations...', 'loading');

    unsubscribeFromChats = listenToChats(async (chats) => {
        const ignoredUids = await getIgnoreList();

        const filteredChats = chats.filter(chat => {
            const partnerUid = chat.participants.find(p => p !== auth.currentUser?.uid);
            return partnerUid && !ignoredUids.includes(partnerUid);
        });
        
        if (filteredChats.length === 0) {
            renderStateMessage(dialogsList, 'No conversations yet. Click "Copy My Link" to invite someone.', 'empty');
            return;
        }
        
        clearElement(dialogsList);
        const dialogItemsPromises = filteredChats.map(chat => renderDialogItem(chat, onSelectDialog, unreadIds.has(chat.id)));
        const dialogItems = (await Promise.all(dialogItemsPromises)).filter(Boolean) as HTMLElement[];
        dialogsList.append(...dialogItems);
    });

    return () => {
        if (unsubscribeFromChats) {
            unsubscribeFromChats();
            unsubscribeFromChats = null;
        }
    };
}