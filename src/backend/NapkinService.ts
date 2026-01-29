import { LocalStorageNapkinService } from './LocalStorageNapkinService';
import { FirebaseNapkinCache } from './FirebaseNapkinCache';
import { StorageLocation, type Napkin } from '../types';
import type { NapkinStorage } from './NapkinStorage';
import { auth } from '../lib/firebase-auth';

// Shared instance to persist cache across navigation/renders
const sharedCloudCache = new FirebaseNapkinCache();

// Clear cache on auth changes
auth.onAuthStateChanged(() => {
    sharedCloudCache.clear();
});

export class NapkinService implements NapkinStorage {
    private local = new LocalStorageNapkinService();
    private cloud = sharedCloudCache;

    private get isAuthenticated() {
        return !!auth.currentUser;
    }

    private isNewer(a: Napkin, b: Napkin, aGracePeriodMs: number = 50, bGracePeriodMs: number = 0): boolean {
        // Add a small grace period to overwrite local with cloud if they are very close
        return (new Date(a.lastSavedAt).getTime() + aGracePeriodMs) > new Date(b.lastSavedAt).getTime() + bGracePeriodMs;
    }

    private isSame(a: Napkin, b: Napkin): boolean {
        return a.lastSavedAt === b.lastSavedAt;
    }

    async saveNapkin(napkin: Napkin): Promise<Napkin> {
        // Always save to local for speed and offline support
        const localNapkin = await this.local.saveNapkin(napkin);

        // If authenticated, also save to cloud
        if (this.isAuthenticated) {
            try {
                return await this.cloud.saveNapkin(napkin);
            } catch (error) {
                console.error("Failed to save to cloud:", error);
                // We don't throw here because local save succeeded
            }
        }

        return localNapkin;
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
        //const combined = new Map<string, Napkin>();
        const combined = new Map<string, Napkin>();

        for (const n of localNapkins) {
            if (!this.isAuthenticated) {
                // Fallback to local if not authenticated
                combined.set(n.id, n);
                continue;
            }

            // If user is authenticated, sync napkins with cloud
            const cloudNapkin = cloudNapkins.find(cN => cN.id === n.id);

            // Sync all local napkins that do not exist on cloud

            if (!cloudNapkin) {
                console.log('Local does not exist on cloud for: ' + n.title);
                const syncedNapkin = await this.cloud.saveNapkin(n);
                combined.set(syncedNapkin.id, syncedNapkin);
                continue;
            }

            // If date is same, continue
            if (this.isSame(cloudNapkin, n)) {
                continue;
            }

            // If local is newer than cloud
            if (!this.isNewer(cloudNapkin, n)) {
                console.log('Local is newer for: ' + n.title);
                const syncedNapkin = await this.cloud.saveNapkin(n);
                combined.set(syncedNapkin.id, syncedNapkin);
                continue;
            } else if (this.isNewer(cloudNapkin, n)) {
                // If cloud is newer than local
                console.log('Cloud is newer for:' + n.title);
                const syncedNapkin = await this.local.saveNapkin(cloudNapkin);
                combined.set(syncedNapkin.id, syncedNapkin);
            }
        }

        // Add cloud napkins
        cloudNapkins.forEach(cN => {
            const existing = combined.get(cN.id);
            if (!existing) {
                combined.set(cN.id, cN);
            }
        });

        const result = Array.from(combined.values());
        // Sort by createdAt descending
        return result.sort((a, b) => new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime());
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
