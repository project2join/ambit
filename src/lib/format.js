/*
  Kleine Helfer, um Zeitpunkte lesbar zu machen —
  genutzt vom Pläne-Feed und von den Verbindungen.
*/

// Zeitpunkt eines Plans:
// - Flexibel: das Zeitfenster («Diese Woche»)
// - Fix mit noch offener Uhrzeit: Tag + grobe Tageszeit («Do, 7. Aug. · Abends»)
// - Fix mit festgelegter Uhrzeit: Tag + genaue Zeit («Do, 7. Aug. · 19:00»)
export function formatWhen(plan, t, lang) {
  if (plan.is_flexible) {
    return plan.time_window ? t(`create.window.${plan.time_window}`) : null
  }
  if (!plan.when_at) return null
  const d = new Date(plan.when_at)
  const locale = lang === 'de' ? 'de-CH' : 'en-GB'
  const day = d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  // Solange nur eine grobe Tageszeit feststeht, zeigen wir nie die
  // (intern nur als Platzhalter gespeicherte) Uhrzeit an.
  const time = plan.daypart
    ? t(`dayparts.${plan.daypart}`)
    : d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

// Die sieben Wochentage (Reihenfolge Mo–So) für die Flexibel-Auswahl
export const DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const DAY_NUM = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

// Aus einem Wochentag («thu») und einer Uhrzeit («19:00») das nächste
// passende Datum machen (heute oder innerhalb der nächsten 7 Tage)
export function nextDateFor(dayId, time) {
  const now = new Date()
  const delta = (DAY_NUM[dayId] - now.getDay() + 7) % 7
  const d = new Date(now)
  d.setDate(now.getDate() + delta)
  const [h, m] = (time || '19:00').split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d
}
