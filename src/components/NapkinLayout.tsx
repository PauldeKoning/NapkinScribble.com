import React, { useState } from 'react';
import { PanelLeft, Check } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { clsx } from 'clsx';

const NapkinLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Header state shared with children via Context
    const [headerState, setHeaderState] = useState<{
        isSaving: boolean;
        lastSaved: Date | null;
        actions?: React.ReactNode;
    }>({
        isSaving: false,
        lastSaved: null
    });

    // Detect if we are in a napkin (not the home page)
    const isNapkinPage = location.pathname.startsWith('/napkin/');

    return (
        <div className="bg-surface flex h-dvh w-full overflow-hidden font-sans">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="relative flex flex-1 flex-col overflow-hidden">
                {/* Unified Header */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="text-primary hover:bg-black/5 rounded-md p-2 transition-colors md:hidden"
                        >
                            <PanelLeft size={24} />
                        </button>

                        {/* Always show desktop toggle if sidebar is NOT persistent, but for now just mobile */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="text-primary/50 hover:text-primary hidden md:block transition-colors"
                            title="Open Sidebar"
                        >
                            <PanelLeft size={24} className={clsx(isSidebarOpen && "opacity-0")} />
                        </button>

                        <span className="font-handwritten text-2xl font-bold text-primary sm:text-3xl">
                            NapkinScribble
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {isNapkinPage && (
                            <div className={clsx(
                                "flex items-center gap-1.5 text-xs font-medium transition-all duration-500",
                                headerState.isSaving ? "text-primary/40 opacity-100" : (headerState.lastSaved ? "text-primary/20 opacity-100" : "opacity-0")
                            )}>
                                {headerState.isSaving ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary/20 border-t-primary/60" />
                                ) : (
                                    <Check size={14} className="text-green-600/40" />
                                )}
                                <span className="hidden sm:inline">
                                    {headerState.isSaving ? 'Saving...' : (headerState.lastSaved ? 'Saved' : '')}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center">
                            {headerState.actions}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-[#FCFBF4]">
                    <Outlet context={{ setHeaderState }} />
                </div>
            </main>
        </div>
    );
};

export default NapkinLayout;
