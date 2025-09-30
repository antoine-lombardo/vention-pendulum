import { useSimulation } from '~/contexts/simulation';
import { PendulumConfig } from './pendulum-config';
import RangeSlider from '../ui/RangeSlider';
import { PendulumStatus } from '~/contexts/simulation/types';

export function SimulationConfig() {
  const { options, setWindVelocity, setWindDirection, getCommonStatus } =
    useSimulation();

  const isDisabled = getCommonStatus() !== PendulumStatus.IDLE;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-6xl bg-[#1e293b] rounded-xl shadow-xl shadow-gray-900 p-4 mt-4 gap-6">
      {options.pendulums.map((_, index) => (
        <div className="flex flex-col gap-2" key={index}>
          <div className="text-lg font-semibold">Pendulum #{index + 1}</div>
          <PendulumConfig index={index} />
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <div className="text-lg font-semibold">Wind</div>
        <RangeSlider
          label="Velocity"
          value={options.wind.velocity}
          onValueChange={(value) => {
            setWindVelocity(value);
          }}
          showValue
          unit="km/h"
          min={0}
          max={100}
          step={1}
          decimals={0}
          color="white"
          disabled={isDisabled}
        />
        <RangeSlider
          label="Direction"
          value={options.wind.direction * (180 / Math.PI)}
          onValueChange={(value) => {
            setWindDirection(value / (180 / Math.PI));
          }}
          showValue
          unit="°"
          min={0}
          max={360}
          step={1}
          color="white"
          decimals={0}
          disabled={isDisabled}
        />
      </div>
    </div>
  );
}
