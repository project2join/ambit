/*
  Der «Pläne»-Tab: Feed aller sichtbaren Pläne + die ganze Anfrage-Mechanik.

  - Eigene Pläne stehen in «Alle» zuoberst; der Chip «Meine» zeigt nur sie.
  - Fremde Pläne haben den «Anfragen»-Knopf (bei flexiblen Plänen wählt
    man dabei die Tage, die passen).
  - Der Host sieht Anfragen mit Mini-Profil und entscheidet: Haken oder X.
  - Sanfter Korb: Abgelehnte sehen nur «Plan ist voll» — nie eine Ablehnung.
  - Belegte Plätze und offen/voll pflegt die Datenbank automatisch.
*/
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Card, Chip, Label } from '../components/UI'
import { ShieldIcon, CheckIcon, XIcon } from '../components/Icons'
import ProfileSheet from '../components/ProfileSheet'
import { CATEGORY_IDS } from '../data/profileOptions'
import { formatWhen, DAY_IDS, nextDateFor } from '../lib/format'

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
function Avatar({ owner, size = 'w-11 h-11' }) {
  const photo = owner?.photo_urls?.[0]
  if (photo) {
    return <img src={photo} alt="" className={`${size} rounded-full object-cover flex-shrink-0`} />
  }
  return (
    <div
      className={`${size} rounded-full bg-pine-soft flex items-center justify-center font-serif font-semibold text-pine flex-shrink-0`}
    >
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
  const { t, i18n } = useTranslation()

  const [plans, setPlans] = useState(null) // null = lädt noch
  const [profiles, setProfiles] = useState({}) // Infos zu Erstellenden + Anfragenden
  const [myRequests, setMyRequests] = useState({}) // plan_id → meine Anfrage
  const [incoming, setIncoming] = useState({}) // plan_id → Anfragen auf meine Pläne
  const [catFilter, setCatFilter] = useState('alle')
  const [sheetProfile, setSheetProfile] = useState(null) // Mini-Profil gross
  const [dayPick, setDayPick] = useState(null) // { planId, days } — Tage wählen vor Anfrage
  const [dateFix, setDateFix] = useState(null) // { planId, day, time } — Host legt Termin fest

  // Alles laden: Pläne, meine Anfragen, Anfragen auf meine Pläne, Profile
  const load = useCallback(async () => {
    const { data: planRows, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Pläne laden fehlgeschlagen:', error.message)
      setPlans([])
      return
    }

    const { data: reqRows } = await supabase
      .from('requests')
      .select('*')
      .eq('requester', user.id)
    const myMap = {}
    for (const r of reqRows || []) myMap[r.plan_id] = r

    const myPlanIds = planRows.filter((p) => p.owner === user.id).map((p) => p.id)
    const incMap = {}
    const requesterIds = []
    if (myPlanIds.length > 0) {
      const { data: incRows } = await supabase
        .from('requests')
        .select('*')
        .in('plan_id', myPlanIds)
        .order('created_at', { ascending: true })
      for (const r of incRows || []) {
        ;(incMap[r.plan_id] = incMap[r.plan_id] || []).push(r)
        requesterIds.push(r.requester)
      }
    }

    const ids = [...new Set([...planRows.map((p) => p.owner), ...requesterIds])]
    const profMap = {}
    if (ids.length > 0) {
      const { data: profRows } = await supabase
        .from('public_profiles')
        .select('id, name, age, photo_urls, about, home_area, languages, categories, prompts')
        .in('id', ids)
      for (const p of profRows || []) profMap[p.id] = p
    }

    setProfiles(profMap)
    setMyRequests(myMap)
    setIncoming(incMap)
    setPlans(planRows)
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  // ---------- Aktionen ----------

  // Anfragen (bei flexiblen Plänen mit den gewählten Tagen)
  async function sendRequest(plan, days = []) {
    const existing = myRequests[plan.id]
    if (existing) {
      // Nach einer früheren Absage: dieselbe Anfrage wieder öffnen
      await supabase
        .from('requests')
        .update({ status: 'pending', available_days: days, needs_reconfirm: false })
        .eq('id', existing.id)
    } else {
      const { error } = await supabase
        .from('requests')
        .insert({ plan_id: plan.id, requester: user.id, available_days: days })
      if (error) console.error('Anfrage fehlgeschlagen:', error.message)
    }
    setDayPick(null)
    load()
  }

  async function acceptRequest(req) {
    await supabase.from('requests').update({ status: 'accepted' }).eq('id', req.id)
    load()
  }

  // Sanfter Korb: intern «declined», nach aussen nur «Plan ist voll»
  async function declineRequest(req) {
    await supabase.from('requests').update({ status: 'declined' }).eq('id', req.id)
    load()
  }

  async function cancelJoin(req) {
    if (!window.confirm(t('requests.cancelConfirm'))) return
    await supabase
      .from('requests')
      .update({ status: 'cancelled', needs_reconfirm: false })
      .eq('id', req.id)
    load()
  }

  async function confirmJoin(req) {
    await supabase.from('requests').update({ needs_reconfirm: false }).eq('id', req.id)
    load()
  }

  // Host legt bei einem flexiblen Plan den Termin fest → wird fixer Plan,
  // alle Angenommenen werden um Zusage gebeten
  async function fixDate(plan, dayId, time) {
    const when = nextDateFor(dayId, time)
    await supabase
      .from('plans')
      .update({ is_flexible: false, when_at: when.toISOString(), time_window: null })
      .eq('id', plan.id)
    await supabase
      .from('requests')
      .update({ needs_reconfirm: true })
      .eq('plan_id', plan.id)
      .eq('status', 'accepted')
    setDateFix(null)
    load()
  }

  async function deletePlan(id) {
    if (!window.confirm(t('plans.deleteConfirm'))) return
    const { error } = await supabase.from('plans').delete().eq('id', id)
    if (!error) setPlans((list) => list.filter((p) => p.id !== id))
  }

  // ---------- Anzeige ----------

  // Chips grenzen nur die Anzeige ein — nie dauerhaft
  const filtered =
    plans === null
      ? []
      : catFilter === 'alle'
        ? plans
        : catFilter === 'meine'
          ? plans.filter((p) => p.owner === user.id)
          : plans.filter((p) => p.category === catFilter)

  // Eigene Pläne zuoberst, damit Anfragen nie untergehen
  const visible = [
    ...filtered.filter((p) => p.owner === user.id),
    ...filtered.filter((p) => p.owner !== user.id),
  ]

  return (
    <div className="px-[18px] py-4 pb-6">
      {/* Filter-Chips: Alle · Meine · Kategorien */}
      <div className="flex gap-2 overflow-x-auto pb-3.5">
        <Chip active={catFilter === 'alle'} onClick={() => setCatFilter('alle')}>
          {t('plans.all')}
        </Chip>
        <Chip active={catFilter === 'meine'} onClick={() => setCatFilter('meine')}>
          {t('plans.mine')}
        </Chip>
        {CATEGORY_IDS.map((c) => (
          <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
            {t(`categories.${c}`)}
          </Chip>
        ))}
      </div>

      {/* Leerer Feed = Einladung, nie Leere */}
      {plans !== null && visible.length === 0 && (
        <Card className="text-center py-8 px-6">
          <p className="font-serif text-[22px] leading-snug font-semibold text-ink">
            {t('plans.emptyTitle')}
          </p>
          <p className="text-[14px] text-sub mt-2 leading-relaxed">{t('plans.emptyBody')}</p>
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
        const owner = profiles[plan.owner]
        const when = formatWhen(plan, t, i18n.language)
        const myReq = myRequests[plan.id]
        // Sanfter Korb: für Abgelehnte fühlt sich der Plan einfach voll an
        const softFull = myReq?.status === 'declined'
        const reallyFull = plan.status === 'full'

        const reqs = incoming[plan.id] || []
        const pending = reqs.filter((r) => r.status === 'pending')
        const accepted = reqs.filter((r) => r.status === 'accepted')
        const cancelled = reqs.filter((r) => r.status === 'cancelled')

        return (
          <Card key={plan.id} className="mb-3 p-4">
            {/* Eigener Plan: grünes Label, Anfrage-Zähler, Löschen */}
            {isMine && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.3px] text-pine">
                    {t('plans.yourPlan')}
                  </div>
                  {pending.length > 0 && (
                    <span className="text-[12px] font-semibold text-bordeaux-deep bg-bordeaux-soft px-2.5 py-0.5 rounded-full">
                      {t('requests.requestCount', { count: pending.length })}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deletePlan(plan.id)}
                  className="text-[12px] font-semibold text-mut"
                >
                  {t('plans.delete')}
                </button>
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
                  {when && <> · {when}</>}
                  {plan.is_flexible && (
                    <span className="text-[10.5px] font-bold tracking-[0.5px] uppercase text-sub bg-paper border border-line px-[7px] py-[2px] rounded-full ml-0.5">
                      {t('plans.flexBadge')}
                    </span>
                  )}
                  {plan.alcohol_free && <> · {t('plans.alcoholFree')}</>}
                </div>
              </div>
            </div>

            {/* Der Plan-Text in Anführungszeichen, Fraunces */}
            <p className="font-serif text-[17px] font-medium leading-[1.35] text-ink my-3">
              «{plan.text}»
            </p>

            {/* Plätze + Sichtbarkeit + Anfrage-Knopf */}
            <div className="flex justify-between items-end gap-3">
              <div>
                {!softFull && <SpotDots spots={plan.spots} taken={plan.taken} />}
                <div className="text-[11px] text-mut mt-1.5 flex items-center gap-1">
                  <ShieldIcon size={11} />
                  {t('plans.visibleFor', { filters: filterLine(plan, t) })}
                </div>
              </div>

              {/* Der Knopf auf fremden Plänen — je nach Stand */}
              {!isMine && (
                <>
                  {myReq?.status === 'accepted' ? null : myReq?.status === 'pending' ? (
                    <span className="rounded-full bg-pine-soft text-pine px-4 py-2.5 text-[13px] font-semibold flex-shrink-0">
                      {t('requests.requested')}
                    </span>
                  ) : softFull || reallyFull ? (
                    <span className="rounded-full bg-paper border border-line text-mut px-4 py-2.5 text-[13px] font-semibold flex-shrink-0">
                      {t('requests.planFull')}
                    </span>
                  ) : dayPick?.planId === plan.id ? null : (
                    <button
                      type="button"
                      onClick={() =>
                        plan.is_flexible
                          ? setDayPick({ planId: plan.id, days: [] })
                          : sendRequest(plan)
                      }
                      className="rounded-full bg-pine text-white px-[18px] py-2.5 text-[14px] font-semibold flex-shrink-0"
                    >
                      {t('requests.request')}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Flexibler Plan: Tage antippen, dann Anfrage senden */}
            {!isMine && dayPick?.planId === plan.id && (
              <div className="mt-3 pt-3 border-t border-line">
                <div className="text-[12px] text-mut mb-2">{t('requests.pickDays')}</div>
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_IDS.map((d) => (
                    <Chip
                      key={d}
                      active={dayPick.days.includes(d)}
                      onClick={() =>
                        setDayPick({
                          ...dayPick,
                          days: dayPick.days.includes(d)
                            ? dayPick.days.filter((x) => x !== d)
                            : [...dayPick.days, d],
                        })
                      }
                    >
                      {t(`days.${d}`)}
                    </Chip>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => sendRequest(plan, dayPick.days)}
                  disabled={dayPick.days.length === 0}
                  className="mt-3 rounded-full bg-pine text-white px-[18px] py-2.5 text-[14px] font-semibold disabled:opacity-40"
                >
                  {t('requests.send')}
                </button>
              </div>
            )}

            {/* Angenommen: Bestätigung mit Zeitpunkt + Absagen */}
            {!isMine && myReq?.status === 'accepted' && (
              <div className="mt-3 pt-3 border-t border-line">
                {myReq.needs_reconfirm ? (
                  // Der Host hat den Termin neu festgelegt → zusagen oder absagen
                  <>
                    <p className="text-[14px] text-ink font-medium">
                      {t('requests.dateSet', { when })}
                    </p>
                    <div className="flex gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={() => confirmJoin(myReq)}
                        className="rounded-full bg-pine text-white px-[18px] py-2.5 text-[13px] font-semibold"
                      >
                        {t('requests.confirm')}
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelJoin(myReq)}
                        className="rounded-full border border-line bg-card text-sub px-[18px] py-2.5 text-[13px] font-semibold"
                      >
                        {t('requests.cancel')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13.5px] font-semibold text-pine flex items-center gap-1.5">
                      <CheckIcon size={15} />
                      {when ? t('requests.youreIn', { when }) : t('requests.joined')}
                    </span>
                    <button
                      type="button"
                      onClick={() => cancelJoin(myReq)}
                      className="text-[12px] font-semibold text-mut flex-shrink-0"
                    >
                      {t('requests.cancel')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ---------- Host-Bereich: Anfragen verwalten ---------- */}
            {isMine && (
              <div className="mt-3 pt-3 border-t border-line">
                {/* Wer ist schon dabei */}
                {accepted.length > 0 && (
                  <div className="text-[12.5px] text-sub mb-2">
                    {t('requests.with', {
                      names: accepted
                        .map((r) => profiles[r.requester]?.name || '…')
                        .join(', '),
                    })}
                  </div>
                )}

                {/* Flexibler Plan: Verfügbarkeiten + Termin festlegen */}
                {plan.is_flexible && accepted.length > 0 && (
                  <div className="bg-paper rounded-xl p-3 mb-2.5">
                    <Label className="text-[11px] mb-1.5">{t('requests.availability')}</Label>
                    {accepted.map((r) => (
                      <div key={r.id} className="text-[13.5px] text-ink">
                        {profiles[r.requester]?.name || '…'} ·{' '}
                        {(r.available_days || []).map((d) => t(`days.${d}`)).join(', ')}
                      </div>
                    ))}
                    {dateFix?.planId === plan.id ? (
                      <div className="mt-2.5">
                        <div className="flex gap-1.5 flex-wrap">
                          {DAY_IDS.map((d) => (
                            <Chip
                              key={d}
                              active={dateFix.day === d}
                              onClick={() => setDateFix({ ...dateFix, day: d })}
                            >
                              {t(`days.${d}`)}
                            </Chip>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center mt-2.5">
                          <input
                            type="time"
                            value={dateFix.time}
                            onChange={(e) => setDateFix({ ...dateFix, time: e.target.value })}
                            className="rounded-xl border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-pine"
                          />
                          <button
                            type="button"
                            onClick={() => fixDate(plan, dateFix.day, dateFix.time)}
                            disabled={!dateFix.day}
                            className="rounded-full bg-pine text-white px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
                          >
                            {t('requests.setDate')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDateFix({ planId: plan.id, day: null, time: '19:00' })}
                        className="mt-2 rounded-full bg-ink text-white px-4 py-2 text-[12.5px] font-semibold"
                      >
                        {t('requests.setDate')}
                      </button>
                    )}
                  </div>
                )}

                {/* Offene Anfragen mit Mini-Profil und Haken/X */}
                {pending.map((r) => {
                  const person = profiles[r.requester]
                  return (
                    <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-b-0">
                      <button
                        type="button"
                        onClick={() => person && setSheetProfile(person)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <Avatar owner={person} size="w-10 h-10" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-ink">
                            {person ? `${person.name}, ${person.age}` : '…'}
                          </div>
                          <div className="text-[12px] text-sub truncate">
                            {plan.is_flexible && r.available_days?.length > 0
                              ? (r.available_days || []).map((d) => t(`days.${d}`)).join(', ')
                              : person?.about}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => acceptRequest(r)}
                        aria-label={t('requests.accept')}
                        className="w-9 h-9 rounded-full bg-pine text-white flex items-center justify-center flex-shrink-0"
                      >
                        <CheckIcon size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => declineRequest(r)}
                        aria-label={t('requests.declineSoft')}
                        className="w-9 h-9 rounded-full bg-card border border-line text-mut flex items-center justify-center flex-shrink-0"
                      >
                        <XIcon size={17} />
                      </button>
                    </div>
                  )
                })}

                {/* Freundlicher Hinweis bei Absagen — nie negativ */}
                {cancelled.map((r) => (
                  <div key={r.id} className="text-[12px] text-mut py-1.5">
                    {t('requests.cancelledNote', {
                      name: profiles[r.requester]?.name || '…',
                    })}
                  </div>
                ))}

                {pending.length === 0 && (
                  <div className="text-[12px] text-mut">{t('requests.noRequests')}</div>
                )}
              </div>
            )}
          </Card>
        )
      })}

      {/* Mini-Profil in Grossansicht */}
      {sheetProfile && (
        <ProfileSheet profile={sheetProfile} onClose={() => setSheetProfile(null)} />
      )}
    </div>
  )
}

export default PlaeneTab
