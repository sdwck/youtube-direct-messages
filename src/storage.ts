const READ_TIMESTAMPS_KEY = 'yt-dm-read-timestamps';

type ReadTimestamps = { [chatId: string]: number };

export function getReadTimestamps(): ReadTimestamps {
    try {
        const data = localStorage.getItem(READ_TIMESTAMPS_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error("Error reading read timestamps from localStorage:", error);
        return {};
    }
}

export function updateReadTimestamp(chatId: string): void {
    const timestamps = getReadTimestamps();
    timestamps[chatId] = Date.now() + 3000;
    
    localStorage.setItem(READ_TIMESTAMPS_KEY, JSON.stringify(timestamps));
}