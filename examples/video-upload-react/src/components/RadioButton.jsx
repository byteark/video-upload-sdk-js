export function RadioButton(props) {
  const { id, label, value, checked, onChange } = props;

  return (
    <div className="flex items-center me-4">
      <input
        id={id}
        type="radio"
        value={value}
        checked={checked ?? false}
        onChange={onChange}
        name="inline-radio-group"
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"
      />
      <label
        htmlFor={id}
        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-700 cursor-pointer whitespace-nowrap"
      >
        {label}
      </label>
    </div>
  );
}
