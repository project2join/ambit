/*
  Herzstück der App: entscheidet, wer was sieht.
  - Nicht eingeloggt → nur der Login-Bildschirm
  - Eingeloggt → vorerst eine leere Seite mit E-Mail und Logout-Knopf
*/
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'

function App() {
  // session = die aktuelle Anmeldung (null heisst: niemand eingeloggt)
  const [session, setSession] = useState(null)
  // Beim allerersten Laden wissen wir noch nicht, ob jemand eingeloggt ist
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Beim Start: Ist schon jemand eingeloggt? (z. B. von letztem Besuch)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Danach: zuhören, ob sich jemand ein- oder ausloggt,
    // damit die Seite sofort umschaltet
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      }
    )

    // Aufräumen, wenn die App geschlossen wird
    return () => listener.subscription.unsubscribe()
  }, [])

  // Abmelden: Supabase vergisst die Anmeldung, Login-Screen erscheint wieder
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // Noch am Prüfen — kurz nichts anzeigen (verhindert Aufblitzen des Logins)
  if (loading) {
    return <div className="min-h-dvh bg-paper" />
  }

  // Nicht eingeloggt → ausschliesslich der Login-Bildschirm
  if (!session) {
    return <Login />
  }

  // Eingeloggt → vorerst leere Seite mit E-Mail und Logout
  return (
    <div className="min-h-dvh bg-paper flex justify-center">
      <div className="w-full max-w-[390px] flex flex-col">
        <header className="px-5 pt-5 pb-3 flex items-center justify-between">
          <span className="font-serif text-[24px] font-medium tracking-[0.2px] text-ink">
            Ambit
          </span>
          <button
            onClick={handleLogout}
            className="text-[12px] font-semibold text-sub bg-card border border-line rounded-full px-4 py-2"
          >
            Abmelden
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center gap-2 px-5 pb-16 text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.9px] text-mut">
            Eingeloggt als
          </div>
          <p className="font-serif text-[18px] font-medium text-ink">
            {session.user.email}
          </p>
        </main>
      </div>
    </div>
  )
}

export default App
