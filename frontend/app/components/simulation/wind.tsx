import { Arrow, Text } from 'react-konva';
import { SCENE_HEIGHT, SCENE_WIDTH } from '~/common/globals/simulation';
import { useSimulation } from '~/contexts/simulation';

const ARROW_MAX_LENGTH = 0.05;
const ARROW_MIN_LENGTH = 0.02;
const ARROW_POSX = SCENE_WIDTH * 0.06;
const ARROW_POSY = SCENE_HEIGHT * 0.9;

export function Wind() {
  const { options } = useSimulation();

  const arrowLength =
    ARROW_MIN_LENGTH +
    (ARROW_MAX_LENGTH - ARROW_MIN_LENGTH) * (options.wind.velocity / 100);

  return (
    <>
      <Arrow
        points={[
          ARROW_POSX - arrowLength * Math.cos(options.wind.direction),
          ARROW_POSY - arrowLength * Math.sin(options.wind.direction),
          ARROW_POSX + arrowLength * Math.cos(options.wind.direction),
          ARROW_POSY + arrowLength * Math.sin(options.wind.direction),
        ]}
        pointerWidth={arrowLength * 0.4}
        pointerLength={arrowLength * 0.2}
        stroke="#98b7ed"
        strokeWidth={0.01}
      />
      <Text
        text={options.wind.velocity.toFixed(0) + ' km/h'}
        x={ARROW_POSX + ARROW_MAX_LENGTH}
        y={ARROW_POSY + 0.016 - 0.008}
        fontSize={0.02}
        align="left"
        width={0.1}
        height={0.016}
        fill="white"
      />
      <Text
        text={((options.wind.direction * 180) / Math.PI).toFixed(0) + '°'}
        x={ARROW_POSX + ARROW_MAX_LENGTH}
        y={ARROW_POSY - 0.016 - 0.008}
        fontSize={0.02}
        align="left"
        width={0.1}
        height={0.016}
        fill="white"
      />
    </>
  );
}
