import { getIgnoreList, removeFromIgnoreList, addToIgnoreList } from '../../firebase/settings';
import { getUserProfile } from '../../firebase/firestore';
import { User } from '../../types/user';
import { createCloseIcon } from '../components/icons';

function clearElement(el: HTMLElement) {
    while (el.firstChild) { el.removeChild(el.firstChild); }
}

function createIgnoredUserElement(user: User, onRemove: (uid: string) => void): HTMLElement {
    const item = document.createElement('div');
    item.className = 'settings-list-item';
    
    const avatar = document.createElement('img');
    avatar.src = user.photoURL || 'https://via.placeholder.com/40';
    
    const nameContainer = document.createElement('div');
    nameContainer.className = 'settings-list-item-name';
    const name = document.createElement('span');
    name.textContent = user.displayName || `User...${user.uid.slice(-4)}`;
    nameContainer.appendChild(name);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'yt-dm-icon-button remove-ignore-btn';
    removeBtn.title = 'Remove from ignore list';
    removeBtn.appendChild(createCloseIcon());
    removeBtn.onclick = () => {
        onRemove(user.uid);
    };
    
    item.append(avatar, nameContainer, removeBtn);
    return item;
}

export async function renderSettingsView(container: HTMLElement) {
    clearElement(container);
    container.className = 'yt-dm-settings-view';

    const header = document.createElement('h2');
    header.textContent = 'Ignore List';

    const list = document.createElement('div');
    list.className = 'settings-list';

    const ignoredUids = await getIgnoreList();
    if (ignoredUids.length === 0) {
        list.textContent = 'Your ignore list is empty.';
        list.style.marginLeft = '8px';
    } else {
        list.style.marginLeft = '0';
        const userPromises = ignoredUids.map(uid => getUserProfile(uid));
        const users = await Promise.all(userPromises);
        users.forEach(user => {
            const userEl = createIgnoredUserElement(user, async (uidToRemove) => {
                await removeFromIgnoreList(uidToRemove);
                renderSettingsView(container);
            });
            list.appendChild(userEl);
        });
    }
    
    container.append(header, list);
}