/*
  Onboarding: Wer sich zum ersten Mal einloggt, durchläuft diese
  kurzen Schritte und füllt so sein Profil. Jeder Schritt speichert
  beim «Weiter» — wer die App schliesst, macht später dort weiter.

  Am Schluss kommt eine Einladung, den ersten Plan zu erstellen —
  mit gut sichtbarem «Später»: eine Einladung, nie eine Pflicht.
*/
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { saveProfile } from '../lib/profile'
import { Card, Label, Chip, Toggle, PrimaryButton } from '../components/UI'
import { LockIcon, MapPinIcon } from '../components/Icons'
import PhotoGrid from '../components/PhotoGrid'
import LocationSearch from '../components/LocationSearch'
import PromptPicker from '../components/PromptPicker'
import {
  GENDER_IDS,
  LANGUAGE_IDS,
  RHYTHM_IDS,
  CATEGORY_IDS,
  SEEK_IDS,
  MEET_IDS,
  SMOKING_IDS,
  ORIENTATION_IDS,
  REL_IDS,
} from '../data/profileOptions'

// Ein Element in einer Liste an- oder abwählen
function toggle(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
}

function Onboarding({ user, profile, onDone }) {
  const { t } = useTranslation()

  // Der Entwurf des Profils — startet mit dem, was schon gespeichert ist
  const [draft, setDraft] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    gender: profile?.gender || null,
    photo_urls: profile?.photo_urls || [],
    about: profile?.about || '',
    prompts: profile?.prompts || [],
    languages: profile?.languages || [],
    home_area: profile?.home_area || null,
    home_lat: profile?.home_lat ?? null,
    home_lng: profile?.home_lng ?? null,
    rhythm: profile?.rhythm || [],
    categories: profile?.categories || [],
    seeks: profile?.seeks || [],
    meet_pref: profile?.meet_pref || [],
    smoking: profile?.smoking || null,
    orientation: profile?.orientation || null,
    rel_model: profile?.rel_model || null,
    pref_show_open_rel: profile?.pref_show_open_rel ?? true,
  })

  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false) // Speichern fehlgeschlagen?
  const [pickerSlot, setPickerSlot] = useState(null) // welcher Prompt-Platz wählt gerade eine Frage?
  const [otherLang, setOtherLang] = useState('') // Eingabefeld «weitere Sprachen»

  // Die Schritte. Der Dating-Schritt erscheint nur, wenn Dating gewählt ist.
  const steps = [
    'basics',
    'photos',
    'about',
    'prompts',
    'languages',
    'location',
    'rhythm',
    'interests',
    'smoking',
    ...(draft.seeks.includes('dating') ? ['dating'] : []),
    'firstplan',
  ]
  const step = steps[stepIndex]

  function update(patch) {
    setDraft((d) => ({ ...d, ...patch }))
  }

  // «Weiter»: aktuellen Stand speichern, dann zum nächsten Schritt.
  // Wenn das Speichern scheitert, bleiben wir stehen und zeigen es an.
  async function next() {
    setSaving(true)
    setSaveError(false)
    const ok = await saveProfile(user.id, { ...draft, age: Number(draft.age) || null })
    setSaving(false)
    if (!ok) {
      setSaveError(true)
      return
    }
    setStepIndex((i) => i + 1)
    window.scrollTo(0, 0)
  }

  // Onboarding abschliessen (vom letzten Schritt aus)
  async function finish(targetTab) {
    setSaving(true)
    setSaveError(false)
    const ok = await saveProfile(user.id, {
      ...draft,
      age: Number(draft.age) || null,
      onboarding_done: true,
    })
    setSaving(false)
    if (!ok) {
      setSaveError(true)
      return
    }
    onDone(targetTab)
  }

  // Darf man beim aktuellen Schritt weiter?
  const canContinue = {
    basics:
      draft.name.trim().length > 0 &&
      Number(draft.age) >= 18 &&
      Number(draft.age) <= 120 &&
      !!draft.gender,
    photos: draft.photo_urls.length >= 2,
    about: draft.about.trim().length > 0,
    prompts:
      draft.prompts.length >= 2 &&
      draft.prompts.slice(0, 2).every((p) => p.answer.trim().length > 0),
    languages: draft.languages.length > 0,
    location: !!draft.home_area,
    rhythm: draft.rhythm.length > 0,
    interests:
      draft.categories.length > 0 &&
      draft.seeks.length > 0 &&
      draft.meet_pref.length > 0,
    smoking: true, // optional
    dating: !!draft.orientation,
  }[step]

  // ---------- Hilfsfunktionen für die Prompts ----------

  // Frage für einen Platz (0, 1 oder 2) festlegen
  function setPromptId(slot, id) {
    const prompts = [...draft.prompts]
    prompts[slot] = { id, answer: prompts[slot]?.answer || '' }
    update({ prompts })
    setPickerSlot(null)
  }

  function setPromptAnswer(slot, text) {
    const prompts = [...draft.prompts]
    prompts[slot] = { ...prompts[slot], answer: text.slice(0, 150) }
    update({ prompts })
  }

  function removeThirdPrompt() {
    update({ prompts: draft.prompts.slice(0, 2) })
  }

  // Ein Prompt-Platz als Karte (Frage + Antwortfeld)
  function promptSlot(slot, optional = false) {
    const p = draft.prompts[slot]
    if (!p) {
      return (
        <button
          type="button"
          onClick={() => setPickerSlot(slot)}
          className="w-full py-3 rounded-xl border-[1.5px] border-dashed border-line text-mut text-[13px] font-medium"
        >
          {optional ? t('promptsUi.addThird') : `+ ${t('promptsUi.pick')}`}
        </button>
      )
    }
    return (
      <div className="bg-paper rounded-xl p-[14px]">
        <Label className="text-[11px]">{t(`prompts.${p.id}`)}</Label>
        <input
          value={p.answer}
          onChange={(e) => setPromptAnswer(slot, e.target.value)}
          placeholder={t('promptsUi.answerPlaceholder')}
          className="w-full mt-2 rounded-lg border border-line bg-card px-3 py-2.5 text-[14.5px] text-ink outline-none focus:border-pine"
        />
        <div className="flex justify-between items-center mt-2">
          <button
            type="button"
            onClick={() => setPickerSlot(slot)}
            className="text-[12px] font-semibold text-mut"
          >
            {t('promptsUi.change')}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-mut">{p.answer.length}/150</span>
            {optional && (
              <button
                type="button"
                onClick={removeThirdPrompt}
                className="text-[12px] font-semibold text-mut"
              >
                {t('common.remove')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---------- Die Anzeige ----------

  return (
    <div className="min-h-dvh bg-paper flex justify-center">
      <div className="w-full max-w-[390px] flex flex-col px-5 pb-10">
        {/* Kopf: Wortmarke + Abmelden + Fortschritt */}
        <header className="pt-5 pb-2">
          <div className="flex items-center justify-between">
            <span className="font-serif text-[24px] font-medium tracking-[0.2px] text-ink">
              {t('brand.name')}
            </span>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="text-[12px] font-semibold text-sub bg-card border border-line rounded-full px-4 py-2"
            >
              {t('me.logout')}
            </button>
          </div>
          <div className="mt-3 h-1 rounded-full bg-line overflow-hidden">
            <div
              className="h-full bg-pine rounded-full transition-all"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="text-[11px] text-mut mt-2">
            {t('onboarding.stepOf', { current: stepIndex + 1, total: steps.length })}
          </div>
        </header>

        <main className="flex-1 flex flex-col gap-4 pt-4">
          {/* ---------- Schritt 1: Name, Alter, Geschlecht ---------- */}
          {step === 'basics' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.basics.title')}
              </h1>
              <p className="text-[14px] text-sub -mt-2">{t('onboarding.basics.subtitle')}</p>

              <Card>
                <Label>{t('onboarding.basics.nameLabel')}</Label>
                <input
                  value={draft.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder={t('onboarding.basics.namePlaceholder')}
                  className="w-full mt-2 rounded-xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none focus:border-pine"
                />

                <Label className="mt-5">{t('onboarding.basics.ageLabel')}</Label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  value={draft.age}
                  onChange={(e) => update({ age: e.target.value })}
                  placeholder="18"
                  className="w-full mt-2 rounded-xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none focus:border-pine"
                />
                <p className="text-[12px] text-mut mt-1.5">{t('onboarding.basics.ageHint')}</p>

                <Label className="mt-5 mb-2">{t('onboarding.basics.genderLabel')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {GENDER_IDS.map((g) => (
                    <Chip key={g} active={draft.gender === g} onClick={() => update({ gender: g })}>
                      {t(`gender.${g}`)}
                    </Chip>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ---------- Schritt 2: Fotos ---------- */}
          {step === 'photos' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.photosStep.title')}
              </h1>
              <p className="text-[14px] text-sub -mt-2">{t('onboarding.photosStep.subtitle')}</p>
              <Card>
                <Label className="mb-3">
                  {t('me.photosLabel', { count: draft.photo_urls.length })}
                </Label>
                <PhotoGrid
                  userId={user.id}
                  photos={draft.photo_urls}
                  onChange={(urls) => update({ photo_urls: urls })}
                />
              </Card>
            </>
          )}

          {/* ---------- Schritt 3: Über mich ---------- */}
          {step === 'about' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.aboutStep.title')}
              </h1>
              <p className="text-[14px] text-sub -mt-2">{t('onboarding.aboutStep.subtitle')}</p>
              <Card>
                <div className="flex justify-between items-baseline mb-2">
                  <Label>{t('me.aboutLabel')}</Label>
                  <span className="text-[11px] text-mut">{draft.about.length}/150</span>
                </div>
                <textarea
                  value={draft.about}
                  onChange={(e) => update({ about: e.target.value.slice(0, 150) })}
                  placeholder={t('onboarding.aboutStep.placeholder')}
                  rows={4}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[14.5px] text-ink outline-none focus:border-pine resize-none"
                />
              </Card>
            </>
          )}

          {/* ---------- Schritt 4: Prompts ---------- */}
          {step === 'prompts' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.promptsStep.title')}
              </h1>
              <p className="text-[14px] text-sub -mt-2">{t('onboarding.promptsStep.subtitle')}</p>
              <Card className="flex flex-col gap-3">
                {promptSlot(0)}
                {promptSlot(1)}
                {promptSlot(2, true)}
              </Card>
            </>
          )}

          {/* ---------- Schritt 5: Sprachen ---------- */}
          {step === 'languages' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.languagesStep.title')}
              </h1>
              <Card>
                <div className="flex gap-2 flex-wrap">
                  {LANGUAGE_IDS.map((l) => (
                    <Chip
                      key={l}
                      active={draft.languages.includes(l)}
                      onClick={() => update({ languages: toggle(draft.languages, l) })}
                    >
                      {t(`languagesList.${l}`)}
                    </Chip>
                  ))}
                  {/* Selbst eingetragene Sprachen als abwählbare Chips */}
                  {draft.languages
                    .filter((l) => !LANGUAGE_IDS.includes(l))
                    .map((l) => (
                      <Chip
                        key={l}
                        active
                        onClick={() => update({ languages: toggle(draft.languages, l) })}
                      >
                        {l}
                      </Chip>
                    ))}
                </div>
                {/* «Weitere»: frei eintippen und hinzufügen */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const val = otherLang.trim()
                    if (val && !draft.languages.includes(val)) {
                      update({ languages: [...draft.languages, val] })
                    }
                    setOtherLang('')
                  }}
                  className="flex gap-2 mt-3"
                >
                  <input
                    value={otherLang}
                    onChange={(e) => setOtherLang(e.target.value)}
                    placeholder={t('onboarding.languagesStep.otherPlaceholder')}
                    className="flex-1 min-w-0 rounded-xl border border-line bg-paper px-4 py-2.5 text-[13.5px] text-ink outline-none focus:border-pine"
                  />
                  <button
                    type="submit"
                    disabled={!otherLang.trim()}
                    className="rounded-full border border-line px-4 text-[13px] font-semibold text-sub disabled:opacity-40"
                  >
                    {t('onboarding.languagesStep.otherAdd')}
                  </button>
                </form>
              </Card>
            </>
          )}

          {/* ---------- Schritt 6: Wohnort ---------- */}
          {step === 'location' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.locationStep.title')}
              </h1>
              <p className="text-[14px] text-sub -mt-2">{t('onboarding.locationStep.subtitle')}</p>
              <Card>
                {draft.home_area ? (
                  <div>
                    <Label>{t('onboarding.locationStep.chosenLabel')}</Label>
                    <div className="flex items-center gap-2 mt-2 text-[15px] text-ink">
                      <MapPinIcon size={15} className="text-pine" />
                      {draft.home_area}
                      <button
                        type="button"
                        onClick={() =>
                          update({ home_area: null, home_lat: null, home_lng: null })
                        }
                        className="ml-auto text-[12px] font-semibold text-mut"
                      >
                        {t('common.change')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <LocationSearch
                    onPick={(r) =>
                      update({ home_area: r.area, home_lat: r.lat, home_lng: r.lng })
                    }
                  />
                )}
                <p className="text-[12px] text-mut mt-4 leading-relaxed flex items-start gap-1.5">
                  <LockIcon size={12} className="mt-0.5 flex-shrink-0" />
                  {t('onboarding.locationStep.privacyHint')}
                </p>
              </Card>
            </>
          )}

          {/* ---------- Schritt 7: Rhythmus ---------- */}
          {step === 'rhythm' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.rhythmStep.title')}
              </h1>
              <Card>
                <div className="flex gap-2 flex-wrap">
                  {RHYTHM_IDS.map((r) => (
                    <Chip
                      key={r}
                      active={draft.rhythm.includes(r)}
                      onClick={() => update({ rhythm: toggle(draft.rhythm, r) })}
                    >
                      {t(`rhythmList.${r}`)}
                    </Chip>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ---------- Schritt 8: Kategorien + Absicht ---------- */}
          {step === 'interests' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.interestsStep.title')}
              </h1>
              <Card>
                <Label className="mb-2">{t('intent.categoriesLabel')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORY_IDS.map((c) => (
                    <Chip
                      key={c}
                      active={draft.categories.includes(c)}
                      onClick={() => update({ categories: toggle(draft.categories, c) })}
                    >
                      {t(`categories.${c}`)}
                    </Chip>
                  ))}
                </div>
                <p className="text-[12px] text-mut mt-2 leading-relaxed">
                  {t('intent.categoriesHint')}
                </p>

                <Label className="mt-5 mb-2">{t('intent.seekLabel')}</Label>
                <div className="flex gap-2">
                  {SEEK_IDS.map((s) => (
                    <Chip
                      key={s}
                      warm={s === 'dating'}
                      active={draft.seeks.includes(s)}
                      onClick={() => update({ seeks: toggle(draft.seeks, s) })}
                    >
                      {t(`seek.${s}`)}
                    </Chip>
                  ))}
                </div>

                <Label className="mt-5 mb-2">{t('intent.meetLabel')}</Label>
                <div className="flex gap-2">
                  {MEET_IDS.map((m) => (
                    <Chip
                      key={m}
                      active={draft.meet_pref.includes(m)}
                      onClick={() => update({ meet_pref: toggle(draft.meet_pref, m) })}
                    >
                      {t(`meet.${m}`)}
                    </Chip>
                  ))}
                </div>
                <p className="text-[12px] text-mut mt-3 leading-relaxed">
                  {t('intent.intentHint')}
                </p>
              </Card>
            </>
          )}

          {/* ---------- Schritt 9: Rauchen (optional) ---------- */}
          {step === 'smoking' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.smokingStep.title')}
              </h1>
              <Card>
                <div className="flex gap-2">
                  {SMOKING_IDS.map((s) => (
                    <Chip
                      key={s}
                      active={draft.smoking === s}
                      onClick={() => update({ smoking: draft.smoking === s ? null : s })}
                    >
                      {t(`smokingList.${s}`)}
                    </Chip>
                  ))}
                </div>
                <p className="text-[12px] text-mut mt-2">{t('onboarding.smokingStep.hint')}</p>
              </Card>
            </>
          )}

          {/* ---------- Schritt 10: Dating-Einstellungen ---------- */}
          {step === 'dating' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.datingStep.title')}
              </h1>
              <Card>
                <Label warm className="mb-2">{t('intent.orientLabel')}</Label>
                <div className="flex gap-2">
                  {ORIENTATION_IDS.map((o) => (
                    <Chip
                      key={o}
                      warm
                      active={draft.orientation === o}
                      onClick={() => update({ orientation: o })}
                    >
                      {t(`orientationList.${o}`)}
                    </Chip>
                  ))}
                </div>
                <p className="text-[12px] text-mut mt-2 leading-relaxed flex items-start gap-1.5">
                  <LockIcon size={12} className="mt-0.5 flex-shrink-0" />
                  {t('intent.orientHint')}
                </p>

                <Label warm className="mt-5 mb-2">{t('intent.relLabel')}</Label>
                <div className="flex gap-2">
                  {REL_IDS.map((r) => (
                    <Chip
                      key={r}
                      warm
                      active={draft.rel_model === r}
                      onClick={() => update({ rel_model: draft.rel_model === r ? null : r })}
                    >
                      {t(`relList.${r}`)}
                    </Chip>
                  ))}
                </div>
                <p className="text-[12px] text-mut mt-2 leading-relaxed">{t('intent.relHint')}</p>

                <div className="flex items-center gap-2.5 mt-5">
                  <Toggle
                    warm
                    on={draft.pref_show_open_rel}
                    onClick={() => update({ pref_show_open_rel: !draft.pref_show_open_rel })}
                  />
                  <span className="text-[14px] text-ink">{t('intent.showOpenRel')}</span>
                </div>
              </Card>
            </>
          )}

          {/* ---------- Abschluss: Einladung zum ersten Plan ---------- */}
          {step === 'firstplan' && (
            <>
              <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
                {t('onboarding.firstPlan.title')}
              </h1>
              <p className="text-[14px] text-sub -mt-2">{t('onboarding.firstPlan.subtitle')}</p>

              {/* 2–3 Vorschläge, passend zu den gewählten Kategorien */}
              {draft.categories.slice(0, 3).map((c) => (
                <Card key={c}>
                  <Label className="text-pine">{t(`categories.${c}`)}</Label>
                  <p className="font-serif text-[16px] font-medium text-ink mt-2 leading-snug">
                    «{t(`planSuggestions.${c}`)}»
                  </p>
                  <button
                    type="button"
                    onClick={() => finish('create')}
                    className="mt-3 rounded-full bg-pine px-5 py-2.5 text-[13px] font-semibold text-white"
                  >
                    {t('onboarding.firstPlan.use')}
                  </button>
                </Card>
              ))}

              {/* «Später» — gut sichtbar, gleichwertig */}
              <button
                type="button"
                onClick={() => finish('plans')}
                disabled={saving}
                className="w-full rounded-full border border-line bg-card px-6 py-3.5 text-[15px] font-semibold text-sub"
              >
                {t('common.later')}
              </button>
              <p className="text-[12px] text-mut text-center -mt-1">
                {t('onboarding.firstPlan.laterHint')}
              </p>
              {/* Falls das Speichern scheitert: sichtbar sagen statt schweigen */}
              {saveError && (
                <p className="text-[13px] text-bordeaux text-center">
                  {t('onboarding.saveError')}
                </p>
              )}
            </>
          )}

          {/* Weiter/Zurück (ausser auf der Abschluss-Karte) */}
          {step !== 'firstplan' && (
            <div className="mt-2 flex flex-col gap-3">
              {saveError && (
                <p className="text-[13px] text-bordeaux text-center">
                  {t('onboarding.saveError')}
                </p>
              )}
              <PrimaryButton onClick={next} disabled={!canContinue || saving}>
                {t('common.next')}
              </PrimaryButton>
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => i - 1)}
                  className="text-[13px] font-semibold text-mut"
                >
                  {t('common.back')}
                </button>
              )}
            </div>
          )}
        </main>

        {/* Fragen-Auswahl (Overlay) */}
        {pickerSlot !== null && (
          <PromptPicker
            usedIds={draft.prompts.map((p) => p.id)}
            onPick={(id) => setPromptId(pickerSlot, id)}
            onClose={() => setPickerSlot(null)}
          />
        )}
      </div>
    </div>
  )
}

export default Onboarding
