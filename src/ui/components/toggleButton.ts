import { emit, DMEvents } from '../../events';
import { createStrokedMessageIcon } from './icons';

export function createToggleButton(onClick: (buttonElement: HTMLButtonElement) => void): HTMLButtonElement {
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'yt-dm-toggle';
  toggleBtn.title = 'Open DM panel';

  const notificationDot = document.createElement('span');
  notificationDot.className = 'yt-dm-notification-dot';

  const iconContainer = document.createElement('div');
  iconContainer.className = 'yt-dm-icon-container';
  iconContainer.appendChild(createStrokedMessageIcon());

  toggleBtn.append(notificationDot, iconContainer);
  
  toggleBtn.style.cssText = `
    position: relative;
    background: transparent; 
    border: none; 
    cursor: pointer; 
    padding: 8px;
    border-radius: 50%; 
    width: 40px; 
    height: 40px;
    display: flex; 
    align-items: center; 
    justify-content: center;
    fill: var(--yt-spec-icon-active-other, #fff);
  `;
  
  toggleBtn.onmouseover = () => { toggleBtn.style.backgroundColor = 'var(--yt-spec-hover-background, rgba(255, 255, 255, 0.1))' };
  toggleBtn.onmouseout = () => { toggleBtn.style.backgroundColor = 'transparent' };
  
  toggleBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick(toggleBtn);
  });

  function insertButton() {
    if (document.getElementById('yt-dm-toggle')) {
      return;
    }
    const notificationsButton = document.querySelector('ytd-notification-topbar-button-renderer');
    if (notificationsButton && notificationsButton.parentElement) {
      notificationsButton.parentElement.insertBefore(toggleBtn, notificationsButton);
      emit(DMEvents.UIReady, undefined);
    }
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById('yt-dm-toggle')) {
        insertButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  insertButton();
  
  return toggleBtn;
}