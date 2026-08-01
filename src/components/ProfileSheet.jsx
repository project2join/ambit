/*
  Mini-Profil in Grossansicht: erscheint von unten, wenn der Host
  eine anfragende Person antippt. Zeigt nur die erlaubten Felder
  (Fotos, Name, Alter, Ort, Sprachen, Kategorien, Über mich, Antworten).
*/
import { useTranslation } from 'react-i18next'
import { XIcon } from './Icons'
import { langShort } from '../data/profileOptions'

function ProfileSheet({ profile, onClose }) {
  const { t } = useTranslation()
  if (!profile) return null

  const photo = profile.photo_urls?.[0]

  return (
    <div className="fixed inset-0 z-30 bg-ink/55 flex items-end justify-center">
      <div className="w-full max-w-[390px] bg-card rounded-t-3xl overflow-hidden max-h-[85vh] overflow-y-auto">
        {/* Foto-Kopf (erstes Foto oder ruhige Farbfläche) */}
        <div className="relative h-[190px] bg-pine-soft">
          {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-ink/45 text-white flex items-center justify-center"
          >
            <XIcon size={17} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-7">
          <div className="font-serif text-[21px] font-bold text-ink">
            {profile.name}, {profile.age}
          </div>
          <div className="text-[13px] text-mut mt-0.5">
            {profile.home_area}
            {profile.languages?.length > 0 &&
              ' · ' + profile.languages.map(langShort).join('/')}
          </div>

          {/* Kategorien */}
          {profile.categories?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap my-2.5">
              {profile.categories.map((c) => (
                <span
                  key={c}
                  className="text-[12px] font-semibold text-pine bg-pine-soft px-[11px] py-1 rounded-full"
                >
                  {t(`categories.${c}`)}
                </span>
              ))}
            </div>
          )}

          {/* Über mich */}
          {profile.about && (
            <p className="text-[14.5px] text-ink leading-relaxed mt-1">{profile.about}</p>
          )}

          {/* Prompt-Antworten: Frage in der App-Sprache, Antwort im Original */}
          {(profile.prompts || []).map((p) => (
            <div key={p.id} className="bg-paper rounded-xl p-[14px] mt-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.9px] text-mut">
                {t(`prompts.${p.id}`)}
              </div>
              <div className="text-[14.5px] text-ink mt-1 leading-snug">{p.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfileSheet
