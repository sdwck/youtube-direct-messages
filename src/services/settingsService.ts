import { AppSettings, NotificationStyle } from '../types/settings';
import { chatService } from './chatService';
import { User } from '../types/user';

const SETTINGS_KEY = 'yt-dm-app-settings';

const defaultSettings: AppSettings = {
    ignoredUserIds: [],
    notificationStyle: NotificationStyle.COUNT
};

interface ISettingsService {
    getAppSettings(): AppSettings;
    saveAppSettings(settings: AppSettings): void;
    addToIgnoreList(uid: string): void;
    removeFromIgnoreList(uid: string): void;
    getIgnoredUsers(): Promise<User[]>;
    getIgnoredUids(): Promise<string[]>;
}

function getAppSettings(): AppSettings {
    try {
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            return { ...defaultSettings, ...parsed };
        }
    } catch (error) {
        console.error("Failed to parse app settings:", error);
    }
    return defaultSettings;
}

function saveAppSettings(settings: AppSettings): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save app settings:", error);
    }
}

function addToIgnoreList(uid: string): void {
    const settings = getAppSettings();
    if (!settings.ignoredUserIds.includes(uid)) {
        settings.ignoredUserIds.push(uid);
        saveAppSettings(settings);
    }
}

function removeFromIgnoreList(uid: string): void {
    const settings = getAppSettings();
    settings.ignoredUserIds = settings.ignoredUserIds.filter(id => id !== uid);
    saveAppSettings(settings);
}

async function getIgnoredUsers(): Promise<User[]> {
    const settings = getAppSettings();
    if (settings.ignoredUserIds.length === 0) {
        return [];
    }
    const userPromises = settings.ignoredUserIds.map(uid => chatService.getUserProfile(uid));
    return Promise.all(userPromises);
}

async function getIgnoredUids(): Promise<string[]> {
    const settings = getAppSettings();
    return settings.ignoredUserIds;
}

export const settingsService: ISettingsService = {
    getAppSettings,
    saveAppSettings,
    addToIgnoreList,
    removeFromIgnoreList,
    getIgnoredUsers,
    getIgnoredUids
};