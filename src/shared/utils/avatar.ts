export function generateAvatarPlaceholder(name: string | null | undefined, size: number = 40): string {
    const defaultName = name || ':3';
    const initials = defaultName
        .split(' ')
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();

    const encodedInitials = encodeURIComponent(initials);
    return `https://placehold.co/${size}/808080/FFFFFF?text=${encodedInitials}`;
}