export enum NotificationStyle {
    MINIMAL = 'minimal',
    COUNT = 'count'
}

export interface AppSettings {
    ignoredUserIds: string[];
    notificationStyle: NotificationStyle;
}