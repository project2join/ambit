/*
  Der «Pläne»-Tab: die Liste aller offenen Pläne als Karten,
  gestaltet nach dem Prototyp.

  Wichtig: Die Sichtbarkeits-Logik (Alter, Geschlecht, verifiziert,
  Blockierungen) läuft in der Datenbank selbst (siehe
  supabase/setup2-plaene.sql) — unpassende Pläne kommen hier gar nie an.
  Die Kategorie-Chips oben grenzen die Liste nur vorübergehend ein,
  sie filtern nie dauerhaft und schliessen niemanden aus.
*/
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Card, Chip } from '../components/UI'
import { ShieldIcon } from '../components/Icons'
import { CATEGORY_IDS } from '../data/profileOptions'

// Die Plätze-Anzeige mit Punkten (wie im Prototyp)
function SpotDots({ spots, taken }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-[5px]">
      {Array.from({ length: spots }).map((_, i) => (
        <span
          key={i}
          className={
            'w-[9px] h-[9px] rounded-full border-[1.5px] border-pine ' +
            (i < taken ? 'bg-pine' : 'bg-transparent')
          }
        />
      ))}
      <span className="text-[12px] text-sub ml-1">
        {t('plans.freeSpots', { free: spots - taken, total: spots })}
      </span>
    </div>
  )
}

// Rundes Profilbild: erstes Foto, sonst Kreis mit Anfangsbuchstabe
function Avatar({ owner }) {
  const photo = owner?.photo_urls?.[0]
  if (photo) {
    return <img src={photo} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div className="w-11 h-11 rounded-full bg-pine-soft flex items-center justify-center font-serif font-semibold text-pine flex-shrink-0">
      {(owner?.name || '?')[0]}
    </div>
  )
}

// Die Zeile «sichtbar für: …» aus den Plan-Filtern zusammensetzen
function filterLine(plan, t) {
  const parts = []
  if (plan.age_min || plan.age_max) {
    parts.push(`${plan.age_min ?? 18}–${plan.age_max ?? '65+'}`)
  } else {
    parts.push(t('plans.everyone'))
  }
  if (plan.gender_filter === 'women') parts.push(t('plans.genderWomen'))
  if (plan.gender_filter === 'men') parts.push(t('plans.genderMen'))
  if (plan.verified_only) parts.push(t('plans.verifiedOnly'))
  return parts.join(' · ')
}

function PlaeneTab({ user, onCreate }) {
  const { t } = useTranslation()

  const [plans, setPlans] = useState(null) // null = lädt noch
  const [owners, setOwners] = useState({}) // Infos zu den Erstellenden
  const [catFilter, setCatFilter] = useState('alle')

  // Beim Öffnen des Tabs: Pläne + Infos zu den Erstellenden laden
  useEffect(() => {
    async function load() {
      const { data: planRows, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Pläne laden fehlgeschlagen:', error.message)
        setPlans([])
        return
      }

      // Name, Alter und Foto der Erstellenden aus der öffentlichen
      // Profil-Sicht holen (nur die erlaubten Felder)
      const ownerIds = [...new Set(planRows.map((p) => p.owner))]
      if (ownerIds.length > 0) {
        const { data: ownerRows } = await supabase
          .from('public_profiles')
          .select('id, name, age, photo_urls')
          .in('id', ownerIds)
        const map = {}
        for (const o of ownerRows || []) map[o.id] = o
        setOwners(map)
      }
      setPlans(planRows)
    }
    load()
  }, [])

  // Chips grenzen nur die Anzeige ein — nie dauerhaft
  const visible =
    plans === null
      ? []
      : catFilter === 'alle'
        ? plans
        : plans.filter((p) => p.category === catFilter)

  return (
    <div className="px-[18px] py-4 pb-6">
      {/* Kategorie-Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3.5">
        <Chip active={catFilter === 'alle'} onClick={() => setCatFilter('alle')}>
          {t('plans.all')}
        </Chip>
        {CATEGORY_IDS.map((c) => (
          <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
            {t(`categories.${c}`)}
          </Chip>
        ))}
      </div>

      {/* Noch am Laden: kurz nichts zeigen */}
      {plans === null && null}

      {/* Leerer Feed = Einladung, nie Leere */}
      {plans !== null && visible.length === 0 && (
        <Card className="text-center py-8 px-6">
          <p className="font-serif text-[22px] leading-snug font-semibold text-ink">
            {t('plans.emptyTitle')}
          </p>
          <p className="text-[14px] text-sub mt-2 leading-relaxed">
            {t('plans.emptyBody')}
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-5 rounded-full bg-pine px-6 py-3 text-[14px] font-semibold text-white shadow-card active:bg-ink transition-colors"
          >
            {t('plans.emptyButton')}
          </button>
        </Card>
      )}

      {/* Die Plan-Karten */}
      {visible.map((plan) => {
        const isMine = plan.owner === user.id
        const owner = owners[plan.owner]
        return (
          <Card key={plan.id} className="mb-3 p-4">
            {/* Eigener Plan: kleines grünes Label */}
            {isMine && (
              <div className="text-[12px] font-semibold uppercase tracking-[0.3px] text-pine mb-2">
                {t('plans.yourPlan')}
              </div>
            )}

            {/* Kopfzeile: Bild, Name, Kategorie, Zeitpunkt */}
            <div className="flex items-center gap-3">
              <Avatar owner={owner} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-ink">
                  {owner ? `${owner.name}, ${owner.age}` : '…'}
                </div>
                <div className="text-[12px] text-mut flex items-center gap-1 flex-wrap">
                  {t(`categories.${plan.category}`)}
                  {plan.when_text && <> · {plan.when_text}</>}
                  {plan.flexible && (
                    <span className="text-[10.5px] font-bold tracking-[0.5px] uppercase text-sub bg-paper border border-line px-[7px] py-[2px] rounded-full ml-0.5">
                      {t('plans.flexBadge')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Der Plan-Text in Anführungszeichen, Fraunces */}
            <p className="font-serif text-[17px] font-medium leading-[1.35] text-ink my-3">
              «{plan.text}»
            </p>

            {/* Plätze + Sichtbarkeit */}
            <SpotDots spots={plan.spots} taken={plan.taken} />
            <div className="text-[11px] text-mut mt-1.5 flex items-center gap-1">
              <ShieldIcon size={11} />
              {t('plans.visibleFor', { filters: filterLine(plan, t) })}
            </div>
          </Card>
        )
      })}

      {/* Hinweis am Ende der Liste */}
      {visible.length > 0 && (
        <p className="text-[12px] text-mut text-center px-5 pt-2 leading-relaxed">
          {t('plans.footer')}
        </p>
      )}
    </div>
  )
}

export default PlaeneTab
