import React, { createContext, useState, useContext, useEffect } from 'react';
import type { SimulationOptions, SimulationState } from './types';
import useWebSocket, { ReadyState } from 'react-use-websocket-lite';
import type { WSMessage } from '~/common/types/WSMessages';
import axios from 'axios';
import type { SimulationStartResponse } from '~/common/types/APIMessages';

const HOSTNAME = 'localhost:3000';
const WS_URL = `ws://${HOSTNAME}`;
const BASE_URL = `http://${HOSTNAME}/api`;

const SimulationContext = createContext<{
  state: SimulationState | undefined;
  options: SimulationOptions;
  start: () => void;
  stop: () => void;
}>({
  state: undefined,
  options: {
    pendulums: [],
    wind: {
      enabled: false,
      direction: 0,
      velocity: 0,
    },
  },
  start: () => {
    /* empty */
  },
  stop: () => {
    /* empty */
  },
});

export const SimulationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<SimulationState | undefined>(undefined);
  const [options, setOptions] = useState<SimulationOptions>({
    pendulums: [
      { anchor: { x: 0.15, y: 0 }, angle: -0.5, length: 0.3, mass: 0.2 },
      { anchor: { x: 0.3, y: 0 }, angle: -0.3, length: 0.3, mass: 0.2 },
      { anchor: { x: 0.45, y: 0 }, angle: -0.1, length: 0.2, mass: 0.2 },
      { anchor: { x: 0.6, y: 0 }, angle: 0.15, length: 0.25, mass: 0.2 },
      { anchor: { x: 0.75, y: 0 }, angle: 0.45, length: 0.1, mass: 0.2 },
    ],
    wind: {
      enabled: false,
      direction: 0,
      velocity: 0,
    },
  });
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
          setState(wsMessage.data.state);
          break;
        }
      }
    },
  });

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return;
    axios
      .get<SimulationState>(`${BASE_URL}/simulation`, {})
      .then((response) => {
        setState(response.data);
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
        setState(response.data.state);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const stop = () => {
    axios
      .post<SimulationStartResponse>(`${BASE_URL}/simulation/stop`)
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <SimulationContext.Provider value={{ state, options, start, stop }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);
