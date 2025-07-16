import { AppSettings, NotificationStyle } from '../types/settings';
import { chatService } from './chatService';
import { User } from '../types/user';
import { authService } from './authService';

const SETTINGS_KEY = 'yt-dm-app-settings';

let ignoreListCache: string[] | null = null;

authService.onAuthChange(user => {
    if (!user) {
        ignoreListCache = null;
    }
});

const defaultSettings: AppSettings = {
    notificationStyle: NotificationStyle.COUNT
};

interface ISettingsService {
    getAppSettings(): AppSettings;
    saveAppSettings(settings: AppSettings): void;
    addToIgnoreList(uid: string): Promise<void>;
    removeFromIgnoreList(uid: string): Promise<void>;
    getIgnoredUsers(): Promise<User[]>;
    getIgnoredUids(forceRefresh?: boolean): Promise<string[]>;
}

function getAppSettings(): AppSettings {
    try {
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            return { 
                notificationStyle: parsed.notificationStyle || defaultSettings.notificationStyle
            };
        }
    } catch (error) {
        console.error("Failed to parse app settings:", error);
    }
    return defaultSettings;
}

function saveAppSettings(settings: AppSettings): void {
    try {
        const settingsToSave = {
            notificationStyle: settings.notificationStyle
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
        console.error("Failed to save app settings:", error);
    }
}

async function addToIgnoreList(uid: string): Promise<void> {
    await chatService.addUserToIgnoreList(uid);
    ignoreListCache = null; 
}

async function removeFromIgnoreList(uid: string): Promise<void> {
    await chatService.removeUserFromIgnoreList(uid);
    ignoreListCache = null; 
}

async function getIgnoredUids(forceRefresh = false): Promise<string[]> {
    if (ignoreListCache !== null && !forceRefresh) {
        return ignoreListCache;
    }
    
    const uids = await chatService.getIgnoreListUids();
    ignoreListCache = uids;
    return uids;
}

async function getIgnoredUsers(): Promise<User[]> {
    const uids = await getIgnoredUids(true);
    if (uids.length === 0) {
        return [];
    }

    const userPromises = uids.map(uid => 
        chatService.getUserProfile(uid).catch(err => {
            console.warn(`Could not fetch profile for ignored UID: ${uid}`, err);
            return null;
        })
    );
    const users = (await Promise.all(userPromises)).filter(u => u !== null) as User[];
    return users;
}


export const settingsService: ISettingsService = {
    getAppSettings,
    saveAppSettings,
    addToIgnoreList,
    removeFromIgnoreList,
    getIgnoredUsers,
    getIgnoredUids
};