/*
  Blockieren und Melden — erscheint von unten, wenn man im Profil
  oder im Chat auf die drei Punkte tippt.
*/
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from './Icons'
import { blockUser, reportUser } from '../lib/safety'

function SafetyMenu({ user, person, planId, onBlocked, onClose }) {
  const { t } = useTranslation()

  const [mode, setMode] = useState('menu') // menu | report | sent
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function handleBlock() {
    if (!window.confirm(t('safety.blockConfirm', { name: person.name }))) return
    setBusy(true)
    const ok = await blockUser(user.id, person.id)
    setBusy(false)
    if (ok) {
      onBlocked?.()
      onClose()
    } else {
      setError(true)
    }
  }

  async function handleReport(e) {
    e.preventDefault()
    setBusy(true)
    setError(false)
    const ok = await reportUser({
      reporter: user.id,
      reportedUser: person.id,
      planId,
      reason: reason.trim(),
    })
    setBusy(false)
    if (ok) setMode('sent')
    else setError(true)
  }

  return (
    <div className="fixed inset-0 z-40 bg-ink/55 flex items-end justify-center">
      <div className="w-full max-w-[390px] bg-card rounded-t-3xl px-5 pt-5 pb-7">
        <div className="flex items-center justify-between mb-3">
          <div className="font-serif text-[18px] font-bold text-ink">
            {mode === 'report' ? t('safety.reportTitle') : person.name}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-mut p-1"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Auswahl: Melden oder Blockieren */}
        {mode === 'menu' && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setMode('report')}
              className="w-full text-left rounded-xl border border-line bg-paper px-4 py-3.5 text-[14.5px] text-ink"
            >
              {t('safety.report')}
            </button>
            <button
              type="button"
              onClick={handleBlock}
              disabled={busy}
              className="w-full text-left rounded-xl border border-line bg-paper px-4 py-3.5 text-[14.5px] text-bordeaux disabled:opacity-50"
            >
              {t('safety.block')}
            </button>
          </div>
        )}

        {/* Meldeformular: kurzer Freitext */}
        {mode === 'report' && (
          <form onSubmit={handleReport}>
            <p className="text-[13px] text-sub mb-2.5 leading-relaxed">
              {t('safety.reportBody')}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 1000))}
              placeholder={t('safety.reportPlaceholder')}
              rows={4}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[14.5px] text-ink outline-none focus:border-pine resize-none"
            />
            {error && (
              <p className="text-[13px] text-bordeaux mt-2">{t('safety.reportError')}</p>
            )}
            <button
              type="submit"
              disabled={!reason.trim() || busy}
              className="w-full mt-3 rounded-full bg-pine px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {t('safety.reportSend')}
            </button>
          </form>
        )}

        {/* Danach: ruhige Bestätigung */}
        {mode === 'sent' && (
          <div className="text-center py-4">
            <p className="text-[15px] text-ink">{t('safety.reportDone')}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full border border-line bg-paper px-6 py-2.5 text-[13.5px] font-semibold text-sub"
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SafetyMenu
