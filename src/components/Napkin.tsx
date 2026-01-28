import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { NapkinService } from '../backend/NapkinService';
import { useAuth } from '../contexts/AuthContext';
import { Bold, Italic, Type, MoreHorizontal, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useEditorState } from '@tiptap/react'

const Napkin: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    // We use a ref to hold the current ID so our auto-save logic always has the latest execution context
    // without needing to be re-created on every render.
    const napkinIdRef = useRef<string | null>(id || null);

    const [showTitleHint, setShowTitleHint] = useState(false);
    const [titleFocused, setTitleFocused] = useState(false);
    const [, setUpdate] = useState(0);
    const titleRef = React.useRef<HTMLTextAreaElement>(null);

    const [showActions, setShowActions] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Service Instance
    const storageService = React.useMemo(() => new NapkinService(), []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowActions(false);
                setConfirmDelete(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset menu state when switching napkins
    useEffect(() => {
        setShowActions(false);
        setConfirmDelete(false);
    }, [id]);
    // ... rest of useEditor stays same
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2],
                },
            }),
            Placeholder.configure({
                placeholder: 'Start scribbling... Maybe a startup idea, a feature note, or just a grocery list?',
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

    const editorState = useEditorState({
        editor: editor,
        selector: ({ editor }) => {
            if (!editor) return null

            return {
                isEditable: editor.isEditable,
                isBold: editor.isActive('bold'),
                isItalic: editor.isActive('italic'),
                isHeading: editor.isActive('heading', { level: 2 }),
            }
        },
    });


    // Sync ref when ID changes
    useEffect(() => {
        napkinIdRef.current = id || null;
    }, [id]);

    // Load Napkin Logic
    useEffect(() => {
        const loadNapkin = async () => {
            if (id) {
                const napkin = await storageService.getNapkin(id);
                if (napkin) {
                    setTitle(napkin.title);
                    editor?.commands.setContent(napkin.content);
                }
            } else {
                // Reset for new napkin
                setTitle('');
                editor?.commands.setContent('');
                napkinIdRef.current = null;
            }
            setIsLoaded(true);
        };

        if (editor) {
            loadNapkin();
        }
    }, [id, editor, storageService, user]);

    // Auto-Save Logic
    const saveNapkin = useDebouncedCallback(async (currentTitle: string, currentContent: string) => {
        // 1. Validation: Don't save if everything is empty
        if (!currentTitle.trim() && editor?.isEmpty) return;

        // 2. Resolve target: Fetch existing or create a new instance
        const currentId = napkinIdRef.current;
        let napkin = currentId ? await storageService.getNapkin(currentId) : null;

        if (!napkin) {
            napkin = await storageService.createNapkin();

            // If this is a brand new napkin or if the ID was missing/invalid, 
            // update the URL to match the new identity.
            if (currentId !== napkin.id) {
                navigate(`/napkin/${napkin.id}`, { replace: true });
            }
        }

        // 3. Apply updates
        napkin.title = currentTitle;
        napkin.content = currentContent;
        napkin.lastSavedAt = new Date().toISOString();

        // 4. Persist
        await storageService.saveNapkin(napkin);
    }, 1000);

    // Trigger save on changes
    useEffect(() => {
        if (!isLoaded || !editor) return;

        const content = editor.getHTML();
        saveNapkin(title, content);

    }, [title, editor?.state.doc.content.size, saveNapkin, isLoaded]); // simplistic dependency on content size or just editor update

    // Better way for Tiptap content update:
    useEffect(() => {
        if (!editor || !isLoaded) return;

        const handleUpdate = () => {
            saveNapkin(title, editor.getHTML());
        };

        editor.on('update', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
        }
    }, [editor, title, isLoaded, saveNapkin]);

    // Allow title changes to trigger save too
    useEffect(() => {
        if (isLoaded && editor) {
            saveNapkin(title, editor.getHTML());
        }
    }, [title, isLoaded]);


    // UX Hint Logic
    useEffect(() => {
        if (!title) {
            const timer = setTimeout(() => setShowTitleHint(true), 500);
            return () => clearTimeout(timer);
        } else {
            setShowTitleHint(false);
        }
    }, [title]);

    const handleDelete = async () => {
        if (id) {
            await storageService.deleteNapkin(id);
            navigate('/napkin', { replace: true });
        }
    };

    return (
        <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col px-4 pt-4 sm:px-12 md:pt-12">
            {/* Top right actions */}
            {id && (
                <div className="absolute right-4 top-4 z-20 md:right-8 md:top-8" ref={menuRef}>
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="text-primary/40 hover:bg-black/5 hover:text-primary rounded-full p-2 transition-colors"
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {showActions && (
                        <div className="bg-surface absolute right-0 mt-2 w-48 origin-top-right rounded-2xl p-1 shadow-2xl ring-1 ring-black/5 backdrop-blur-md animate-in fade-in zoom-in duration-200">
                            {!confirmDelete ? (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                >
                                    <Trash2 size={18} />
                                    Delete Scribble
                                </button>
                            ) : (
                                <div className="p-1">
                                    <button
                                        onClick={handleDelete}
                                        className="mb-1 flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-95 shadow-md"
                                    >
                                        Tap again to delete
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(false)}
                                        className="flex w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-medium text-primary/40 hover:bg-black/5"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
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
            <div
                className={clsx(
                    "fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-4 md:bottom-10 md:absolute transition-all duration-300",
                    titleFocused ? "opacity-10 scale-95 pointer-events-none" : "opacity-100 scale-100"
                )}
            >
                {editor && (
                    <div className="flex items-center gap-1 rounded-full bg-surface px-4 py-2 shadow-xl ring-1 ring-black/5 backdrop-blur-md">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={clsx(
                                "rounded-full p-3 transition-all duration-200",
                                editorState?.isBold
                                    ? "bg-primary text-surface shadow-md"
                                    : "text-primary/40 hover:bg-black/5 hover:text-primary"
                            )}
                            title="Bold"
                        >
                            <Bold size={20} strokeWidth={editorState?.isBold ? 3 : 2} />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={clsx(
                                "rounded-full p-3 transition-all duration-200",
                                editorState?.isItalic
                                    ? "bg-primary text-surface shadow-md"
                                    : "text-primary/40 hover:bg-black/5 hover:text-primary"
                            )}
                            title="Italic"
                        >
                            <Italic size={20} strokeWidth={editorState?.isItalic ? 3 : 2} />
                        </button>
                        <div className="mx-2 h-6 w-px bg-gray-200" />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={clsx(
                                "rounded-full p-3 transition-all duration-200",
                                editorState?.isHeading
                                    ? "bg-primary text-surface shadow-md"
                                    : "text-primary/40 hover:bg-black/5 hover:text-primary"
                            )}
                            title="Heading"
                        >
                            <Type size={20} strokeWidth={editorState?.isHeading ? 3 : 2} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Napkin;
