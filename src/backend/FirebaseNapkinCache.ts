import { type Napkin } from '../types';
import type { NapkinStorage } from './NapkinStorage';
import { FirebaseNapkinService } from './FirebaseNapkinService';

export class FirebaseNapkinCache implements NapkinStorage {
    private cache: Napkin[] | null = null;
    private lastFetch: number = 0;
    private readonly TIMEOUT = 5 * 60 * 1000; // 5 minutes
    private realService: FirebaseNapkinService;

    constructor() {
        this.realService = new FirebaseNapkinService();
    }

    async getNapkins(): Promise<Napkin[]> {
        const now = Date.now();
        if (this.cache && (now - this.lastFetch < this.TIMEOUT)) {
            console.log('[Cache] Serving from memory (5m timeout)');
            return this.cache;
        }

        const fresh = await this.realService.getNapkins();
        this.cache = fresh;
        this.lastFetch = now;
        return fresh;
    }

    async getNapkin(id: string): Promise<Napkin | null> {
        const napkin = await this.realService.getNapkin(id);
        if (napkin) {
            this.saveNapkinToCache(napkin);
        }
        return napkin;
    }

    async saveNapkin(napkin: Napkin): Promise<Napkin> {
        const savedNapkin = await this.realService.saveNapkin(napkin);

        this.saveNapkinToCache(napkin);

        return savedNapkin;
    }

    private saveNapkinToCache(napkin: Napkin): void {
        if (this.cache) {
            const index = this.cache.findIndex(n => n.id === napkin.id);
            if (index !== -1) {
                this.cache[index] = { ...napkin };
            } else {
                this.cache = [napkin, ...this.cache];
            }

            // Re-sort to maintain order
            this.cache.sort((a, b) =>
                new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime()
            );
        }
    }

    async createNapkin(): Promise<Napkin> {
        return await this.realService.createNapkin();
    }

    async deleteNapkin(id: string): Promise<void> {
        await this.realService.deleteNapkin(id);
        if (this.cache) {
            this.cache = this.cache.filter(n => n.id !== id);
        }
    }

    clear() {
        this.cache = null;
        this.lastFetch = 0;
    }
}
