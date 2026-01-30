import { auth } from '../firebase';
import { StorageLocation, type Napkin } from '../types';
import type { NapkinStorage } from './NapkinStorage';

const STORAGE_KEY = 'napkin_scribbles';

export class LocalStorageNapkinService implements NapkinStorage {

    private get isAuthenticated() {
        return !!auth.currentUser;
    }

    async saveNapkin(napkin: Napkin): Promise<Napkin> {
        console.log('Saving local napkin for: ' + napkin.title);
        const napkins = await this.getNapkins();
        const index = napkins.findIndex((n) => n.id === napkin.id);

        if (index >= 0) {
            napkins[index] = napkin;
        } else {
            napkins.push(napkin);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(napkins));

        return napkin;
    }

    async getNapkins(): Promise<Napkin[]> {
        const data = localStorage.getItem(STORAGE_KEY);
        // Return parsed data or empty array, sorted by createdAt descending (newest first)
        const napkins: Napkin[] = data ? JSON.parse(data) : [];
        return napkins.sort((a, b) => new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime()).map(n => ({ ...n, storage: StorageLocation.LocalStorage }));
    }

    async getNapkin(id: string): Promise<Napkin | null> {
        const napkins = await this.getNapkins();
        return napkins.find((n) => n.id === id) || null;
    }

    async createNapkin(): Promise<Napkin> {
        const newNapkin: Napkin = {
            id: crypto.randomUUID(),
            title: '',
            content: '',
            storage: StorageLocation.LocalStorage,
            createdAt: new Date().toISOString(),
            lastSavedAt: new Date().toISOString(),
        };
        // We do not save immediately here; we wait for the user to edit.
        return newNapkin;
    }

    async deleteNapkin(id: string): Promise<void> {
        const napkins = await this.getNapkins();
        const filtered = napkins.filter(n => n.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
}
