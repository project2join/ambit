/*
  Fragen-Auswahl: dunkles Overlay von unten, wie im Prototyp.
  Zeigt alle Prompt-Fragen, die noch nicht beantwortet sind.
*/
import { useTranslation } from 'react-i18next'
import { PROMPT_IDS } from '../data/profileOptions'
import { XIcon } from './Icons'

function PromptPicker({ usedIds, onPick, onClose }) {
  const { t } = useTranslation()
  const free = PROMPT_IDS.filter((id) => !usedIds.includes(id))

  return (
    <div className="fixed inset-0 z-30 bg-ink/55 flex items-end justify-center">
      <div className="w-full max-w-[390px] bg-card rounded-t-3xl p-5 pb-7 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="font-serif text-[19px] font-bold text-ink">
            {t('promptsUi.pickTitle')}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-mut p-1"
          >
            <XIcon size={20} />
          </button>
        </div>

        {free.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            className="block w-full text-left bg-paper border border-line rounded-xl px-4 py-3 mb-2 text-[14px] text-ink leading-snug"
          >
            {t(`prompts.${id}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default PromptPicker
