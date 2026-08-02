/*
  Startseite für nicht eingeloggte Besucher:
  oben die einladende Begrüssung (Slogan + Text),
  darunter das Login per Magic Link (E-Mail eingeben → Link per Mail → drin).

  Alle Texte kommen per t('…') aus den Übersetzungsdateien
  (src/i18n/de.json und en.json) — nie direkt aus dem Code.
*/
import { useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { supabase } from './lib/supabase'

function Login() {
  // t = Funktion, die zu einem Schlüssel den Text in der aktuellen Sprache liefert
  const { t } = useTranslation()

  // Merkt sich, was gerade passiert:
  const [email, setEmail] = useState('') // was im Feld steht
  const [sending, setSending] = useState(false) // wird gerade gesendet?
  const [sent, setSent] = useState(false) // wurde der Link verschickt?
  const [error, setError] = useState(null) // null | 'generic' | 'rate'

  // Wird ausgeführt, wenn man auf «Anmelde-Link schicken» drückt
  async function handleSubmit(e) {
    e.preventDefault() // verhindert, dass die Seite neu lädt
    setError(null)
    setSending(true)

    // Supabase bitten, den Magic Link zu verschicken.
    // emailRedirectTo: Nach dem Klick im Mail landet man wieder in unserer App.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })

    setSending(false)
    if (error) {
      // Den echten Grund in die Konsole schreiben (F12 → Console),
      // damit beim Entwickeln nichts im Dunkeln bleibt
      console.error('Anmelde-Mail fehlgeschlagen:', error.status, error.message)
      // Zu viele Mails in kurzer Zeit? Dann das ehrlich sagen.
      const isRate =
        error.status === 429 || /rate limit|security purposes/i.test(error.message || '')
      setError(isRate ? 'rate' : 'generic')
    } else {
      setSent(true) // Erfolgsmeldung zeigen
    }
  }

  return (
    <div className="min-h-dvh bg-paper flex justify-center">
      <div className="w-full max-w-[390px] flex flex-col">
        {/* Kopfzeile mit der Wortmarke: schlicht und aufrecht */}
        <header className="px-5 pt-5 pb-3">
          <span className="font-serif text-[24px] font-medium tracking-[0.2px] text-ink">
            {t('brand.name')}
          </span>
        </header>

        {/* Begrüssung */}
        <main className="flex-1 flex flex-col justify-center gap-5 px-5 pb-10">
          {/* whitespace-pre-line: der Zeilenumbruch (\n) aus der
              Übersetzungsdatei wird als echter Umbruch angezeigt */}
          <h1 className="font-serif text-[32px] leading-[1.25] font-semibold text-ink whitespace-pre-line">
            {t('login.slogan')}
          </h1>

          <p className="text-[15px] leading-relaxed text-sub max-w-[32ch]">
            {t('login.intro')}
          </p>

          {/* Darunter: das Login in einer weissen Karte */}
          <div className="mt-2 rounded-2xl bg-card border border-line shadow-card p-6">
            {sent ? (
              // Nach dem Absenden: Bestätigung statt Formular
              <div className="text-center py-2">
                <div className="text-[12px] font-semibold uppercase tracking-[0.9px] text-pine">
                  {t('login.sentLabel')}
                </div>
                <p className="font-serif text-[18px] font-medium text-ink mt-3 leading-snug">
                  {t('login.sentTitle')}
                </p>
                <p className="text-[14px] text-sub mt-2 leading-relaxed">
                  {/* Trans: wie t(), kann aber die E-Mail-Adresse mitten im
                      Satz einsetzen und das <strong> darin gestalten */}
                  <Trans
                    i18nKey="login.sentBody"
                    values={{ email }}
                    components={{
                      strong: <span className="text-ink font-medium" />,
                    }}
                  />
                </p>
              </div>
            ) : (
              // Das Formular: E-Mail-Feld + Knopf
              <form onSubmit={handleSubmit}>
                <label
                  htmlFor="email"
                  className="block text-[12px] font-semibold uppercase tracking-[0.9px] text-mut mb-2"
                >
                  {t('login.emailLabel')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-mut outline-none focus:border-pine"
                />

                {/* Fehlermeldung, nur falls nötig */}
                {error && (
                  <p className="text-[13px] text-bordeaux mt-2 leading-relaxed">
                    {error === 'rate' ? t('login.errorRate') : t('login.error')}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full mt-4 rounded-full bg-pine px-6 py-3.5 text-[15px] font-semibold text-white shadow-card active:bg-ink transition-colors disabled:opacity-60"
                >
                  {sending ? t('login.submitting') : t('login.submit')}
                </button>

                <p className="text-[12px] text-mut mt-4 text-center leading-relaxed">
                  {t('login.noPassword')}
                </p>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Login
