export default function Spinner({ label = "Loading" }: { label?: string }) {
  return <span className="spinner-wrap"><span className="spinner" aria-hidden="true" />{label}</span>;
}
