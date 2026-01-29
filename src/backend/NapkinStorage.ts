import type { Napkin } from '../types';

export interface NapkinStorage {
    saveNapkin(napkin: Napkin): Promise<Napkin>;
    getNapkins(): Promise<Napkin[]>;
    getNapkin(id: string): Promise<Napkin | null>;
    createNapkin(): Promise<Napkin>;
    deleteNapkin(id: string): Promise<void>;
}
