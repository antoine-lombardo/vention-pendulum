import type { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useState } from 'react';
import { Circle, Layer, Line, Stage, Star, Text } from 'react-konva';
import { ANCHOR_LINE_Y } from '~/common/globals/simulation';
import { useSimulation } from '~/contexts/simulation';
import { PendulumStatus } from '~/contexts/simulation/types';

export function meta() {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

const SCENE_WIDTH = 1.0; // meters
const SCENE_HEIGHT = 0.6; // meters

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

  // State to track current scale and dimensions
  const [stageSize, setStageSize] = useState({
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    scale: 1,
  });

  // Reference to parent container
  const containerRef = useRef(null);

  // Function to handle resize
  const updateSize = () => {
    if (!containerRef.current) return;

    // Get container width
    const containerWidth = containerRef.current.offsetWidth;

    // Calculate scale
    const scale = containerWidth / SCENE_WIDTH;

    // Update state with new dimensions
    setStageSize({
      width: SCENE_WIDTH * scale,
      height: SCENE_HEIGHT * scale,
      scale: scale,
    });
  };

  // Update on mount and when window resizes
  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const isState = (state: PendulumStatus): boolean => {
    return states.every((pendulum) => pendulum.status === state);
  };

  const circles = states.map((pendulum, index) => (
    <Circle
      key={index}
      x={pendulum.position.x}
      y={pendulum.position.y}
      radius={options.pendulums[index].radius}
      fill="#7e98c4"
      draggable={isState(PendulumStatus.IDLE)}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onDragMove={(e) => {
        const boundedPosition = {
          x: Math.max(0, Math.min(e.target.x(), SCENE_WIDTH)),
          y: Math.max(ANCHOR_LINE_Y, e.target.y()),
        };
        e.target.setPosition(boundedPosition);
        setPosition(index, {
          x: boundedPosition.x,
          y: boundedPosition.y,
        });
      }}
      shadowColor="black"
      shadowBlur={0.01}
      shadowOffset={{ x: 0.01, y: 0.01 }}
      shadowOpacity={0.5}
    />
  ));

  const arms = states.map((pendulum, index) => (
    <Line
      key={index}
      points={[
        options.pendulums[index].anchor.x,
        options.pendulums[index].anchor.y,
        pendulum.position.x,
        pendulum.position.y,
      ]}
      stroke="#7e98c4"
      strokeWidth={0.005}
      shadowColor="black"
      shadowBlur={0.01}
      shadowOffset={{ x: 0.01, y: 0.01 }}
      shadowOpacity={0.5}
    />
  ));

  const anchors = options.pendulums.map((pendulum, index) => (
    <Star
      key={index}
      x={pendulum.anchor.x}
      y={pendulum.anchor.y}
      numPoints={6}
      innerRadius={0.006}
      outerRadius={0.008}
      fill="yellow"
      draggable={isState(PendulumStatus.IDLE)}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onDragMove={(e) => {
        const boundedPosition = {
          x: Math.max(0, Math.min(e.target.x(), SCENE_WIDTH)),
          y: ANCHOR_LINE_Y,
        };
        e.target.setPosition(boundedPosition);
        setAnchor(index, {
          x: boundedPosition.x,
          y: boundedPosition.y,
        });
        setPosition(index, states[index].position);
      }}
    />
  ));

  const anchorsInfos =
    isState(PendulumStatus.IDLE) &&
    options.pendulums.map((pendulum, index) => (
      <Text
        key={index}
        text={pendulum.anchor.x.toFixed(2) + ' m'}
        x={pendulum.anchor.x - 0.05}
        y={pendulum.anchor.y - 0.03}
        fontSize={0.02}
        align="center"
        width={0.1}
        fill="white"
      />
    ));

  const lengthsInfos =
    isState(PendulumStatus.IDLE) &&
    options.pendulums.map((pendulum, index) => (
      <Text
        key={index}
        text={pendulum.length.toFixed(2) + ' m'}
        x={
          pendulum.anchor.x +
          (states[index].position.x - pendulum.anchor.x) / 2 -
          0.05
        }
        y={
          pendulum.anchor.y +
          (states[index].position.y - pendulum.anchor.y) / 2 -
          0.008
        }
        fontSize={0.02}
        align="center"
        width={0.1}
        height={0.016}
        fill="white"
      />
    ));

  const anglesInfos =
    isState(PendulumStatus.IDLE) &&
    options.pendulums.map((pendulum, index) => (
      <Text
        key={index}
        text={((pendulum.angle * 180) / Math.PI).toFixed(2) + '°'}
        x={pendulum.anchor.x + (pendulum.angle < 0 ? -1 : 1) * 0.05 - 0.05}
        y={pendulum.anchor.y + 0.006}
        fontSize={0.02}
        align="center"
        width={0.1}
        height={0.016}
        fill="white"
      />
    ));

  return (
    <div className="w-screen h-screen bg-[#0d1521] px-8 py-12 text-white flex flex-col items-center">
      <button
        onClick={start}
        disabled={
          !isState(PendulumStatus.IDLE) && !isState(PendulumStatus.ERROR)
        }
      >
        Start
      </button>
      <button
        onClick={stop}
        disabled={isState(PendulumStatus.IDLE) || isState(PendulumStatus.ERROR)}
      >
        Stop
      </button>
      <button onClick={pause} disabled={!isState(PendulumStatus.RUNNING)}>
        Pause
      </button>
      <button onClick={resume} disabled={!isState(PendulumStatus.PAUSED)}>
        Resume
      </button>
      <div className="w-full max-w-6xl bg-[#1e293b] rounded-xl border-4 border-white">
        <div ref={containerRef} className="w-full">
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            scaleX={stageSize.scale}
            scaleY={stageSize.scale}
          >
            <Layer>
              <Line
                points={[0, ANCHOR_LINE_Y, SCENE_WIDTH, ANCHOR_LINE_Y]}
                stroke="#050a12"
                strokeWidth={0.008}
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
      </div>
    </div>
  );
}
