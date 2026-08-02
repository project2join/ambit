/*
  Verifizierung im «Ich»-Tab: Selfie mit einer zufälligen Geste,
  direkt in der App aufgenommen. Freiwillig.

  Vier Zustände: schon verifiziert · Prüfung läuft · hat nicht
  geklappt · noch nie versucht.
*/
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Label } from './UI'
import { BadgeCheckIcon, LockIcon } from './Icons'
import {
  loadMyVerification,
  submitVerification,
  randomGesture,
} from '../lib/verification'

function VerificationCard({ user, profile }) {
  const { t } = useTranslation()

  const [request, setRequest] = useState(undefined) // undefined = lädt noch
  const [gesture] = useState(randomGesture)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    loadMyVerification(user.id).then(setRequest)
  }, [user.id])

  // Das Foto kommt direkt aus der Kamera (siehe capture="user" unten)
  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setBusy(true)
    setError(false)
    const ok = await submitVerification(user.id, file, gesture)
    setBusy(false)
    if (ok) setRequest(await loadMyVerification(user.id))
    else setError(true)
  }

  // Schon verifiziert — nichts mehr zu tun
  if (profile.is_verified) {
    return (
      <Card>
        <Label className="mb-2">{t('settings.verification')}</Label>
        <div className="text-[14px] text-pine font-semibold flex items-center gap-1.5">
          <BadgeCheckIcon size={16} strokeWidth={2} />
          {t('settings.verificationDone')}
        </div>
      </Card>
    )
  }

  const pending = request?.status === 'pending'
  const rejected = request?.status === 'rejected'

  return (
    <Card>
      <Label className="mb-2">{t('settings.verification')}</Label>

      {pending ? (
        // Prüfung läuft
        <>
          <div className="text-[14px] font-semibold text-ink">{t('verify.pending')}</div>
          <p className="text-[12.5px] text-sub mt-1 leading-relaxed">
            {t('verify.pendingBody')}
          </p>
        </>
      ) : (
        <>
          {rejected ? (
            <>
              <div className="text-[14px] font-semibold text-ink">
                {t('verify.rejected')}
              </div>
              <p className="text-[12.5px] text-sub mt-1 leading-relaxed">
                {t('verify.rejectedBody')}
              </p>
            </>
          ) : (
            <>
              <div className="text-[14px] text-ink">
                {t('settings.verificationPending')}
              </div>
              <p className="text-[12.5px] text-sub mt-1 leading-relaxed">
                {t('verify.explain')}
              </p>
            </>
          )}

          {/* Die Geste — sie beweist, dass das Selfie gerade entsteht */}
          <div className="bg-paper rounded-xl px-4 py-3 mt-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.9px] text-mut">
              {t('verify.gestureIntro')}
            </div>
            <div className="font-serif text-[17px] font-semibold text-ink mt-1">
              {t(`verify.gesture.${gesture}`)}
            </div>
          </div>

          {error && <p className="text-[13px] text-bordeaux mt-2">{t('verify.error')}</p>}

          <button
            type="button"
            onClick={() => fileRef.current.click()}
            disabled={busy}
            className="w-full mt-3 rounded-full bg-pine px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {busy
              ? t('verify.uploading')
              : rejected
                ? t('verify.retry')
                : t('verify.start')}
          </button>

          <p className="text-[12px] text-mut mt-2.5 leading-relaxed flex items-start gap-1.5">
            <LockIcon size={12} className="mt-0.5 flex-shrink-0" />
            {t('verify.privacy')}
          </p>
        </>
      )}

      {/* capture="user": öffnet am Handy direkt die Frontkamera,
          nicht die Fotogalerie — so kann kein altes Bild genommen werden */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        className="hidden"
      />
    </Card>
  )
}

export default VerificationCard
