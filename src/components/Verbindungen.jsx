/*
  «Verbindungen»: Übersicht über alles Kommende — öffnet sich von unten
  über das Symbol oben rechts im Header.
  Ansicht «Pläne»: gehostete und zugesagte Treffen chronologisch,
  dazu die eigenen offenen Anfragen.
  Ansicht «Du gefällst»: vorerst Platzhalter (Phase 2: Signale & Matches).
*/
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Card, Chip } from './UI'
import { XIcon } from './Icons'
import ChatSheet from './ChatSheet'
import { formatWhen } from '../lib/format'

function Verbindungen({ user, onClose }) {
  const { t, i18n } = useTranslation()

  const [tab, setTab] = useState('plans')
  const [chatPlan, setChatPlan] = useState(null) // offener Plan-Chat
  const [hosted, setHosted] = useState([]) // meine Pläne
  const [joined, setJoined] = useState([]) // wo ich angenommen bin
  const [pendingMine, setPendingMine] = useState([]) // meine offenen Anfragen
  const [names, setNames] = useState({}) // Profilnamen

  useEffect(() => {
    async function load() {
      // Meine eigenen Pläne + wer dabei ist
      const { data: myPlans } = await supabase
        .from('plans')
        .select('*')
        .eq('owner', user.id)

      const myPlanIds = (myPlans || []).map((p) => p.id)
      let accByPlan = {}
      let ids = []
      if (myPlanIds.length > 0) {
        const { data: acc } = await supabase
          .from('requests')
          .select('*')
          .in('plan_id', myPlanIds)
          .eq('status', 'accepted')
        for (const r of acc || []) {
          ;(accByPlan[r.plan_id] = accByPlan[r.plan_id] || []).push(r.requester)
          ids.push(r.requester)
        }
      }

      // Meine Anfragen (offen oder angenommen) + die Pläne dazu
      const { data: myReqs } = await supabase
        .from('requests')
        .select('*')
        .eq('requester', user.id)
        .in('status', ['pending', 'accepted'])

      const reqPlanIds = (myReqs || []).map((r) => r.plan_id)
      let reqPlans = {}
      if (reqPlanIds.length > 0) {
        const { data: planRows } = await supabase
          .from('plans')
          .select('*')
          .in('id', reqPlanIds)
        for (const p of planRows || []) {
          reqPlans[p.id] = p
          ids.push(p.owner)
        }
      }

      // Namen der Beteiligten
      let nameMap = {}
      if (ids.length > 0) {
        const { data: profRows } = await supabase
          .from('public_profiles')
          .select('id, name')
          .in('id', [...new Set(ids)])
        for (const p of profRows || []) nameMap[p.id] = p.name
      }

      setHosted(
        (myPlans || []).map((p) => ({ plan: p, participants: accByPlan[p.id] || [] }))
      )
      setJoined(
        (myReqs || [])
          .filter((r) => r.status === 'accepted' && reqPlans[r.plan_id])
          .map((r) => ({ req: r, plan: reqPlans[r.plan_id] }))
      )
      setPendingMine(
        (myReqs || [])
          .filter((r) => r.status === 'pending' && reqPlans[r.plan_id])
          .map((r) => ({ req: r, plan: reqPlans[r.plan_id] }))
      )
      setNames(nameMap)
    }
    load()
  }, [user.id])

  async function cancelJoin(req) {
    if (!window.confirm(t('requests.cancelConfirm'))) return
    await supabase
      .from('requests')
      .update({ status: 'cancelled', needs_reconfirm: false })
      .eq('id', req.id)
    onClose() // schliessen — der Feed lädt frisch
  }

  // Gehostete + zugesagte Treffen chronologisch mischen (Flexible ans Ende)
  const upcoming = [
    ...hosted.map((h) => ({ type: 'hosted', ...h })),
    ...joined.map((j) => ({ type: 'joined', ...j })),
  ].sort((a, b) => {
    const ta = a.plan.when_at ? new Date(a.plan.when_at).getTime() : Infinity
    const tb = b.plan.when_at ? new Date(b.plan.when_at).getTime() : Infinity
    return ta - tb
  })

  return (
    <div className="fixed inset-0 z-30 bg-ink/55 flex items-end justify-center">
      <div className="w-full max-w-[390px] bg-paper rounded-t-3xl max-h-[88vh] overflow-y-auto px-[18px] pt-5 pb-7">
        {/* Kopf */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="font-serif text-[21px] font-bold text-ink">
            {t('connections.title')}
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

        {/* Umschalter: Pläne / Du gefällst */}
        <div className="flex gap-2 mb-3.5">
          <Chip active={tab === 'plans'} onClick={() => setTab('plans')}>
            {t('connections.tabPlans')} · {upcoming.length}
          </Chip>
          <Chip warm active={tab === 'likes'} onClick={() => setTab('likes')}>
            {t('connections.tabLikes')}
          </Chip>
        </div>

        {tab === 'plans' && (
          <>
            {/* Kommende Treffen */}
            {upcoming.map(({ type, plan, participants, req }) => (
              <Card key={plan.id + type} className="mb-2 p-3.5">
                <div className="text-[14.5px] font-semibold text-ink truncate">
                  «{plan.text}»
                </div>
                <div className="text-[12.5px] text-sub mt-0.5">
                  {formatWhen(plan, t, i18n.language)}
                  {type === 'hosted'
                    ? ' · ' +
                      (participants.length > 0
                        ? t('requests.with', {
                            names: participants.map((id) => names[id] || '…').join(', '),
                          })
                        : t('connections.nobodyYet'))
                    : ' · ' + t('connections.hostedBy', { name: names[plan.owner] || '…' })}
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  {/* Chat gibt es, sobald jemand dabei ist */}
                  {(type === 'joined' || participants?.length > 0) && (
                    <button
                      type="button"
                      onClick={() => setChatPlan(plan)}
                      className="rounded-full bg-pine text-white px-3.5 py-2 text-[12px] font-semibold"
                    >
                      {t('chat.open')}
                    </button>
                  )}
                  {type === 'joined' && (
                    <button
                      type="button"
                      onClick={() => cancelJoin(req)}
                      className="rounded-full border border-line bg-card text-sub px-3.5 py-2 text-[12px] font-semibold"
                    >
                      {t('requests.cancel')}
                    </button>
                  )}
                </div>
              </Card>
            ))}

            {/* Eigene offene Anfragen */}
            {pendingMine.map(({ plan }) => (
              <Card key={'pend' + plan.id} className="mb-2 p-3.5">
                <div className="text-[14.5px] font-semibold text-ink truncate">
                  «{plan.text}»
                </div>
                <div className="text-[12.5px] text-mut mt-0.5">
                  {formatWhen(plan, t, i18n.language)} · {t('connections.requestOpen')}
                </div>
              </Card>
            ))}

            {upcoming.length === 0 && pendingMine.length === 0 && (
              <p className="text-[13px] text-mut text-center py-8">
                {t('connections.empty')}
              </p>
            )}
          </>
        )}

        {/* «Du gefällst» — Platzhalter für Phase 2 */}
        {tab === 'likes' && (
          <div className="text-center py-10">
            <div className="font-serif text-[20px] font-semibold text-ink">
              {t('placeholder.title')}
            </div>
            <p className="text-[13px] text-sub mt-1.5">{t('connections.likesSoon')}</p>
          </div>
        )}
      </div>

      {/* Plan-Chat */}
      {chatPlan && (
        <ChatSheet user={user} plan={chatPlan} onClose={() => setChatPlan(null)} />
      )}
    </div>
  )
}

export default Verbindungen
