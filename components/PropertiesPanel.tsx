import React from 'react';
import { Shape, Circle, Rectangle, Slider, Programming, ProgrammingLine } from '../types';

interface PropertiesPanelProps {
  selectedShape: Shape | null;
  shapes: Shape[];
  onUpdateShape: (shapeId: string, updatedProperties: Partial<Shape>) => void;
  onDeleteShape: (shapeId: string) => void;
}

const PropertyInput: React.FC<{ label: string; name: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; }> = 
({ label, name, value, onChange, type = 'text' }) => (
    <div className="flex items-center">
        <label className="w-24 text-sm text-gray-400 capitalize">{label}</label>
        <input 
            type={type}
            name={name}
            value={value} 
            onChange={onChange}
            className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
    </div>
);

const rgbaToHex = (rgba: string): string => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!match) return '#000000';
    
    const toHex = (c: string) => parseInt(c).toString(16).padStart(2, '0');
    
    return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
};

const hexToRgba = (hex: string, alpha = 1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getTargetProperties = (targetShape: Shape | null | undefined): string[] => {
    if (!targetShape) return [];
    const numericKeys: string[] = [];
    for (const key in targetShape) {
        if (typeof (targetShape as any)[key] === 'number') {
            numericKeys.push(key);
        }
    }
    const blacklistedKeys = ['view', 'movingAverageWindow'];
    return numericKeys.filter(key => !blacklistedKeys.includes(key)).sort();
}


const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedShape, shapes, onUpdateShape, onDeleteShape }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!selectedShape) return;
    const { name, value, type } = e.target;
    
    let finalValue: string | number | null | boolean = value;
    if (type === 'number') {
        finalValue = parseFloat(value) || 0;
    }
    if ((name === 'inheritedSliderId' || name === 'manualTriggerId') && value === '') {
      finalValue = null;
    }
    if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
    }

    if (name === 'targetId') {
      onUpdateShape(selectedShape.id, { 
          targetId: value,
          targetProperty: '' 
      } as Partial<Shape>);
    } else {
      onUpdateShape(selectedShape.id, { [name]: finalValue } as Partial<Shape>);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedShape || selectedShape.type === 'slider' || selectedShape.type === 'programming') return;
     const newColor = hexToRgba(e.target.value);
     const updatedHandlers = {
         ...selectedShape.collisionHandlers,
         onNoCollision: {
             ...selectedShape.collisionHandlers.onNoCollision,
             cor: newColor
         }
     };
     onUpdateShape(selectedShape.id, { collisionHandlers: updatedHandlers });
  }

  const handleLinePropertyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedShape || selectedShape.type === 'slider' || selectedShape.type === 'programming') return;
    const { name, value } = e.target;
    const newLinha = {
      ...selectedShape.linha,
      [name]: parseFloat(value) || 0,
    };
    onUpdateShape(selectedShape.id, { linha: newLinha });
  };

  const handleLineColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedShape || selectedShape.type === 'slider' || selectedShape.type === 'programming') return;
    const newColor = hexToRgba(e.target.value);
    const newLinha = {
      ...selectedShape.linha,
      cor: newColor,
    };
    onUpdateShape(selectedShape.id, { linha: newLinha });
  };

  const handleProgrammingLineChange = (index: number, updatedLine: Partial<ProgrammingLine>) => {
    if (selectedShape?.type !== 'programming') return;
    const newLinhas = [...selectedShape.linhas];
    newLinhas[index] = { ...newLinhas[index], ...updatedLine };
    if ('targetObjectId' in updatedLine) {
      newLinhas[index].property = '';
    }
    onUpdateShape(selectedShape.id, { linhas: newLinhas });
  };

  const addProgrammingLine = () => {
    if (selectedShape?.type !== 'programming') return;
    const newLinhas = [...selectedShape.linhas, {
      targetObjectId: '',
      property: '',
      value: 0,
      ordem: selectedShape.linhas.length + 1,
    }];
    onUpdateShape(selectedShape.id, { linhas: newLinhas });
  };
  
  const deleteProgrammingLine = (index: number) => {
    if (selectedShape?.type !== 'programming') return;
    const newLinhas = selectedShape.linhas.filter((_, i) => i !== index)
      .map((line, newIndex) => ({ ...line, ordem: newIndex + 1 }));
    onUpdateShape(selectedShape.id, { linhas: newLinhas });
  };

  const targetShape = selectedShape?.type === 'slider' && selectedShape.targetId 
        ? shapes.find(s => s.id === selectedShape.targetId) 
        : null;

  const sliderTargetProperties = getTargetProperties(targetShape);


  return (
    <aside className="w-72 bg-gray-900 p-4 border-l border-gray-700 space-y-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Properties</h2>
      {selectedShape ? (
        <>
          <div className="space-y-3">
            <PropertyInput label="Name" name="nome" value={selectedShape.nome} onChange={handleInputChange} />
            <PropertyInput label="X" name="x" value={Math.round(selectedShape.x)} onChange={handleInputChange} type="number" />
            <PropertyInput label="Y" name="y" value={Math.round(selectedShape.y)} onChange={handleInputChange} type="number" />

            {selectedShape.type === 'circulo' && (
               <PropertyInput label="Diameter" name="diametro" value={Math.round((selectedShape as Circle).diametro)} onChange={handleInputChange} type="number" />
            )}

            {selectedShape.type === 'retangulo' && (
              <>
                <PropertyInput label="Width" name="largura" value={Math.round((selectedShape as Rectangle).largura)} onChange={handleInputChange} type="number" />
                <PropertyInput label="Height" name="altura" value={Math.round((selectedShape as Rectangle).altura)} onChange={handleInputChange} type="number" />
                <PropertyInput label="Rotation" name="rotation" value={(selectedShape as Rectangle).rotation} onChange={handleInputChange} type="number" />
              </>
            )}

            {selectedShape.type === 'slider' && (
              <>
                  <PropertyInput label="Value" name="value" value={Math.round(selectedShape.value)} onChange={handleInputChange} type="number" />
                  
                  <div className="flex items-center">
                      <label className="w-24 text-sm text-gray-400 capitalize">Target</label>
                      <select
                          name="targetId"
                          value={selectedShape.targetId}
                          onChange={handleInputChange}
                          className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                          <option value="">None</option>
                          {shapes.filter(s => s.id !== selectedShape.id).map(s => (
                              <option key={s.id} value={s.id}>{s.nome}</option>
                          ))}
                      </select>
                  </div>

                  <div className="flex items-center">
                      <label className="w-24 text-sm text-gray-400 capitalize">Property</label>
                      <select
                          name="targetProperty"
                          value={selectedShape.targetProperty}
                          onChange={handleInputChange}
                          disabled={!selectedShape.targetId}
                          className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <option value="">Select...</option>
                          {sliderTargetProperties.map(prop => (
                              <option key={prop} value={prop}>{prop}</option>
                          ))}
                      </select>
                  </div>
                  
                  <div className="flex items-center">
                      <label className="w-24 text-sm text-gray-400 capitalize">Inherit From</label>
                      <select
                          name="inheritedSliderId"
                          value={selectedShape.inheritedSliderId || ''}
                          onChange={handleInputChange}
                          className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                          <option value="">None</option>
                          {shapes.filter(s => s.id !== selectedShape.id && s.type === 'slider').map(s => (
                              <option key={s.id} value={s.id}>{s.nome}</option>
                          ))}
                      </select>
                  </div>

                  <PropertyInput label="Min" name="min" value={selectedShape.min} onChange={handleInputChange} type="number" />
                  <PropertyInput label="Max" name="max" value={selectedShape.max} onChange={handleInputChange} type="number" />
                  
                  <div className="flex items-center">
                      <label className="w-24 text-sm text-gray-400">Show Label</label>
                      <input 
                          type="checkbox"
                          name="showLabel"
                          checked={selectedShape.showLabel}
                          onChange={(e) => onUpdateShape(selectedShape.id, { showLabel: e.target.checked })}
                          className="w-5 h-5 bg-gray-700 text-indigo-500 rounded focus:ring-indigo-500"
                      />
                  </div>

                  <div className="flex items-center">
                      <label className="w-24 text-sm text-gray-400">Use Avg</label>
                      <input 
                          type="checkbox"
                          name="useMovingAverage"
                          checked={selectedShape.useMovingAverage}
                          onChange={(e) => onUpdateShape(selectedShape.id, { useMovingAverage: e.target.checked })}
                          className="w-5 h-5 bg-gray-700 text-indigo-500 rounded focus:ring-indigo-500"
                      />
                  </div>
                  
                  <PropertyInput label="Window" name="movingAverageWindow" value={selectedShape.movingAverageWindow} onChange={handleInputChange} type="number" />
              </>
            )}

            {selectedShape.type === 'programming' && (
                <>
                    <PropertyInput label="Width" name="width" value={Math.round(selectedShape.width)} onChange={handleInputChange} type="number" />
                    <PropertyInput label="Height" name="height" value={Math.round(selectedShape.height)} onChange={handleInputChange} type="number" />

                    <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-400 capitalize">Exec Mode</label>
                        <select name="executionMode" value={selectedShape.executionMode} onChange={handleInputChange} className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="auto">Auto</option>
                            <option value="manual">Manual</option>
                        </select>
                    </div>

                    {selectedShape.executionMode === 'auto' && (
                        <PropertyInput label="Interval (ms)" name="autoInterval" value={selectedShape.autoInterval} onChange={handleInputChange} type="number" />
                    )}

                    {selectedShape.executionMode === 'manual' && (
                        <div className="flex items-center">
                            <label className="w-24 text-sm text-gray-400 capitalize">Trigger</label>
                            <select name="manualTriggerId" value={selectedShape.manualTriggerId || ''} onChange={handleInputChange} className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">None</option>
                                {shapes.filter(s => s.id !== selectedShape.id).map(s => (
                                    <option key={s.id} value={s.id}>{s.nome}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-gray-700">
                        <h3 className="text-md font-semibold text-white">Lines</h3>
                        {selectedShape.linhas.map((line, index) => {
                             const targetShape = shapes.find(s => s.id === line.targetObjectId);
                             const targetProperties = getTargetProperties(targetShape);
                             return (
                                <div key={index} className="p-2 bg-gray-800 rounded space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-400">Line {line.ordem}</span>
                                        <button onClick={() => deleteProgrammingLine(index)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                                    </div>
                                    <select value={line.targetObjectId} onChange={(e) => handleProgrammingLineChange(index, { targetObjectId: e.target.value })} className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm">
                                        <option value="">Select Target...</option>
                                        {shapes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                    </select>
                                    <select value={line.property} onChange={(e) => handleProgrammingLineChange(index, { property: e.target.value })} disabled={!line.targetObjectId} className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm disabled:opacity-50">
                                        <option value="">Select Property...</option>
                                        {targetProperties.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <input type="number" value={line.value} onChange={(e) => handleProgrammingLineChange(index, { value: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm" />
                                </div>
                            );
                        })}
                        <button onClick={addProgrammingLine} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1 px-2 rounded">Add Line</button>
                    </div>
                </>
            )}


            {(selectedShape.type === 'circulo' || selectedShape.type === 'retangulo') && (
              <>
                <div className="flex items-center">
                   <label className="w-24 text-sm text-gray-400 capitalize">Fill Color</label>
                   <input
                      type="color"
                      value={rgbaToHex(selectedShape.collisionHandlers.onNoCollision.cor)}
                      onChange={handleColorChange}
                      className="w-full h-8 p-1 bg-gray-700 border-none rounded cursor-pointer"
                   />
                </div>
                <PropertyInput
                  label="Line Width"
                  name="espessura"
                  value={selectedShape.linha.espessura}
                  onChange={handleLinePropertyChange}
                  type="number"
                />
                <div className="flex items-center">
                  <label className="w-24 text-sm text-gray-400 capitalize">Line Color</label>
                  <input
                    type="color"
                    value={rgbaToHex(selectedShape.linha.cor)}
                    onChange={handleLineColorChange}
                    className="w-full h-8 p-1 bg-gray-700 border-none rounded cursor-pointer"
                  />
                </div>
              </>
            )}

          </div>
          <div className="pt-4 mt-4 border-t border-gray-700">
             <button
                onClick={() => onDeleteShape(selectedShape.id)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 flex items-center justify-center space-x-2"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Shape</span>
             </button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 pt-8">
          <p>No shape selected</p>
        </div>
      )}
    </aside>
  );
};

export default PropertiesPanel;