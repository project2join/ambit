/*
  «Plan erstellen» — der Screen hinter dem grünen Plus-Knopf,
  gebaut nach dem Prototyp:
  Text → Kategorie → Wann (Fix mit Datum/Uhrzeit ODER Flexibel mit
  Zeitfenster) → Plätze-Stepper → alkoholfrei → «Wer sieht diesen Plan?»
  (Altersspanne, Geschlecht, nur verifiziert) → Veröffentlichen.
*/
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Card, Label, Chip, Toggle } from '../components/UI'
import { ShieldIcon } from '../components/Icons'
import { CATEGORY_IDS } from '../data/profileOptions'

const TIME_WINDOWS = ['this_week', 'weekend', 'next_week']

function ErstellenTab({ user, onPublished }) {
  const { t } = useTranslation()

  // Alle Eingaben des Formulars
  const [text, setText] = useState('')
  const [category, setCategory] = useState('sport')
  const [mode, setMode] = useState('fix') // «Fix» ist der Standard
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [timeWindow, setTimeWindow] = useState('this_week')
  const [spots, setSpots] = useState(2)
  const [alcoholFree, setAlcoholFree] = useState(false)
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(65)
  const [gender, setGender] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState(false)
  const [hasFlexPlan, setHasFlexPlan] = useState(false)

  // Prüfen: Gibt es schon einen flexiblen Plan? (Nur einer aufs Mal erlaubt)
  useEffect(() => {
    supabase
      .from('plans')
      .select('id')
      .eq('owner', user.id)
      .eq('is_flexible', true)
      .then(({ data }) => setHasFlexPlan((data || []).length > 0))
  }, [user.id])

  // Darf veröffentlicht werden?
  const canPublish =
    text.trim().length > 0 &&
    (mode === 'fix' ? date && time : !hasFlexPlan) &&
    !publishing

  async function publish() {
    setPublishing(true)
    setError(false)

    const { error } = await supabase.from('plans').insert({
      owner: user.id,
      category,
      text: text.trim(),
      is_flexible: mode === 'flex',
      // Fix: Datum + Uhrzeit als richtiger Zeitpunkt speichern
      when_at: mode === 'fix' ? new Date(`${date}T${time}`).toISOString() : null,
      // Flexibel: nur das Zeitfenster speichern
      time_window: mode === 'flex' ? timeWindow : null,
      spots,
      alcohol_free: alcoholFree,
      // Volle Spanne (18–65+) heisst: keine Einschränkung → nichts speichern
      age_min: ageMin > 18 ? ageMin : null,
      age_max: ageMax < 65 ? ageMax : null,
      gender_filter: gender,
      verified_only: verifiedOnly,
    })

    setPublishing(false)
    if (error) {
      console.error('Plan veröffentlichen fehlgeschlagen:', error.message)
      setError(true)
    } else {
      onPublished() // zurück zum Feed — dort erscheint der Plan
    }
  }

  return (
    <div className="px-[18px] py-4 pb-6">
      {/* Titel */}
      <h1 className="font-serif text-[19px] font-semibold text-ink mb-1">
        {t('create.title')}
      </h1>
      <p className="text-[13px] text-sub mb-4">{t('create.subtitle')}</p>

      {/* Der Plan-Text — in Fraunces, wie im Prototyp */}
      <input
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 200))}
        placeholder={t('create.placeholder')}
        className="w-full rounded-[14px] border border-line bg-card px-4 py-[15px] font-serif text-[16px] text-ink placeholder:text-mut outline-none focus:border-pine"
      />

      {/* Kategorie */}
      <Label className="mt-[18px] mb-2">{t('create.categoryLabel')}</Label>
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_IDS.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {t(`categories.${c}`)}
          </Chip>
        ))}
      </div>

      {/* Wann: Fix oder Flexibel */}
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
        // Fix: Datum und Uhrzeit wählen
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="block text-[12px] text-mut mb-1">{t('create.dateLabel')}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none focus:border-pine"
            />
          </label>
          <label className="flex-1">
            <span className="block text-[12px] text-mut mb-1">{t('create.timeLabel')}</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none focus:border-pine"
            />
          </label>
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

      {/* Schon ein flexibler Plan vorhanden? Dann freundlich stoppen */}
      {mode === 'flex' && hasFlexPlan && (
        <p className="text-[13px] text-bordeaux mt-2">{t('create.alreadyFlexible')}</p>
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
        <div className="font-serif text-[22px] font-semibold text-ink min-w-5 text-center">
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

        <p className="text-[12px] text-mut mt-3 leading-relaxed">
          {t('create.visibilityHint')}
        </p>
      </Card>

      {/* Fehlermeldung, nur falls nötig */}
      {error && <p className="text-[13px] text-bordeaux mt-3">{t('create.publishError')}</p>}

      {/* Veröffentlichen */}
      <button
        type="button"
        onClick={publish}
        disabled={!canPublish}
        className="w-full mt-[18px] rounded-full bg-ink px-6 py-[15px] text-[15px] font-semibold text-white disabled:opacity-40"
      >
        {publishing ? t('create.publishing') : t('create.publish')}
      </button>

      {/* Sagt freundlich, was noch fehlt, solange der Knopf grau ist */}
      {!canPublish && !publishing && (
        <p className="text-[12px] text-mut text-center mt-2">
          {text.trim().length === 0
            ? t('create.needText')
            : mode === 'fix' && (!date || !time)
              ? t('create.needDateTime')
              : mode === 'flex' && hasFlexPlan
                ? t('create.alreadyFlexible')
                : ''}
        </p>
      )}
    </div>
  )
}

export default ErstellenTab
