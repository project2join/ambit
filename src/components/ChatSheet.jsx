/*
  Plan-Chat: ein Gruppenchat pro Plan, für den Host und alle Angenommenen.
  Neue Nachrichten erscheinen sofort (Supabase Realtime), ohne Neuladen.

  Die erste Nachricht schreibt die App selbst als Eisbrecher.
  Sie wird als Daten gespeichert (nicht als fertiger Satz), damit jede
  Person sie in ihrer eigenen App-Sprache liest — die Antwort aus dem
  Profil bleibt aber in der Sprache, in der sie geschrieben wurde.

  48 Stunden nach dem Plan-Zeitpunkt ist der Chat nur noch zum Lesen da.
*/
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { XIcon, MoreIcon } from './Icons'
import { formatWhen } from '../lib/format'
import SafetyMenu from './SafetyMenu'
import KeepCard from './KeepCard'
import { loadKeeps, addKeep, removeKeep, isKeepWindow } from '../lib/keeps'

const CLOSE_AFTER_MS = 48 * 60 * 60 * 1000 // 48 Stunden

function ChatSheet({ user, plan, onClose, onKeepChange }) {
  const { t, i18n } = useTranslation()

  const [messages, setMessages] = useState([])
  const [people, setPeople] = useState({}) // id → Profil (Name, Foto, Antworten)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [keep, setKeep] = useState(null) // { mine, matched } für diesen Plan
  const [whoOpen, setWhoOpen] = useState(false) // «Wen melden?»-Liste
  const [safetyPerson, setSafetyPerson] = useState(null)
  const bottomRef = useRef(null)

  // Ist der Plan mehr als 48 Stunden vorbei? Dann nur noch lesen —
  // ausser es hat beidseitig «Gerne wieder» gepasst, dann bleibt er offen.
  const closed =
    !!plan.when_at &&
    Date.now() > new Date(plan.when_at).getTime() + CLOSE_AFTER_MS &&
    !keep?.matched

  // Nachrichten und Teilnehmende laden
  const load = useCallback(async () => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('plan_id', plan.id)
      .order('created_at', { ascending: true })

    // Wer ist dabei: der Host und alle Angenommenen
    const { data: acc } = await supabase
      .from('requests')
      .select('requester')
      .eq('plan_id', plan.id)
      .eq('status', 'accepted')

    const ids = [...new Set([plan.owner, ...(acc || []).map((r) => r.requester)])]
    const map = {}
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from('public_profiles')
        .select('id, name, photo_urls, prompts')
        .in('id', ids)
      for (const p of profs || []) map[p.id] = p
    }

    // Stand von «Gerne wieder» für diesen Plan
    const keeps = await loadKeeps(user.id)
    setKeep(keeps[plan.id] || { mine: false, matched: false })

    setPeople(map)
    setMessages(msgs || [])
    return { msgs: msgs || [], people: map }
  }, [plan.id, plan.owner, user.id])

  // Beim Öffnen: laden, Eisbrecher anlegen (falls noch keiner da ist),
  // und auf neue Nachrichten horchen
  useEffect(() => {
    let active = true

    load().then(async ({ msgs, people }) => {
      if (!active) return
      const hasIcebreaker = msgs.some((m) => m.kind === 'system')
      if (!hasIcebreaker && !closed) {
        await createIcebreaker(people)
        if (active) load()
      }
    })

    // Live-Verbindung: jede neue Nachricht dieses Plans kommt sofort an
    const channel = supabase
      .channel(`plan-chat-${plan.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `plan_id=eq.${plan.id}`,
        },
        (payload) => {
          setMessages((list) =>
            list.some((m) => m.id === payload.new.id) ? list : [...list, payload.new]
          )
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id])

  // Immer ans Ende scrollen, wenn etwas Neues kommt
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  // Den Eisbrecher zusammenstellen: Eckdaten des Plans + ein lockeres
  // Detail aus der Prompt-Antwort einer teilnehmenden Person
  async function createIcebreaker(peopleMap) {
    // Jemanden mit einer Antwort suchen — am liebsten jemand anderes als ich
    const candidates = Object.values(peopleMap).filter(
      (p) => (p.prompts || []).some((q) => q.answer?.trim())
    )
    const pick =
      candidates.find((p) => p.id !== user.id) || candidates[0] || null
    const prompt = pick
      ? (pick.prompts || []).find((q) => q.answer?.trim())
      : null

    const { error } = await supabase.from('messages').insert({
      plan_id: plan.id,
      kind: 'system',
      payload: {
        category: plan.category,
        when_at: plan.when_at,
        time_window: plan.time_window,
        is_flexible: plan.is_flexible,
        detail: prompt
          ? { name: pick.name, promptId: prompt.id, answer: prompt.answer }
          : null,
      },
    })
    // Doppelte Eisbrecher verhindert die Datenbank — Fehler hier ist harmlos
    if (error && error.code !== '23505') {
      console.error('Eisbrecher fehlgeschlagen:', error.message)
    }
  }

  // «Gerne wieder» antippen
  async function handleKeep() {
    await addKeep(plan.id, user.id)
    await load()
    onKeepChange?.()
  }

  // Verbindung lösen — still, ohne Meldung an die anderen
  async function handleRelease() {
    if (!window.confirm(t('keep.releaseConfirm'))) return
    await removeKeep(plan.id, user.id)
    onKeepChange?.()
    onClose()
  }

  async function send(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    const { error } = await supabase
      .from('messages')
      .insert({ plan_id: plan.id, sender: user.id, kind: 'user', text })
    setSending(false)
    if (error) console.error('Nachricht senden fehlgeschlagen:', error.message)
    else setDraft('')
  }

  // Den Eisbrecher in der Sprache der lesenden Person zusammensetzen
  function icebreakerText(payload) {
    const when = formatWhen(payload, t, i18n.language)
    const first = t('chat.icebreaker', {
      category: t(`categories.${payload.category}`),
      when: when || '',
    })
    if (!payload.detail) return first
    const second = t('chat.icebreakerDetail', {
      name: payload.detail.name,
      question: t(`prompts.${payload.detail.promptId}`),
      answer: payload.detail.answer,
    })
    return `${first} ${second}`
  }

  return (
    <div className="fixed inset-0 z-40 bg-ink/55 flex items-end justify-center">
      <div className="w-full max-w-[390px] bg-paper rounded-t-3xl flex flex-col h-[85vh]">
        {/* Kopf: Titel und der Plan-Text als Erinnerung */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-line flex-shrink-0">
          <div className="min-w-0">
            <div className="font-serif text-[19px] font-bold text-ink">
              {t('chat.title')}
            </div>
            <div className="text-[12.5px] text-mut truncate">«{plan.text}»</div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Drei Punkte: jemanden melden oder blockieren */}
            <button
              type="button"
              onClick={() => setWhoOpen(true)}
              aria-label={t('safety.menu')}
              className="text-mut p-1"
            >
              <MoreIcon size={20} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="text-mut p-1"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* Die Nachrichten */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
          {messages.length === 0 && (
            <p className="text-[13px] text-mut text-center py-6">{t('chat.empty')}</p>
          )}

          {messages.map((m) => {
            // Der Eisbrecher: ruhige Karte quer über die Breite
            if (m.kind === 'system') {
              return (
                <div
                  key={m.id}
                  className="bg-pine-soft text-pine rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed"
                >
                  {icebreakerText(m.payload || {})}
                </div>
              )
            }

            const isMine = m.sender === user.id
            const person = people[m.sender]
            return (
              <div
                key={m.id}
                className={'flex flex-col ' + (isMine ? 'items-end' : 'items-start')}
              >
                {!isMine && (
                  <span className="text-[11px] text-mut mb-0.5 ml-1">
                    {person?.name || '…'}
                  </span>
                )}
                <div
                  className={
                    'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-snug ' +
                    (isMine
                      ? 'bg-pine text-white rounded-br-md'
                      : 'bg-card border border-line text-ink rounded-bl-md')
                  }
                >
                  {m.text}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Nach dem Treffen: «Gerne wieder» — bleibt 7 Tage antippbar,
            also auch dann noch, wenn der Chat längst geschlossen ist */}
        {(isKeepWindow(plan) || keep?.matched) && (
          <div className="px-5 pb-3 flex-shrink-0">
            <KeepCard
              plan={plan}
              state={keep}
              onKeep={handleKeep}
              onRelease={handleRelease}
            />
          </div>
        )}

        {/* Schreiben — oder der Hinweis, dass der Plan vorbei ist */}
        <div className="px-5 pt-3 pb-5 border-t border-line flex-shrink-0">
          {closed ? (
            <p className="text-[13px] text-mut text-center">{t('chat.closed')}</p>
          ) : (
            <form onSubmit={send} className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                placeholder={t('chat.placeholder')}
                className="flex-1 min-w-0 rounded-full border border-line bg-card px-4 py-2.5 text-[14.5px] text-ink placeholder:text-mut outline-none focus:border-pine"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="rounded-full bg-pine text-white px-5 text-[13.5px] font-semibold disabled:opacity-40"
              >
                {t('chat.send')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* «Wen möchtest du melden oder blockieren?» */}
      {whoOpen && (
        <div className="fixed inset-0 z-40 bg-ink/55 flex items-end justify-center">
          <div className="w-full max-w-[390px] bg-card rounded-t-3xl px-5 pt-5 pb-7">
            <div className="flex items-center justify-between mb-3">
              <div className="font-serif text-[18px] font-bold text-ink">
                {t('safety.whoTitle')}
              </div>
              <button
                type="button"
                onClick={() => setWhoOpen(false)}
                aria-label={t('common.close')}
                className="text-mut p-1"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {Object.values(people)
                .filter((p) => p.id !== user.id)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSafetyPerson(p)
                      setWhoOpen(false)
                    }}
                    className="w-full text-left rounded-xl border border-line bg-paper px-4 py-3.5 text-[14.5px] text-ink"
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Melden / Blockieren */}
      {safetyPerson && (
        <SafetyMenu
          user={user}
          person={safetyPerson}
          planId={plan.id}
          onBlocked={onClose}
          onClose={() => setSafetyPerson(null)}
        />
      )}
    </div>
  )
}

export default ChatSheet
