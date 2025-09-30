import { Text } from 'react-konva';
import { useSimulation } from '~/contexts/simulation';

export function PendulumAnchorPosition(props: { index: number }) {
  const { options } = useSimulation();

  return (
    <Text
      key={props.index}
      text={options.pendulums[props.index].anchor.x.toFixed(2) + ' m'}
      x={options.pendulums[props.index].anchor.x - 0.05}
      y={options.pendulums[props.index].anchor.y - 0.03}
      fontSize={0.02}
      align="center"
      width={0.1}
      fill="white"
    />
  );
}
