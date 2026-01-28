import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Library, PenSquare, X, Cloud, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';
import { LocalStorageNapkinService } from '../backend/LocalStorageNapkinService';
import { StorageLocation, type Napkin } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [recentNapkins, setRecentNapkins] = useState<Napkin[]>([]);

    // Service Instance
    const storageService = React.useMemo(() => new LocalStorageNapkinService(), []);

    const fetchNapkins = async () => {
        const napkins = await storageService.getNapkins();
        setRecentNapkins(napkins);
    };

    useEffect(() => {
        fetchNapkins();

        // Listen for storage events (basic cross-tab sync) 
        // OR simpler: just re-fetch when the sidebar opens or url changes
        window.addEventListener('storage', fetchNapkins);
        return () => window.removeEventListener('storage', fetchNapkins);
    }, [isOpen, id]); // Re-fetch when sidebar opens or ID changes (implies save)

    return (
        <>
            {/* Overlay for mobile */}
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
                    "bg-surface fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:shadow-none",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between p-4">
                    <h2 className="font-handwritten text-3xl font-bold text-primary">
                        NapkinScribble
                    </h2>
                    <button
                        onClick={onClose}
                        className="hover:bg-primary/10 rounded-full p-2 text-primary md:hidden"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 px-3 py-4">
                    <NavLink
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

                    <NavLink
                        to="/napkins"
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors opacity-50 cursor-not-allowed",
                                isActive
                                    ? "bg-primary text-surface"
                                    : "hover:bg-primary/5 text-primary"
                            )
                        }
                        onClick={(e) => e.preventDefault()} // Disabled for now as per requirements
                    >
                        <Library size={20} />
                        Your Napkins
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
                    {/* User Profile / Settings could go here */}
                    <p className="text-xs text-center text-gray-400">
                        Cloud sync coming soon...
                    </p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
