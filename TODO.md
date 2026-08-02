# Ambit — Offene Punkte (nicht vergessen!)

## Versprochen, kommt noch
- **Verifizierung automatisieren** — läuft aktuell von Hand: Selfie kommt
  über die App in den privaten Bucket `verification`, du schaust es an und
  setzt in `verification_requests` den Status auf `approved` oder `rejected`
  (das Häkchen wird dann automatisch gesetzt, das Selfie gelöscht).
  Später: ein Dienst gleicht Selfie und Profilfoto selbst ab — Achtung,
  biometrische Daten brauchen eine saubere rechtliche Grundlage.
- **Profil pausieren** — Knopf im «Ich»-Tab: unsichtbar werden, ohne dass
  Daten verloren gehen; jederzeit reaktivierbar.
- **Benachrichtigungen** wirklich verschicken (E-Mail oder Push). Die
  Schalter im «Ich»-Tab speichern die Wahl schon, es passiert nur noch nichts.
- **Treffpunkt als eigenes Feld** beim Plan-Erstellen. Aktuell steckt der Ort
  im Plan-Text; «Plan teilen» schickt darum den ganzen Text mit.
- **Magic-Link-Mail auf Deutsch** übersetzen
  (Supabase → Authentication → Email Templates).
- **Meldungen anschauen**: Die Tabelle `reports` in Supabase regelmässig
  prüfen — es gibt noch keine Benachrichtigung darüber.

## Nächste grosse Schritte
- Feed-Sortierung nach «So treffe ich mich gern» (Gruppe/zu zweit):
  passende Pläne zuerst zeigen — nie ausblenden
- Entdecken-Tab (Dating-Set, beidseitige Matches) — füllt auch
  «Du gefällst» in den Verbindungen
- Orte-Tab (private Orte, beidseitige Aufdeckung)

## Vor dem echten Start (Launch-Checkliste)
- **Eigener Mail-Versand (SMTP) in Supabase hinterlegen** — der eingebaute
  Versand ist nur zum Entwickeln und erlaubt nur wenige Mails pro Stunde.
  Ohne das können sich echte Nutzer nicht anmelden. Anbieter z. B. Resend,
  Postmark, SendGrid; einzurichten unter Supabase → Project Settings →
  Authentication → SMTP Settings. Dazu gehört eine eigene Domain, damit die
  Anmelde-Mails nicht im Spam landen.
- Supabase-Gratis-Projekte werden nach längerer Inaktivität pausiert —
  vor dem Start auf einen bezahlten Plan wechseln.
- Datenschutzerklärung und Nutzungsbedingungen (Pflicht bei einer App mit
  Fotos, Standort und Dating-Funktion).

## Ideen für später
- «Gerne wieder» in grösseren Gruppen: aktuell ein Tipp fürs ganze Treffen.
  Falls gewünscht, später zusätzlich einzelne Personen anschreiben können.

## Technisch härten (später)
- Anfrage-Statuswechsel serverseitig absichern (aktuell könnte eine
  technisch versierte Person ihre eigene Anfrage per API annehmen —
  Lösung: Statuswechsel über eine Datenbank-Funktion statt direktem Update)
- «Sanfter Korb» auch auf API-Ebene verbergen (declined-Status ist im
  Netzwerk-Tab theoretisch sichtbar, die Oberfläche zeigt ihn nie)
