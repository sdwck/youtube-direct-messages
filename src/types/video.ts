export interface Video {
    title: string;
    type?: 'video' | 'short';
    thumbnail: string;
    url: string;
    duration: string;
    timestamp?: number;
}