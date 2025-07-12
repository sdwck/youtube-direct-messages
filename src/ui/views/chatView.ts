import { User } from '../../types/user';
import { Message } from '../../types/message';
import { listenToNewMessages, addMessage, fetchInitialMessages, fetchOlderMessages } from '../../firebase/firestore';
import { createMessageElement } from '../components/message';
import { Unsubscribe } from '../../libs/firebase/firebase-firestore.js';
import { formatDateSeparator } from '../utils/time';
import { updateReadTimestamp } from '../../storage';
import { QueryDocumentSnapshot } from '../../libs/firebase/firebase-firestore.js';
import { auth } from '../../firebase/firebase-config';
import { Timestamp } from '../../libs/firebase/firebase-firestore.js';
import { parseVideoIdFromUrl, fetchYouTubeVideoDetails } from '../utils/youtube';
import { createShareIcon } from '../components/icons';

function clearElement(el: HTMLElement) {
    while (el.firstChild) { el.removeChild(el.firstChild); }
}

export function renderChatView(
    listContainer: HTMLElement,
    footerContainer: HTMLElement,
    partner: User,
    chatId: string
): Unsubscribe {
    let oldestMessageDoc: QueryDocumentSnapshot | null = null;
    let isLoadingOlder = false;
    let newMessagesListener: Unsubscribe | null = null;
    let messages: Message[] = [];

    listContainer.className = 'yt-dm-message-list';

    clearElement(footerContainer);

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'yt-dm-input-wrapper';

    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.className = 'yt-dm-message-input';
    inputElement.placeholder = 'Say something...';
    inputElement.maxLength = 500;

    const shareButton = document.createElement('button');
    shareButton.className = 'yt-dm-icon-button share-video-button';
    shareButton.title = 'Share current video';
    shareButton.appendChild(createShareIcon());

    const charCounter = document.createElement('div');
    charCounter.className = 'yt-dm-char-counter';
    inputWrapper.append(inputElement, charCounter);
    footerContainer.appendChild(inputWrapper);
    footerContainer.appendChild(shareButton);

    const handleShareVideo = async () => {
        const videoId = parseVideoIdFromUrl(window.location.href);
        if (!videoId) {
            alert("No video found on this page to share.");
            return;
        }

        const myUid = auth.currentUser?.uid;
        if (!myUid) return;

        shareButton.disabled = true;
        try {
            const videoData = await fetchYouTubeVideoDetails(videoId);
            
            const optimisticMessage: Message = {
                id: `optimistic_${Date.now()}`,
                from: myUid,
                video: videoData,
                timestamp: Timestamp.now()
            };

            messages = [...messages, optimisticMessage];
            await addMessagesToView([optimisticMessage], 'bottom');
            listContainer.scrollTop = listContainer.scrollHeight;

            await addMessage(chatId, { video: videoData });

        } catch (error) {
            console.error("Failed to share video:", error);
            alert("Could not share video.");
        } finally {
            shareButton.disabled = false;
        }
    };
    shareButton.addEventListener('click', handleShareVideo);

    const handleInput = () => {
        const currentLength = inputElement.value.length;
        charCounter.textContent = `${currentLength} / 500`;

        if (currentLength >= 400) {
            charCounter.classList.add('visible');
        } else {
            charCounter.classList.remove('visible');
        }

        if (currentLength >= 500) {
            charCounter.classList.add('limit-exceeded');
        } else {
            charCounter.classList.remove('limit-exceeded');
        }
    };
    inputElement.addEventListener('input', handleInput);

    const handleSend = async () => {
        const text = inputElement.value.trim();
        if (!text) return;

        const myUid = auth.currentUser?.uid;
        if (!myUid) return;

        const textToSend = text;
        inputElement.value = '';
        handleInput();

        const optimisticMessage: Message = {
            id: `optimistic_${Date.now()}`,
            from: myUid,
            text: textToSend,
            timestamp: Timestamp.now() 
        };

        messages = [...messages, optimisticMessage];
        await addMessagesToView([optimisticMessage], 'bottom');
        listContainer.scrollTop = listContainer.scrollHeight;

        try {
            await addMessage(chatId, { text: textToSend });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };
    
    const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') { handleSend(); }
    };
    inputElement.addEventListener('keydown', onKeydown);

    async function addMessagesToView(msgs: Message[], position: 'top' | 'bottom') {
        const fragment = document.createDocumentFragment();

        for (const msg of msgs) {
            if (msg.timestamp) {
                const dateSeparator = document.createElement('div');
                dateSeparator.className = 'yt-dm-date-separator';
                dateSeparator.setAttribute('data-date-string', msg.timestamp.toDate().toDateString());
                dateSeparator.textContent = formatDateSeparator(msg.timestamp);
                fragment.appendChild(dateSeparator);
            }
            const messageEl = await createMessageElement(msg);
            messageEl.setAttribute('data-message-id', msg.id);
            fragment.appendChild(messageEl);
        }

        if (position === 'top') listContainer.prepend(fragment);
        else listContainer.appendChild(fragment);
        cleanupDateSeparators();
    }

    function cleanupDateSeparators() {
        const allSeparators = listContainer.querySelectorAll('.yt-dm-date-separator');
        let lastDateString: string | null = null;

        allSeparators.forEach(separator => {
            const currentDateString = separator.getAttribute('data-date-string');
            
            if (currentDateString === lastDateString) {
                separator.remove();
            } else {
                lastDateString = currentDateString;
            }
        });
    }

    const loadOlderMessages = async () => {
        if (isLoadingOlder || !oldestMessageDoc) return;
        isLoadingOlder = true;
        const firstVisibleMessage = listContainer.querySelector('.yt-dm-message-container');

        try {
            const { messages: olderMessages, oldestDoc: newOldestDoc } = await fetchOlderMessages(chatId, oldestMessageDoc);

            if (olderMessages.length > 0) {
                messages = [...olderMessages, ...messages];
                await addMessagesToView(olderMessages, 'top');
                oldestMessageDoc = newOldestDoc;

                if (firstVisibleMessage) {
                    firstVisibleMessage.scrollIntoView({ block: 'start' });
                }
            } else {
                oldestMessageDoc = null;
            }
        } finally {
            isLoadingOlder = false;
        }
    };

    const handleScroll = () => {
        if (listContainer.scrollTop < 50) {
            loadOlderMessages();
        }
    };
    listContainer.addEventListener('scroll', handleScroll, { passive: true });

    clearElement(listContainer);
    fetchInitialMessages(chatId).then(async ({ messages: initialMessages, oldestDoc: initialOldestDoc }) => {
        messages = initialMessages;
        await addMessagesToView(messages, 'bottom');
        oldestMessageDoc = initialOldestDoc;

        setTimeout(() => { listContainer.scrollTop = listContainer.scrollHeight; }, 0);
        updateReadTimestamp(chatId);

        const latestMessage = messages[messages.length - 1];
        if (latestMessage) {
            newMessagesListener = listenToNewMessages(chatId, latestMessage.id, async (newMsgs) => {
                const myUid = auth.currentUser?.uid;
                const trulyNewMsgs = newMsgs.filter(newMsg => newMsg.from !== myUid);
                
                if (trulyNewMsgs.length > 0) {
                    const isAtBottom = listContainer.scrollHeight - listContainer.scrollTop - listContainer.clientHeight < 50;
                    messages = [...messages, ...trulyNewMsgs];
                    await addMessagesToView(trulyNewMsgs, 'bottom');
                    if (isAtBottom) {
                        listContainer.scrollTop = listContainer.scrollHeight;
                    }
                    updateReadTimestamp(chatId);
                }
            });
        }
    });

    return () => {
        listContainer.removeEventListener('scroll', handleScroll);
        if (newMessagesListener) newMessagesListener();
        inputElement.removeEventListener('input', handleInput);
        inputElement.removeEventListener('keydown', onKeydown);
        shareButton.removeEventListener('click', handleShareVideo);
    };
}