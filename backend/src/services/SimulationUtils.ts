import { PendulumOptions } from '@src/models/SimulationTypes';

export const calculatePosition = (angle: number, options: PendulumOptions) => {
  if (angle === 0)
    return { x: options.anchor.x, y: options.anchor.y + options.length };
  return {
    x:
      options.anchor.x +
      (angle < 0 ? -1 : 1) * Math.sin(Math.abs(angle)) * options.length,
    y: options.anchor.y + Math.cos(Math.abs(angle)) * options.length,
  };
};
