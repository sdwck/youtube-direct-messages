export enum NotificationStyle {
    MINIMAL = 'minimal',
    COUNT = 'count'
}

export interface AppSettings {
    notificationStyle: NotificationStyle;
}