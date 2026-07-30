/*
  Login-Bildschirm — das Einzige, was nicht eingeloggte Besucher sehen.
  Ablauf: E-Mail eingeben → Supabase schickt einen Magic Link per Mail →
  ein Klick auf den Link loggt ein. Kein Passwort nötig.
*/
import { useState } from 'react'
import { supabase } from './lib/supabase'

function Login() {
  // Merkt sich, was gerade passiert:
  const [email, setEmail] = useState('') // was im Feld steht
  const [sending, setSending] = useState(false) // wird gerade gesendet?
  const [sent, setSent] = useState(false) // wurde der Link verschickt?
  const [error, setError] = useState('') // Fehlermeldung, falls etwas schiefgeht

  // Wird ausgeführt, wenn man auf «Link schicken» drückt
  async function handleSubmit(e) {
    e.preventDefault() // verhindert, dass die Seite neu lädt
    setError('')
    setSending(true)

    // Supabase bitten, den Magic Link zu verschicken.
    // emailRedirectTo: Nach dem Klick im Mail landet man wieder in unserer App.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })

    setSending(false)
    if (error) {
      setError('Das hat leider nicht geklappt. Stimmt die E-Mail-Adresse?')
    } else {
      setSent(true) // Erfolgsmeldung zeigen
    }
  }

  return (
    <div className="min-h-dvh bg-paper flex justify-center">
      <div className="w-full max-w-[390px] flex flex-col justify-center px-5 pb-16">
        {/* Wortmarke und Tagline */}
        <div className="text-center mb-10">
          <div className="font-serif text-[34px] font-medium tracking-[0.2px] text-ink">
            Ambit
          </div>
          <p className="mt-3 text-[15px] text-sub">
            Du gehst eh. Nimm jemanden mit.
          </p>
        </div>

        {/* Weisse Karte mit dem Formular */}
        <div className="rounded-2xl bg-card border border-line shadow-card p-6">
          {sent ? (
            // Nach dem Absenden: Bestätigung statt Formular
            <div className="text-center py-2">
              <div className="text-[12px] font-semibold uppercase tracking-[0.9px] text-pine">
                Link verschickt
              </div>
              <p className="font-serif text-[18px] font-medium text-ink mt-3 leading-snug">
                Schau in dein Postfach.
              </p>
              <p className="text-[14px] text-sub mt-2 leading-relaxed">
                Wir haben dir einen Anmelde-Link an{' '}
                <span className="text-ink font-medium">{email}</span> geschickt.
                Ein Klick darauf, und du bist drin.
              </p>
            </div>
          ) : (
            // Das Formular: E-Mail-Feld + Knopf
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="email"
                className="block text-[12px] font-semibold uppercase tracking-[0.9px] text-mut mb-2"
              >
                Deine E-Mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.ch"
                className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-mut outline-none focus:border-pine"
              />

              {/* Fehlermeldung, nur falls nötig */}
              {error && (
                <p className="text-[13px] text-bordeaux mt-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full mt-4 rounded-full bg-pine px-6 py-3.5 text-[15px] font-semibold text-white shadow-card active:bg-ink transition-colors disabled:opacity-60"
              >
                {sending ? 'Wird geschickt…' : 'Anmelde-Link schicken'}
              </button>

              <p className="text-[12px] text-mut mt-4 text-center leading-relaxed">
                Kein Passwort nötig — du bekommst einen Link per Mail.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
