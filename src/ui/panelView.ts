export class PanelView {
    public static createShell(): { shell: HTMLElement, viewContainer: HTMLElement } {
        const shell = document.createElement('div');
        shell.id = 'yt-dm-chat-panel';
        if (window.getComputedStyle(document.documentElement).getPropertyValue('--yt-spec-menu-background') === '#fff')
            shell.classList.add('light-theme');
        shell.style.display = 'none';
        
        const viewContainer = document.createElement('div');
        viewContainer.className = 'yt-dm-view-container';
        
        shell.appendChild(viewContainer);
        
        return { shell, viewContainer };
    }
}