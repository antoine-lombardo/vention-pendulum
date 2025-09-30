import type { KonvaEventObject } from 'konva/lib/Node';
import { Circle, Layer, Line, Stage, Star, Text } from 'react-konva';
import { ANCHOR_LINE_Y } from '~/common/globals/simulation';
import { useSimulation } from '~/contexts/simulation';

export function meta() {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

const STAGE_WIDTH = 1000;
const STAGE_HEIGHT = 600;
const MULTIPLIER = 1000;

const handleMouseOver = (e: KonvaEventObject<MouseEvent>) => {
  const stage = e.target.getStage();
  if (!stage) return;
  stage.container().style.cursor = 'move';
};

const handleMouseOut = (e: KonvaEventObject<MouseEvent>) => {
  const stage = e.target.getStage();
  if (!stage) return;
  stage.container().style.cursor = 'default';
};

export default function Home() {
  const {
    isReady,
    states,
    options,
    start,
    stop,
    pause,
    resume,
    setPosition,
    setAnchor,
  } = useSimulation();

  if (!isReady) return null;

  const isState = (state: string): boolean => {
    return states.every((pendulum) => pendulum.status === state);
  };

  const circles = states.map((pendulum, index) => (
    <Circle
      key={index}
      x={pendulum.position.x * MULTIPLIER}
      y={pendulum.position.y * MULTIPLIER}
      radius={30}
      fill="#7e98c4"
      draggable={isState('idle')}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onDragMove={(e) => {
        const boundedPosition = {
          x: Math.max(0, Math.min(e.target.x(), STAGE_WIDTH)),
          y: Math.max(ANCHOR_LINE_Y * MULTIPLIER, e.target.y()),
        };
        e.target.setPosition(boundedPosition);
        setPosition(index, {
          x: boundedPosition.x / MULTIPLIER,
          y: boundedPosition.y / MULTIPLIER,
        });
      }}
      shadowColor="black"
      shadowBlur={10}
      shadowOffset={{ x: 10, y: 10 }}
      shadowOpacity={0.5}
    />
  ));

  const arms = states.map((pendulum, index) => (
    <Line
      key={index}
      points={[
        options.pendulums[index].anchor.x * MULTIPLIER,
        options.pendulums[index].anchor.y * MULTIPLIER,
        pendulum.position.x * MULTIPLIER,
        pendulum.position.y * MULTIPLIER,
      ]}
      stroke="#7e98c4"
      strokeWidth={5}
      shadowColor="black"
      shadowBlur={10}
      shadowOffset={{ x: 10, y: 10 }}
      shadowOpacity={0.5}
    />
  ));

  const anchors = options.pendulums.map((pendulum, index) => (
    <Star
      key={index}
      x={pendulum.anchor.x * MULTIPLIER}
      y={pendulum.anchor.y * MULTIPLIER}
      numPoints={6}
      innerRadius={6}
      outerRadius={8}
      fill="yellow"
      draggable={isState('idle')}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onDragMove={(e) => {
        const boundedPosition = {
          x: Math.max(0, Math.min(e.target.x(), STAGE_WIDTH)),
          y: ANCHOR_LINE_Y * MULTIPLIER,
        };
        e.target.setPosition(boundedPosition);
        setAnchor(index, {
          x: boundedPosition.x / MULTIPLIER,
          y: boundedPosition.y / MULTIPLIER,
        });
      }}
    />
  ));

  const anchorsInfos =
    isState('idle') &&
    options.pendulums.map((pendulum, index) => (
      <Text
        key={index}
        text={pendulum.anchor.x.toFixed(2) + ' m'}
        x={pendulum.anchor.x * MULTIPLIER - 50}
        y={pendulum.anchor.y * MULTIPLIER - 30}
        fontSize={16}
        align="center"
        width={100}
        fill="white"
      />
    ));

  const lengthsInfos =
    isState('idle') &&
    options.pendulums.map((pendulum, index) => (
      <Text
        key={index}
        text={pendulum.length.toFixed(2) + ' m'}
        x={
          (pendulum.anchor.x +
            (states[index].position.x - pendulum.anchor.x) / 2) *
            MULTIPLIER -
          50
        }
        y={
          (pendulum.anchor.y +
            (states[index].position.y - pendulum.anchor.y) / 2) *
            MULTIPLIER -
          8
        }
        fontSize={16}
        align="center"
        width={100}
        height={16}
        fill="white"
      />
    ));

  const anglesInfos =
    isState('idle') &&
    options.pendulums.map((pendulum, index) => (
      <Text
        key={index}
        text={((pendulum.angle * 180) / Math.PI).toFixed(2) + '°'}
        x={
          pendulum.anchor.x * MULTIPLIER +
          (pendulum.angle < 0 ? -1 : 1) * 40 -
          50
        }
        y={pendulum.anchor.y + 60}
        fontSize={16}
        align="center"
        width={100}
        height={16}
        fill="white"
      />
    ));

  return (
    <div className="bg-[#1e293b] p-4 text-white">
      <button onClick={start} disabled={!isState('idle') && !isState('error')}>
        Start
      </button>
      <button onClick={stop} disabled={isState('idle') || isState('error')}>
        Stop
      </button>
      <button onClick={pause} disabled={!isState('running')}>
        Pause
      </button>
      <button onClick={resume} disabled={!isState('paused')}>
        Resume
      </button>
      <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
        <Layer>
          <Line
            points={[
              0,
              ANCHOR_LINE_Y * MULTIPLIER,
              STAGE_WIDTH,
              ANCHOR_LINE_Y * MULTIPLIER,
            ]}
            stroke="#050a12"
            strokeWidth={8}
          />
          {arms}
          {circles}
          {anchors}
          {anchorsInfos}
          {lengthsInfos}
          {anglesInfos}
        </Layer>
      </Stage>
    </div>
  );
}
