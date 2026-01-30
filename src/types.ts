export const StorageLocation = {
    LocalStorage: 'local_storage',
    Firebase: 'firebase'
} as const;

export type StorageLocation = (typeof StorageLocation)[keyof typeof StorageLocation];

export interface Napkin {
    id: string;
    title: string;
    content: string; // HTML string from Tiptap
    storage: StorageLocation;
    createdAt: string; // ISO string
    lastSavedAt: string; // ISO string
    isPublic?: boolean; // Optional: Public link sharing
    userId?: string; // Optional: User ID for Firebase ownership
}
