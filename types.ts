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

export type Shape = Circle | Rectangle;

export interface AppData {
  theme: {
    name: string;
    backgroundColor: string;
  };
  objects: Shape[];
}
