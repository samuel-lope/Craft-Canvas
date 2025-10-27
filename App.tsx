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
          movingAverageWindow: 10
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
      const shapeToUpdate = prevData.objects.find(s => s.id === shapeId);
      if (!shapeToUpdate) return prevData;
  
      const newShape = { ...shapeToUpdate, ...updatedProperties };
      let newObjects = prevData.objects.map(s => (s.id === shapeId ? newShape : s));
      
      if (newShape.type === 'slider' && 'value' in updatedProperties) {
        const slider = newShape as Slider;
        if (slider.targetId && slider.targetProperty) {
          newObjects = newObjects.map(obj => {
            if (obj.id === slider.targetId) {
               const newTarget = { ...obj, [slider.targetProperty]: slider.value };
               return newTarget;
            }
            return obj;
          });
        }
      }
      
      return { ...prevData, objects: newObjects };
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
