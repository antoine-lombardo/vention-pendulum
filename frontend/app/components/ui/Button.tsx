import clsx from 'clsx';

const COLORS_CLASSES = {
  blue: [
    'bg-blue-900',
    'not-disabled:hover:bg-blue-900/90',
    'ing-blue-900/50',
    'not-disabled:dark:focus:ring-blue-900/55',
  ],
  green: [
    'bg-green-900',
    'not-disabled:hover:bg-green-900/90',
    'ing-green-900/50',
    'not-disabled:dark:focus:ring-green-900/55',
  ],
  red: [
    'bg-red-900',
    'not-disabled:hover:bg-red-900/90',
    'ing-red-900/50',
    'not-disabled:dark:focus:ring-red-900/55',
  ],
  orange: [
    'bg-amber-700',
    'not-disabled:hover:bg-amber-700/90',
    'ing-amber-700/50',
    'not-disabled:dark:focus:ring-amber-700/55',
  ],
};

export default function Button(props: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  color?: 'blue' | 'green' | 'red' | 'orange';
  onClick: () => void;
}) {
  const colorClasses = COLORS_CLASSES[props.color || 'blue'];

  return (
    <button
      disabled={!!props.disabled}
      type="button"
      className={clsx(
        'disabled:opacity-50',
        'not-disabled:cursor-pointer',
        'disabled:cursor-not-allowed',
        'text-white',
        'focus:ring-4',
        'focus:outline-none',
        'font-medium',
        'rounded-lg',
        'text-sm',
        'px-5',
        'py-2.5 ',
        'text-center ',
        'inline-flex ',
        'items-center ',
        'me-2 ',
        'mb-2',
        colorClasses,
      )}
      onClick={props.onClick}
    >
      {props.icon && <div className="mr-2">{props.icon}</div>}
      {props.children}
    </button>
  );
}
