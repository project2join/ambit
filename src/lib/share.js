/*
  «Plan teilen»: schickt die Eckdaten eines Treffens über das
  Teilen-Menü des Geräts an eine Vertrauensperson.
  Wo das Menü fehlt (z. B. am Computer), landet der Text in der
  Zwischenablage.
*/
import { formatWhen } from './format'

export async function sharePlan({ plan, names, t, lang }) {
  const lines = [
    t('share.intro'),
    '',
    `${t('share.when')}: ${formatWhen(plan, t, lang) || '—'}`,
    `${t('share.what')}: ${t(`categories.${plan.category}`)} — «${plan.text}»`,
  ]
  if (names?.length > 0) {
    lines.push(`${t('share.who')}: ${names.join(', ')}`)
  }
  const text = lines.join('\n')

  // Teilen-Menü des Geräts (Handy) …
  if (navigator.share) {
    try {
      await navigator.share({ title: t('share.subject'), text })
      return 'shared'
    } catch {
      return 'cancelled' // Teilen abgebrochen — das ist kein Fehler
    }
  }

  // … sonst in die Zwischenablage
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
