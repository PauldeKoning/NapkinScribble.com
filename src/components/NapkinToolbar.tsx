import React from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { Bold, Italic, Type } from 'lucide-react';
import { clsx } from 'clsx';

interface NapkinToolbarProps {
    editor: Editor | null;
    isVisible: boolean;
}

export const NapkinToolbar: React.FC<NapkinToolbarProps> = ({ editor, isVisible }) => {
    const editorState = useEditorState({
        editor: editor,
        selector: ({ editor }) => {
            if (!editor) return null;

            return {
                isEditable: editor.isEditable,
                isBold: editor.isActive('bold'),
                isItalic: editor.isActive('italic'),
                isHeading: editor.isActive('heading', { level: 2 }),
            };
        },
    });

    if (!editor) return null;

    return (
        <div
            className={clsx(
                "fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-4 md:bottom-10 md:absolute transition-all duration-300",
                isVisible ? "opacity-100 scale-100" : "opacity-10 scale-95 pointer-events-none"
            )}
        >
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
        </div>
    );
};
