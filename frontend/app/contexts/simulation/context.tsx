import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  PendulumStatus,
  type PendulumOptions,
  type PendulumState,
  type SimulationOptions,
} from './types';
import useWebSocket, { ReadyState } from 'react-use-websocket-lite';
import type { StateMessage, WSMessage } from '~/common/types/WSMessages';
import axios from 'axios';
import type {
  APIMessage,
  SimulationStatusResponse,
} from '~/common/types/APIMessages';
import { MASS_RADIUS_RATIO } from '~/common/globals/simulation';

const HOSTNAME = 'localhost:3000';
const WS_URL = `ws://${HOSTNAME}`;
const BASE_URL = `http://${HOSTNAME}/api`;
const DEFAULT_OPTIONS: SimulationOptions = {
  pendulums: [],
  wind: {
    direction: 0,
    velocity: 0,
  },
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

const SimulationContext = createContext<{
  isReady: boolean;
  states: PendulumState[];
  options: SimulationOptions;
  getCommonStatus: () => PendulumStatus;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setPosition: (index: number, position: { x: number; y: number }) => void;
  setAnchor: (index: number, position: { x: number; y: number }) => void;
  setAngle: (index: number, angle: number) => void;
  setLength: (index: number, length: number) => void;
  setMass: (index: number, mass: number) => void;
  setWindVelocity: (velocity: number) => void;
  setWindDirection: (direction: number) => void;
}>({
  isReady: false,
  states: [],
  options: DEFAULT_OPTIONS,
  getCommonStatus: () => PendulumStatus.NOT_SYNCED,
  start: () => {
    /* empty */
  },
  stop: () => {
    /* empty */
  },
  pause: () => {
    /* empty */
  },
  resume: () => {
    /* empty */
  },
  setPosition: () => {
    /* empty */
  },
  setAnchor: () => {
    /* empty */
  },
  setAngle: () => {
    /* empty */
  },
  setLength: () => {
    /* empty */
  },
  setMass: () => {
    /* empty */
  },
  setWindVelocity: () => {
    /* empty */
  },
  setWindDirection: () => {
    /* empty */
  },
});

export const SimulationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [states, setStates] = useState<PendulumState[]>([]);
  const [options, setOptions] = useState<SimulationOptions>(DEFAULT_OPTIONS);
  const { readyState } = useWebSocket({
    url: WS_URL,
    shouldReconnect: true,
    reconnectInterval: 1000,
    maxReconnectAttempts: 100000000,
    retryOnError: true,
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
        case 'state': {
          const stateMessage = wsMessage as StateMessage;
          // setOptions(wsMessage.data.options);

          setStates((prev) => {
            const newStates = [...prev];
            newStates[stateMessage.from] = stateMessage.data.state;
            return newStates;
          });
          break;
        }
        // case 'simulation_update': {
        //   if (wsMessage.data.state.status === 'idle') {
        //     setState(getIdleState(options));
        //   } else {
        //     setState(wsMessage.data.state);
        //   }
        //   break;
        // }
      }
    },
  });

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) {
      setIsReady(false);
      return;
    }
    setTimeout(() => {
      axios
        .get<SimulationStatusResponse>(`${BASE_URL}/simulation`, {})
        .then((response) => {
          setOptions(response.data.options);
          setStates(response.data.states);
          setIsReady(true);
        })
        .catch((error) => {
          console.error(error);
        });
    }, 1000);
  }, [readyState]);

  const getCommonStatus = () => {
    let commonStatus = PendulumStatus.NOT_SYNCED;
    for (const pendulum of states) {
      if (commonStatus === PendulumStatus.NOT_SYNCED) {
        commonStatus = pendulum.status;
      } else if (commonStatus !== pendulum.status) {
        commonStatus = PendulumStatus.NOT_SYNCED;
        break;
      }
    }
    return commonStatus;
  };

  const start = () => {
    console.log('Starting simulation with options:', options);
    axios
      .post<APIMessage>(`${BASE_URL}/simulation/start`, options)
      .catch((error) => {
        console.error(error);
      });
  };

  const stop = () => {
    axios.get<APIMessage>(`${BASE_URL}/simulation/stop`).catch((error) => {
      console.error(error);
    });
  };

  const pause = () => {
    axios.get<APIMessage>(`${BASE_URL}/simulation/pause`).catch((error) => {
      console.error(error);
    });
  };

  const resume = () => {
    axios.get<APIMessage>(`${BASE_URL}/simulation/resume`).catch((error) => {
      console.error(error);
    });
  };

  const setPosition = (index: number, position: { x: number; y: number }) => {
    // All pendulums must be idle
    if (!states.every((pendulum) => pendulum.status === PendulumStatus.IDLE))
      return;
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
    setStates((prev) => {
      const newStates = [...prev];
      newStates[index] = {
        ...newStates[index],
        angle: calculateAngle(position, options.pendulums[index]),
        position,
      };
      return newStates;
    });
  };

  const setAnchor = (index: number, position: { x: number; y: number }) => {
    // All pendulums must be idle
    if (!states.every((pendulum) => pendulum.status === PendulumStatus.IDLE))
      return;
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

  const setAngle = (index: number, angle: number) => {
    // All pendulums must be idle
    if (!states.every((pendulum) => pendulum.status === PendulumStatus.IDLE))
      return;
    if (index < 0 || index >= options.pendulums.length) return;
    setOptions((prev) => {
      const newOptions = { ...prev };
      newOptions.pendulums[index] = {
        ...newOptions.pendulums[index],
        angle,
      };
      return newOptions;
    });
    setStates((prev) => {
      const newStates = [...prev];
      newStates[index] = {
        ...newStates[index],
        angle,
        position: calculatePosition(angle, options.pendulums[index]),
      };
      return newStates;
    });
  };

  const setLength = (index: number, length: number) => {
    setOptions((prev) => {
      const newOptions = { ...prev };
      newOptions.pendulums[index] = {
        ...newOptions.pendulums[index],
        length,
      };
      return newOptions;
    });
    setStates((prev) => {
      const newStates = [...prev];
      newStates[index] = {
        ...newStates[index],
        position: calculatePosition(options.pendulums[index].angle, {
          ...options.pendulums[index],
          length,
        }),
      };
      return newStates;
    });
  };

  const setMass = (index: number, mass: number) => {
    setOptions((prev) => {
      const newOptions = { ...prev };
      newOptions.pendulums[index] = {
        ...newOptions.pendulums[index],
        mass,
        radius: mass / MASS_RADIUS_RATIO,
      };
      return newOptions;
    });
  };

  const setWindVelocity = (velocity: number) => {
    setOptions((prev) => {
      const newOptions = { ...prev, wind: { ...prev.wind, velocity } };
      return newOptions;
    });
  };
  const setWindDirection = (direction: number) => {
    setOptions((prev) => {
      const newOptions = { ...prev, wind: { ...prev.wind, direction } };
      return newOptions;
    });
  };

  return (
    <SimulationContext.Provider
      value={{
        isReady,
        states,
        options,
        getCommonStatus,
        start,
        stop,
        pause,
        resume,
        setPosition,
        setAnchor,
        setAngle,
        setLength,
        setMass,
        setWindVelocity,
        setWindDirection,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);
