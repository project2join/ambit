/*
  Der Rahmen der eingeloggten App: Kopfzeile, Inhalt, Navigation unten.
  Der «Ich»-Tab ist fertig — die anderen vier sind vorerst Platzhalter.
*/
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BottomNav from './components/BottomNav'
import IchTab from './tabs/IchTab'

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

  return (
    <div className="min-h-dvh bg-paper flex justify-center">
      {/* h-dvh + flex-col: Inhalt scrollt, Kopf und Navigation bleiben stehen */}
      <div className="w-full max-w-[390px] h-dvh flex flex-col">
        <header className="px-5 pt-5 pb-3 flex-shrink-0">
          <span className="font-serif text-[24px] font-medium tracking-[0.2px] text-ink">
            {t('brand.name')}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {tab === 'me' ? (
            <IchTab user={user} profile={profile} onChange={onProfileChange} />
          ) : (
            <Placeholder />
          )}
        </div>

        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </div>
  )
}

export default MainShell
