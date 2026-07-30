/*
  Die Navigation unten: fünf Tabs wie im Prototyp.
  Der Plus-Knopf in der Mitte ist erhöht und tannengrün.
*/
import { useTranslation } from 'react-i18next'
import { HomeIcon, CompassIcon, PlusIcon, MapPinIcon, UserIcon } from './Icons'

const TABS = [
  { id: 'plans', labelKey: 'nav.plans', Icon: HomeIcon },
  { id: 'discover', labelKey: 'nav.discover', Icon: CompassIcon },
  { id: 'create', labelKey: null, Icon: PlusIcon }, // der Plus-Knopf
  { id: 'places', labelKey: 'nav.places', Icon: MapPinIcon },
  { id: 'me', labelKey: 'nav.me', Icon: UserIcon },
]

function BottomNav({ tab, onChange }) {
  const { t } = useTranslation()

  return (
    <nav className="flex justify-around items-center px-2 pt-2.5 pb-4 bg-card border-t border-line flex-shrink-0">
      {TABS.map(({ id, labelKey, Icon }) => {
        const active = tab === id

        // Der mittlere Plus-Knopf: rund, erhöht, grün
        if (id === 'create') {
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-label={t('nav.create')}
              className={
                '-mt-7 w-[50px] h-[50px] rounded-full text-white flex items-center justify-center shadow-[0_6px_16px_rgba(51,71,60,0.30)] transition-colors ' +
                (active ? 'bg-ink' : 'bg-pine')
              }
            >
              <PlusIcon size={24} strokeWidth={2} />
            </button>
          )
        }

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={
              'flex flex-col items-center gap-[3px] px-2.5 py-1 ' +
              (active ? 'text-ink' : 'text-mut')
            }
          >
            <Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
            <span className={'text-[10.5px] ' + (active ? 'font-bold' : 'font-medium')}>
              {t(labelKey)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
