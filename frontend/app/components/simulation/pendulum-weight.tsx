import type { KonvaEventObject } from 'konva/lib/Node';
import { Circle } from 'react-konva';
import { ANCHOR_LINE_Y, SCENE_WIDTH } from '~/common/globals/simulation';
import { useSimulation } from '~/contexts/simulation';
import { PendulumStatus } from '~/contexts/simulation/types';

export function PendulumWeight(props: { index: number }) {
  const { states, options, getCommonStatus, setPosition } = useSimulation();

  const isDraggable = [PendulumStatus.IDLE, PendulumStatus.ERROR].includes(
    getCommonStatus(),
  );

  const handleMouseOver = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    if (!isDraggable) return;
    stage.container().style.cursor = 'move';
  };

  const handleMouseOut = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    stage.container().style.cursor = 'default';
  };

  const handleDragMove = (e: KonvaEventObject<MouseEvent>) => {
    const boundedPosition = {
      x: Math.max(0, Math.min(e.target.x(), SCENE_WIDTH)),
      y: Math.max(ANCHOR_LINE_Y, e.target.y()),
    };
    e.target.setPosition(boundedPosition);
    setPosition(props.index, {
      x: boundedPosition.x,
      y: boundedPosition.y,
    });
  };

  return (
    <Circle
      key={props.index}
      x={states[props.index].position.x}
      y={states[props.index].position.y}
      radius={options.pendulums[props.index].radius}
      fill="#7e98c4"
      draggable={isDraggable}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onDragMove={handleDragMove}
      shadowColor="#111827"
      shadowBlur={0.02}
      shadowOffset={{ x: 0.005, y: 0.005 }}
      shadowOpacity={0.9}
    />
  );
}
