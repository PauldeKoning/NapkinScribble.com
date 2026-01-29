import React, { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { NapkinService } from '../backend/NapkinService';
import { EDITOR_CONFIG } from '../constants/editor';

interface UseNapkinLoaderOptions {
    napkinId: string | undefined;
    editor: Editor | null;
    storageService: NapkinService;
    isInitialLoadRef: React.MutableRefObject<boolean>;
    onDataLoaded: (title: string, content: string) => void;
}

interface UseNapkinLoaderReturn {
    isLoaded: boolean;
    loadNapkin: (suppressLoadingState?: boolean) => Promise<void>;
}

export function useNapkinLoader({
    napkinId,
    editor,
    storageService,
    isInitialLoadRef,
    onDataLoaded,
}: UseNapkinLoaderOptions): UseNapkinLoaderReturn {
    const [isLoaded, setIsLoaded] = useState(false);

    const loadNapkin = useCallback(
        async (suppressLoadingState = false) => {
            if (!suppressLoadingState) setIsLoaded(false);
            isInitialLoadRef.current = true;

            if (napkinId) {
                const napkin = await storageService.getNapkin(napkinId);
                if (napkin) {
                    onDataLoaded(napkin.title, napkin.content);

                    if (editor && napkin.content !== editor.getHTML()) {
                        editor.commands.setContent(napkin.content);
                    }
                }
            } else {
                onDataLoaded('', '');
                if (editor) {
                    editor.commands.setContent('');
                }
            }

            setIsLoaded(true);
            setTimeout(() => {
                isInitialLoadRef.current = false;
            }, EDITOR_CONFIG.INITIAL_LOAD_DELAY_MS);
        },
        [napkinId, editor, storageService, onDataLoaded, isInitialLoadRef]
    );

    // Initial load when ID or editor is ready
    useEffect(() => {
        if (editor) {
            loadNapkin();
        }
    }, [napkinId, editor, loadNapkin]);

    // Handle tab focus / visibility refresh
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && napkinId && editor) {
                console.log('[Sync] Tab focused, refreshing content...');
                loadNapkin(true);
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [napkinId, editor, loadNapkin]);

    return {
        isLoaded,
        loadNapkin,
    };
}
