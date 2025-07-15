import { emit, DMEvents } from '../events';
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