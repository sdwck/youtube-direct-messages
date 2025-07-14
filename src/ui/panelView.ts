export class PanelView {
    public static createShell(): { shell: HTMLElement, viewContainer: HTMLElement } {
        const shell = document.createElement('div');
        shell.id = 'yt-dm-chat-panel';
        shell.style.display = 'none';
        
        const viewContainer = document.createElement('div');
        viewContainer.className = 'yt-dm-view-container';
        
        shell.appendChild(viewContainer);
        
        return { shell, viewContainer };
    }
}