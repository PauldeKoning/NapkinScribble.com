import React from 'react';
import { Link } from 'react-router-dom';

const FrontPage: React.FC = () => {
    React.useEffect(() => {
        document.title = "NapkinScribble - Capture your brilliant ideas instantly";
    }, []);

    return (
        <div className="bg-surface fixed inset-0 flex w-full flex-col items-center justify-center overflow-hidden p-6 font-sans">
            <div className="flex w-full max-w-sm flex-col items-center text-center sm:max-w-2xl">
                {/* Stylized Header */}
                <h1 className="mb-4 text-balance font-handwritten text-6xl font-bold leading-tight text-primary sm:mb-6 sm:whitespace-nowrap sm:text-7xl">
                    NapkinScribble
                </h1>

                {/* Attention Getter */}
                <p className="mb-10 text-balance px-4 text-lg leading-relaxed text-primary/80 sm:px-0 sm:text-2xl">
                    Give your lightbulb moments somewhere to land.
                </p>

                {/* Primary Action Button */}
                <Link
                    to="/napkin"
                    className="bg-primary hover:bg-primary/95 shadow-primary/20 inline-block rounded-full px-8 py-4 text-lg font-semibold text-surface shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 sm:px-10"
                >
                    Start Scribbling
                </Link>

                {/* Subtle Decorative element (Napkin vibe) */}
                <div className="border-accent/10 mt-12 border-t pt-6 sm:mt-16 sm:pt-8">
                    <p className="text-accent/40 text-sm italic">
                        "The best ideas start on a napkin."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FrontPage;
