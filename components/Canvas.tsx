import React, { useRef, useState, useCallback, MouseEvent } from 'react';
import { Shape, Circle, Rectangle } from '../types';

type Interaction = {
  type: 'move' | 'resize';
  shape: Shape;
  handle?: string;
  offsetX: number;
  offsetY: number;
};

interface CanvasProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onUpdateShape: (id: string, props: Partial<Shape>) => void;
}

const HANDLE_SIZE = 8;

const Canvas: React.FC<CanvasProps> = ({ shapes, selectedShapeId, onSelectShape, onUpdateShape }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);

  const getSVGPoint = (e: MouseEvent | React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  const handleMouseDownOnShape = (e: React.MouseEvent, shape: Shape) => {
    e.stopPropagation();
    onSelectShape(shape.id);
    const { x, y } = getSVGPoint(e);
    setInteraction({
      type: 'move',
      shape,
      offsetX: x - shape.x,
      offsetY: y - shape.y,
    });
  };
  
  const handleMouseDownOnHandle = (e: React.MouseEvent, shape: Shape, handle: string) => {
    e.stopPropagation();
    const { x, y } = getSVGPoint(e);
    setInteraction({ type: 'resize', shape, handle, offsetX: x, offsetY: y });
  };

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!interaction) return;
    const { x, y } = getSVGPoint(e as unknown as MouseEvent);
    const { type, shape, offsetX, offsetY } = interaction;

    if (type === 'move') {
      onUpdateShape(shape.id, { x: x - offsetX, y: y - offsetY });
    } else if (type === 'resize') {
       const { handle } = interaction;
       let { x: newX, y: newY } = shape;
       
       if (shape.type === 'circulo') {
            const dx = x - shape.x;
            const dy = y - shape.y;
            const newRadius = Math.sqrt(dx * dx + dy * dy);
            onUpdateShape(shape.id, { diametro: newRadius * 2 });
       } else if (shape.type === 'retangulo') {
            let { largura, altura } = shape;
            const dx = x - offsetX;
            const dy = y - offsetY;

            if (handle.includes('right')) {
                largura += dx;
                newX += dx / 2;
            }
            if (handle.includes('left')) {
                largura -= dx;
                newX += dx / 2;
            }
            if (handle.includes('bottom')) {
                altura += dy;
                newY += dy / 2;
            }
            if (handle.includes('top')) {
                altura -= dy;
                newY += dy / 2;
            }

            if(largura > 0 && altura > 0) {
                 onUpdateShape(shape.id, { x: newX, y: newY, largura, altura });
                 setInteraction({...interaction, offsetX: x, offsetY: y });
            }
       }
    }
  }, [interaction, onUpdateShape]);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    setInteraction(null);
  }, [handleMouseMove]);
  
  React.useEffect(() => {
    if (interaction) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, handleMouseMove, handleMouseUp]);


  const renderHandles = (shape: Shape) => {
      if (shape.type === 'circulo') {
        const { x, y, diametro } = shape;
        const r = diametro / 2;
        const handles = [
            { id: 'top', cx: x, cy: y - r, cursor: 'ns-resize' },
            { id: 'bottom', cx: x, cy: y + r, cursor: 'ns-resize' },
            { id: 'left', cx: x - r, cy: y, cursor: 'ew-resize' },
            { id: 'right', cx: x + r, cy: y, cursor: 'ew-resize' },
        ];
        return handles.map(h => 
            <circle key={h.id} cx={h.cx} cy={h.cy} r={HANDLE_SIZE/2} fill="white" stroke="#3b82f6" className={`cursor-${h.cursor}`} onMouseDown={e => handleMouseDownOnHandle(e, shape, h.id)} />
        );
      } else if (shape.type === 'retangulo') {
        const { x, y, largura, altura } = shape;
        const halfW = largura / 2;
        const halfH = altura / 2;
        const handles = [
            { id: 'top-left', x: x - halfW, y: y - halfH, cursor: 'nwse-resize' },
            { id: 'top-right', x: x + halfW, y: y - halfH, cursor: 'nesw-resize' },
            { id: 'bottom-left', x: x - halfW, y: y + halfH, cursor: 'nesw-resize' },
            { id: 'bottom-right', x: x + halfW, y: y + halfH, cursor: 'nwse-resize' },
        ];
         return handles.map(h =>
            <rect key={h.id} x={h.x - HANDLE_SIZE/2} y={h.y-HANDLE_SIZE/2} width={HANDLE_SIZE} height={HANDLE_SIZE} fill="white" stroke="#3b82f6" className={`cursor-${h.cursor}`} onMouseDown={e => handleMouseDownOnHandle(e, shape, h.id)} />
         );
      }
      return null;
  };
  
  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  return (
    <div className="w-full h-full bg-gray-800 rounded-lg shadow-inner overflow-hidden border border-gray-700">
      <svg ref={svgRef} width="100%" height="100%" onMouseDown={() => onSelectShape(null)}>
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#4a5568" strokeWidth="0.5"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {shapes.map(shape => {
          const isSelected = shape.id === selectedShapeId;
          if (shape.type === 'circulo') {
            return (
              <circle
                key={shape.id}
                cx={shape.x}
                cy={shape.y}
                r={shape.diametro / 2}
                fill={shape.collisionHandlers.onNoCollision.cor}
                stroke={isSelected ? '#3b82f6' : shape.linha.cor}
                strokeWidth={isSelected ? 2 : shape.linha.espessura}
                onMouseDown={e => handleMouseDownOnShape(e, shape)}
                className="cursor-move"
              />
            );
          }
          if (shape.type === 'retangulo') {
            return (
              <rect
                key={shape.id}
                x={shape.x - shape.largura / 2}
                y={shape.y - shape.altura / 2}
                width={shape.largura}
                height={shape.altura}
                fill={shape.collisionHandlers.onNoCollision.cor}
                stroke={isSelected ? '#3b82f6' : shape.linha.cor}
                strokeWidth={isSelected ? 2 : shape.linha.espessura}
                rx="4"
                transform={`rotate(${shape.rotation} ${shape.x} ${shape.y})`}
                onMouseDown={e => handleMouseDownOnShape(e, shape)}
                className="cursor-move"
              />
            );
          }
          return null;
        })}

        {selectedShape && renderHandles(selectedShape)}
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