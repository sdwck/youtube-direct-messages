import { Video } from "../../types/video";

function formatSecondsToTime(secondsValue: number): string {
    if (isNaN(secondsValue) || secondsValue < 0) {
        return '';
    }
    const totalSeconds = Math.floor(secondsValue);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${minutes}:${paddedSeconds}`;
}

export async function fetchYouTubeVideoDetails(videoId: string, timestamp?: number): Promise<Video> {
    const type = window.location.pathname.includes('/shorts/') ? 'short' : 'video';

    let title = 'YouTube Video';
    let durationString = '';
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    try {
        const playerResponse = (window as any).ytInitialPlayerResponse;
        if (playerResponse && playerResponse.videoDetails) {
            const videoDetails = playerResponse.videoDetails;
            if (videoDetails.videoId === videoId) {
                if (videoDetails.title) {
                    title = videoDetails.title;
                }
                if (videoDetails.lengthSeconds) {
                    durationString = formatSecondsToTime(parseInt(videoDetails.lengthSeconds, 10));
                }
                if (videoDetails.thumbnail?.thumbnails?.length > 0) {
                    thumbnail = videoDetails.thumbnail.thumbnails.pop().url;
                }
            }
        }
    } catch { }

    try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`);
        if (response.ok) {
            const data = await response.json();
            if (data.title) title = data.title;
            if (data.thumbnail_url) thumbnail = data.thumbnail_url;
        }
    } catch { }

    if (!title || title === 'YouTube Video') {
        const titleEl = document.querySelector('h1.ytd-watch-metadata');
        if (titleEl) {
            title = titleEl.textContent?.trim() || title;
        }
    }

    if (!durationString) {
        const standardDurationEl = document.querySelector('.ytp-time-duration');
        if (standardDurationEl) {
            durationString = standardDurationEl.textContent?.trim() || '';
        } else {
            const progressBarEl = document.querySelector('.ytPlayerProgressBarDragContainer');
            const maxSecondsAttr = progressBarEl?.getAttribute('aria-valuemax');
            if (maxSecondsAttr) {
                durationString = formatSecondsToTime(parseFloat(maxSecondsAttr));
            }
        }
    }

    if (!timestamp)
        return {
            type: type,
            title: title,
            thumbnail: thumbnail,
            url: `https://youtu.be/${videoId}`,
            duration: durationString
        }

    return {
        type: type,
        title: title,
        thumbnail: thumbnail,
        url: `https://youtu.be/${videoId}`,
        duration: durationString,
        timestamp: timestamp
    };
}

export function parseVideoIdFromUrl(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

export function parseYouTubeVideoId(url: string): string | null {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}