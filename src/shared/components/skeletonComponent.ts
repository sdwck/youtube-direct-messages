function createSkeletonElement(classes: string[]): HTMLElement {
    const el = document.createElement('div');
    el.className = `yt-dm-skeleton ${classes.join(' ')}`;
    return el;
}

export function createDialogItemSkeleton(): HTMLElement {
    const item = document.createElement('div');
    item.className = 'skeleton-item';

    const avatar = createSkeletonElement(['yt-dm-skeleton-avatar']);

    const textContainer = document.createElement('div');
    textContainer.className = 'skeleton-text-container';
    const line1 = createSkeletonElement(['yt-dm-skeleton-text']);
    const line2 = createSkeletonElement(['yt-dm-skeleton-text', 'short']);
    textContainer.append(line1, line2);

    item.append(avatar, textContainer);
    return item;
}

export function createUserItemSkeleton(): HTMLElement {
    const item = document.createElement('div');
    item.className = 'skeleton-item';

    const avatar = createSkeletonElement(['yt-dm-skeleton-avatar-medium']);
    const text = createSkeletonElement(['yt-dm-skeleton-text']);
    
    item.append(avatar, text);
    return item;
}

export function createMessageListSkeleton(): HTMLElement[] {
    const items = [];
    for (let i = 0; i < 7; i++) {
        const isOutgoing = i % 2 !== 0;
        const item = document.createElement('div');
        item.className = `skeleton-item ${isOutgoing ? 'outgoing' : ''}`;
        
        const bubble = createSkeletonElement(['yt-dm-skeleton-message-bubble']);
        
        if (!isOutgoing) {
            const avatar = createSkeletonElement(['yt-dm-skeleton-avatar-medium']);
            item.append(avatar, bubble);
        } else {
            item.appendChild(bubble);
        }
        items.push(item);
    }
    return items;
}

export function createSkeletonList(count: number, createFn: () => HTMLElement): HTMLElement[] {
    return Array.from({ length: count }, createFn);
}