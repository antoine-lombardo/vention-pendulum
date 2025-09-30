import { Layer, Line, Stage, Text } from 'react-konva';
import {
  ANCHOR_LINE_Y,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from '~/common/globals/simulation';
import { PendulumWeight } from './pendulum-weight';
import { PendulumString } from './pendulum-string';
import { PendulumAnchor } from './pendulum-anchor';
import { PendulumLength } from './pendulum-length';
import { PendulumAngle } from './pendulum-angle';
import { PendulumAnchorPosition } from './pendulum-anchor-position';
import { PendulumStatus } from '~/contexts/simulation/types';
import { useSimulation } from '~/contexts/simulation';
import { useEffect, useRef, useState } from 'react';
import { PendulumMass } from './pendulum-mass';

export function Simulation() {
  const { isReady, states, options, getCommonStatus } = useSimulation();

  // Only render the scene is SimulationContext is ready
  if (!isReady) return null;

  //
  // Tricks to handle window resizes
  // ref: https://konvajs.org/docs/sandbox/Responsive_Canvas.html
  //

  // State to track current scale and dimensions
  const [stageSize, setStageSize] = useState({
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    scale: 1,
  });

  // Reference to parent container
  const containerRef = useRef<HTMLDivElement>(null);

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

  //
  // Scene Objects
  //

  const isDraggable = getCommonStatus() === PendulumStatus.IDLE;

  const weights = states.map((_, index) => (
    <PendulumWeight index={index} key={index} />
  ));
  const strings = states.map((_, index) => (
    <PendulumString index={index} key={index} />
  ));
  const anchors = options.pendulums.map((_, index) => (
    <PendulumAnchor index={index} key={index} />
  ));
  const lengths =
    isDraggable &&
    options.pendulums.map((_, index) => (
      <PendulumLength index={index} key={index} />
    ));
  const angles =
    isDraggable &&
    options.pendulums.map((_, index) => (
      <PendulumAngle index={index} key={index} />
    ));
  const anchorPositions =
    isDraggable &&
    options.pendulums.map((_, index) => (
      <PendulumAnchorPosition index={index} key={index} />
    ));
  const masses =
    isDraggable &&
    options.pendulums.map((_, index) => (
      <PendulumMass index={index} key={index} />
    ));

  //
  // Simulation status string
  //

  let status = 'N/A';
  switch (getCommonStatus()) {
    case PendulumStatus.IDLE:
      status = 'Idle';
      break;
    case PendulumStatus.RUNNING:
      status = 'Running';
      break;
    case PendulumStatus.PAUSED:
      status = 'Paused';
      break;
    case PendulumStatus.WAITING_FOR_RESTART:
      status = 'Restarting';
      break;
    case PendulumStatus.NOT_SYNCED:
      status = 'Not Synced';
      break;
  }

  //
  // Return component
  //

  return (
    <div className="w-full max-w-6xl bg-[#1e293b] rounded-xl shadow-xl shadow-gray-900">
      <div ref={containerRef} className="w-full relative">
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          scaleX={stageSize.scale}
          scaleY={stageSize.scale}
        >
          <Layer>
            <Line
              points={[0, ANCHOR_LINE_Y, SCENE_WIDTH, ANCHOR_LINE_Y]}
              stroke="#98b7ed"
              strokeWidth={0.008}
            />
            {strings}
            {weights}
            {anchors}
            {lengths}
            {angles}
            {anchorPositions}
            {masses}
          </Layer>
        </Stage>
        <div className="absolute bottom-2 right-4 text-lg">{status}</div>
      </div>
    </div>
  );
}
