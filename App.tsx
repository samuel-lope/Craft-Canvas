import React, { useState } from 'react';
import { Shape, Circle, Rectangle } from './types';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import { Header } from './components/Header';

const App: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  
  const addShape = (shapeType: 'circle' | 'rectangle') => {
    const newShape = {
      id: crypto.randomUUID(),
      x: Math.random() * 400 + 50, // Random position within canvas bounds
      y: Math.random() * 300 + 50,
      fill: getRandomColor(),
      stroke: '#1f2937', // A dark stroke for contrast
    };

    if (shapeType === 'circle') {
      const circle: Circle = {
        ...newShape,
        type: 'circle',
        radius: 30,
      };
      setShapes(prevShapes => [...prevShapes, circle]);
    } else {
      const rectangle: Rectangle = {
        ...newShape,
        type: 'rectangle',
        width: 80,
        height: 50,
      };
      setShapes(prevShapes => [...prevShapes, rectangle]);
    }
  };

  const handleAddCircle = () => addShape('circle');
  const handleAddRectangle = () => addShape('rectangle');
  const handleClearCanvas = () => setShapes([]);

  return (
    <div className="flex flex-col h-screen bg-gray-800 font-sans">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <Toolbar 
          onAddCircle={handleAddCircle} 
          onAddRectangle={handleAddRectangle}
          onClear={handleClearCanvas}
        />
        <main className="flex-grow p-4 md:p-6 bg-gray-900 overflow-auto">
          <Canvas shapes={shapes} />
        </main>
      </div>
    </div>
  );
};

export default App;