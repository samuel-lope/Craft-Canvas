// Fix: Add manual type definitions for the Web Serial API as they are missing from the project's TypeScript configuration.
// This resolves errors related to 'SerialPort' and 'navigator.serial'.
interface SerialPort extends EventTarget {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
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

// Firmata Command Constants
const SET_PIN_MODE = 0xF4;
const REPORT_ANALOG = 0xC0;
const REPORT_DIGITAL = 0xD0;
const ANALOG_MESSAGE = 0xE0;
const DIGITAL_MESSAGE = 0x90;

interface FirmataConnection {
    port: SerialPort;
    writer: WritableStreamDefaultWriter<Uint8Array>;
    reader: ReadableStreamDefaultReader<Uint8Array>;
    parserState: {
        command: number | null;
        pinOrPort: number | null;
        buffer: number[];
        bytesToCollect: number;
        state: 'idle' | 'collecting';
    };
}

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData>({
    theme: { name: 'default', backgroundColor: '#273322' },
    objects: [],
  });
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<Record<string, number>>({});
  const triggerCooldowns = useRef<Record<string, boolean>>({});
  const firmataConnections = useRef<Map<string, FirmataConnection>>(new Map());
  const digitalPortStates = useRef<Record<string, number[]>>({});
  const lastSentOutputValues = useRef<Record<string, any>>({});
  const appDataRef = useRef(appData);

  useEffect(() => {
    appDataRef.current = appData;
  }, [appData]);

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

  // FIX: `updateShape` is now a stable function that doesn't depend on other callbacks.
  // It focuses solely on updating the state, while propagation/trigger logic is handled separately
  // by callers or effects to avoid stale closures and dependency cycles.
  const updateShape = useCallback((shapeId: string, updatedProperties: Partial<Shape>) => {
    setAppData(prevData => {
        const objects = [...prevData.objects];
        const shapeIndex = objects.findIndex(s => s.id === shapeId);
        if (shapeIndex === -1) return prevData;
        
        objects[shapeIndex] = { ...objects[shapeIndex], ...updatedProperties } as Shape;
        
        return { ...prevData, objects };
    });
  }, []);

  const executeProgrammingStep = useCallback((progId: string, getLinhas: (prog: Programming) => ProgrammingLine[]) => {
      if (triggerCooldowns.current[progId]) return;

      triggerCooldowns.current[progId] = true;
      setTimeout(() => {
          delete triggerCooldowns.current[progId];
      }, 100);

      setExecutionState(prevState => {
          // FIX: Use the appDataRef to ensure the most current state is used for finding the programming object.
          // This prevents stale closures from causing the execution to fail or use outdated data.
          const prog = appDataRef.current.objects.find(o => o.id === progId) as Programming;
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
  }, [updateShape]);

  // A more advanced update handler that also manages propagation and triggers.
  const updateShapeAndPropagate = useCallback((shapeId: string, updatedProperties: Partial<Shape>) => {
    setAppData(prevData => {
        let objects = [...prevData.objects];
        
        const updateQueue: { id: string, props: Partial<Shape> }[] = [{ id: shapeId, props: updatedProperties }];
        const processedIds = new Set<string>();
        const triggeredProgs = new Set<string>();

        while (updateQueue.length > 0) {
            const { id, props } = updateQueue.shift()!;

            if (processedIds.has(id) && !('value' in props || 'currentState' in props)) continue;
            
            const shapeIndex = objects.findIndex(s => s.id === id);
            if (shapeIndex === -1) continue;

            const oldShape = objects[shapeIndex];
            const updatedShape = { ...oldShape, ...props };
            objects[shapeIndex] = updatedShape as Shape;
            processedIds.add(id);

            if (updatedShape.type === 'slider' && 'value' in props) {
                if (updatedShape.targetId && updatedShape.targetProperty) {
                    updateQueue.push({ id: updatedShape.targetId, props: { [updatedShape.targetProperty]: updatedShape.value } });
                }
                objects.forEach(slaveCandidate => {
                    if (slaveCandidate.type === 'slider' && slaveCandidate.inheritedSliderId === updatedShape.id) {
                        const masterSlider = updatedShape;
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

            if (updatedShape.type === 'button' && 'currentState' in props) {
                if (updatedShape.targetId && updatedShape.targetProperty) {
                    const valueToSend = updatedShape.currentState === 1 ? updatedShape.valueOn : updatedShape.valueOff;
                    const parsedValue = parseFloat(valueToSend);
                    if (!isNaN(parsedValue)) {
                       updateQueue.push({ id: updatedShape.targetId, props: { [updatedShape.targetProperty]: parsedValue } });
                    }
                }
            }

            objects.forEach(progCandidate => {
                if (progCandidate.type === 'programming' && progCandidate.executionMode === 'manual' && progCandidate.manualTriggerId === updatedShape.id) {
                    triggeredProgs.add(progCandidate.id);
                }
            });
        }
        
        // Trigger programming blocks outside the update loop.
        triggeredProgs.forEach(progId => {
            const prog = objects.find(o => o.id === progId) as Programming;
            if (prog) {
                 executeProgrammingStep(prog.id, (p) => p.linhas);
            }
        });

        return { ...prevData, objects };
    });
  }, [executeProgrammingStep]);


  useEffect(() => {
    const timers: number[] = [];
    appData.objects.forEach(shape => {
      if (shape.type === 'programming' && shape.executionMode === 'auto' && shape.linhas.length > 0) {
        const timer = window.setInterval(() => {
          executeProgrammingStep(shape.id, (prog) => prog.linhas);
        }, shape.autoInterval);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(window.clearInterval);
    };
  }, [appData.objects, executeProgrammingStep]);


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

    const processFirmataMessage = useCallback((firmataId: string, parserState: FirmataConnection['parserState']) => {
        const firmata = appDataRef.current.objects.find(s => s.id === firmataId);
        if (!firmata || firmata.type !== 'firmata') return;

        const [lsb, msb] = parserState.buffer;
        const value = lsb | (msb << 7);

        if (parserState.command === ANALOG_MESSAGE) {
            const pin = parserState.pinOrPort!;
            const mapping = firmata.mappings.inputs.find(m => m.mode === 'Analog' && m.pin === (pin + 14));
            if (mapping && mapping.targetId && mapping.property) {
                const adcMax = mapping.adcMax || 1023;
                const targetMin = mapping.min;
                const targetMax = mapping.max;
                const range = targetMax - targetMin;
                const mappedValue = targetMin + (value / adcMax) * range;
                updateShapeAndPropagate(mapping.targetId, { [mapping.property]: mappedValue });
            }
        } else if (parserState.command === DIGITAL_MESSAGE) {
            const portNum = parserState.pinOrPort!;
            for (let i = 0; i < 8; i++) {
                const pin = portNum * 8 + i;
                const mapping = firmata.mappings.inputs.find(m => m.mode === 'Digital' && m.pin === pin);
                if (mapping && mapping.targetId && mapping.property) {
                    const pinState = (value >> i) & 0x01;
                    const mappedValue = pinState === 1 ? mapping.max : mapping.min;
                    updateShapeAndPropagate(mapping.targetId, { [mapping.property]: mappedValue });
                }
            }
        }
    }, [updateShapeAndPropagate]);

    const readFromPort = useCallback(async (firmataId: string, connection: FirmataConnection) => {
        while (connection.port.readable) {
            try {
                const { value, done } = await connection.reader.read();
                if (done) break;

                for (const byte of value) {
                    const parser = connection.parserState;
                    if (parser.state === 'idle') {
                        const command = byte & 0xF0;
                        if (command === ANALOG_MESSAGE || command === DIGITAL_MESSAGE) {
                            parser.command = command;
                            parser.pinOrPort = byte & 0x0F;
                            parser.state = 'collecting';
                            parser.bytesToCollect = 2;
                        }
                    } else if (parser.state === 'collecting') {
                        parser.buffer.push(byte);
                        if (parser.buffer.length === parser.bytesToCollect) {
                            processFirmataMessage(firmataId, parser);
                            parser.state = 'idle';
                            parser.buffer = [];
                        }
                    }
                }
            } catch (error) {
                console.error("Error reading from serial port:", error);
                break;
            }
        }
    }, [processFirmataMessage]);

  const handleConnectFirmata = useCallback(async (firmataId: string) => {
    if (firmataConnections.current.has(firmataId)) return;
    updateShape(firmataId, { connectionStatus: 'connecting' });

    try {
        if (!navigator.serial) {
            alert('Web Serial API not supported.');
            throw new Error('Web Serial not supported');
        }
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 57600 });

        const writer = port.writable.getWriter();
        const reader = port.readable.getReader();
        const connection: FirmataConnection = {
            port, writer, reader,
            parserState: { command: null, pinOrPort: null, buffer: [], bytesToCollect: 0, state: 'idle' }
        };
        firmataConnections.current.set(firmataId, connection);
        digitalPortStates.current[firmataId] = Array(16).fill(0);

        const firmata = appData.objects.find(s => s.id === firmataId) as Firmata;
        if (firmata) {
            for (const mapping of firmata.mappings.outputs) {
                const mode = mapping.mode === 'PWM' ? 0x03 : 0x01; // 3 = PWM, 1 = OUTPUT
                await writer.write(new Uint8Array([SET_PIN_MODE, mapping.pin, mode]));
            }
            for (const mapping of firmata.mappings.inputs) {
                if (mapping.mode === 'Analog') {
                    const analogPin = mapping.pin - 14; // A0 is pin 14, firmata uses 0 for A0
                    if (analogPin >= 0) {
                        await writer.write(new Uint8Array([SET_PIN_MODE, mapping.pin, 0x02])); // 2 = ANALOG
                        await writer.write(new Uint8Array([REPORT_ANALOG | analogPin, 1])); // Enable reporting
                    }
                } else { // Digital
                    await writer.write(new Uint8Array([SET_PIN_MODE, mapping.pin, 0x00])); // 0 = INPUT
                    const portNum = Math.floor(mapping.pin / 8);
                    await writer.write(new Uint8Array([REPORT_DIGITAL | portNum, 1])); // Enable reporting for port
                }
            }
        }
        
        updateShape(firmataId, { connectionStatus: 'connected' });
        readFromPort(firmataId, connection);

    } catch (error) {
        console.error('Failed to connect to the serial port:', error);
        updateShape(firmataId, { connectionStatus: 'error' });
        firmataConnections.current.delete(firmataId);
        setTimeout(() => {
            const currentShape = appDataRef.current.objects.find(s => s.id === firmataId);
            if (currentShape?.type === 'firmata' && currentShape.connectionStatus === 'error') {
                 updateShape(firmataId, { connectionStatus: 'disconnected' });
            }
        }, 3000);
    }
  }, [updateShape, appData.objects, readFromPort]);

    useEffect(() => {
        const sendFirmataData = async () => {
            for (const firmata of appData.objects) {
                if (firmata.type !== 'firmata' || firmata.connectionStatus !== 'connected') continue;

                const connection = firmataConnections.current.get(firmata.id);
                if (!connection) continue;

                for (const [index, mapping] of firmata.mappings.outputs.entries()) {
                    if (!mapping.sourceId || !mapping.property) continue;
                    
                    const sourceShape = appData.objects.find(s => s.id === mapping.sourceId);
                    if (!sourceShape) continue;
                    
                    const currentValue = (sourceShape as any)[mapping.property];
                    const key = `${firmata.id}-${index}`;
                    const lastValue = lastSentOutputValues.current[key];

                    if (currentValue !== lastValue) {
                        lastSentOutputValues.current[key] = currentValue;

                        if (mapping.mode === 'PWM') {
                            const sourceMin = (sourceShape as any).min ?? 0;
                            const sourceMax = (sourceShape as any).max ?? 1023;
                            const range = sourceMax - sourceMin;
                            const scaledValue = range === 0 ? 0 : ((currentValue - sourceMin) / range) * 255;
                            const pwmValue = Math.round(Math.max(0, Math.min(255, scaledValue)));
                            const command = new Uint8Array([ANALOG_MESSAGE | mapping.pin, pwmValue & 0x7F, (pwmValue >> 7) & 0x7F]);
                            await connection.writer.write(command);
                        } else { // Digital
                            const digitalValue = currentValue > 0 ? 1 : 0;
                            const portNumber = Math.floor(mapping.pin / 8);
                            const pinInPort = mapping.pin % 8;
                            let portState = digitalPortStates.current[firmata.id]?.[portNumber] ?? 0;
                            
                            if (digitalValue === 1) {
                                portState |= (1 << pinInPort);
                            } else {
                                portState &= ~(1 << pinInPort);
                            }
                            digitalPortStates.current[firmata.id][portNumber] = portState;
                            const command = new Uint8Array([DIGITAL_MESSAGE | portNumber, portState & 0x7F, (portState >> 7) & 0x7F]);
                            await connection.writer.write(command);
                        }
                    }
                }
            }
        };
        sendFirmataData();
    }, [appData.objects]);


  const handleDisconnectFirmata = useCallback(async (firmataId: string) => {
      const connection = firmataConnections.current.get(firmataId);
      if (connection) {
          try {
              await connection.reader.cancel();
              connection.writer.releaseLock();
              await connection.port.close();
          } catch (error) {
              console.error('Error closing the port:', error);
          } finally {
              firmataConnections.current.delete(firmataId);
              delete digitalPortStates.current[firmataId];
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
            onUpdateShape={updateShapeAndPropagate}
            executionState={executionState}
            onConnectFirmata={handleConnectFirmata}
            onDisconnectFirmata={handleDisconnectFirmata}
          />
        </main>
        <PropertiesPanel
            selectedShape={selectedShape}
            shapes={appData.objects}
            onUpdateShape={updateShapeAndPropagate}
            onDeleteShape={deleteShape}
        />
      </div>
    </div>
  );
};

export default App;