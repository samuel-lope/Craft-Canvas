// Fix: Add manual type definitions for the Web Serial API as they are missing from the project's TypeScript configuration.
// This resolves errors related to 'SerialPort' and 'navigator.serial'.
interface SerialPort extends EventTarget {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface Serial {
  requestPort(options?: any): Promise<SerialPort>;
}

declare global {
  interface Navigator {
    serial: Serial;
  }
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shape, Circle, Rectangle, AppData, Slider, Programming, ProgrammingLine, Button, Firmata } from './types';
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
  const [executionState, setExecutionState] = useState<Record<string, number>>({});
  const triggerCooldowns = useRef<Record<string, boolean>>({});
  const firmataConnections = useRef<Map<string, SerialPort>>(new Map());


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

  const addShape = (shapeType: 'circulo' | 'retangulo' | 'slider' | 'programming' | 'button' | 'firmata') => {
    const baseProps = {
      id: `${shapeType}_${Date.now()}`,
      nome: shapeType === 'circulo' ? 'Novo Círculo' : shapeType === 'retangulo' ? 'Novo Retângulo' : shapeType === 'slider' ? 'Novo Slider' : shapeType === 'programming' ? 'Código' : shapeType === 'button' ? 'Novo Switch' : 'Firmata',
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
    } else if (shapeType === 'slider') {
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
    } else if (shapeType === 'programming') {
      const programming: Programming = {
        ...baseProps,
        type: 'programming',
        width: 250,
        height: 200,
        executionMode: 'auto',
        autoInterval: 1000,
        manualTriggerId: null,
        linhas: [],
      };
      newShape = programming;
    } else if (shapeType === 'button') {
      const button: Button = {
        ...baseProps,
        type: 'button',
        targetId: '',
        targetProperty: '',
        valueOn: '1',
        valueOff: '0',
        currentState: 0,
      };
      newShape = button;
    } else { // firmata
      const firmata: Firmata = {
        ...baseProps,
        type: 'firmata',
        connectionStatus: 'disconnected',
        mappings: {
          inputs: [],
          outputs: [],
        }
      };
      newShape = firmata;
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

            if (processedIds.has(id) && !('value' in props || 'currentState' in props)) continue;
            
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
                        // This direct update is fine for sliders, as it's the end of this chain.
                        // We will add to queue for consistency and complex interactions later.
                        updateQueue.push({ id: updatedShape.targetId, props: { [updatedShape.targetProperty]: updatedShape.value } });
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

            // 3. Propagate to target (for buttons)
            if (updatedShape.type === 'button' && 'currentState' in props) {
                if (updatedShape.targetId && updatedShape.targetProperty) {
                    const valueToSend = updatedShape.currentState === 1 ? updatedShape.valueOn : updatedShape.valueOff;
                    const parsedValue = parseFloat(valueToSend);
                    if (!isNaN(parsedValue)) {
                       updateQueue.push({ id: updatedShape.targetId, props: { [updatedShape.targetProperty]: parsedValue } });
                    }
                }
            }

            // 4. Trigger manual programming blocks
             objects.forEach(progCandidate => {
                if (progCandidate.type === 'programming' && progCandidate.executionMode === 'manual' && progCandidate.manualTriggerId === updatedShape.id) {
                    executeProgrammingStep(progCandidate.id, (prog) => prog.linhas);
                }
            });
        }
        
        return { ...prevData, objects };
    });
  }, []);

  const executeProgrammingStep = (progId: string, getLinhas: (prog: Programming) => ProgrammingLine[]) => {
      if (triggerCooldowns.current[progId]) return;

      triggerCooldowns.current[progId] = true;
      setTimeout(() => {
          delete triggerCooldowns.current[progId];
      }, 100);

      setExecutionState(prevState => {
          const prog = appData.objects.find(o => o.id === progId) as Programming;
          if (!prog) return prevState;
          
          const linhas = getLinhas(prog);
          if (linhas.length === 0) return prevState;

          const currentOrdem = prevState[progId] || 0;
          const nextOrdem = (currentOrdem % linhas.length) + 1;
          
          const lineToExecute = linhas.find(l => l.ordem === nextOrdem);
          
          if (lineToExecute) {
              const { targetObjectId, property, value } = lineToExecute;
              if (targetObjectId && property) {
                  // Use a timeout to de-couple the state update from this call
                  setTimeout(() => updateShape(targetObjectId, { [property]: value }), 0);
              }
          }
          return { ...prevState, [progId]: nextOrdem };
      });
  };

  useEffect(() => {
    // FIX: The type for setInterval's return value in a browser environment is `number`, not `NodeJS.Timeout`.
    const timers: number[] = [];
    appData.objects.forEach(shape => {
      if (shape.type === 'programming' && shape.executionMode === 'auto' && shape.linhas.length > 0) {
        const timer = setInterval(() => {
          executeProgrammingStep(shape.id, (prog) => prog.linhas);
        }, shape.autoInterval);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(clearInterval);
    };
  }, [appData.objects]);


  const deleteShape = useCallback((shapeId: string) => {
    setAppData(prevData => ({
      ...prevData,
      objects: prevData.objects.filter(shape => shape.id !== shapeId),
    }));
    if (selectedShapeId === shapeId) {
        setSelectedShapeId(null);
    }
    setExecutionState(prevState => {
        const newState = { ...prevState };
        delete newState[shapeId];
        return newState;
    });
  }, [selectedShapeId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        const target = e.target as HTMLElement;
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName.toUpperCase())) {
          return;
        }
        e.preventDefault();
        deleteShape(selectedShapeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedShapeId, deleteShape]);


  const handleAddCircle = () => addShape('circulo');
  const handleAddRectangle = () => addShape('retangulo');
  const handleAddSlider = () => addShape('slider');
  const handleAddProgramming = () => addShape('programming');
  const handleAddButton = () => addShape('button');
  const handleAddFirmata = () => addShape('firmata');
  const handleClearCanvas = () => {
    setAppData(prevData => ({
        ...prevData,
        objects: [],
    }));
    setSelectedShapeId(null);
    setExecutionState({});
  };

  const handleConnectFirmata = useCallback(async (firmataId: string) => {
    if (firmataConnections.current.has(firmataId)) {
        console.warn('Already connected or connecting.');
        return;
    }

    updateShape(firmataId, { connectionStatus: 'connecting' });

    try {
        if (!navigator.serial) {
            alert('Web Serial API not supported in this browser.');
            updateShape(firmataId, { connectionStatus: 'error' });
            return;
        }

        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 57600 });
        
        firmataConnections.current.set(firmataId, port);
        updateShape(firmataId, { connectionStatus: 'connected' });

    } catch (error) {
        console.error('Failed to connect to the serial port:', error);
        updateShape(firmataId, { connectionStatus: 'error' });
        setTimeout(() => {
            const currentShape = appData.objects.find(s => s.id === firmataId);
            if (currentShape?.type === 'firmata' && currentShape.connectionStatus === 'error') {
                 updateShape(firmataId, { connectionStatus: 'disconnected' });
            }
        }, 3000);
    }
  }, [updateShape, appData.objects]);


  const handleDisconnectFirmata = useCallback(async (firmataId: string) => {
      const port = firmataConnections.current.get(firmataId);
      if (port) {
          try {
              await port.close();
          } catch (error) {
              console.error('Error closing the port:', error);
          } finally {
              firmataConnections.current.delete(firmataId);
              updateShape(firmataId, { connectionStatus: 'disconnected' });
          }
      }
  }, [updateShape]);

  const selectedShape = appData.objects.find(shape => shape.id === selectedShapeId) || null;

  return (
    <div className="flex flex-col h-screen bg-gray-800 font-sans">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <Toolbar 
          onAddCircle={handleAddCircle} 
          onAddRectangle={handleAddRectangle}
          onAddSlider={handleAddSlider}
          onAddProgramming={handleAddProgramming}
          onAddButton={handleAddButton}
          onAddFirmata={handleAddFirmata}
          onClear={handleClearCanvas}
        />
        <main className="flex-grow p-4 md:p-6 bg-gray-900 overflow-auto">
          <Canvas 
            shapes={appData.objects}
            selectedShapeId={selectedShapeId}
            onSelectShape={setSelectedShapeId}
            onUpdateShape={updateShape}
            executionState={executionState}
            onConnectFirmata={handleConnectFirmata}
            onDisconnectFirmata={handleDisconnectFirmata}
          />
        </main>
        <PropertiesPanel
            selectedShape={selectedShape}
            shapes={appData.objects}
            onUpdateShape={updateShape}
            onDeleteShape={deleteShape}
        />
      </div>
    </div>
  );
};

export default App;