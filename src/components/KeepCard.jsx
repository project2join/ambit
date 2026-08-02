/*
  Die «Gerne wieder»-Karte, die nach einem Treffen erscheint.

  Drei Zustände:
  1. Noch nicht getippt  → Einladung mit Frist («Noch bis Sonntag.»)
  2. Getippt, offen      → ruhige Bestätigung; NIE ein Hinweis darauf,
                            ob jemand anderes schon getippt hat
  3. Beidseitig          → «Ihr bleibt in Kontakt.» + Verbindung lösen
*/
import { useTranslation } from 'react-i18next'
import { CheckIcon } from './Icons'
import { keepDeadline } from '../lib/keeps'

function KeepCard({ plan, state, onKeep, onRelease }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'de' ? 'de-CH' : 'en-GB'

  // Beidseitig — der Chat bleibt offen
  if (state?.matched) {
    return (
      <div className="bg-pine-soft rounded-2xl px-4 py-3.5">
        <div className="text-[14px] font-semibold text-pine flex items-center gap-1.5">
          <CheckIcon size={15} />
          {t('keep.matched')}
        </div>
        <p className="text-[12.5px] text-sub mt-1 leading-relaxed">
          {t('keep.matchedBody')}
        </p>
        <button
          type="button"
          onClick={onRelease}
          className="text-[12px] font-semibold text-mut mt-2"
        >
          {t('keep.release')}
        </button>
      </div>
    )
  }

  // Schon getippt — ruhig bestätigen, sonst nichts verraten
  if (state?.mine) {
    return (
      <div className="bg-paper border border-line rounded-2xl px-4 py-3.5">
        <div className="text-[14px] font-semibold text-ink flex items-center gap-1.5">
          <CheckIcon size={15} className="text-pine" />
          {t('keep.done')}
        </div>
        <p className="text-[12.5px] text-mut mt-1 leading-relaxed">
          {t('keep.doneBody')}
        </p>
      </div>
    )
  }

  // Noch offen — die Einladung
  return (
    <div className="bg-card border border-line rounded-2xl px-4 py-3.5">
      <div className="font-serif text-[16px] font-semibold text-ink">
        {t('keep.title')}
      </div>
      <p className="text-[12.5px] text-sub mt-1 leading-relaxed">{t('keep.body')}</p>
      <div className="flex items-center gap-3 mt-2.5">
        <button
          type="button"
          onClick={onKeep}
          className="rounded-full bg-pine text-white px-4 py-2 text-[12.5px] font-semibold"
        >
          {t('keep.button')}
        </button>
        <span className="text-[11.5px] text-mut">
          {t('keep.until', {
            day: keepDeadline(plan).toLocaleDateString(locale, { weekday: 'long' }),
          })}
        </span>
      </div>
    </div>
  )
}

export default KeepCard
