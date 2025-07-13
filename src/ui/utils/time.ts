import { Timestamp } from "../../libs/firebase/firebase-firestore.js";

export function formatTime(timestamp: Timestamp | undefined): string {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        return '';
    }
    const date = timestamp.toDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

export function formatDateSeparator(timestamp: Timestamp | undefined): string {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
        return 'Today';
    }
    if (date.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString(navigator.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}