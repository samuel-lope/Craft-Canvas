import React, { useState, useEffect, useCallback } from 'react';
import { Shape, Circle, Rectangle, AppData, Slider } from './types';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import { Header } from './components/Header';
import PropertiesPanel from './components/PropertiesPanel';

const LOCAL_STORAGE_KEY = 'modular-build-data';

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData>({
    theme: { name: 'default', backgroundColor: '#273322' },
    objects: [],
  });
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData: AppData = JSON.parse(savedData);
        setAppData(parsedData);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [appData]);

  const addShape = (shapeType: 'circulo' | 'retangulo' | 'slider') => {
    const baseProps = {
      id: `${shapeType}_${Date.now()}`,
      nome: shapeType === 'circulo' ? 'Novo Círculo' : shapeType === 'retangulo' ? 'Novo Retângulo' : 'Novo Slider',
      view: appData.objects.length,
      x: 250,
      y: 150,
    };

    let newShape: Shape;

    if (shapeType === 'circulo') {
      const circle: Circle = {
        ...baseProps,
        type: 'circulo',
        reactsToCollision: true,
        isObstacle: false,
        collisionHandlers: {
          onCollision: { cor: 'rgba(239, 68, 68, 1)' },
          onNoCollision: { cor: 'rgba(59, 130, 246, 1)' },
        },
        linha: {
          espessura: 1,
          cor: 'rgba(255, 255, 255, 0.1)',
        },
        diametro: 100,
      };
      newShape = circle;
    } else if (shapeType === 'retangulo') {
      const rectangle: Rectangle = {
        ...baseProps,
        type: 'retangulo',
        reactsToCollision: true,
        isObstacle: false,
        collisionHandlers: {
          onCollision: { cor: 'rgba(239, 68, 68, 1)' },
          onNoCollision: { cor: 'rgba(59, 130, 246, 1)' },
        },
        linha: {
          espessura: 1,
          cor: 'rgba(255, 255, 255, 0.1)',
        },
        largura: 150,
        altura: 80,
        rotation: 0,
      };
      newShape = rectangle;
    } else { // slider
      const slider: Slider = {
          ...baseProps,
          type: 'slider',
          value: 0,
          targetId: "",
          targetProperty: "",
          min: 0,
          max: 500,
          inheritedSliderId: null,
          useMovingAverage: false,
          movingAverageWindow: 10,
          showLabel: true,
      };
      newShape = slider;
    }
    
    setAppData(prevData => ({
      ...prevData,
      objects: [...prevData.objects, newShape],
    }));
    setSelectedShapeId(newShape.id);
  };
  
  const updateShape = useCallback((shapeId: string, updatedProperties: Partial<Shape>) => {
    setAppData(prevData => {
        let objects = [...prevData.objects];
        
        const updateQueue: { id: string, props: Partial<Shape> }[] = [{ id: shapeId, props: updatedProperties }];
        const processedIds = new Set<string>();

        while (updateQueue.length > 0) {
            const { id, props } = updateQueue.shift()!;

            // Prevent infinite loops from circular dependencies
            if (processedIds.has(id) && !('value' in props)) continue;
            
            const shapeIndex = objects.findIndex(s => s.id === id);
            if (shapeIndex === -1) continue;

            const oldShape = objects[shapeIndex];
            const updatedShape = { ...oldShape, ...props };
            objects[shapeIndex] = updatedShape;
            processedIds.add(id);

            // 1. Propagate to target (for sliders)
            if (updatedShape.type === 'slider' && 'value' in props) {
                if (updatedShape.targetId && updatedShape.targetProperty) {
                    const targetIndex = objects.findIndex(o => o.id === updatedShape.targetId);
                    if (targetIndex !== -1) {
                        const targetShape = objects[targetIndex];
                        const newTarget = { ...targetShape, [updatedShape.targetProperty]: updatedShape.value };
                        objects[targetIndex] = newTarget;
                    }
                }
            }

            // 2. Propagate to inherited sliders (if this is a master slider)
            if (updatedShape.type === 'slider' && 'value' in props) {
                const masterSlider = updatedShape;
                objects.forEach(slaveCandidate => {
                    if (slaveCandidate.type === 'slider' && slaveCandidate.inheritedSliderId === masterSlider.id) {
                        const slaveSlider = slaveCandidate;
                        const masterRange = masterSlider.max - masterSlider.min;
                        const slaveRange = slaveSlider.max - slaveSlider.min;
                        
                        const newSlaveValue = masterRange === 0
                            ? slaveSlider.min
                            : slaveSlider.min + ((masterSlider.value - masterSlider.min) / masterRange) * slaveRange;
                        
                        if (slaveSlider.value !== newSlaveValue) {
                           updateQueue.push({ id: slaveSlider.id, props: { value: newSlaveValue } });
                        }
                    }
                });
            }
        }
        
        return { ...prevData, objects };
    });
}, []);

  const handleAddCircle = () => addShape('circulo');
  const handleAddRectangle = () => addShape('retangulo');
  const handleAddSlider = () => addShape('slider');
  const handleClearCanvas = () => {
    setAppData(prevData => ({
        ...prevData,
        objects: [],
    }));
    setSelectedShapeId(null);
  };

  const selectedShape = appData.objects.find(shape => shape.id === selectedShapeId) || null;

  return (
    <div className="flex flex-col h-screen bg-gray-800 font-sans">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <Toolbar 
          onAddCircle={handleAddCircle} 
          onAddRectangle={handleAddRectangle}
          onAddSlider={handleAddSlider}
          onClear={handleClearCanvas}
        />
        <main className="flex-grow p-4 md:p-6 bg-gray-900 overflow-auto">
          <Canvas 
            shapes={appData.objects}
            selectedShapeId={selectedShapeId}
            onSelectShape={setSelectedShapeId}
            onUpdateShape={updateShape}
          />
        </main>
        <PropertiesPanel
            selectedShape={selectedShape}
            shapes={appData.objects}
            onUpdateShape={updateShape}
        />
      </div>
    </div>
  );
};

export default App;