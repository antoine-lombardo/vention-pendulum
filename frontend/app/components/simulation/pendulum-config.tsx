import { useSimulation } from '~/contexts/simulation';
import RangeSlider from '../ui/RangeSlider';
import {
  ANCHOR_LINE_Y,
  MASS_RADIUS_RATIO,
  PENDULUM_COLORS,
  SCENE_HEIGHT,
} from '~/common/globals/simulation';
import { PendulumStatus } from '~/contexts/simulation/types';

export function PendulumConfig(props: { index: number }) {
  const { options, setAnchor, setAngle, setLength, setMass, getCommonStatus } =
    useSimulation();

  const isDisabled = getCommonStatus() !== PendulumStatus.IDLE;

  return (
    <div className="flex flex-col gap-1">
      <RangeSlider
        label="Anchor"
        value={options.pendulums[props.index].anchor.x}
        onValueChange={(value) => {
          setAnchor(props.index, { x: value, y: ANCHOR_LINE_Y });
          setAngle(props.index, options.pendulums[props.index].angle);
        }}
        showValue
        unit="m"
        min={0}
        max={1}
        step={0.01}
        decimals={2}
        color={PENDULUM_COLORS[props.index]}
        disabled={isDisabled}
      />

      <RangeSlider
        label="Angle"
        value={(options.pendulums[props.index].angle * 180) / Math.PI}
        onValueChange={(value) =>
          setAngle(props.index, (value * Math.PI) / 180)
        }
        showValue
        unit="°"
        min={-90}
        max={90}
        step={0.1}
        decimals={1}
        color={PENDULUM_COLORS[props.index]}
        disabled={isDisabled}
      />

      <RangeSlider
        label="Length"
        value={options.pendulums[props.index].length}
        onValueChange={(value) => setLength(props.index, value)}
        showValue
        unit="m"
        min={0.01}
        max={SCENE_HEIGHT}
        step={0.01}
        decimals={2}
        color={PENDULUM_COLORS[props.index]}
        disabled={isDisabled}
      />

      <RangeSlider
        label="Mass"
        value={options.pendulums[props.index].radius * MASS_RADIUS_RATIO * 1000}
        onValueChange={(value) => setMass(props.index, value / 1000)}
        showValue
        unit="g"
        min={100}
        max={1000}
        step={10}
        decimals={0}
        color={PENDULUM_COLORS[props.index]}
        disabled={isDisabled}
      />
    </div>
  );
}
