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
}


export type Shape = Circle | Rectangle | Slider;

export interface AppData {
  theme: {
    name: string;
    backgroundColor: string;
  };
  objects: Shape[];
}
