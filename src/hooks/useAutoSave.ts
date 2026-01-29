import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import type { Editor } from '@tiptap/react';
import { NapkinService } from '../backend/NapkinService';
import { EDITOR_CONFIG } from '../constants/editor';

interface UseAutoSaveOptions {
    napkinId: string | undefined;
    title: string;
    editor: Editor | null;
    isLoaded: boolean;
    storageService: NapkinService;
    isInitialLoadRef: React.MutableRefObject<boolean>;
}

interface UseAutoSaveReturn {
    isSaving: boolean;
    lastSaved: Date | null;
    saveNow: () => void;
}

export function useAutoSave({
    napkinId,
    title,
    editor,
    isLoaded,
    storageService,
    isInitialLoadRef,
}: UseAutoSaveOptions): UseAutoSaveReturn {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const napkinIdRef = useRef<string | null>(napkinId || null);

    // Sync ref when ID changes
    useEffect(() => {
        napkinIdRef.current = napkinId || null;
    }, [napkinId]);

    // Core save function
    const saveNapkin = useDebouncedCallback(
        async (currentTitle: string, currentContent: string) => {
            console.log('Saving napkin...');

            // Don't save if everything is empty
            if (!currentTitle.trim() && editor?.isEmpty) return;

            // Resolve target: Fetch existing or create a new instance
            const currentId = napkinIdRef.current;
            let napkin = currentId ? await storageService.getNapkin(currentId) : null;

            if (!napkin) {
                napkin = await storageService.createNapkin();

                // Update URL to match the new identity
                if (currentId !== napkin.id) {
                    navigate(`/napkin/${napkin.id}`, { replace: true });
                }
            }

            // Apply updates
            napkin.title = currentTitle;
            napkin.content = currentContent;
            napkin.lastSavedAt = new Date().toISOString();

            // Persist
            setIsSaving(true);
            try {
                await storageService.saveNapkin(napkin);
                setLastSaved(new Date());
                window.dispatchEvent(new CustomEvent('napkin-update'));
            } finally {
                setIsSaving(false);
            }
        },
        EDITOR_CONFIG.AUTO_SAVE_DELAY_MS
    );

    // Trigger save on title changes
    useEffect(() => {
        if (!isLoaded || !editor || isInitialLoadRef.current) return;

        setLastSaved(null);
        saveNapkin(title, editor.getHTML());
    }, [title, isLoaded, editor, saveNapkin]);

    // Trigger save on editor content changes
    useEffect(() => {
        if (!editor || !isLoaded) return;

        const handleUpdate = () => {
            if (isInitialLoadRef.current) return;

            setLastSaved(null);
            saveNapkin(title, editor.getHTML());
        };

        editor.on('update', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor, title, isLoaded, saveNapkin]);

    // Cleanup: Cancel pending saves when switching napkins
    useEffect(() => {
        return () => {
            saveNapkin.cancel();
        };
    }, [napkinId, saveNapkin]);

    const saveNow = useCallback(() => {
        if (editor) {
            saveNapkin(title, editor.getHTML());
            saveNapkin.flush();
        }
    }, [title, editor, saveNapkin]);

    return {
        isSaving,
        lastSaved,
        saveNow,
    };
}
