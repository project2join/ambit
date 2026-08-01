# Ambit — Offene Punkte (nicht vergessen!)

## Versprochen, kommt noch
- **Verifizierungsprozess** bauen (z. B. Selfie-Abgleich, braucht einen Dienst).
  Danach: Schalter «Nur verifizierte Profile» im Erstellen-Screen wieder
  einblenden (siehe Kommentar in src/tabs/ErstellenTab.jsx) und den
  Verifiziert-Haken im Profilkopf zeigen.
- **Profil löschen** — Knopf im «Ich»-Tab: Konto, Profildaten und Fotos
  vollständig entfernen.
- **Profil pausieren** — Knopf im «Ich»-Tab: unsichtbar werden, ohne dass
  Daten verloren gehen; jederzeit reaktivierbar.
- **Magic-Link-Mail auf Deutsch** übersetzen
  (Supabase → Authentication → Email Templates).
- Alte Spalte `is_verified` in der profiles-Tabelle aufräumen
  (bei Gelegenheit, mit Vorsicht).

## Nächste grosse Schritte
- Feed-Sortierung nach «So treffe ich mich gern» (Gruppe/zu zweit):
  passende Pläne zuerst zeigen — nie ausblenden
- Anfragen / Mitkommen bei fremden Plänen (der grüne «Anfragen»-Knopf)
- Entdecken-Tab (Dating-Set, beidseitige Matches)
- Orte-Tab (private Orte, beidseitige Aufdeckung)
- Plan-Chat
