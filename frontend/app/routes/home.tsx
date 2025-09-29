import { useSimulation } from '~/contexts/simulation';

export function meta() {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export default function Home() {
  const { state, options, start, stop } = useSimulation();

  return (
    <div>
      <button onClick={start} disabled={state?.status === 'running'}>
        Start
      </button>
      <button onClick={stop} disabled={state?.status !== 'running'}>
        Stop
      </button>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <pre>{JSON.stringify(options, null, 2)}</pre>
    </div>
  );
}
