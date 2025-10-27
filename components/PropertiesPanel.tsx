import React from 'react';
import { Shape, Circle, Rectangle } from '../types';

interface PropertiesPanelProps {
  selectedShape: Shape | null;
  onUpdateShape: (shapeId: string, updatedProperties: Partial<Shape>) => void;
}

const PropertyInput: React.FC<{ label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; }> = 
({ label, value, onChange, type = 'text' }) => (
    <div className="flex items-center">
        <label className="w-20 text-sm text-gray-400 capitalize">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={onChange}
            className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
    </div>
);


const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedShape, onUpdateShape }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedShape) return;
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
    onUpdateShape(selectedShape.id, { [name]: finalValue } as Partial<Shape>);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedShape) return;
     const newColor = e.target.value;
     const updatedHandlers = {
         ...selectedShape.collisionHandlers,
         onNoCollision: {
             ...selectedShape.collisionHandlers.onNoCollision,
             cor: newColor
         }
     };
     onUpdateShape(selectedShape.id, { collisionHandlers: updatedHandlers });
  }

  return (
    <aside className="w-64 bg-gray-900 p-4 border-l border-gray-700 space-y-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Properties</h2>
      {selectedShape ? (
        <div className="space-y-3">
          <PropertyInput label="Name" name="nome" value={selectedShape.nome} onChange={handleInputChange} />
          <PropertyInput label="X" name="x" value={selectedShape.x} onChange={handleInputChange} type="number" />
          <PropertyInput label="Y" name="y" value={selectedShape.y} onChange={handleInputChange} type="number" />

          {selectedShape.type === 'circulo' && (
             <PropertyInput label="Diameter" name="diametro" value={(selectedShape as Circle).diametro} onChange={handleInputChange} type="number" />
          )}

          {selectedShape.type === 'retangulo' && (
            <>
              <PropertyInput label="Width" name="largura" value={(selectedShape as Rectangle).largura} onChange={handleInputChange} type="number" />
              <PropertyInput label="Height" name="altura" value={(selectedShape as Rectangle).altura} onChange={handleInputChange} type="number" />
              <PropertyInput label="Rotation" name="rotation" value={(selectedShape as Rectangle).rotation} onChange={handleInputChange} type="number" />
            </>
          )}

          <div className="flex items-center">
             <label className="w-20 text-sm text-gray-400 capitalize">Color</label>
             <input
                type="color"
                value={selectedShape.collisionHandlers.onNoCollision.cor}
                onChange={handleColorChange}
                className="w-full h-8 p-1 bg-gray-700 rounded cursor-pointer"
             />
          </div>

        </div>
      ) : (
        <div className="text-center text-gray-500 pt-8">
          <p>No shape selected</p>
        </div>
      )}
    </aside>
  );
};

export default PropertiesPanel;