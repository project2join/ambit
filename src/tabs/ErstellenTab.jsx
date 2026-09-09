/*
  «Plan erstellen» — der Screen hinter dem grünen Plus-Knopf,
  gebaut nach dem Prototyp:
  Text → Kategorie → Wann (Fix mit Datum + grober Tageszeit ODER
  Flexibel mit Zeitfenster) → Plätze-Stepper → alkoholfrei →
  «Wer sieht diesen Plan?» (Altersspanne, Geschlecht, nur verifiziert)
  → Veröffentlichen.

  Bei «Fix» wird bewusst nur die Tageszeit abgefragt, nie die genaue
  Uhrzeit — die legt der Host erst im Plan-Chat fest, sobald jemand
  angenommen hat (Schutz vor Stalking: niemand weiss vorab öffentlich,
  dass eine Person um exakt 19:00 an einem bestimmten Ort ist).
*/
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Card, Label, Chip, Toggle } from '../components/UI'
import { ShieldIcon } from '../components/Icons'
import { CATEGORY_IDS } from '../data/profileOptions'

const TIME_WINDOWS = ['this_week', 'weekend', 'next_week']

// Grobe Tageszeit statt genauer Uhrzeit — schützt vor Stalking
// (niemand weiss vorab, dass du z. B. um exakt 19:00 an einem Ort bist).
// Jede Tageszeit hat eine Platzhalter-Uhrzeit fürs Sortieren im
// Hintergrund; angezeigt wird nur das Wort, nie diese Uhrzeit.
export const DAYPART_IDS = ['morning', 'midday', 'afternoon', 'evening']
export const DAYPART_TIMES = {
  morning: '09:00',
  midday: '12:00',
  afternoon: '15:00',
  evening: '19:00',
}

// Aus einem ISO-Zeitstempel das lokale Datum als "YYYY-MM-DD" holen
// (für das <input type="date">-Feld). Nicht einfach die ISO-Zeichenkette
// zerschneiden — das würde bei manchen Uhrzeiten den falschen Tag zeigen.
function toDateInputValue(iso) {
  const d = new Date(iso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ErstellenTab({ user, editPlan, onPublished }) {
  const { t } = useTranslation()
  const isEditing = !!editPlan

  // Wurde die genaue Uhrzeit schon im Chat vereinbart? Dann ist der Plan
  // nicht mehr flexibel und hat keine Tageszeit mehr — nur noch when_at.
  // In diesem Fall lassen wir «Wann» beim Bearbeiten unangetastet: die
  // Uhrzeit gehört dann in den Chat, nicht mehr in dieses Formular.
  const isFinalized = isEditing && !editPlan.is_flexible && !editPlan.daypart

  // Alle Eingaben des Formulars — beim Bearbeiten mit den Werten des
  // bestehenden Plans vorausgefüllt, sonst mit den üblichen Standardwerten.
  const [text, setText] = useState(editPlan?.text || '')
  const [category, setCategory] = useState(editPlan?.category || 'sport')
  const [mode, setMode] = useState(editPlan?.is_flexible ? 'flex' : 'fix')
  const [date, setDate] = useState(
    isEditing && !isFinalized && editPlan.when_at ? toDateInputValue(editPlan.when_at) : ''
  )
  const [daypart, setDaypart] = useState(editPlan?.daypart || '')
  const [timeWindow, setTimeWindow] = useState(editPlan?.time_window || 'this_week')
  const [spots, setSpots] = useState(editPlan?.spots || 2)
  const [alcoholFree, setAlcoholFree] = useState(editPlan?.alcohol_free || false)
  const [ageMin, setAgeMin] = useState(editPlan?.age_min || 18)
  const [ageMax, setAgeMax] = useState(editPlan?.age_max || 65)
  const [gender, setGender] = useState(editPlan?.gender_filter || 'all')
  const [verifiedOnly, setVerifiedOnly] = useState(editPlan?.verified_only || false)

  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState(false)
  const [hasFlexPlan, setHasFlexPlan] = useState(false)

  // Prüfen: Gibt es schon einen flexiblen Plan? (Nur einer aufs Mal erlaubt).
  // Beim Bearbeiten eines eigenen Plans ist das nicht relevant — der
  // bestehende Plan zählt ja nicht als "ein zusätzlicher".
  useEffect(() => {
    if (isEditing) return
    supabase
      .from('plans')
      .select('id')
      .eq('owner', user.id)
      .eq('is_flexible', true)
      .then(({ data }) => setHasFlexPlan((data || []).length > 0))
  }, [user.id, isEditing])

  // Darf veröffentlicht/gespeichert werden?
  const canPublish =
    text.trim().length > 0 &&
    !publishing &&
    (isFinalized ||
      (mode === 'fix' ? date && daypart : isEditing || !hasFlexPlan))

  async function publish() {
    setPublishing(true)
    setError(false)

    // Die gemeinsamen Felder — Wann/Tageszeit kommt gleich dazu
    const payload = {
      category,
      text: text.trim(),
      spots,
      alcohol_free: alcoholFree,
      // Volle Spanne (18–65+) heisst: keine Einschränkung → nichts speichern
      age_min: ageMin > 18 ? ageMin : null,
      age_max: ageMax < 65 ? ageMax : null,
      gender_filter: gender,
      verified_only: verifiedOnly,
    }

    // Ist die Uhrzeit schon im Chat vereinbart, lassen wir when_at/daypart/
    // is_flexible/time_window beim Speichern komplett unangetastet.
    if (!isFinalized) {
      payload.is_flexible = mode === 'flex'
      // Fix: Datum steht fest, aber nur eine grobe Tageszeit — die
      // genaue Uhrzeit bespricht man dann im Chat (Stalking-Schutz).
      // Die Platzhalter-Uhrzeit dient nur der Sortierung im Hintergrund.
      payload.when_at =
        mode === 'fix' ? new Date(`${date}T${DAYPART_TIMES[daypart]}`).toISOString() : null
      payload.daypart = mode === 'fix' ? daypart : null
      // Flexibel: nur das Zeitfenster speichern
      payload.time_window = mode === 'flex' ? timeWindow : null
    }

    const { error } = isEditing
      ? await supabase.from('plans').update(payload).eq('id', editPlan.id).eq('owner', user.id)
      : await supabase.from('plans').insert({ owner: user.id, ...payload })

    setPublishing(false)
    if (error) {
      console.error('Plan speichern fehlgeschlagen:', error.message)
      setError(true)
    } else {
      onPublished() // zurück zum Feed — dort erscheint der Plan
    }
  }

  return (
    <div className="px-[18px] py-4 pb-6">
      {/* Titel */}
      <h1 className="font-serif text-[19px] font-semibold text-ink mb-4">
        {isEditing ? t('create.editTitle') : t('create.title')}
      </h1>

      {/* Der Plan-Text — in Fraunces, wie im Prototyp */}
      <input
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 200))}
        placeholder={t('create.placeholder')}
        className="w-full rounded-[14px] border border-line bg-card px-4 py-[15px] font-serif text-[16px] text-ink placeholder:text-mut outline-none focus:border-pine"
      />
      {/* Sicherheits-Hinweis: keine genaue Adresse/Uhrzeit im Text —
          sonst könnte man verfolgt werden. Bewusst nur ein sanfter
          Hinweis, keine harte Regel (freier Text lässt sich nicht
          zuverlässig prüfen). */}
      <p className="text-[12px] text-mut mt-1.5 leading-relaxed">
        {t('create.textSafetyHint')}
      </p>

      {/* Kategorie */}
      <Label className="mt-[18px] mb-2">{t('create.categoryLabel')}</Label>
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_IDS.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {t(`categories.${c}`)}
          </Chip>
        ))}
      </div>

      {/* Wann: Fix oder Flexibel — beim Bearbeiten eines Plans mit schon
          vereinbarter Uhrzeit lassen wir das ganz weg (siehe Hinweis unten) */}
      {isFinalized ? (
        <>
          <Label className="mt-[18px] mb-2">{t('create.whenLabel')}</Label>
          <p className="text-[12px] text-mut leading-relaxed">
            {t('create.finalizedTimeHint')}
          </p>
        </>
      ) : (
        <>
          <Label className="mt-[18px] mb-2">{t('create.whenLabel')}</Label>
          <div className="flex gap-2 mb-2.5">
            <Chip active={mode === 'fix'} onClick={() => setMode('fix')}>
              {t('create.fix')}
            </Chip>
            <Chip active={mode === 'flex'} onClick={() => setMode('flex')}>
              {t('create.flexible')}
            </Chip>
          </div>

          {mode === 'fix' ? (
            // Fix: Datum + grobe Tageszeit wählen (genaue Uhrzeit kommt
            // erst später im Chat, siehe Sicherheits-Hinweis oben)
            <div>
              <label className="block mb-3">
                <span className="block text-[12px] text-mut mb-1">{t('create.dateLabel')}</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none focus:border-pine"
                />
              </label>
              <span className="block text-[12px] text-mut mb-1.5">{t('create.daypartLabel')}</span>
              <div className="flex gap-2 flex-wrap">
                {DAYPART_IDS.map((d) => (
                  <Chip key={d} active={daypart === d} onClick={() => setDaypart(d)}>
                    {t(`dayparts.${d}`)}
                  </Chip>
                ))}
              </div>
            </div>
          ) : (
            // Flexibel: ein Zeitfenster wählen
            <div className="flex gap-2 flex-wrap">
              {TIME_WINDOWS.map((w) => (
                <Chip key={w} active={timeWindow === w} onClick={() => setTimeWindow(w)}>
                  {t(`create.window.${w}`)}
                </Chip>
              ))}
            </div>
          )}

          <p className="text-[12px] text-mut mt-2 leading-relaxed">
            {mode === 'flex' ? t('create.flexHint') : t('create.fixHint')}
          </p>
          {mode === 'fix' && (
            <p className="text-[12px] text-mut mt-1 leading-relaxed">
              {t('create.fixTimeHint')}
            </p>
          )}

          {/* Schon ein flexibler Plan vorhanden? Dann freundlich stoppen.
              Beim Bearbeiten nicht relevant (der Plan zählt sich nicht selbst mit). */}
          {mode === 'flex' && hasFlexPlan && !isEditing && (
            <p className="text-[13px] text-bordeaux mt-2">{t('create.alreadyFlexible')}</p>
          )}
        </>
      )}

      {/* Plätze-Stepper: 1 bis 5 */}
      <Label className="mt-[18px] mb-2">{t('create.spotsLabel')}</Label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSpots(Math.max(1, spots - 1))}
          className="w-[38px] h-[38px] rounded-full border border-line bg-card text-[18px] text-ink"
        >
          −
        </button>
        {/* bewusst schlicht in der Textschrift — nicht in der Serife */}
        <div className="text-[17px] font-medium text-ink min-w-5 text-center">
          {spots}
        </div>
        <button
          type="button"
          onClick={() => setSpots(Math.min(5, spots + 1))}
          className="w-[38px] h-[38px] rounded-full border border-line bg-card text-[18px] text-ink"
        >
          +
        </button>
      </div>

      {/* Alkoholfrei (optional) */}
      <div className="flex items-center gap-2.5 mt-[18px]">
        <Toggle on={alcoholFree} onClick={() => setAlcoholFree(!alcoholFree)} />
        <span className="text-[14px] text-ink">{t('create.alcoholFreeLabel')}</span>
      </div>
      <p className="text-[12px] text-mut mt-1.5">{t('create.alcoholFreeHint')}</p>

      {/* Wer sieht diesen Plan? */}
      <Card className="mt-5 p-4">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink mb-3">
          <ShieldIcon size={14} className="text-pine" />
          {t('create.visibilityTitle')}
        </div>

        {/* Altersspanne mit Doppel-Schieberegler */}
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="text-[12px] text-mut">{t('create.ageLabel')}</span>
          <span className="font-serif text-[15px] font-bold text-ink">
            {ageMin} – {ageMax === 65 ? '65+' : ageMax} {t('create.ageYears')}
          </span>
        </div>
        <div className="dual-range relative h-[34px] mb-3">
          {/* Grundlinie */}
          <div className="absolute top-[15px] left-0 right-0 h-1 rounded-sm bg-line" />
          {/* Gewählter Bereich (grün) */}
          <div
            className="absolute top-[15px] h-1 rounded-sm bg-pine"
            style={{
              left: `${((ageMin - 18) / 47) * 100}%`,
              right: `${100 - ((ageMax - 18) / 47) * 100}%`,
            }}
          />
          <input
            type="range"
            min="18"
            max="65"
            value={ageMin}
            onChange={(e) => setAgeMin(Math.min(Number(e.target.value), ageMax - 1))}
            aria-label={t('create.ageLabel') + ' min'}
          />
          <input
            type="range"
            min="18"
            max="65"
            value={ageMax}
            onChange={(e) => setAgeMax(Math.max(Number(e.target.value), ageMin + 1))}
            aria-label={t('create.ageLabel') + ' max'}
          />
        </div>

        {/* Geschlecht */}
        <div className="text-[12px] text-mut mb-1.5">{t('create.genderLabel')}</div>
        <div className="flex gap-2 mb-3.5">
          {['all', 'women', 'men'].map((g) => (
            <Chip key={g} active={gender === g} onClick={() => setGender(g)}>
              {t(`orientationList.${g === 'all' ? 'all' : g}`)}
            </Chip>
          ))}
        </div>

        {/* Nur verifizierte Profile */}
        <div className="flex items-center gap-2.5">
          <Toggle on={verifiedOnly} onClick={() => setVerifiedOnly(!verifiedOnly)} />
          <span className="text-[14px] text-ink">{t('create.verifiedOnly')}</span>
        </div>
        {/* Ehrlich sein: solange kaum jemand verifiziert ist, sieht
            fast niemand den Plan */}
        {verifiedOnly && (
          <p className="text-[12px] text-mut mt-1.5 leading-relaxed">
            {t('create.verifiedOnlyHint')}
          </p>
        )}

        <p className="text-[12px] text-mut mt-3 leading-relaxed">
          {t('create.visibilityHint')}
        </p>
      </Card>

      {/* Fehlermeldung, nur falls nötig */}
      {error && <p className="text-[13px] text-bordeaux mt-3">{t('create.publishError')}</p>}

      {/* Veröffentlichen/Speichern — Tannengrün: Pläne sind freundschaftlich */}
      <button
        type="button"
        onClick={publish}
        disabled={!canPublish}
        className="w-full mt-[18px] rounded-full bg-pine px-6 py-[15px] text-[15px] font-semibold text-white disabled:opacity-40"
      >
        {isEditing
          ? publishing
            ? t('create.saving')
            : t('create.save')
          : publishing
            ? t('create.publishing')
            : t('create.publish')}
      </button>

      {/* Nur wenn Text schon steht, aber Datum/Tageszeit fehlen */}
      {!publishing && !isFinalized && text.trim().length > 0 && mode === 'fix' && (!date || !daypart) && (
        <p className="text-[12px] text-mut text-center mt-2">
          {t('create.needDateTime')}
        </p>
      )}
    </div>
  )
}

export default ErstellenTab
