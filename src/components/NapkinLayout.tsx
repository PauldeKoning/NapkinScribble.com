import React, { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const NapkinLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="bg-surface flex h-dvh w-full overflow-hidden font-sans">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="relative flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header / Toggle */}
                <header className="flex h-16 items-center border-b border-gray-100 px-4 md:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-primary hover:bg-primary/5 rounded-md p-2 transition-colors"
                    >
                        <PanelLeft size={24} />
                    </button>
                    <span className="ml-4 font-handwritten text-2xl font-bold text-primary">
                        NapkinScribble
                    </span>
                </header>

                {/* Desktop Toggle (absolute positioned) */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-primary/50 hover:text-primary absolute left-4 top-4 z-10 hidden transition-colors md:block"
                    title="Toggle Sidebar"
                >
                    {/* Logic to hide toggle if sidebar is persistent on desktop could go here, 
               but for now we'll keep it simple or hide it if Sidebar is always visible on desktop */}
                </button>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default NapkinLayout;
