/*
  Wiederverwendbare Design-Bausteine im Quiet-Luxury-Stil des Prototyps.
  Damit sieht alles automatisch gleich aus.
*/

// Weisse Karte mit Haarlinie und abgerundeten Ecken
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-card border border-line rounded-2xl p-[18px] ${className}`}>
      {children}
    </div>
  )
}

// Kapitälchen-Label mit Letter-Spacing (z. B. «MEINE FOTOS»)
// warm = Bordeaux für Dating-Momente, sonst gedämpftes Grau
export function Label({ children, warm, className = '' }) {
  return (
    <div
      className={`text-[12px] font-semibold uppercase tracking-[0.9px] ${
        warm ? 'text-bordeaux-deep' : 'text-mut'
      } ${className}`}
    >
      {children}
    </div>
  )
}

// Auswahl-Chip: aktiv = dunkel (oder Bordeaux bei warm), inaktiv = weiss
export function Chip({ active, warm, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-[14px] py-[7px] rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border ' +
        (active
          ? (warm ? 'bg-bordeaux' : 'bg-ink') + ' text-white border-transparent'
          : 'bg-card text-sub border-line')
      }
    >
      {children}
    </button>
  )
}

// Ein-/Aus-Schalter (wie beim «offene Beziehungen anzeigen»-Schalter)
export function Toggle({ on, onClick, warm }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={
        'relative w-10 h-[23px] rounded-full transition-colors flex-shrink-0 ' +
        (on ? (warm ? 'bg-bordeaux' : 'bg-pine') : 'bg-line')
      }
    >
      <span
        className={
          'absolute top-[2.5px] w-[18px] h-[18px] rounded-full bg-white transition-all ' +
          (on ? 'left-[19px]' : 'left-[3px]')
        }
      />
    </button>
  )
}

// Grüner Hauptknopf (volle Breite)
export function PrimaryButton({ onClick, disabled, children, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full bg-pine px-6 py-3.5 text-[15px] font-semibold text-white shadow-card active:bg-ink transition-colors disabled:opacity-40"
    >
      {children}
    </button>
  )
}
