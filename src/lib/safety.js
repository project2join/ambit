/*
  Blockieren und Melden.

  Blockieren wirkt beidseitig und sofort: Die Datenbank blendet
  Profile, Pläne, Anfragen und Nachrichten in beide Richtungen aus
  (siehe supabase/setup8-sicherheit.sql).
*/
import { supabase } from './supabase'

export async function blockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker: blockerId, blocked: blockedId })
  // Schon blockiert? Dann ist alles in Ordnung.
  if (error && error.code !== '23505') {
    console.error('Blockieren fehlgeschlagen:', error.message)
    return false
  }
  return true
}

export async function reportUser({ reporter, reportedUser, planId, reason }) {
  const { error } = await supabase.from('reports').insert({
    reporter,
    reported_user: reportedUser || null,
    plan_id: planId || null,
    reason,
  })
  if (error) {
    console.error('Melden fehlgeschlagen:', error.message)
    return false
  }
  return true
}
