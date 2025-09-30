import { Line } from 'react-konva';
import { PENDULUM_COLORS } from '~/common/globals/simulation';
import { useSimulation } from '~/contexts/simulation';

export function PendulumString(props: { index: number }) {
  const { states, options } = useSimulation();

  return (
    <Line
      key={props.index}
      points={[
        options.pendulums[props.index].anchor.x,
        options.pendulums[props.index].anchor.y,
        states[props.index].position.x,
        states[props.index].position.y,
      ]}
      stroke={PENDULUM_COLORS[props.index]}
      strokeWidth={0.005}
      shadowColor="#111827"
      shadowBlur={0.02}
      shadowOffset={{ x: 0.005, y: 0.005 }}
      shadowOpacity={0.9}
    />
  );
}
