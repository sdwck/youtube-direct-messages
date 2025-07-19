import { auth } from '../../firebase/firebaseConfig';
import { parseVideoIdFromUrl, fetchYouTubeVideoDetails, parseYouTubeVideoId } from '../utils/youtube';
import { stateService } from '../../services/stateService';

function createDMShareButton(): HTMLElement {
  const dmShareButton = document.createElement('div');
  dmShareButton.className = 'style-scope yt-third-party-share-target-section-renderer share-to-dm';
  dmShareButton.setAttribute('role', 'button');

  const buttonInner = document.createElement('button');
  buttonInner.className = 'style-scope yt-share-target-renderer';
  buttonInner.title = 'Share to DM';
  buttonInner.id = 'target';

  const iconContainer = document.createElement('div');
  iconContainer.className = 'icon-resize style-scope yt-share-target-renderer';

  const iconShape = document.createElement('span');
  iconShape.className = 'yt-icon-shape style-scope yt-icon yt-spec-icon-shape';

  const iconDiv = document.createElement('div');
  iconDiv.style.width = '100%';
  iconDiv.style.height = '100%';
  iconDiv.style.display = 'block';
  iconDiv.style.fill = 'currentcolor';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 60 60');
  svg.setAttribute('focusable', 'false');
  svg.style.pointerEvents = 'none';
  svg.style.display = 'inherit';
  svg.style.width = '100%';
  svg.style.height = '100%';

  const circle = document.createElementNS(svgNS, 'circle');
  circle.setAttribute('cx', '30');
  circle.setAttribute('cy', '30');
  circle.setAttribute('r', '30');
  circle.setAttribute('fill', '#2e293a');

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('fill', '#FFF');
  path.setAttribute('d', 'M42 18H18c-2.21 0-4 1.79-4 4v14c0 2.21 1.79 4 4 4h2.5L25 45l5.5-5H42c2.21 0 4-1.79 4-4V22c0-2.21-1.79-4-4-4z');

  svg.append(circle, path);
  iconDiv.appendChild(svg);
  iconShape.appendChild(iconDiv);
  iconContainer.appendChild(iconShape);

  const title = document.createElement('div');
  title.id = 'title';
  title.className = 'style-scope yt-share-target-renderer';
  title.innerText = 'DM';

  buttonInner.append(iconContainer, title);
  dmShareButton.appendChild(buttonInner);

  return dmShareButton;
}

function insertDMButton(container: Element | null) {
  if (!container || container.querySelector('.share-to-dm')) return;
  const dmShareButton = createDMShareButton();

  dmShareButton.onclick = async (e) => {
    e.stopImmediatePropagation();
    e.preventDefault();

    if (!auth.currentUser) {
      alert('You must be signed in to share.');
      return;
    }

    let videoId = parseVideoIdFromUrl(window.location.href);
    if (!videoId) {
      const shareUrlInput = document.getElementById('share-url') as HTMLInputElement;
      if (shareUrlInput?.value) {
        videoId = parseYouTubeVideoId(shareUrlInput.value);
      }
    }

    if (!videoId) {
      alert('Could not find a valid YouTube video ID on this page.');
      return;
    }

    const sharePanel = document.querySelector('ytd-unified-share-panel-renderer');
    const timestampCheckbox = sharePanel?.querySelector<HTMLInputElement>('tp-yt-paper-checkbox');
    const timestampInput = sharePanel?.querySelector<HTMLInputElement>('tp-yt-iron-input input');

    let timestamp: number | undefined;
    if (timestampCheckbox?.checked && timestampInput?.value) {
      timestamp = timestampInput.value.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
    }

    const videoData = await fetchYouTubeVideoDetails(videoId, timestamp);
    stateService.enterShareMode(videoData);

    const closeButton = document.querySelector('ytd-unified-share-panel-renderer #close-button button');
    if (closeButton instanceof HTMLElement)
      closeButton.click();

    document.getElementById('yt-dm-toggle')?.click();
  };

  const firstTarget = container.querySelector('yt-share-target-renderer');
  if (firstTarget) {
    firstTarget.before(dmShareButton);
  } else {
    container.appendChild(dmShareButton);
  }
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach(m => {
    m.addedNodes.forEach(node => {
      if (node instanceof HTMLElement && node.matches('div#list.yt-third-party-share-target-section-renderer')) {
        const container = node.querySelector('div#contents.yt-third-party-share-target-section-renderer');
        insertDMButton(container);
      }
    });
  });
});

observer.observe(document.body, { subtree: true, childList: true });