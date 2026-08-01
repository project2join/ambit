/*
  Der Rahmen der eingeloggten App: Kopfzeile (mit Verbindungen-Symbol),
  Inhalt, Navigation unten.
*/
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from './lib/supabase'
import BottomNav from './components/BottomNav'
import Verbindungen from './components/Verbindungen'
import { UsersIcon } from './components/Icons'
import IchTab from './tabs/IchTab'
import PlaeneTab from './tabs/PlaeneTab'
import ErstellenTab from './tabs/ErstellenTab'

// Platzhalter für die Tabs, die wir als Nächstes bauen
function Placeholder() {
  const { t } = useTranslation()
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 px-8 text-center">
      <div className="font-serif text-[24px] font-semibold text-ink">
        {t('placeholder.title')}
      </div>
      <p className="text-[14px] text-sub">{t('placeholder.body')}</p>
    </div>
  )
}

function MainShell({ user, profile, onProfileChange, initialTab = 'plans' }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState(initialTab)
  const [connOpen, setConnOpen] = useState(false) // Verbindungen offen?
  const [badge, setBadge] = useState(0) // Zähler für Neuigkeiten

  // Neuigkeiten zählen: offene Anfragen auf meine Pläne +
  // neu festgelegte Termine, die auf meine Zusage warten
  const loadBadge = useCallback(async () => {
    try {
      const { data: myPlans } = await supabase
        .from('plans')
        .select('id')
        .eq('owner', user.id)
      const ids = (myPlans || []).map((p) => p.id)

      let pendingCount = 0
      if (ids.length > 0) {
        const { count } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .in('plan_id', ids)
          .eq('status', 'pending')
        pendingCount = count || 0
      }

      const { count: reconfirmCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('requester', user.id)
        .eq('status', 'accepted')
        .eq('needs_reconfirm', true)

      setBadge(pendingCount + (reconfirmCount || 0))
    } catch {
      setBadge(0)
    }
  }, [user.id])

  useEffect(() => {
    loadBadge()
  }, [loadBadge, tab, connOpen])

  return (
    <div className="min-h-dvh bg-paper flex justify-center">
      {/* h-dvh + flex-col: Inhalt scrollt, Kopf und Navigation bleiben stehen */}
      <div className="w-full max-w-[390px] h-dvh flex flex-col">
        <header className="px-5 pt-5 pb-3 flex-shrink-0 flex items-center justify-between">
          <span className="font-serif text-[24px] font-medium tracking-[0.2px] text-ink">
            {t('brand.name')}
          </span>

          {/* Verbindungen-Symbol mit Zähler bei Neuigkeiten */}
          <button
            type="button"
            onClick={() => setConnOpen(true)}
            aria-label={t('connections.title')}
            className="relative w-10 h-10 rounded-full bg-card border border-line text-ink flex items-center justify-center"
          >
            <UsersIcon size={19} />
            {badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-bordeaux text-white text-[10.5px] font-bold flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {tab === 'me' && (
            <IchTab user={user} profile={profile} onChange={onProfileChange} />
          )}
          {tab === 'plans' && (
            <PlaeneTab user={user} onCreate={() => setTab('create')} />
          )}
          {tab === 'create' && (
            <ErstellenTab user={user} onPublished={() => setTab('plans')} />
          )}
          {tab !== 'me' && tab !== 'plans' && tab !== 'create' && <Placeholder />}
        </div>

        <BottomNav tab={tab} onChange={setTab} />

        {/* Verbindungen-Übersicht (Overlay) */}
        {connOpen && (
          <Verbindungen
            user={user}
            onClose={() => {
              setConnOpen(false)
              // Nach dem Schliessen den Feed frisch laden (z. B. nach Absage)
              if (tab === 'plans') {
                setTab('')
                setTimeout(() => setTab('plans'), 0)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

export default MainShell
