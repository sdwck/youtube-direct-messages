import { signInWithGoogle } from '../../firebase/firebase-config';

function clearElement(el: HTMLElement) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
}

export function renderLoginView(container: HTMLElement) {
    clearElement(container);

    const wrapper = document.createElement('div');
    wrapper.className = 'yt-dm-login-view';
    wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px;';

    const p = document.createElement('p');
    p.textContent = 'Sign in to use YouTube DMs';

    const button = document.createElement('button');
    button.id = 'yt-dm-login-btn';
    button.textContent = 'Sign In with Google';
    button.style.cssText = 'background-color: #3ea6ff; color: #0f0f0f; font-weight: 500; border: none; padding: 10px 16px; border-radius: 18px; cursor: pointer;';
    button.addEventListener('click', signInWithGoogle);

    wrapper.append(p, button);
    container.appendChild(wrapper);
}