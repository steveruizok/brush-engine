export default function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (n: string) => void
}) {
  return (
    <>
      <label>{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
      <span>{String(value)}</span>
    </>
  )
}
