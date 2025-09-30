import { Text } from 'react-konva';
import { useSimulation } from '~/contexts/simulation';

export function PendulumMass(props: { index: number }) {
  const { states, options } = useSimulation();

  return (
    <Text
      key={props.index}
      text={(options.pendulums[props.index].radius * 100).toFixed(1) + ' kg'}
      x={states[props.index].position.x - 0.05}
      y={
        states[props.index].position.y +
        options.pendulums[props.index].radius +
        0.02 -
        0.008
      }
      fontSize={0.02}
      align="center"
      width={0.1}
      height={0.016}
      fill="white"
    />
  );
}
