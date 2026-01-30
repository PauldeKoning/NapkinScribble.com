import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Trash2, Globe, ShieldOff } from 'lucide-react';
import { NapkinService } from '../backend/NapkinService';

interface NapkinActionsMenuProps {
    napkinId: string;
    isPublic: boolean;
    storageService: NapkinService;
    onShare?: () => void;
}

export const NapkinActionsMenu: React.FC<NapkinActionsMenuProps> = ({ napkinId, isPublic, storageService, onShare }) => {
    const navigate = useNavigate();
    const [showActions, setShowActions] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
    }, [napkinId]);

    const handleDelete = async () => {
        await storageService.deleteNapkin(napkinId);
        window.dispatchEvent(new CustomEvent('napkin-update'));
        navigate('/napkin', { replace: true });
    };

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setShowActions(!showActions)}
                className="text-primary/40 hover:bg-black/5 hover:text-primary rounded-full p-2 transition-colors"
            >
                <MoreHorizontal size={20} />
            </button>

            {showActions && (
                <div className="bg-surface absolute right-0 mt-2 w-48 origin-top-right rounded-2xl p-1 shadow-2xl ring-1 ring-black/5 backdrop-blur-md animate-in fade-in zoom-in duration-200 z-50">
                    {!confirmDelete ? (
                        <>
                            {onShare && (
                                <button
                                    onClick={() => {
                                        onShare();
                                        setShowActions(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-primary/80 transition-colors hover:bg-black/5"
                                >
                                    {isPublic ? (
                                        <>
                                            <ShieldOff size={18} className="text-primary/60" />
                                            Stop Sharing
                                        </>
                                    ) : (
                                        <>
                                            <Globe size={18} className="text-accent" />
                                            Share Scribble
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                                <Trash2 size={18} />
                                Delete Scribble
                            </button>
                        </>
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
    );
};
