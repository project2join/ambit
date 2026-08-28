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
- **Treffpunkt als eigenes Feld** beim Plan-Erstellen. Aktuell steckt der Ort
  im Plan-Text; «Plan teilen» schickt darum den ganzen Text mit. Ein eigenes
  Feld könnte den genauen Ort erst nach Annahme zeigen (gleiches Prinzip wie
  bei «Orte»: privat, nur beidseitige Aufdeckung). Die Uhrzeit ist dafür
  seit 2026-08-27 schon gelöst (siehe unten) — hier geht's nur noch um den
  Ort. Bis dahin gibt's einen Regel-Hinweis im Erstellen-Screen («Kaffee am
  Sonntag» statt «10 Uhr, Café Freud»).
- **Magic-Link-Mail auf Deutsch** übersetzen
  (Supabase → Authentication → Email Templates).
- **Meldungen und Feedback anschauen**: Die Tabellen `reports` und
  `feedback` in Supabase regelmässig prüfen — es gibt noch keine
  Benachrichtigung darüber. Feedback kommt bewusst nicht per Mail, damit
  deine Adresse nirgends in der App sichtbar ist (Wunsch vom 2026-08-16).
  Falls später doch eine Mail-Benachrichtigung gewünscht ist: über einen
  Datenbank-Trigger + Resend (sobald Resend eh für den Mail-Versand
  eingerichtet ist, siehe Launch-Checkliste unten).

## Für die erste Testrunde mit echten Leuten (ab 2026-08-16)
- Bewusste Entscheidung (2026-08-16): KEINE externen Benachrichtigungen
  (E-Mail/Push) — Ambit öffnet man, wenn man Lust hat, nicht weil ein
  Ping ruft. In-App-Kennzeichen reichen: die rote Zahl beim
  Verbindungen-Symbol (MainShell.jsx, loadBadge) und der Punkt am
  «Meine»-Chip im Pläne-Tab zeigen offene Anfragen usw. schon jetzt,
  sobald man die App öffnet. Nicht von selbst wieder Mail/Push
  einbauen, ohne das nochmal abzusprechen.
- Deploy auf Vercel (ambit-ten.vercel.app) + Gmail-SMTP eingerichtet
  (2026-08-16) — beides erledigt. Gmail-Mails landen manchmal im Spam,
  das ist der bekannte Kompromiss der Zwischenlösung.
- PWA-Icons (192/512 PNG) ergänzt, iPhone braucht weiterhin Safari
  fürs «Zum Home-Bildschirm» (Apple-Einschränkung, nicht unsere Sache).

## Nächste grosse Schritte
- Feed-Sortierung nach «So treffe ich mich gern» (Gruppe/zu zweit):
  passende Pläne zuerst zeigen — nie ausblenden
- Entdecken-Tab (Dating-Set, beidseitige Matches) — füllt auch
  «Du gefällst» in den Verbindungen
- Orte-Tab (private Orte, beidseitige Aufdeckung)

## Erledigt, aber mit einer Voraussetzung (2026-08-16)
- **Umkreis-Filter für Pläne + automatisches Aufräumen** (setup11) sind
  gebaut. WICHTIG: Bevor das SQL läuft, muss in Supabase unter
  Database → Extensions **pg_cron** eingeschaltet werden — sonst schlägt
  der letzte Teil des Skripts (automatisches stündliches Löschen) fehl.
  Regel: abgelaufene Pläne ohne angenommene Person verschwinden nach
  24 Std. (fix) bzw. 10 Tagen (flexibel) automatisch, auch beim Host.
  Pläne mit mindestens einer angenommenen Person bleiben immer.
- **Tageszeit statt Uhrzeit bei fixen Plänen** (setup14, 2026-08-27):
  Beim Erstellen wählt man nur noch Morgens/Mittags/Nachmittags/Abends,
  nie eine genaue Uhrzeit — die legt der Host im Chat fest, sobald
  jemand angenommen hat (Stalking-Schutz). Braucht kein zusätzliches
  Supabase-Setup ausser dem SQL selbst.
- **«Gerne ein andermal»-Knopf** (setup15, 2026-08-27): Wer an einem Plan
  interessiert ist, aber am Termin nicht kann, hinterlässt einen für den
  Host sichtbaren, freundlichen Hinweis («Lea kann an diesem Tag leider
  nicht — hätte aber gern mal mitgemacht») — kein Platz wird belegt, kein
  versteckter Match-Mechanismus (der hätte hier nicht funktioniert, siehe
  Commit-Nachricht). Braucht kein zusätzliches Supabase-Setup ausser dem
  SQL selbst.

## Vor dem echten Start (Launch-Checkliste)
- **Eigener Mail-Versand (SMTP) in Supabase hinterlegen** — der eingebaute
  Versand ist nur zum Entwickeln und erlaubt nur wenige Mails pro Stunde.
  Ohne das können sich echte Nutzer nicht anmelden. Für die Beta reicht
  Gmail-SMTP über project2join@gmail.com (App-Passwort, kein eigener
  Domain nötig). Für den echten Start dann auf einen Dienst wie Resend,
  Postmark oder SendGrid mit eigener Domain wechseln — sonst landen
  Anmelde-Mails eher im Spam. Einzurichten unter Supabase → Project
  Settings → Authentication → SMTP Settings.
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
