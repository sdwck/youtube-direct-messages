import * as api from '../firebase/api';
import { User } from '../types/user';

interface ISettingsService {
    getIgnoreList(): Promise<string[]>;
    addToIgnoreList(uidToIgnore: string): Promise<void>;
    removeFromIgnoreList(uidToRemove: string): Promise<void>;
    getUserProfile(uid: string): Promise<User>;
}

export const settingsService: ISettingsService = {
    getIgnoreList: api.getIgnoreList,
    addToIgnoreList: api.addToIgnoreList,
    removeFromIgnoreList: api.removeFromIgnoreList,
    getUserProfile: api.getUserProfile
};