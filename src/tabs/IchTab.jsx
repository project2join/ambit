/*
  Der «Ich»-Tab: das eigene Profil, alles direkt bearbeitbar.
  Jede Änderung wird sofort gespeichert — ohne Speichern-Knopf.
  Aufbau und Stil folgen dem Prototyp (design-referenz/ambit-prototyp.jsx).
*/
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { saveProfile } from '../lib/profile'
import { setLanguage } from '../i18n'
import { Card, Label, Chip, Toggle } from '../components/UI'
import { LockIcon, MapPinIcon, BadgeCheckIcon } from '../components/Icons'
import VerificationCard from '../components/VerificationCard'
import FeedbackForm from '../components/FeedbackForm'
import { deleteAccount } from '../lib/account'
import PhotoGrid from '../components/PhotoGrid'
import LocationSearch from '../components/LocationSearch'
import PromptPicker from '../components/PromptPicker'
import {
  LANGUAGE_IDS,
  RHYTHM_IDS,
  CATEGORY_IDS,
  SEEK_IDS,
  MEET_IDS,
  SMOKING_IDS,
  ORIENTATION_IDS,
  REL_IDS,
  langShort,
} from '../data/profileOptions'

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
}

function IchTab({ user, profile, onChange }) {
  const { t, i18n } = useTranslation()

  const [pickerOpen, setPickerOpen] = useState(false) // Fragen-Auswahl offen?
  const [editingLocation, setEditingLocation] = useState(false)
  const [editingCurrent, setEditingCurrent] = useState(false) // Ferien-Standort?
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [otherLang, setOtherLang] = useState('')
  const radiusTimer = useRef(null) // verzögertes Speichern für den Slider

  // Eine Änderung: sofort anzeigen UND in Supabase speichern
  function patch(fields) {
    onChange({ ...profile, ...fields })
    saveProfile(user.id, fields)
  }

  // Slider: Anzeige sofort, Speichern erst nach kurzer Ruhe (sonst
  // würde jede Zwischenposition einzeln gespeichert)
  function setRadius(value) {
    onChange({ ...profile, radius_km: value })
    clearTimeout(radiusTimer.current)
    radiusTimer.current = setTimeout(() => saveProfile(user.id, { radius_km: value }), 500)
  }

  function setPromptAnswer(slot, text) {
    const prompts = [...(profile.prompts || [])]
    prompts[slot] = { ...prompts[slot], answer: text.slice(0, 150) }
    patch({ prompts })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // Konto löschen: zweimal nachfragen, dann unwiderruflich entfernen
  async function handleDeleteAccount() {
    if (!window.confirm(t('settings.deleteConfirm'))) return
    const word = window.prompt(t('settings.deleteConfirmWord'))
    if (word?.trim().toUpperCase() !== t('settings.deleteWord')) return

    setDeleting(true)
    setDeleteError(false)
    const ok = await deleteAccount(user.id)
    setDeleting(false)
    if (!ok) setDeleteError(true)
    // Bei Erfolg meldet die App automatisch ab — der Login erscheint
  }

  const prompts = profile.prompts || []

  return (
    <div className="px-[18px] py-4 pb-6 flex flex-col gap-3">
      {/* ---------- Kopf ---------- */}
      <Card className="text-center">
        <div className="w-[76px] h-[76px] rounded-full bg-pine-soft mx-auto flex items-center justify-center font-serif text-[30px] font-bold text-pine">
          {(profile.name || '?')[0]}
        </div>
        <div className="font-serif text-[20px] font-semibold text-ink mt-2.5 flex items-center justify-center gap-1.5">
          {profile.name}, {profile.age}
          {/* Grünes Häkchen nur bei geprüften Profilen */}
          {profile.is_verified && (
            <BadgeCheckIcon size={17} className="text-pine" strokeWidth={2} />
          )}
        </div>
        <div className="text-[13px] text-mut mt-0.5">
          {profile.home_area}
          {profile.languages?.length > 0 &&
            ' · ' + profile.languages.map(langShort).join('/')}
        </div>
      </Card>

      {/* ---------- Fotos ---------- */}
      <Card>
        <Label className="mb-2.5">
          {t('me.photosLabel', { count: (profile.photo_urls || []).length })}
        </Label>
        <PhotoGrid
          userId={user.id}
          photos={profile.photo_urls || []}
          onChange={(urls) => patch({ photo_urls: urls })}
        />
      </Card>

      {/* ---------- Über mich + Prompts ---------- */}
      <Card>
        <div className="flex justify-between items-baseline mb-1.5">
          <Label>{t('me.aboutLabel')}</Label>
          <span className="text-[11px] text-mut">{(profile.about || '').length}/150</span>
        </div>
        <textarea
          value={profile.about || ''}
          onChange={(e) => patch({ about: e.target.value.slice(0, 150) })}
          rows={3}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-[14.5px] text-ink leading-relaxed outline-none focus:border-pine resize-none"
        />

        {prompts.map((p, i) => (
          <div key={p.id} className="bg-paper rounded-xl p-[14px] mt-2.5">
            <Label className="text-[11px]">{t(`prompts.${p.id}`)}</Label>
            <input
              value={p.answer}
              onChange={(e) => setPromptAnswer(i, e.target.value)}
              className="w-full mt-2 rounded-lg border border-line bg-card px-3 py-2.5 text-[14.5px] text-ink outline-none focus:border-pine"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-mut">{p.answer.length}/150</span>
              {/* Die dritte Antwort ist freiwillig und lässt sich entfernen */}
              {i === 2 && (
                <button
                  type="button"
                  onClick={() => patch({ prompts: prompts.slice(0, 2) })}
                  className="text-[12px] font-semibold text-mut"
                >
                  {t('common.remove')}
                </button>
              )}
            </div>
          </div>
        ))}

        {prompts.length < 3 && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full mt-2.5 py-3 rounded-xl border-[1.5px] border-dashed border-line text-mut text-[13px] font-medium"
          >
            {t('promptsUi.addThird')}
          </button>
        )}
      </Card>

      {/* ---------- Meist unterwegs ---------- */}
      <Card>
        <Label className="mb-2">{t('me.rhythmLabel')}</Label>
        <div className="flex gap-2 flex-wrap">
          {RHYTHM_IDS.map((r) => (
            <Chip
              key={r}
              active={(profile.rhythm || []).includes(r)}
              onClick={() => patch({ rhythm: toggle(profile.rhythm || [], r) })}
            >
              {t(`rhythmList.${r}`)}
            </Chip>
          ))}
        </div>
      </Card>

      {/* ---------- Ich spreche ---------- */}
      <Card>
        <Label className="mb-2">{t('me.languagesLabel')}</Label>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGE_IDS.map((l) => (
            <Chip
              key={l}
              active={(profile.languages || []).includes(l)}
              onClick={() => patch({ languages: toggle(profile.languages || [], l) })}
            >
              {t(`languagesList.${l}`)}
            </Chip>
          ))}
          {(profile.languages || [])
            .filter((l) => !LANGUAGE_IDS.includes(l))
            .map((l) => (
              <Chip
                key={l}
                active
                onClick={() => patch({ languages: toggle(profile.languages, l) })}
              >
                {l}
              </Chip>
            ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const val = otherLang.trim()
            if (val && !(profile.languages || []).includes(val)) {
              patch({ languages: [...(profile.languages || []), val] })
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

      {/* ---------- Wohnort & Umkreis ---------- */}
      <Card>
        <Label className="mb-2">{t('me.locationLabel')}</Label>
        {editingLocation ? (
          <LocationSearch
            onPick={(r) => {
              patch({ home_area: r.area, home_lat: r.lat, home_lng: r.lng })
              setEditingLocation(false)
            }}
          />
        ) : (
          <div className="flex items-center gap-2 text-[14.5px] text-ink">
            <MapPinIcon size={15} className="text-pine" />
            {profile.home_area}
            <button
              type="button"
              onClick={() => setEditingLocation(true)}
              className="ml-auto text-[12px] font-semibold text-mut"
            >
              {t('common.change')}
            </button>
          </div>
        )}

        {/* Vorübergehender Standort — z. B. in den Ferien */}
        <div className="mt-4 pt-4 border-t border-line">
          <Label className="mb-2">{t('me.currentLabel')}</Label>
          {editingCurrent ? (
            <LocationSearch
              onPick={(r) => {
                patch({ current_area: r.area, current_lat: r.lat, current_lng: r.lng })
                setEditingCurrent(false)
              }}
            />
          ) : profile.current_area ? (
            <div className="flex items-center gap-2 text-[14.5px] text-ink">
              <MapPinIcon size={15} className="text-pine" />
              {profile.current_area}
              <button
                type="button"
                onClick={() =>
                  patch({ current_area: null, current_lat: null, current_lng: null })
                }
                className="ml-auto text-[12px] font-semibold text-mut"
              >
                {t('common.remove')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingCurrent(true)}
              className="w-full py-2.5 rounded-xl border-[1.5px] border-dashed border-line text-mut text-[13px] font-medium"
            >
              + {t('me.currentAdd')}
            </button>
          )}
          <p className="text-[12px] text-mut leading-relaxed mt-2">
            {t('me.currentHint')}
          </p>
        </div>

        {/* Umkreis-Slider: 1–100 km */}
        <div className="flex justify-between items-baseline mt-4 mb-1">
          <span className="text-[12px] text-mut">{t('me.radiusLabel')}</span>
          <span className="text-[15px] font-semibold text-ink">
            {profile.radius_km || 10} km
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={profile.radius_km || 10}
          onChange={(e) => setRadius(Number(e.target.value))}
          aria-label={t('me.radiusLabel')}
          className="w-full accent-pine"
        />
        <p className="text-[12px] text-mut leading-relaxed mt-1">{t('me.radiusHint')}</p>
      </Card>

      {/* ---------- Absicht (Ich suche / Dating / So treffe ich mich) ---------- */}
      <Card>
        <Label className="mb-2">{t('intent.seekLabel')}</Label>
        <div className="flex gap-2">
          {SEEK_IDS.map((s) => (
            <Chip
              key={s}
              warm={s === 'dating'}
              active={(profile.seeks || []).includes(s)}
              onClick={() => patch({ seeks: toggle(profile.seeks || [], s) })}
            >
              {t(`seek.${s}`)}
            </Chip>
          ))}
        </div>

        {/* Dating-Block nur zeigen, wenn Dating aktiviert ist */}
        {(profile.seeks || []).includes('dating') && (
          <div className="mt-4 pt-4 border-t border-line">
            <Label warm className="mb-2">{t('intent.orientLabel')}</Label>
            <div className="flex gap-2">
              {ORIENTATION_IDS.map((o) => (
                <Chip
                  key={o}
                  warm
                  active={profile.orientation === o}
                  onClick={() => patch({ orientation: o })}
                >
                  {t(`orientationList.${o}`)}
                </Chip>
              ))}
            </div>
            <p className="text-[12px] text-mut mt-2 leading-relaxed flex items-start gap-1.5">
              <LockIcon size={12} className="mt-0.5 flex-shrink-0" />
              {t('intent.orientHint')}
            </p>

            <Label warm className="mt-4 mb-2">{t('intent.relLabel')}</Label>
            <div className="flex gap-2">
              {REL_IDS.map((r) => (
                <Chip
                  key={r}
                  warm
                  active={profile.rel_model === r}
                  onClick={() => patch({ rel_model: profile.rel_model === r ? null : r })}
                >
                  {t(`relList.${r}`)}
                </Chip>
              ))}
            </div>
            <p className="text-[12px] text-mut mt-2 leading-relaxed">{t('intent.relHint')}</p>

            <div className="flex items-center gap-2.5 mt-4">
              <Toggle
                warm
                on={profile.pref_show_open_rel ?? true}
                onClick={() => patch({ pref_show_open_rel: !(profile.pref_show_open_rel ?? true) })}
              />
              <span className="text-[14px] text-ink">{t('intent.showOpenRel')}</span>
            </div>
          </div>
        )}

        <Label className="mt-4 mb-2">{t('intent.meetLabel')}</Label>
        <div className="flex gap-2">
          {MEET_IDS.map((m) => (
            <Chip
              key={m}
              active={(profile.meet_pref || []).includes(m)}
              onClick={() => patch({ meet_pref: toggle(profile.meet_pref || [], m) })}
            >
              {t(`meet.${m}`)}
            </Chip>
          ))}
        </div>
        <p className="text-[12px] text-mut mt-3 leading-relaxed">{t('intent.intentHint')}</p>
      </Card>

      {/* ---------- Kategorien ---------- */}
      <Card>
        <Label className="mb-2">{t('intent.categoriesLabel')}</Label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_IDS.map((c) => (
            <Chip
              key={c}
              active={(profile.categories || []).includes(c)}
              onClick={() => patch({ categories: toggle(profile.categories || [], c) })}
            >
              {t(`categories.${c}`)}
            </Chip>
          ))}
        </div>
        <p className="text-[12px] text-mut mt-2 leading-relaxed">{t('intent.categoriesHint')}</p>
      </Card>

      {/* ---------- Rauchen ---------- */}
      <Card>
        <Label className="mb-2">{t('me.smokingLabel')}</Label>
        <div className="flex gap-2">
          {SMOKING_IDS.map((s) => (
            <Chip
              key={s}
              active={profile.smoking === s}
              onClick={() => patch({ smoking: profile.smoking === s ? null : s })}
            >
              {t(`smokingList.${s}`)}
            </Chip>
          ))}
        </div>
        <p className="text-[12px] text-mut mt-2">{t('onboarding.smokingStep.hint')}</p>
      </Card>

      {/* ---------- App-Sprache ---------- */}
      <Card>
        <Label className="mb-2">{t('me.appLanguage')}</Label>
        <div className="flex gap-2">
          {['de', 'en'].map((lang) => (
            <Chip key={lang} active={i18n.language === lang} onClick={() => setLanguage(lang)}>
              {t(`language.${lang}`)}
            </Chip>
          ))}
        </div>
      </Card>

      {/* ---------- Verifizierung ---------- */}
      <VerificationCard user={user} profile={profile} />

      {/* ---------- Einstellungen ---------- */}
      <Card>
        <Label className="mb-3">{t('settings.title')}</Label>

        {/*
          Bewusst KEINE Benachrichtigungs-Schalter: Ambit soll man
          öffnen, wenn man Lust hat — nicht weil ein Ping ruft.
          Ein Besuch bleibt so immer ein bewusster Entscheid.
        */}

        {/* Feedback — bleibt in der App, keine Adresse sichtbar */}
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="block w-full text-left"
        >
          <span className="text-[14px] font-semibold text-ink">
            {t('settings.feedback')}
          </span>
          <p className="text-[12px] text-mut mt-1">{t('settings.feedbackHint')}</p>
        </button>

        {/* Abmelden */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full mt-5 rounded-full border border-line bg-paper px-6 py-3 text-[14px] font-semibold text-sub"
        >
          {t('me.logout')}
        </button>

        {/* Konto löschen — unwiderruflich, deshalb doppelt abgesichert */}
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="w-full mt-2 rounded-full border border-line bg-paper px-6 py-3 text-[14px] font-semibold text-bordeaux disabled:opacity-50"
        >
          {deleting ? t('settings.deleting') : t('settings.deleteAccount')}
        </button>
        {deleteError && (
          <p className="text-[13px] text-bordeaux mt-2 text-center">
            {t('settings.deleteError')}
          </p>
        )}
      </Card>

      {/* Fragen-Auswahl (Overlay) */}
      {pickerOpen && (
        <PromptPicker
          usedIds={prompts.map((p) => p.id)}
          onPick={(id) => {
            patch({ prompts: [...prompts, { id, answer: '' }] })
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* Feedback (Overlay) */}
      {feedbackOpen && (
        <FeedbackForm user={user} onClose={() => setFeedbackOpen(false)} />
      )}
    </div>
  )
}

export default IchTab
