import { useField } from 'formik';
import DateInput from './DateInput';

export default function FormikDateInput({ name, ...rest }) {
  const [field, , helpers] = useField(name);

  return (
    <DateInput
      {...rest}
      name={name}
      value={field.value}
      onChange={(nextValue) => helpers.setValue(nextValue)}
      onBlur={() => helpers.setTouched(true)}
    />
  );
}
