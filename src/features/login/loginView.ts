import { authService } from '../../services/authService';
import { clearElement } from '../../shared/dom';

export class LoginView {
    public static render(container: HTMLElement) {
        clearElement(container);
        
        const header = document.createElement('div');
        header.className = 'yt-dm-chat-header';
        const title = document.createElement('span');
        title.className = 'yt-dm-username';
        title.textContent = 'Messages';
        header.appendChild(title);

        const wrapper = document.createElement('div');
        wrapper.className = 'yt-dm-login-view';

        const p = document.createElement('p');
        p.textContent = 'Sign in to use YouTube DMs';

        const button = document.createElement('button');
        button.id = 'yt-dm-login-btn';
        button.textContent = 'Sign In with Google';
        button.onclick = () => authService.signIn();

        wrapper.append(p, button);
        container.append(header, wrapper);
    }
}