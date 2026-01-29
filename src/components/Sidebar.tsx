import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { PenSquare, X, Cloud, Smartphone, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { NapkinService } from '../backend/NapkinService';
import { StorageLocation, type Napkin } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [recentNapkins, setRecentNapkins] = useState<Napkin[]>([]);
    const { user, signInWithGoogle, signOut } = useAuth();

    // Service Instance
    const storageService = React.useMemo(() => new NapkinService(), []);

    const fetchNapkins = async () => {
        const napkins = await storageService.getNapkins();
        setRecentNapkins(napkins);
    };

    useEffect(() => {
        // If sidebar is not open, don't fetch
        if (!isOpen) return;

        fetchNapkins();

        // Listen for internal update events
        window.addEventListener('napkin-update', fetchNapkins);
        return () => window.removeEventListener('napkin-update', fetchNapkins);
    }, [isOpen, id, user]); // Re-fetch when sidebar opens, ID changes, or user auth state changes

    return (
        <>
            {/* Overlay (Mobile only) */}
            <div
                className={clsx(
                    "bg-primary/20 fixed inset-0 z-40 backdrop-blur-sm transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <aside
                className={clsx(
                    "bg-surface inset-y-0 left-0 z-50 flex flex-col border-gray-200 transition-all duration-300 ease-in-out",
                    // Fixed overlay on mobile, relative push-item on desktop
                    "fixed md:relative",
                    // Desktop: Animate width only. Mobile: Animate transform.
                    isOpen
                        ? "translate-x-0 w-72 border-r shadow-xl md:shadow-none opacity-100"
                        : "w-0 md:w-0 opacity-0 md:opacity-100 -translate-x-full md:translate-x-0 overflow-hidden border-none"
                )}
            >
                {/* Fixed-width wrapper to prevent content reflow during animation */}
                <div className="flex h-full w-72 min-w-[18rem] flex-col">
                    <div className="flex items-center justify-between p-4">
                        <h2 className="font-handwritten text-3xl font-bold text-primary">
                            NapkinScribble
                        </h2>
                        <button
                            onClick={onClose}
                            className="hover:bg-primary/10 rounded-full p-2 text-primary"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2 px-3 py-4">
                        <NavLink
                            onClick={() => {
                                if (window.innerWidth < 768) onClose();
                            }}
                            to="/napkin"
                            end
                            className={({ isActive }) =>
                                clsx(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive && !id // Only active if exact match /napkin (no ID)
                                        ? "bg-primary text-surface"
                                        : "hover:bg-primary/5 text-primary"
                                )
                            }
                        >
                            <PenSquare size={20} />
                            New Scribble
                        </NavLink>

                        <div className="mt-8">
                            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Recent Napkins
                            </h3>

                            <div className="space-y-1">
                                {recentNapkins.length === 0 && (
                                    <p className="px-3 text-xs text-gray-400 italic">No scribbles yet...</p>
                                )}
                                {recentNapkins.slice(0, 10).map((napkin) => (
                                    <button
                                        key={napkin.id}
                                        onClick={() => {
                                            navigate(`/napkin/${napkin.id}`);
                                            if (window.innerWidth < 768) onClose();
                                        }}
                                        className={clsx(
                                            "group flex items-center justify-between hover:bg-primary/5 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                                            id === napkin.id ? "bg-primary/10 text-primary font-semibold" : "text-gray-600"
                                        )}
                                    >
                                        <span className="truncate flex-1">
                                            {napkin.title || "Untitled Scribble"}
                                        </span>
                                        <span className="ml-2 shrink-0 opacity-20 group-hover:opacity-100 transition-opacity" title={napkin.storage === StorageLocation.Firebase ? 'Saved to Cloud' : 'Stored Locally'}>
                                            {napkin.storage === StorageLocation.Firebase ? (
                                                <Cloud size={14} />
                                            ) : (
                                                <Smartphone size={14} />
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </nav>

                    <div className="border-t border-gray-100 p-4">
                        {user ? (
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName || ''} className="h-8 w-8 rounded-full ring-1 ring-primary/10" />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                            {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="overflow-hidden">
                                        <p className="truncate text-sm font-medium text-primary">
                                            {user.displayName || 'Scribbler'}
                                        </p>
                                        <p className="truncate text-xs text-gray-400">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="hover:bg-red-50 rounded-lg p-2 text-primary/40 transition-colors hover:text-red-600"
                                    title="Sign Out"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => signInWithGoogle()}
                                className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-surface transition-all hover:bg-primary/90 active:scale-95 shadow-md"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Sign in with Google
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
