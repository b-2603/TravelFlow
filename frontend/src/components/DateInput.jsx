import { useEffect, useRef, useState } from 'react';
import { formatDateInput, maskDateInput, parseDateInput } from '../utils/formatters';

export default function DateInput({
  value,
  onChange,
  onBlur,
  placeholder = 'dd/mm/yyyy',
  className,
  name,
  id,
  disabled,
  ...rest
}) {
  const [displayValue, setDisplayValue] = useState(formatDateInput(value));
  const [isFocused, setIsFocused] = useState(false);
  const nativeDateRef = useRef(null);

  useEffect(() => {
    const nextDisplay = formatDateInput(value);
    if (!isFocused && nextDisplay !== displayValue) {
      setDisplayValue(nextDisplay);
    }
  }, [value, displayValue, isFocused]);

  const handleChange = (event) => {
    const nextDisplay = maskDateInput(event.target.value);
    setDisplayValue(nextDisplay);

    const parsed = parseDateInput(nextDisplay);

    if (parsed) {
      onChange?.(parsed);
      return;
    }

    if (nextDisplay.trim() === '') {
      onChange?.('');
    }
  };

  const handleBlur = (event) => {
    const parsed = parseDateInput(displayValue);

    if (parsed) {
      const normalized = formatDateInput(parsed);
      if (normalized !== displayValue) {
        setDisplayValue(normalized);
      }
    } else if (displayValue.trim() !== '') {
      setDisplayValue('');
      onChange?.('');
    }

    setIsFocused(false);
    onBlur?.(event);
  };

  const handleNativeDateChange = (event) => {
    const nextValue = event.target.value;
    setDisplayValue(formatDateInput(nextValue));
    onChange?.(nextValue);
  };

  const openDatePicker = () => {
    const input = nativeDateRef.current;

    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div className="input-group">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        className={className}
        name={name}
        id={id}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        {...rest}
      />
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={openDatePicker}
        disabled={disabled}
        aria-label="Chon ngay"
        title="Chọn ngày"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h.5A2.5 2.5 0 0 1 16 3.5v10A2.5 2.5 0 0 1 13.5 16h-11A2.5 2.5 0 0 1 0 13.5v-10A2.5 2.5 0 0 1 2.5 1H3V.5a.5.5 0 0 1 .5-.5ZM1 6v7.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5V6H1Zm14-1V3.5A1.5 1.5 0 0 0 13.5 2H13v.5a.5.5 0 0 1-1 0V2H4v.5a.5.5 0 0 1-1 0V2h-.5A1.5 1.5 0 0 0 1 3.5V5h14Z" />
        </svg>
      </button>
      <input
        ref={nativeDateRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        value={value || ''}
        onChange={handleNativeDateChange}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
