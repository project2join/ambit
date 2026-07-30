/*
  Herzstück der App: entscheidet, wer was sieht.
  - Nicht eingeloggt → nur der Login-Bildschirm
  - Eingeloggt, Profil unvollständig → Onboarding
  - Eingeloggt mit fertigem Profil → die App mit Navigation
*/
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from './lib/supabase'
import { loadProfile } from './lib/profile'
import Login from './Login'
import Onboarding from './onboarding/Onboarding'
import MainShell from './MainShell'
import { Card } from './components/UI'

function App() {
  const { t } = useTranslation()

  // session = die aktuelle Anmeldung (null heisst: niemand eingeloggt)
  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  // Das Profil des eingeloggten Nutzers
  const [profile, setProfile] = useState(null)
  const [profileState, setProfileState] = useState('loading') // loading | ready | error

  // Mit welchem Tab die App nach dem Onboarding startet
  const [startTab, setStartTab] = useState('plans')

  useEffect(() => {
    // Beim Start: Ist schon jemand eingeloggt? (z. B. von letztem Besuch)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionLoading(false)
    })

    // Zuhören, ob sich jemand ein- oder ausloggt
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      }
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  // Sobald jemand eingeloggt ist: das Profil aus der Datenbank laden
  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileState('loading')
      return
    }
    loadProfile(session.user.id).then(({ profile, error }) => {
      if (error) {
        console.error('Profil laden fehlgeschlagen:', error.message)
        setProfileState('error')
      } else {
        setProfile(profile)
        setProfileState('ready')
      }
    })
  }, [session])

  // Noch am Prüfen — kurz nichts anzeigen (verhindert Aufblitzen des Logins)
  if (sessionLoading) {
    return <div className="min-h-dvh bg-paper" />
  }

  // Nicht eingeloggt → ausschliesslich der Login-Bildschirm
  if (!session) {
    return <Login />
  }

  // Profil lädt noch
  if (profileState === 'loading') {
    return <div className="min-h-dvh bg-paper" />
  }

  // Datenbank noch nicht eingerichtet (setup.sql fehlt)
  if (profileState === 'error') {
    return (
      <div className="min-h-dvh bg-paper flex items-center justify-center px-5">
        <Card className="max-w-[350px] text-center">
          <div className="font-serif text-[20px] font-semibold text-ink">
            {t('setupError.title')}
          </div>
          <p className="text-[14px] text-sub mt-2 leading-relaxed">
            {t('setupError.body')}
          </p>
        </Card>
      </div>
    )
  }

  // Eingeloggt, aber Onboarding noch nicht abgeschlossen
  if (!profile?.onboarding_done) {
    return (
      <Onboarding
        user={session.user}
        profile={profile}
        onDone={(tab) => {
          setStartTab(tab)
          // Profil neu laden, damit die App den fertigen Stand hat
          loadProfile(session.user.id).then(({ profile }) => setProfile(profile))
        }}
      />
    )
  }

  // Eingeloggt mit fertigem Profil → die richtige App
  return (
    <MainShell
      user={session.user}
      profile={profile}
      onProfileChange={setProfile}
      initialTab={startTab}
    />
  )
}

export default App
