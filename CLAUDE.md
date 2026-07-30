# Ambit — Projektregeln

## Was diese App ist
Eine mobile-first Web-App (PWA): Nutzer öffnen ihre bestehenden Pläne
für Gesellschaft («Ich gehe eh — komm mit»). Freundschafts-Pläne sind
offen; Dating läuft ausschliesslich über beidseitige Matches.

## Tech-Stack
- React + Vite + Tailwind CSS
- Supabase (Login per Magic Link, Datenbank, Storage, Realtime)
- Hosting: Vercel

## Design-System (verbindlich) — Quiet Luxury
- Referenz: design-referenz/ambit-prototyp.jsx — Stil exakt übernehmen
- Farben: Tinte (warmes Fast-Schwarz) #191813, Hintergrund (Elfenbein) #F6F4EF,
  Karten #FFFFFF, Tannengrün #33473C, Grün hell #E9EBE2,
  Bordeaux #7E3B43, Bordeaux dunkel #652E36, Bordeaux hell #F1E5E3,
  Linien (warme Haarlinien) #E7E2D7, Text gedämpft #6E695D, Text leise #9C9689
- Schriften: Fraunces (Titel, Namen, Zitate — Serife; Wortmarke Ambit aufrecht
  und schlicht, ohne Kursiv, ohne nachgestellten Punkt),
  Inter (Fliesstext)
- Temperatur-Logik: Freundschaftliches = Tannengrün, Dating-Momente = Bordeaux
- Stil: ruhig und editorial — grosszügiger Weissraum, weiche tiefe Schatten,
  Kapitälchen-Labels mit Letter-Spacing, Bildplatzhalter in entsättigten
  Stein- und Sandtönen, keine grellen Farben
- Mobile-first: alles für ca. 390 px Breite entwerfen

## Produktregeln (nie verletzen)
- Kategorien/Interessen sortieren nur — sie schliessen NIE Personen aus
- Sichtbarkeits-Filter (Alter, Geschlecht, verifiziert) wirken VOR der
  Anzeige: Wer nicht passt, sieht den Plan gar nie
- Ablehnungen werden nie angezeigt — Abgelehnte sehen «Plan ist voll»
- Orte von Nutzern sind privat; Aufdeckung nur beidseitig
- Dating nie über offene Pläne, nur über beidseitige Matches

## Arbeitsregeln
- Kleine Schritte; nach jeder funktionierenden Änderung: git commit
- Einfachen, gut kommentierten Code schreiben (Besitzer ist Anfänger)
- Jede Änderung kurz und nicht-technisch erklären
- Keine zusätzlichen Bibliotheken ohne Rückfrage installieren
- Supabase-Schlüssel nur aus .env.local lesen, nie in den Code schreiben
- Mehrsprachigkeit: Jeder Oberflächentext kommt aus den Übersetzungsdateien
  (src/i18n/de.json und en.json), nie direkt aus dem Code — neue Texte
  sofort in beiden Sprachen anlegen
