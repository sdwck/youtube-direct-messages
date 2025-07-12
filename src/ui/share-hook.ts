import { auth } from '../firebase/firebase-config';
import { parseVideoIdFromUrl, fetchYouTubeVideoDetails, parseYouTubeVideoId } from './utils/youtube';

const observer = new MutationObserver((mutations) => {
  mutations.forEach(m => {
    m.addedNodes.forEach(node => {
      if (node instanceof HTMLElement && node.matches('div#list.yt-third-party-share-target-section-renderer')) {
        const container = node.querySelector('div#contents.yt-third-party-share-target-section-renderer');
        if (container && container instanceof HTMLElement) {
          container.style.display = 'flex';
        }
        insertDMButton(container);
      }
    });
  });
});

observer.observe(document.body, { subtree: true, childList: true });

function insertDMButton(container: Element | null) {
  if (!container || container.querySelector('.share-to-dm')) return;

  const ytShare = document.createElement('div');
  ytShare.className = 'style-scope yt-third-party-share-target-section-renderer';
  ytShare.setAttribute('role', 'button');

  const button = document.createElement('button');
  button.id = 'target';
  button.className = 'style-scope yt-share-target-renderer';
  button.title = 'Share to DM';

  const ytIcon = document.createElement('div');
  ytIcon.className = 'icon-resize style-scope yt-share-target-renderer';

  const span = document.createElement('span');
  span.className = 'yt-icon-shape style-scope yt-icon yt-spec-icon-shape';

  const div = document.createElement('div');
  div.style.width = '100%';
  div.style.height = '100%';
  div.style.display = 'block';
  div.style.fill = 'currentcolor';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 60 60');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.pointerEvents = 'none';
  svg.style.display = 'inherit';
  svg.style.width = '100%';
  svg.style.height = '100%';

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '30');
  circle.setAttribute('cy', '30');
  circle.setAttribute('r', '30');
  circle.setAttribute('fill', '#2e293a');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', '#FFF');
  path.setAttribute(
    'd',
    'M42 18H18c-2.21 0-4 1.79-4 4v14c0 2.21 1.79 4 4 4h2.5L25 45l5.5-5H42c2.21 0 4-1.79 4-4V22c0-2.21-1.79-4-4-4z'
  );

  svg.appendChild(circle);
  svg.appendChild(path);

  div.appendChild(svg);
  span.appendChild(div);
  ytIcon.appendChild(span);

  const title = document.createElement('div');
  title.id = 'title';
  title.className = 'style-scope yt-share-target-renderer';
  title.innerText = 'DM';
  title.style.color = 'var(--yt-spec-text-primary)';
  title.setAttribute('style-target', 'title');

  ytShare.onclick = async (e) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    if (!auth.currentUser) {
      alert('You must be signed in to share.');
      return;
    }

    let videoId = parseVideoIdFromUrl(window.location.href);

        if (!videoId) {
            const shareUrlInput = document.getElementById('share-url') as HTMLInputElement;
            if (shareUrlInput && shareUrlInput.value) {
                videoId = parseYouTubeVideoId(shareUrlInput.value);
            }
        }

    if (!videoId) {
      alert('Could not find a valid YouTube video ID on this page.');
      return;
    }

    const videoData = await fetchYouTubeVideoDetails(videoId);

    sessionStorage.setItem('yt-dm-pending-share', JSON.stringify(videoData));

    const toggleButton = document.getElementById('yt-dm-toggle');
    if (toggleButton) {
      toggleButton.click();
    }

    const closeButton = document.querySelector('ytd-unified-share-panel-renderer #close-button');
    if (closeButton instanceof HTMLElement) {
      closeButton.click();
    }
  };

  button.appendChild(ytIcon);
  button.appendChild(title);
  ytShare.appendChild(button);
  ytShare.classList.add('share-to-dm');

  const firstTarget = container.querySelector('yt-share-target-renderer');
  if (firstTarget) {
    firstTarget.before(ytShare);
  } else {
    container.appendChild(ytShare);
  }
}