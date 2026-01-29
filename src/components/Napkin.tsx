import React, { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { NapkinService } from '../backend/NapkinService';
import { clsx } from 'clsx';
import { useCallback } from 'react';
import { EDITOR_CONFIG } from '../constants/editor';
import { useAutoSave } from '../hooks/useAutoSave';
import { useNapkinLoader } from '../hooks/useNapkinLoader';
import { NapkinActionsMenu } from './NapkinActionsMenu';
import { NapkinToolbar } from './NapkinToolbar';

const Napkin: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [title, setTitle] = useState('');

    // Dynamic document title
    useEffect(() => {
        if (title.trim()) {
            document.title = `${title} | NapkinScribble`;
        } else {
            document.title = "New Scribble | NapkinScribble";
        }
    }, [title]);

    // Sync state with parent layout
    const { setHeaderState } = useOutletContext<{
        setHeaderState: (state: any) => void;
    }>();

    const [showTitleHint, setShowTitleHint] = useState(false);
    const [titleFocused, setTitleFocused] = useState(false);
    const [, setUpdate] = useState(0);
    const titleRef = React.useRef<HTMLTextAreaElement>(null);

    const isInitialLoadRef = useRef(true);

    // Service Instance
    const storageService = React.useMemo(() => new NapkinService(), []);

    // ... rest of useEditor stays same
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2],
                },
            }),
            Placeholder.configure({
                placeholder: EDITOR_CONFIG.PLACEHOLDER_TEXT,
            }),
        ],
        onUpdate: () => setUpdate(s => s + 1),
        onSelectionUpdate: () => setUpdate(s => s + 1),
        onTransaction: () => setUpdate(s => s + 1),
        editorProps: {
            attributes: {
                class: 'prose prose-lg mx-auto focus:outline-none min-h-[50dvh] pb-32 text-primary/90 caret-primary prose-p:my-1 prose-headings:mb-4 prose-headings:mt-8 leading-snug',
            },
            handleKeyDown: (_, event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    setTimeout(() => {
                        if (editor) {
                            editor.chain()
                                .unsetAllMarks()
                                .setParagraph()
                                .run();
                        }
                    }, 0);
                }
                return false;
            }
        },
    });

    const onDataLoaded = useCallback((newTitle: string, _newContent: string) => {
        setTitle(newTitle);
    }, []);

    const { isLoaded } = useNapkinLoader({
        napkinId: id,
        editor,
        storageService,
        isInitialLoadRef,
        onDataLoaded,
    });

    // Auto-save hook (after editor is defined and isLoaded is available)
    const { isSaving, lastSaved } = useAutoSave({
        napkinId: id,
        title,
        editor,
        isLoaded,
        storageService,
        isInitialLoadRef,
    });



    // Title hint animation
    useEffect(() => {
        if (!title) {
            const timer = setTimeout(() => setShowTitleHint(true), EDITOR_CONFIG.TITLE_HINT_DELAY_MS);
            return () => clearTimeout(timer);
        } else {
            setShowTitleHint(false);
        }
    }, [title]);

    // Auto-expand title textarea
    useEffect(() => {
        const textarea = titleRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [title]);



    // Sync header state with parent layout
    useEffect(() => {
        if (id) {
            setHeaderState({
                isSaving,
                lastSaved,
                actions: <NapkinActionsMenu napkinId={id} storageService={storageService} />
            });
        } else {
            setHeaderState({ isSaving: false, lastSaved: null, actions: null });
        }

        // Cleanup header state when unmounting
        return () => setHeaderState({ isSaving: false, lastSaved: null, actions: null });
    }, [id, isSaving, lastSaved, setHeaderState, storageService]);

    if (!isLoaded) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[#FCFBF4]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
        );
    }

    return (
        <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col px-4 pt-4 sm:px-12 md:pt-12">
            {/* Main Content Scrollable Area (Title + Editor) */}
            <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
                {/* Title Input Section */}
                <div className="relative mb-4 sm:mb-6">
                    <textarea
                        ref={titleRef}
                        rows={1}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && editor) {
                                e.preventDefault();
                                editor.chain().focus().run();
                            }
                        }}
                        placeholder="Name your napkin..."
                        className="placeholder:text-primary/30 w-full bg-transparent text-3xl font-bold text-primary focus:outline-none sm:text-5xl resize-none overflow-hidden block"
                        autoFocus
                        onFocus={() => {
                            setTitleFocused(true);
                            if (!title) setShowTitleHint(true);
                        }}
                        onBlur={() => {
                            setTitleFocused(false);
                            setShowTitleHint(false);
                        }}
                    />

                    {/* Animated UX Hint */}
                    <div
                        className={clsx(
                            "pointer-events-none absolute -bottom-4 left-1 text-sm font-medium text-accent transition-all duration-500",
                            showTitleHint && !title ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                        )}
                    >
                        Give your idea a name to save it
                    </div>
                </div>

                <EditorContent editor={editor} />
            </div>

            {/* Formatting Toolbar (Sticky Bottom) */}
            <NapkinToolbar editor={editor} isVisible={!titleFocused} />

        </div>
    );
};

export default Napkin;
