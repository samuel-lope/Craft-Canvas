export interface BaseShape {
  id: string;
  x: number;
  y: number;
  fill: string;
  stroke: string;
}

export interface Circle extends BaseShape {
  type: 'circle';
  radius: number;
}

export interface Rectangle extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
}

export type Shape = Circle | Rectangle;