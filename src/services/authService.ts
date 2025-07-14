import { on, DMEvents } from '../shared/events';
import { User } from '../types/user';
import { signInWithGoogle } from '../firebase/firebaseConfig';
import { stateService, ViewType } from './stateService';

class AuthService {
    public currentUser: User | null = null;
    
    public initialize(): void {
        on(DMEvents.AuthChanged, (user) => {
            this.handleAuthChange(user);
        });
    }

    private handleAuthChange(user: User | null): void {
        this.currentUser = user;
        if (user) {
            stateService.setView(ViewType.DIALOGS);
        } else {
            stateService.setView(ViewType.LOGIN);
        }
    }

    public signIn(): Promise<void> {
        return signInWithGoogle();
    }
    
    public onAuthChange(callback: (user: User | null) => void): () => void {
        const handler = (user: User | null) => callback(user);
        on(DMEvents.AuthChanged, handler);
        return () => {};
    }
}

export const authService = new AuthService();