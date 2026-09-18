type Props = { breathing?: boolean; className?: string };

/** The ampersand mark: four things joined into one. */
export default function Amp({ breathing = false, className = '' }: Props) {
  return (
    <span className={`amp${breathing ? ' amp--breathing' : ''}${className ? ` ${className}` : ''}`} aria-hidden="true">
      <span>&amp;</span>
    </span>
  );
}
