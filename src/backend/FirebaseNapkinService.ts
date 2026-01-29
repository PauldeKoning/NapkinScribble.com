import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase-db';
import { auth } from '../lib/firebase-auth';
import { StorageLocation, type Napkin } from '../types';
import type { NapkinStorage } from './NapkinStorage';

export class FirebaseNapkinService implements NapkinStorage {
    private collectionName = 'napkins';

    private get userId() {
        return auth.currentUser?.uid;
    }

    async saveNapkin(napkin: Napkin): Promise<void> {
        if (!this.userId) throw new Error('User must be authenticated to save to Firebase');

        const docRef = doc(db, this.collectionName, napkin.id);

        // Ensure the napkin has the userId before saving
        const dataToSave = {
            ...napkin,
            userId: this.userId,
            storage: StorageLocation.Firebase,
            // We use standard ISO strings for consistency with the LocalStorage service structure,
            // but we could also use Firestore Timestamps if preferred.
            lastSavedAt: new Date().toISOString()
        };

        await setDoc(docRef, dataToSave, { merge: true });
    }

    async getNapkins(): Promise<Napkin[]> {
        if (!this.userId) return [];

        const q = query(
            collection(db, this.collectionName),
            where('userId', '==', this.userId),
            orderBy('lastSavedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as Napkin);
    }

    async getNapkin(id: string): Promise<Napkin | null> {
        if (!this.userId) return null;

        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as Napkin;
            // Security check: ensure the napkin belongs to the current user
            // (Standard precaution even with Firestore rules)
            if (data.userId === this.userId) {
                return data;
            }
        }

        return null;
    }

    async createNapkin(): Promise<Napkin> {
        return {
            id: crypto.randomUUID(),
            title: '',
            content: '',
            storage: StorageLocation.Firebase,
            createdAt: new Date().toISOString(),
            lastSavedAt: new Date().toISOString(),
            userId: this.userId // Store the owner's ID
        };
    }

    async deleteNapkin(id: string): Promise<void> {
        if (!this.userId) throw new Error('User must be authenticated to delete from Firebase');

        const docRef = doc(db, this.collectionName, id);
        // We delete it directly. The Firestore rules should prevent unauthorized deletion.
        await deleteDoc(docRef);
    }
}
