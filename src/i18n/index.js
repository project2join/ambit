/*
  Mehrsprachigkeit (i18n = "Internationalisierung").
  Alle Texte der Oberfläche liegen in de.json und en.json —
  nie direkt im Code. Im Code steht nur ein Schlüssel wie
  t('login.slogan'), und hier wird die richtige Sprache gewählt.
*/
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './de.json'
import en from './en.json'

// 1. Hat der Nutzer schon mal eine Sprache gewählt? (gespeichert im Browser)
const saved = localStorage.getItem('ambit-lang')

// 2. Sonst: die Sprache des Geräts nehmen (Deutsch → de, alles andere → en)
const device = navigator.language?.startsWith('de') ? 'de' : 'en'

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: saved || device, // gespeicherte Wahl gewinnt, sonst Gerätesprache
  fallbackLng: 'de', // Notfall, falls ein Text mal fehlt
  interpolation: { escapeValue: false }, // React schützt selbst vor bösem Code
})

// Sprache wechseln UND die Wahl für den nächsten Besuch merken
export function setLanguage(lang) {
  i18n.changeLanguage(lang)
  localStorage.setItem('ambit-lang', lang)
}

// Dem Browser sagen, in welcher Sprache die Seite gerade ist
i18n.on('languageChanged', (lang) => {
  document.documentElement.lang = lang
})
document.documentElement.lang = i18n.language

export default i18n
