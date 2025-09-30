import type { KonvaEventObject } from 'konva/lib/Node';
import { Star } from 'react-konva';
import { ANCHOR_LINE_Y, SCENE_WIDTH } from '~/common/globals/simulation';
import { useSimulation } from '~/contexts/simulation';
import { PendulumStatus } from '~/contexts/simulation/types';

export function PendulumAnchor(props: { index: number }) {
  const { states, options, getCommonStatus, setAnchor, setPosition } =
    useSimulation();

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
      y: ANCHOR_LINE_Y,
    };
    e.target.setPosition(boundedPosition);
    setAnchor(props.index, {
      x: boundedPosition.x,
      y: boundedPosition.y,
    });
    setPosition(props.index, states[props.index].position);
  };

  return (
    <Star
      key={props.index}
      x={options.pendulums[props.index].anchor.x}
      y={options.pendulums[props.index].anchor.y}
      numPoints={6}
      innerRadius={0.006}
      outerRadius={0.008}
      fill="yellow"
      draggable={isDraggable}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onDragMove={handleDragMove}
    />
  );
}
