/*
  Alle Auswahlmöglichkeiten fürs Profil an einem Ort.
  Hier stehen nur kurze Kennungen (IDs) — die angezeigten Texte
  kommen aus den Übersetzungsdateien (de.json / en.json).
*/

export const CATEGORY_IDS = ['sport', 'kaffee', 'essen', 'ausgang']

export const LANGUAGE_IDS = ['de', 'ch', 'en', 'fr', 'it', 'es', 'pt']

export const RHYTHM_IDS = ['morning', 'evening', 'weekend']

export const GENDER_IDS = ['woman', 'man', 'nonbinary']

export const SEEK_IDS = ['friendship', 'dating']

export const MEET_IDS = ['group', 'pair']

export const SMOKING_IDS = ['no', 'sometimes', 'yes']

export const ORIENTATION_IDS = ['women', 'men', 'all']

export const REL_IDS = ['single', 'open']

// Die zehn Prompt-Fragen. p5 («Ich geh eh regelmässig…») steht
// in der Auswahl immer zuoberst — deshalb diese Reihenfolge.
export const PROMPT_IDS = ['p5', 'p1', 'p2', 'p3', 'p4', 'p6', 'p7', 'p8', 'p9', 'p10']

// Kurz-Kürzel für die Sprachen-Anzeige im Profilkopf (z. B. DE/CH/EN)
export function langShort(id) {
  if (id === 'ch') return 'CH'
  return id.slice(0, 2).toUpperCase()
}
