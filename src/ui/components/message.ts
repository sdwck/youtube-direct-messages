import { auth } from '../../firebase/firebase-config';
import { getUserProfile } from '../../firebase/firestore';
import { Message } from '../../types/message';
import { linkify } from '../utils/linkify';
import { formatSeconds, formatTime } from '../utils/time';

export async function createMessageElement(message: Message): Promise<HTMLElement> {
    const user = auth.currentUser!;
    const isOutgoing = message.from === user.uid;

    const container = document.createElement('div');
    container.className = `yt-dm-message-container ${isOutgoing ? 'outgoing' : 'incoming'}`;

    if (!isOutgoing) {
        const senderProfile = await getUserProfile(message.from);
        const avatar = document.createElement('img');
        avatar.className = 'yt-dm-avatar';
        avatar.src = senderProfile.photoURL || 'https://via.placeholder.com/28';
        container.appendChild(avatar);
    }

    const messageContentWrapper = document.createElement('div');
    messageContentWrapper.className = 'yt-dm-message-content-wrapper';

    const bubble = document.createElement('div');
    bubble.className = 'yt-dm-message-bubble';

    if (message.video) {
        bubble.classList.add('video-embed');

        const videoLink = document.createElement('a');
        if (message.video.type === 'short') {
            const videoId = message.video.url.split('/').pop();
            videoLink.href = `https://www.youtube.com/shorts/${videoId}`;
        } else if (message.video.timestamp) {
            const separator = videoLink.href.includes('?') ? '&' : '?';
            videoLink.href = message.video.url + `${separator}t=${message.video.timestamp}`;
        } else {
            videoLink.href = message.video.url;
        }
        // videoLink.target = '_blank';
        videoLink.rel = 'noopener noreferrer';
        videoLink.style.textDecoration = 'none';
        videoLink.style.color = 'inherit';

        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'video-thumbnail-container';
        const thumbnailImg = document.createElement('img');
        thumbnailImg.className = 'video-thumbnail';
        thumbnailImg.src = message.video.thumbnail;
        const durationSpan = document.createElement('span');
        durationSpan.className = 'video-duration';
        durationSpan.textContent = message.video.duration;
        thumbnailContainer.append(thumbnailImg, durationSpan);

        const titleP = document.createElement('p');
        titleP.className = 'video-title';
        titleP.textContent = message.video.title;

        if (message.video.timestamp) {
            const tsBadge = document.createElement('span');
            tsBadge.className = 'video-timestamp-badge';
            tsBadge.textContent = formatSeconds(message.video.timestamp);
            titleP.appendChild(tsBadge);
        }


        videoLink.append(thumbnailContainer, titleP);
        bubble.appendChild(videoLink);
    } else {
        const messageText = document.createElement('p');
        messageText.className = 'yt-dm-message-text';
        if (message.text) {
            const contentFragment = linkify(message.text);
            messageText.appendChild(contentFragment);
        }

        bubble.appendChild(messageText);
    }

    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'yt-dm-message-timestamp';
    timestampSpan.textContent = formatTime(message.timestamp);

    messageContentWrapper.append(bubble, timestampSpan);

    container.appendChild(messageContentWrapper);

    return container;
}