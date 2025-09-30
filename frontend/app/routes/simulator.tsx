import {
  PauseIcon,
  PlayIcon,
  PlayPauseIcon,
  StopIcon,
} from '@heroicons/react/20/solid';

import { Simulation } from '~/components/simulation';
import Button from '~/components/ui/Button';
import { useSimulation } from '~/contexts/simulation';
import { PendulumStatus } from '~/contexts/simulation/types';

export function meta() {
  return [
    { title: 'Pendulum Simulator' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export default function Simulator() {
  const { isReady, getCommonStatus, start, stop, pause, resume } =
    useSimulation();

  if (!isReady) return null;

  return (
    <div className="w-screen h-screen bg-[#0d1521] px-8 py-12 text-white flex flex-col items-center gap-2">
      <div className="flex flex-row gap-2 justify-center">
        <Button
          icon={<PlayIcon className="size-6" />}
          color="green"
          disabled={
            ![PendulumStatus.IDLE, PendulumStatus.ERROR].includes(
              getCommonStatus(),
            )
          }
          onClick={start}
        >
          Start
        </Button>
        <Button
          icon={<StopIcon className="size-6" />}
          color="red"
          disabled={[PendulumStatus.IDLE, PendulumStatus.ERROR].includes(
            getCommonStatus(),
          )}
          onClick={stop}
        >
          Stop
        </Button>
        <Button
          icon={<PauseIcon className="size-6" />}
          color="orange"
          disabled={getCommonStatus() !== PendulumStatus.RUNNING}
          onClick={pause}
        >
          Pause
        </Button>
        <Button
          icon={<PlayPauseIcon className="size-6" />}
          color="blue"
          disabled={getCommonStatus() !== PendulumStatus.PAUSED}
          onClick={resume}
        >
          Resume
        </Button>
      </div>
      <Simulation />
    </div>
  );
}
