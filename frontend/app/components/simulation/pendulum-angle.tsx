import { Text } from 'react-konva';
import { useSimulation } from '~/contexts/simulation';

export function PendulumAngle(props: { index: number }) {
  const { states, options } = useSimulation();

  return (
    <Text
      key={props.index}
      text={((states[props.index].angle * 180) / Math.PI).toFixed(2) + '°'}
      x={
        options.pendulums[props.index].anchor.x +
        (states[props.index].angle < 0 ? -1 : 1) * 0.05 -
        0.05
      }
      y={options.pendulums[props.index].anchor.y + 0.006}
      fontSize={0.02}
      align="center"
      width={0.1}
      height={0.016}
      fill="white"
    />
  );
}
