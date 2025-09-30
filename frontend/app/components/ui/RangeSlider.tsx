import clsx from 'clsx';

export default function RangeSlider(props: {
  id?: string;
  label?: string;
  disabled?: boolean;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  onValueChange: (value: number) => void;
  unit?: string;
  showValue?: boolean;
  color?: string;
}) {
  return (
    <div className="flex flex-col w-full">
      {props.label && (
        <label
          htmlFor={props.id || 'range-slider'}
          className="block mb-2 text-sm font-medium  text-white"
        >
          {props.label}
        </label>
      )}
      <div className="w-full flex flex-row gap-2 items-center">
        <input
          id={props.id || 'range-slider'}
          type="range"
          value={props.value}
          min={props.min ?? 0}
          max={props.max ?? 100}
          step={props.step ?? 1}
          className={clsx(
            'w-full',
            'h-2',
            'rounded-lg',
            'appearance-none',
            props.disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            props.disabled ? 'opacity-50' : '',
            'bg-gray-700',
          )}
          style={{ accentColor: props.color || 'white' }}
          onChange={(e) => {
            if (props.disabled) return;
            props.onValueChange(Number(e.target.value));
          }}
        ></input>
        {props.showValue && (
          <div className="w-16 text-right text-sm">
            {(props.decimals
              ? props.value.toFixed(props.decimals)
              : props.value) + (props.unit ? ` ${props.unit}` : '')}
          </div>
        )}
      </div>
    </div>
  );
}
