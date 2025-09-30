import {
  PendulumOptions,
  SimulationOptions,
} from '@src/models/SimulationTypes';

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

export const calculateAngle = (
  time: number,
  pendulumOptions: PendulumOptions,
  simulationOptions: SimulationOptions,
) => {
  if (time < 0) time = 0;

  let windOffset = 0;
  if (simulationOptions.wind.velocity > 0) {
    const v = simulationOptions.wind.velocity / 3.6; // Wind velocity in m/s
    const p = 0.5 * 1.225 * v; // Wind pressure in N/m^2
    const A = Math.PI * Math.pow(pendulumOptions.radius, 2); // Exposed area (sphere)
    const F = p * A; // Wind force in N
    windOffset =
      (F / ((pendulumOptions.mass / 100) * 9.81)) *
      Math.cos(simulationOptions.wind.direction);
  }

  // Ref: https://www.acs.psu.edu/drussell/Demos/Pendulum/Pendulum.html
  return (
    pendulumOptions.angle *
      Math.cos(Math.sqrt(9.81 / pendulumOptions.length) * time) +
    windOffset
  );
};
