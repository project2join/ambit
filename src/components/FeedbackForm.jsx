/*
  Feedback direkt in der App: kein Mailprogramm, keine sichtbare
  Adresse. Der Text landet in der Supabase-Tabelle "feedback" —
  nur der Betreiber kann sie im Dashboard einsehen.
*/
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { XIcon } from './Icons'

function FeedbackForm({ user, onClose }) {
  const { t } = useTranslation()

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    setError(false)

    const { error } = await supabase
      .from('feedback')
      .insert({ user_id: user.id, text: text.trim() })

    setSending(false)
    if (error) {
      console.error('Feedback senden fehlgeschlagen:', error.message)
      setError(true)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-ink/55 flex items-end justify-center">
      <div className="w-full max-w-[390px] bg-card rounded-t-3xl px-5 pt-5 pb-7">
        <div className="flex items-center justify-between mb-3">
          <div className="font-serif text-[18px] font-bold text-ink">
            {t('settings.feedback')}
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

        {sent ? (
          // Ruhige Bestätigung — kein "wurde verschickt an ...", nichts Technisches
          <div className="text-center py-4">
            <p className="text-[15px] text-ink">{t('settings.feedbackDone')}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full border border-line bg-paper px-6 py-2.5 text-[13.5px] font-semibold text-sub"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-[13px] text-sub mb-2.5 leading-relaxed">
              {t('settings.feedbackHint')}
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 2000))}
              placeholder={t('settings.feedbackPlaceholder')}
              rows={5}
              autoFocus
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[14.5px] text-ink outline-none focus:border-pine resize-none"
            />
            {error && (
              <p className="text-[13px] text-bordeaux mt-2">{t('settings.feedbackError')}</p>
            )}
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-full mt-3 rounded-full bg-pine px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {sending ? t('settings.feedbackSending') : t('settings.feedbackSend')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default FeedbackForm
