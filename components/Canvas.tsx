import React from 'react';
import { Shape } from '../types';

interface CanvasProps {
  shapes: Shape[];
}

const Canvas: React.FC<CanvasProps> = ({ shapes }) => {
  return (
    <div className="w-full h-full bg-gray-800 rounded-lg shadow-inner overflow-hidden border border-gray-700">
      <svg width="100%" height="100%" className="cursor-grab active:cursor-grabbing">
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#4a5568" strokeWidth="0.5"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {shapes.map(shape => {
          if (shape.type === 'circle') {
            return (
              <circle
                key={shape.id}
                cx={shape.x}
                cy={shape.y}
                r={shape.radius}
                fill={shape.fill}
                stroke={shape.stroke}
                strokeWidth="2"
                className="transition-transform duration-200 ease-in-out hover:scale-105"
              />
            );
          }
          if (shape.type === 'rectangle') {
            return (
              <rect
                key={shape.id}
                x={shape.x - shape.width / 2}
                y={shape.y - shape.height / 2}
                width={shape.width}
                height={shape.height}
                fill={shape.fill}
                stroke={shape.stroke}
                strokeWidth="2"
                rx="4"
                className="transition-transform duration-200 ease-in-out hover:scale-105"
              />
            );
          }
          return null;
        })}
      </svg>
       {shapes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500">
            <h2 className="text-2xl font-semibold">Canvas is empty</h2>
            <p className="mt-2">Use the toolbar to add shapes.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;