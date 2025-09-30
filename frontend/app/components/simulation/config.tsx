import { useSimulation } from '~/contexts/simulation';
import { PendulumConfig } from './pendulum-config';

export function SimulationConfig() {
  const { options } = useSimulation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-6xl bg-[#1e293b] rounded-xl shadow-xl shadow-gray-900 p-4 mt-4 gap-6">
      {options.pendulums.map((_, index) => (
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold">Pendulum #{index + 1}</div>
          <PendulumConfig index={index} key={index} />
        </div>
      ))}
    </div>
  );
}
