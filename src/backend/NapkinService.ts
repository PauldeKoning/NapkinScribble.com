import { LocalStorageNapkinService } from './LocalStorageNapkinService';
import { FirebaseNapkinService } from './FirebaseNapkinService';
import type { Napkin } from '../types';
import type { NapkinStorage } from './NapkinStorage';
import { auth } from '../firebase';

export class NapkinService implements NapkinStorage {
    private local = new LocalStorageNapkinService();
    private cloud = new FirebaseNapkinService();

    private get isAuthenticated() {
        return !!auth.currentUser;
    }

    private isNewer(a: Napkin, b: Napkin): boolean {
        return new Date(a.lastSavedAt).getTime() > new Date(b.lastSavedAt).getTime();
    }

    async saveNapkin(napkin: Napkin): Promise<void> {
        // Always save to local for speed and offline support
        await this.local.saveNapkin(napkin);

        // If authenticated, also save to cloud
        if (this.isAuthenticated) {
            try {
                await this.cloud.saveNapkin(napkin);
            } catch (error) {
                console.error("Failed to save to cloud:", error);
                // We don't throw here because local save succeeded
            }
        }
    }

    async getNapkins(): Promise<Napkin[]> {
        const localNapkins = await this.local.getNapkins();
        let cloudNapkins: Napkin[] = [];

        if (this.isAuthenticated) {
            try {
                cloudNapkins = await this.cloud.getNapkins();
            } catch (error) {
                console.error("Failed to fetch cloud napkins:", error);
            }
        }

        // Merge and deduplicate, keeping the fresher version
        const combined = new Map<string, Napkin>();

        // Add local first
        localNapkins.forEach(n => combined.set(n.id, n));

        // Add cloud, replacing if cloud is newer
        cloudNapkins.forEach(cN => {
            const existing = combined.get(cN.id);
            if (!existing || this.isNewer(cN, existing)) {
                combined.set(cN.id, cN);

                // Sync to local if it's newer or missing
                this.local.saveNapkin(cN).catch(err =>
                    console.error(`Failed to sync napkin ${cN.id} to local:`, err)
                );
            }
        });

        const result = Array.from(combined.values());
        // Sort by createdAt descending
        return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getNapkin(id: string): Promise<Napkin | null> {
        // Fetch from both in parallel
        const [localNapkin, cloudNapkin] = await Promise.all([
            this.local.getNapkin(id),
            this.isAuthenticated ? this.cloud.getNapkin(id).catch(() => null) : Promise.resolve(null)
        ]);

        if (!localNapkin && !cloudNapkin) return null;
        if (!localNapkin) return cloudNapkin;
        if (!cloudNapkin) return localNapkin;

        // Both exist, pick the fresher one
        return this.isNewer(cloudNapkin, localNapkin) ? cloudNapkin : localNapkin;
    }

    async createNapkin(): Promise<Napkin> {
        // If authenticated, create a cloud-ready object, otherwise local
        if (this.isAuthenticated) {
            return await this.cloud.createNapkin();
        }
        return await this.local.createNapkin();
    }

    async deleteNapkin(id: string): Promise<void> {
        // Delete from local and cloud (if possible)
        await this.local.deleteNapkin(id);
        if (this.isAuthenticated) {
            try {
                await this.cloud.deleteNapkin(id);
            } catch (error) {
                console.error("Failed to delete from cloud:", error);
            }
        }
    }
}
