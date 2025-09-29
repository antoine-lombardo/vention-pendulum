import React, { createContext, useState, useContext, useEffect } from 'react';
import type {
  CurrentSimulation,
  PendulumOptions,
  SimulationOptions,
  SimulationState,
} from './types';
import useWebSocket, { ReadyState } from 'react-use-websocket-lite';
import type { WSMessage } from '~/common/types/WSMessages';
import axios from 'axios';
import type { SimulationStartResponse } from '~/common/types/APIMessages';
import { ANCHOR_LINE_Y } from '~/common/globals/simulation';

const HOSTNAME = 'localhost:3000';
const WS_URL = `ws://${HOSTNAME}`;
const BASE_URL = `http://${HOSTNAME}/api`;
const DEFAULT_OPTIONS: SimulationOptions = {
  pendulums: [
    {
      anchor: { x: 0.15, y: ANCHOR_LINE_Y },
      angle: -0.5,
      length: 0.3,
      mass: 0.2,
    },
    {
      anchor: { x: 0.3, y: ANCHOR_LINE_Y },
      angle: -0.3,
      length: 0.3,
      mass: 0.2,
    },
    {
      anchor: { x: 0.45, y: ANCHOR_LINE_Y },
      angle: -0.1,
      length: 0.2,
      mass: 0.2,
    },
    {
      anchor: { x: 0.6, y: ANCHOR_LINE_Y },
      angle: 0.15,
      length: 0.25,
      mass: 0.2,
    },
    {
      anchor: { x: 0.75, y: ANCHOR_LINE_Y },
      angle: 0.45,
      length: 0.1,
      mass: 0.2,
    },
  ],
  wind: {
    enabled: false,
    direction: 0,
    velocity: 0,
  },
};

const getIdleState = (options: SimulationOptions): SimulationState => {
  return {
    status: 'idle',
    elapsedTime: 0,
    pendulums: options.pendulums.map((opt) => ({
      angle: opt.angle,
      position: calculatePosition(opt.angle, opt),
    })),
  };
};

const calculatePosition = (
  angle: number,
  options: PendulumOptions,
): { x: number; y: number } => {
  if (angle === 0)
    return { x: options.anchor.x, y: options.anchor.y + options.length };
  return {
    x:
      options.anchor.x +
      (angle < 0 ? -1 : 1) * Math.sin(Math.abs(angle)) * options.length,
    y: options.anchor.y + Math.cos(Math.abs(angle)) * options.length,
  };
};

const calculateLength = (
  position: { x: number; y: number },
  options: PendulumOptions,
): number => {
  if (position.x === options.anchor.x) return position.y - options.anchor.y;
  return Math.sqrt(
    Math.pow(options.anchor.x - position.x, 2) +
      Math.pow(options.anchor.y - position.y, 2),
  );
};

const calculateAngle = (
  position: { x: number; y: number },
  options: PendulumOptions,
): number => {
  if (position.x === options.anchor.x) return 0;
  return (
    (position.x < options.anchor.x ? -1 : 1) *
    Math.atan(
      Math.abs(position.x - options.anchor.x) / (position.y - options.anchor.y),
    )
  );
};

const SimulationContext = createContext<{
  state: SimulationState;
  options: SimulationOptions;
  start: () => void;
  stop: () => void;
  setPosition: (index: number, position: { x: number; y: number }) => void;
  setAnchor: (index: number, position: { x: number; y: number }) => void;
}>({
  state: getIdleState(DEFAULT_OPTIONS),
  options: DEFAULT_OPTIONS,
  start: () => {
    /* empty */
  },
  stop: () => {
    /* empty */
  },
  setPosition: () => {
    /* empty */
  },
  setAnchor: () => {
    /* empty */
  },
});

export const SimulationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<SimulationState>(
    getIdleState(DEFAULT_OPTIONS),
  );
  const [options, setOptions] = useState<SimulationOptions>(DEFAULT_OPTIONS);
  const { readyState } = useWebSocket({
    url: WS_URL,
    onMessage: (event) => {
      let message: WSMessage | undefined = undefined;
      try {
        message = JSON.parse(event.data);
      } catch {
        console.error('Failed to parse message:', event.data);
        /* empty */
      }
      if (typeof message !== 'object') return;
      if (!message?.event) return;
      const wsMessage = message as WSMessage;
      switch (wsMessage.event) {
        case 'simulation_start': {
          setOptions(wsMessage.data.options);
          setState(wsMessage.data.state);
          break;
        }
        case 'simulation_update': {
          if (wsMessage.data.state.status === 'idle') {
            setState(getIdleState(options));
          } else {
            setState(wsMessage.data.state);
          }
          break;
        }
      }
    },
  });

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return;
    axios
      .get<CurrentSimulation>(`${BASE_URL}/simulation`, {})
      .then((response) => {
        setOptions(response.data.options || DEFAULT_OPTIONS);
        if (!response.data.state || response.data.state.status === 'idle') {
          setState(getIdleState(response.data.options));
        } else {
          setState(response.data.state);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [readyState]);

  const start = () => {
    console.log('Starting simulation with options:', options);
    axios
      .post<SimulationStartResponse>(`${BASE_URL}/simulation/start`, options)
      .then((response) => {
        console.log(response.data.state);
        setState(response.data.state);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const stop = () => {
    axios
      .get<SimulationStartResponse>(`${BASE_URL}/simulation/stop`)
      .catch((error) => {
        console.error(error);
      });
  };

  const setPosition = (index: number, position: { x: number; y: number }) => {
    if (state.status === 'running') return;
    if (index < 0 || index >= options.pendulums.length) return;
    const angle = calculateAngle(position, options.pendulums[index]);
    setOptions((prev) => {
      const newOptions = { ...prev };
      newOptions.pendulums[index] = {
        ...newOptions.pendulums[index],
        angle: angle,
        length: calculateLength(position, newOptions.pendulums[index]),
      };
      return newOptions;
    });
    setState((prev) => {
      const newState = { ...prev };
      newState.pendulums[index] = {
        ...newState.pendulums[index],
        angle: calculateAngle(position, options.pendulums[index]),
        position,
      };
      return newState;
    });
  };

  const setAnchor = (index: number, position: { x: number; y: number }) => {
    if (state.status === 'running') return;
    if (index < 0 || index >= options.pendulums.length) return;
    setOptions((prev) => {
      const newOptions = { ...prev };
      newOptions.pendulums[index] = {
        ...newOptions.pendulums[index],
        anchor: position,
      };
      return newOptions;
    });
  };

  return (
    <SimulationContext.Provider
      value={{ state, options, start, stop, setPosition, setAnchor }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);
