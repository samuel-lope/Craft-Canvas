import React from 'react';

interface ToolbarProps {
  onAddCircle: () => void;
  onAddRectangle: () => void;
  onAddSlider: () => void;
  onAddProgramming: () => void;
  onAddButton: () => void;
  onClear: () => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; title: string }> = ({ onClick, children, title }) => (
    <button
        onClick={onClick}
        title={title}
        className="flex flex-col items-center justify-center w-full p-3 text-gray-400 hover:bg-indigo-600 hover:text-white transition-colors duration-200 rounded-lg"
    >
        {children}
        <span className="text-xs mt-1">{title}</span>
    </button>
);


const Toolbar: React.FC<ToolbarProps> = ({ onAddCircle, onAddRectangle, onAddSlider, onAddProgramming, onAddButton, onClear }) => {
  return (
    <aside className="w-24 bg-gray-900 p-3 flex flex-col items-center space-y-4 border-r border-gray-700">
        <div className="w-full space-y-2">
            <ToolbarButton onClick={onAddCircle} title="Circle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </ToolbarButton>

            <ToolbarButton onClick={onAddRectangle} title="Rectangle">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
                </svg>
            </ToolbarButton>
            
            <ToolbarButton onClick={onAddSlider} title="Slider">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
                    <rect x="10" y="9" width="4" height="6" rx="1" stroke="currentColor" />
                </svg>
            </ToolbarButton>
            
            <ToolbarButton onClick={onAddProgramming} title="Code">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            </ToolbarButton>

            <ToolbarButton onClick={onAddButton} title="Switch">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a10 10 0 110-20 10 10 0 010 20zm0-18v2m-6.364 2.636l1.414 1.414M2.227 12h2m2.636 6.364l1.414-1.414M12 18v2m6.364-2.636l-1.414-1.414M19.773 12h-2m-2.636-6.364l-1.414 1.414" />
                </svg>
            </ToolbarButton>
        </div>
        <div className="mt-auto w-full">
             <ToolbarButton onClick={onClear} title="Clear">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </ToolbarButton>
        </div>
    </aside>
  );
};

export default Toolbar;