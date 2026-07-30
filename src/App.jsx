/*
  Startseite von Ambit — im "Quiet Luxury"-Stil des Prototyps.
  Noch ein Platzhalter: Sie zeigt das Design-Fundament
  (Farben, Schriften, Schatten), bevor die echten Funktionen kommen.
*/
function App() {
  return (
    // Ganze Seite: Elfenbein-Hintergrund, maximal 390px breit (Handy-Format)
    <div className="min-h-dvh bg-paper flex justify-center">
      <div className="w-full max-w-[390px] flex flex-col">
        {/* Kopfzeile mit der Wortmarke: Fraunces kursiv, ohne Punkt */}
        <header className="px-5 pt-5 pb-3">
          <span className="font-serif italic text-[27px] font-medium tracking-[0.3px] text-ink">
            Ambit
          </span>
        </header>

        {/* Mittelteil: Begrüssung */}
        <main className="flex-1 flex flex-col justify-center gap-5 px-5 pb-10">
          {/* Kapitälchen-Label mit Letter-Spacing, wie im Prototyp */}
          <div className="text-[12px] font-semibold uppercase tracking-[0.9px] text-mut">
            Willkommen
          </div>

          <h1 className="font-serif text-[32px] leading-[1.25] font-semibold text-ink">
            Ich gehe eh —<br />
            komm mit.
          </h1>

          <p className="text-[15px] leading-relaxed text-sub max-w-[32ch]">
            Ambit öffnet deine bestehenden Pläne für Gesellschaft. Kein Suchen,
            kein Warten — du gehst ja sowieso.
          </p>

          {/* Beispielkarte: weiss, weicher tiefer Schatten, Haarlinie */}
          <div className="mt-2 rounded-2xl bg-card border border-line shadow-card p-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.9px] text-pine">
              Freundschaft
            </div>
            <div className="font-serif text-[17px] font-medium leading-[1.35] text-ink mt-2">
              «Ich geh eh Donnerstag bouldern — wer kommt mit?»
            </div>
            <div className="text-[13px] text-mut mt-3">Do · 19:00 · Kreis 5</div>
          </div>

          {/* Haupt-Knopf: Tannengrün (freundschaftliche Aktion) */}
          <button className="mt-3 rounded-full bg-pine px-6 py-3.5 text-[15px] font-semibold text-white shadow-card active:bg-ink transition-colors">
            Los geht's
          </button>
        </main>

        {/* Fusszeile */}
        <footer className="px-5 py-4 text-center text-[12px] text-mut">
          Ambit · Version 0.1
        </footer>
      </div>
    </div>
  )
}

export default App
