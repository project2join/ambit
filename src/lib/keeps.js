/*
  «Gerne wieder» — in Kontakt bleiben nach dem Treffen.

  Ein Tipp pro Treffen. Tippen mindestens zwei Personen, bleibt der
  Plan-Chat unbefristet offen — für alle, die getippt haben.
  Wer nicht tippt, verschwindet still daraus; niemand erfährt davon.
*/
import { supabase } from './supabase'

// Der Chat schliesst nach 48 Stunden — «Gerne wieder» bleibt 7 Tage
// antippbar, damit niemand die Gelegenheit verpasst.
export const KEEP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

// Ist das Treffen vorbei und das 7-Tage-Fenster noch offen?
export function isKeepWindow(plan) {
  if (!plan?.when_at) return false // Termin steht noch nicht fest
  const start = new Date(plan.when_at).getTime()
  const now = Date.now()
  return now > start && now < start + KEEP_WINDOW_MS
}

// Bis wann kann man noch tippen? (für «Noch bis Sonntag.»)
export function keepDeadline(plan) {
  return new Date(new Date(plan.when_at).getTime() + KEEP_WINDOW_MS)
}

/*
  Alle «Gerne wieder»-Einträge laden, die ich sehen darf.
  Die Datenbank gibt mir immer nur meinen eigenen Eintrag —
  die der anderen erst, wenn es beidseitig passt.
  Ergebnis: { planId: { mine, matched, count } }
*/
export async function loadKeeps(userId) {
  const { data, error } = await supabase.from('keeps').select('plan_id, user_id')
  if (error) {
    console.error('Gerne-wieder laden fehlgeschlagen:', error.message)
    return {}
  }
  const map = {}
  for (const row of data || []) {
    const entry = (map[row.plan_id] = map[row.plan_id] || { count: 0, mine: false })
    entry.count++
    if (row.user_id === userId) entry.mine = true
    // Sehe ich mehr als meinen eigenen Eintrag, hat es beidseitig gepasst
    entry.matched = entry.count >= 2
  }
  return map
}

// «Gerne wieder» antippen
export async function addKeep(planId, userId) {
  const { error } = await supabase
    .from('keeps')
    .insert({ plan_id: planId, user_id: userId })
  if (error && error.code !== '23505') {
    console.error('Gerne-wieder fehlgeschlagen:', error.message)
    return false
  }
  return true
}

// Verbindung lösen: den eigenen Eintrag entfernen.
// Bleiben dann weniger als zwei übrig, endet der Kontakt still für alle.
export async function removeKeep(planId, userId) {
  const { error } = await supabase
    .from('keeps')
    .delete()
    .eq('plan_id', planId)
    .eq('user_id', userId)
  if (error) {
    console.error('Verbindung lösen fehlgeschlagen:', error.message)
    return false
  }
  return true
}
