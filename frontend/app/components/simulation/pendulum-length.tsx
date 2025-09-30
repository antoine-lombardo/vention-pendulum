import { Text } from 'react-konva';
import { useSimulation } from '~/contexts/simulation';

export function PendulumLength(props: { index: number }) {
  const { states, options } = useSimulation();

  return (
    <Text
      key={props.index}
      text={options.pendulums[props.index].length.toFixed(2) + ' m'}
      x={
        options.pendulums[props.index].anchor.x +
        (states[props.index].position.x -
          options.pendulums[props.index].anchor.x) /
          2 -
        0.05
      }
      y={
        options.pendulums[props.index].anchor.y +
        (states[props.index].position.y -
          options.pendulums[props.index].anchor.y) /
          2 -
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
