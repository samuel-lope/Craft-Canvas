export interface CollisionHandler {
  cor: string;
}

export interface CollisionHandlers {
  onCollision: CollisionHandler;
  onNoCollision: CollisionHandler;
}

export interface Linha {
  espessura: number;
  cor: string;
}

export interface BaseShape {
  id: string;
  type: 'circulo' | 'retangulo';
  nome: string;
  view: number;
  x: number;
  y: number;
  reactsToCollision: boolean;
  isObstacle: boolean;
  collisionHandlers: CollisionHandlers;
  linha: Linha;
}

export interface Circle extends BaseShape {
  type: 'circulo';
  diametro: number;
}

export interface Rectangle extends BaseShape {
  type: 'retangulo';
  largura: number;
  altura: number;
  rotation: number;
}

export interface Slider {
  id: string;
  type: 'slider';
  nome: string;
  view: number;
  x: number;
  y: number;
  value: number;
  targetId: string;
  targetProperty: string;
  min: number;
  max: number;
  inheritedSliderId: string | null;
  useMovingAverage: boolean;
  movingAverageWindow: number;
  showLabel: boolean;
}

export interface ProgrammingLine {
    targetObjectId: string;
    property: string;
    value: any;
    ordem: number;
}

export interface Programming {
    id: string;
    type: 'programming';
    nome: string;
    view: number;
    x: number;
    y: number;
    width: number;
    height: number;
    executionMode: 'auto' | 'manual';
    autoInterval: number;
    manualTriggerId: string | null;
    linhas: ProgrammingLine[];
}

export interface Button {
  id: string;
  type: 'button';
  nome: string;
  view: number;
  x: number;
  y: number;
  targetId: string;
  targetProperty: string;
  valueOn: string;
  valueOff: string;
  currentState: 0 | 1;
}

export interface InputMapping {
  pin: number;
  mode: 'Analog' | 'Digital';
  targetId: string;
  property: string;
  min: number;
  max: number;
  adcBits: number;
  adcMax: number;
}

export interface OutputMapping {
  sourceId: string;
  property: string;
  pin: number;
  mode: 'Digital' | 'PWM';
}

export interface Firmata {
  id: string;
  type: 'firmata';
  nome: string;
  view: number;
  x: number;
  y: number;
  connectionStatus?: 'disconnected' | 'connecting' | 'connected' | 'error';
  mappings: {
    inputs: InputMapping[];
    outputs: OutputMapping[];
  };
}


export type Shape = Circle | Rectangle | Slider | Programming | Button | Firmata;

export interface AppData {
  theme: {
    name: string;
    backgroundColor: string;
  };
  objects: Shape[];
}