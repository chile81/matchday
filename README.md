# MatchDay v0.12.0 — Vibrant Valley Photography

## New in v0.12.0 — archive finished jobs

**Run MIGRATION_v0.12.sql once** (Supabase → SQL Editor — one line, safe anytime). Until it runs, archiving works on your own phone and Sync check reminds you about the line in red.

**Archive, don't delete.** Open the job → Sync & Export → **🗂 Archive job**. It moves under a collapsed "▸ Archived (N)" line at the bottom of the home screen — on *every* phone, because done-ness syncs like everything else. Nothing is deleted: the cloud database keeps it all, the job stays openable from the archived section, and **↩ Restore** in the same menu brings it back to active everywhere. Archived jobs also stop appearing in the "☁ In the cloud" download list.

**A safety rail:** if this phone still owes the cloud photos or people, archiving warns you first and offers to sync — archiving is exactly the moment unsynced work would be forgotten forever.

**Free up phone space.** After archiving, if the cloud verifiably holds every photo, the app offers to remove the full-size copies from this phone. Thumbnails and the roster stay, the job remains browsable, and tapping any photo fetches the full-size version back from the cloud on the spot. This is how a season of 100-photo jobs doesn't fill your phones.

**The nudge.** A job that's 100% accounted for (photographed + excused) and untouched for two weeks gets a small "Done with this job? Tap to archive" on its home card. One tap accepts; ignore it freely.


## New in v0.11.6 — the Sync & Export menu scrolls, and the back button behaves

Two fixes from Bill's phone:

**The menu scrolls now.** Sync & Export started with five buttons and grew to thirteen; on a phone it ran off the bottom with Cloud Sync barely reachable. Every pop-up panel in the app now caps its height and scrolls, so the last button is always a swipe away — on any screen size.

**Back closes the panel instead of freezing the app.** Those panels are overlays, and the phone's back button used to navigate the page *underneath* them while the dark overlay stayed parked on top — the app looked frozen and had to be killed. Now pressing back does what you expect: it closes the panel and leaves you exactly where you were. Press back again and you leave the page normally. If a panel was asking a question (like the duplicate-roster choice), back answers "cancel" cleanly.


## New in v0.11.5 — search can't confuse a parent's name for an athlete's

Tayler's Salida report, solved from the real exports: searching an athlete sometimes "brought up the parent's name." The rosters were loaded perfectly — the cause was the search itself, which matches every column in a person's row. The MS roster's email column holds *parents'* addresses, so searching "Lauren" also surfaced the Berg kids, whose mother is lauren…@gmail.com. Same effect with the soccer roster's Coaches Name column.

Search still looks at everything — that's what makes searching a team or sport code work — but now **name matches come first**, and anyone who matched only through the rest of their row sits below a labeled divider: *"↪ Name doesn't match — found in their row (parent email, coach, team…)"*. Those rows work normally (tap to open, camera to shoot); they just can't impersonate a name match at check-in speed.


## New in v0.11.4 — the app tells you when the database is behind

The final Salida finding, from Tayler's own Sync check: 39 people on her phone, 26 in the cloud, all 37 photos in the cloud. People being rejected while photos went through had one possible cause — **MIGRATION_v0.10.sql was never run**, so the database refused every roster row (which now carries the absent-mark fields) while accepting every photo record. Every phone's roster pushes had been failing silently for days.

Two changes so a missing migration can never hide again:

- **Sync check probes the database schema first.** If the migration is missing, the top line says so in red, in plain words, with the fix.
- **Sync errors carry the database's own words.** The sync toast now says "Cloud database needs an update — run MIGRATION_v0.10.sql" instead of a silent failure or a bare error code, and technical errors include what the database actually said.

The test harness also gained a strict-schema mode that rejects unknown columns like real Postgres does — the reason ten passing test suites never caught this. Reproduced, then verified: after running the migration, one ordinary sync recovers everything with nobody re-entering anything.


## New in v0.11.3 — photos whose person is trapped in another job get their name to the cloud anyway

The last variant of the Salida problem: a phone where the photos live in the right job but the *person's record* got pulled into a duplicate copy of the roster on that same phone. A roster push only sends the job's own people, so those names never reached the cloud no matter how many times you synced.

Now every sync runs a repair pass: for each photo in the job, if this job doesn't hold that person, the app finds them anywhere on the phone and pushes their name to the cloud under this job — without moving anything between jobs locally. Sync check also names this condition ("N of this phone's photographed people aren't in this job — their records sit in '<job>'") instead of reading green.

## New in v0.11.2 — a photo can never outrun its person again

**What Bill's Sync check found after Salida:** 12 photos in the cloud that no other phone could show — because the 12 *people* they belonged to were never uploaded. Walk-ups added on the helper's phone (on the older app version) had photos pushed up without their roster rows. Every other phone pulled the photos' records, found nobody to attach them to, and silently skipped them.

Three fixes:

- **A capture upload now carries its person.** Photo, roster row, check-in status — one unit. A photo record can no longer exist in the cloud without the person it belongs to.
- **The pull heals old holes.** If this phone knows someone the cloud has never heard of (a pre-v0.11 walk-up), it queues them automatically and sends them on the same sync — no manual button needed, on whichever phone holds them.
- **Sync check tells the truth about it.** Orphan photos are now their own finding — "N photos belong to people whose NAMES never reached the cloud — walk-ups added on <phone>" — with the fix, instead of being mislabeled as held-back people. And the phone that owes the names is told so directly: "N people on this device aren't in the cloud yet."

## New in v0.11.1 — Sync check: when the phones don't agree, ask the app why

Sync & Export → **🩺 Sync check**. It asks the cloud directly and compares, then says in plain words what this device has, what the cloud has (and which phone contributed what), and — the important part — **why** anything hasn't come down or gone up from this device. Every reason the app used to skip something silently is now named on this screen:

- people who can't sync because *another job on this phone* already holds them (a roster loaded twice), with the job's name and the fix
- photos held back because they belong to those people
- photo files that are missing or unreadable in cloud storage (the record uploaded but the picture didn't) and which phone must re-send
- photos skipped deliberately because of an undo
- anything this device still owes the cloud

Run it on each device when counts disagree — the odd one out confesses. It also shows the app version and the job's sync key at the top: if two devices show **different keys for the same job**, they're syncing to different places entirely (one of them chose "separate job" at import) and no amount of syncing will merge them — that device should delete its copy and re-download from ☁ In the cloud.

**Self-healing:** if a photo was marked uploaded but the cloud lost it (a sync that half-landed), the phone now notices during its normal pull and re-sends it automatically.

## New in v0.11.0 — uploads keep trying, and you can see what's still waiting

**What went wrong at Salida.** Photos were uploaded once, right after the shutter. If that one attempt failed — weak signal in the gym, the phone locking mid-upload, iOS suspending the app in the background — nothing ever tried again. Meanwhile the phone kept *pulling* everyone else's work every 45 seconds, so it looked completely up to date. That's why the helper's phone had everything and the rest of us were short: her uploads had been quietly failing all afternoon and only a manual Cloud Sync would have caught them up. Nothing on screen said so.

**The app now pushes as well as pulls.** Anything captured on this phone stays on a queue until the cloud confirms it. The background sync uploads a few at a time, retries automatically, and speeds up to every 12 seconds while there's a backlog (45 seconds when everything's clear). It also fires the moment signal returns and the moment you bring the app back to the foreground — which is exactly when an iPhone wakes back up.

**You can see it.** When photos are waiting, the roster shows an orange **☁ N to upload** next to the subject count. Tap it to sync now. It disappears when the queue is empty, and you get an "All N photos uploaded ✓" when the last one lands. The Cloud Sync button in Sync & Export also turns orange and names the number. **Don't leave a venue with an orange count on screen** — that's the whole point of it.

**Walk-ups and marks travel too.** Someone added on site, a name correction, an absent mark — all queued and pushed the same way instead of waiting for a manual sync.

Also: a failed photo no longer stops the ones behind it (a manual sync now uploads what it can and tells you what's left), photos already in the cloud are recognised rather than re-uploaded, and a capture taken while the roster is on screen updates the list immediately.

## New in v0.10.1 — an updated roster folds into the job you're already working on

When the office re-sends the class list with a few more kids on it, importing that file now offers a third choice: **Add the N new names to "<the job>"**. It's the first button, and it does exactly what it says — the new people join the job you already have, and its photos, check-ins and absent marks stay exactly as they are. Nobody gets duplicated: names already on that job are recognised and skipped.

The other two routes are still there (open the job as-is, or set the file up as a separate job), and the wording now tells you which case MatchDay thinks it is: "Looks like an updated roster", "Looks like a retake list", or "These people are already loaded".

The **Import add-on CSV** button inside a job does the same thing and is still the most direct route when you know the file is just extra names.

## New in v0.10.0 — absent, no longer there, and the retake list

**Run MIGRATION_v0.10.sql first** (Supabase → Picture Day Cal → SQL Editor). It adds three columns and includes the delete-tombstone line from v0.9.1 in case that one never got run. Safe to run twice.

Check-in says whether we photographed someone. The new marks say why we didn't:

- **Absent** — not here today. This is the retake list.
- **No longer there** — moved, quit, gone. A roster correction for the office.

**The fast way to use it.** Missing tab → **Mark who's missing →**. One screen, everyone still outstanding, both buttons on every row. Kelly can go down the list with the office and tap as they talk — no opening people one at a time. A running tally at the top counts down the unexplained. The same two buttons are on each person's own screen if you'd rather mark one as you go.

**What the marks do.** Marked people leave the work list and collect under "↪ Excused" at the bottom of the Missing tab, with a badge on their row. The header reads "38/40 checked in • 2 excused", and the team board does the same per team — so a team where everyone is accounted for finally reads complete instead of never finishing. If someone marked Absent turns up after all, photographing them clears the mark automatically.

**Who we missed.** New in Sync & Export. It splits the people with no photo into *Absent (retake list)*, *No longer there (for the office)*, and *No reason given yet*, then gives you:

- **Share this list** — plain text to the office by text or email, ready for scheduling a makeup day.
- **Download list as CSV** — same thing as a file.
- **Retake roster CSV** — just the absent kids, in your original column layout. On retake day, import it as its own job and you're checking people in against a short list instead of the whole school. MatchDay recognises it as a retake list and offers to set it up separately.

Marks sync over Cloud Sync and the QR huddle like check-ins do, newest wins. They're also recorded in the backup ZIP's roster CSV under a new **Status** column.

**Smaller fix:** screens that read the database before drawing (mainly the home list) could paint over a screen you'd already navigated to, bouncing you back. They now check before drawing.

## New in v0.9.5 — a job can't steal another job's roster (important)

**The bug:** every person's internal ID was worked out from their own row in the CSV and nothing else. Load the same roster as two separate jobs and both jobs computed the same IDs for the same people — and since the phone's database is keyed on that ID, the second import quietly took ownership of the first job's people. The first job would open with an empty roster and its photos disconnected. No warning, no undo.

**The fix:** importing now checks whether those people already belong to a job on this phone. If they do, it asks:

- **Open "<the job>" instead** — nothing is added or changed.
- **Set up as a separate job** — a genuinely separate job (retake day, second session). It gets its own private set of IDs, so the two can never reach into each other.

If the file is a shorter list drawn from a job you already have, MatchDay says "Looks like a retake list" and offers the separate-job button first.

If you take the "separate job" route, send it to the other phone with **Share whole shoot** rather than importing the same file there too — a separately-keyed job can't be matched up by importing the CSV twice.

The same protection now covers add-on CSVs, received shoots, merged backup ZIPs and cloud pulls: none of them will adopt a person who belongs to another job on that phone.

## New in v0.9.4 — rename a job any time

Open the shoot → **Sync & Export** (download icon, top right) → **Job name** at the top. Type the new name and tap anywhere else; it saves immediately, and the header, the home list, and future export filenames all follow.

The rename travels with Cloud Sync: other phones on the job pick it up on their next sync (they'll show "☁ Renamed to …"). Rename with no signal and it holds — your version wins over the cloud's old one and pushes as soon as you're back online, rather than getting quietly reverted.

Renaming doesn't touch the roster or the sync identity: photos, check-ins, the QR sync codes, and the cloud copy all keep working. It's just the label.

**Smaller fix:** toasts no longer swallow taps — a message popping up at the bottom of the screen could briefly eat a button press underneath it.

## New in v0.9.3 — every pill toggles

**Tap to add, tap again to remove.** All the value pills now work the same way, on every column. Tap C Team and JV and the field reads "C Team, JV". Tapped the wrong one? Tap it again and it drops off — no backspacing in the text field.

Before this, a column only allowed two values if somebody in the roster *already* had two, which meant the first two-team athlete of the day could never be entered by tapping. Now it doesn't matter what the CSV looked like.

The field also stays in the roster's own order no matter which pill you tap first — tap Varsity then C Team and you still get "C Team, Varsity", so exports stay tidy.

**Smaller fix:** opening a different shoot now clears the search box and filters from the last one. Previously a leftover search could make a fresh roster look empty ("No matches") until you cleared it by hand.

## New in v0.9.2 — the roster fields fill themselves in

**Full-name columns type themselves.** As you enter First and Last name on the Add/Edit screen, any column that holds a copy of the person's name fills in automatically — the "Full Name" column on Kelly's school rosters, and the Student ID column on team rosters (where PhotoDay wants the full name). The label shows "• fills in from the name" so you know which one is doing it.

It figures this out from the CSV itself, not the column header: if the rows already in the roster put that person's own name in a column, new entries get the same treatment — in the same arrangement the CSV uses (First Last, Last First, or Last, First). A real numeric Student ID column never matches, so it's never touched. Type over an auto-filled value any time and your version sticks. Fix a typo in the last name and the full name follows along.

**Tap-to-fill chips for Team, Grade, School, Teacher.** Any column with a short list of repeated values shows those values as buttons under the field (and offers them as keyboard suggestions). One tap instead of typing "Varsity" again. (Superseded by v0.9.3: every pill now toggles.)

**Bulk fill for a blank name column.** If a team CSV shows up with the Student ID column empty, Sync & Export offers "Fill 'Student ID' from names (N blank)" — one tap fills every blank row and leaves anything already filled alone. Cloud Sync afterward to push it to the other phones.

## New in v0.9.1 — Delete subject now sticks everywhere

**Requires one-time SQL first** (run in Supabase → SQL Editor, Picture Day Cal project, *before* deploying this version):

```sql
alter table md_subjects add column if not exists deleted boolean default false;
```

**The fix.** Delete subject always worked locally — but cloud sync re-added the person within 45 seconds because deletions never reached the cloud. Now deleting a subject writes a tombstone (`deleted = true`) to the cloud, removes their photos from cloud storage, and clears their check-in records. Every other device removes them on its next sync instead of resurrecting them. If you're offline at the moment of deletion, the tombstone is queued and sent at the next Cloud Sync. The sync toast now shows removals too (`−1 removed`).

One deliberate consequence: a deleted person stays deleted for that shoot. If you ever delete the wrong person from a CSV roster, re-adding them by hand (Add subject) creates a fresh entry that syncs normally.

**Search finds people everywhere now.** If you're parked on a team/grade filter (or the Missing tab) and search for someone outside that view, they appear under "↪ Not in this view — elsewhere in the shoot" — fully tappable, so being on the wrong team can never hide someone from you again.

**Add a photo from your gallery.** New gallery button on the capture screen (below the camera-flip) and a gallery tile on every person's photo grid — for when the reference photo already exists on your phone (like a snapshot you took as a workaround). Deliberate gallery picks skip the old-photo warning; the warning still guards the accidental system-camera fallback.

## New in v0.8.2 — old-photo guard on the camera fallback

When the in-app camera can't start and the app falls back to the system camera, Samsung's picker can offer old gallery photos — and a stray tap could check someone in with an ancient picture. The app now checks the age of whatever comes back: anything older than 10 minutes triggers a warning naming the photo's actual date, and Cancel discards it. The in-app camera also retries once before falling back at all. Fix for a real incident: an old photo of Bill got attached to a student's check-in via this path — delete such a photo from the subject's row (✕) and re-shoot.

## New in v0.8.1 — per-team PhotoDay exports

**Export for PhotoDay** now asks for a scope: **Everyone (one ZIP)** or a single team/group — one ZIP per team for uploading into separate PhotoDay galleries. Each team button shows how many photographed subjects it holds; the ZIP is named after the team; a multi-team athlete (Team cell "C, JV") is included in both teams' exports with the same reference photo.

## New in v0.8.0 — team board (multi-team T&I days)

One shoot holds all the teams — no more hopping between galleries when a volleyball kid shows up in the football line; check-in is always just name search. And now, tap the **"N/N checked in" counter** at the top of the roster: a board slides up showing every team with its progress bar and missing count (plus an Everyone total). Tap a team to jump straight to that team's missing list. The board follows whatever grouping column the roster has (Team, Group, Class, Grade…) and remembers your choice per shoot. Filters also got smarter: near-unique columns (IDs, filenames, emails) no longer clutter the filter row.

## New in v0.7.1 — camera zoom

The capture screen now supports real camera zoom: **pinch** the viewfinder with two fingers, or drag the **slider** above the shutter (capped at 10×). It's hardware zoom, so the saved photo matches the preview exactly. On devices whose browser camera doesn't expose zoom, the slider stays hidden and everything works as before.

## New in v0.7.0 — shoot dates & smart ordering

Importing a CSV now asks for the **shoot date** (defaults to today; change it later in the Sync & Export sheet). The home screen orders itself the way a working calendar should: today's shoot on top with a "today" badge, upcoming shoots next (soonest first), finished shoots below (most recent first). Dates ride along through QR shoot-share and Cloud Sync, and the "In the cloud" list shows them too.

**Requires one tiny database addition** — run this once in Picture Day Cal's SQL Editor BEFORE deploying this version, or cloud sync will error:
```sql
alter table md_shoots add column if not exists shoot_date text;
```

## New in v0.6.1 — shoots prepared at the computer appear on the phones

The home screen now shows an **"☁ In the cloud — tap to download"** section: any shoot in your database that isn't on this device yet. The desk workflow: Kelly opens the app on her computer (same URL, install it from Chrome), imports the CSVs as shoots, and taps **Cloud Sync now** once per shoot to push them up. Every phone then sees them on the home screen and downloads a roster with one tap — full sync peer immediately, live updates and all. (The Cloud Sync tap after importing matters — an imported shoot stays local until the first sync.)

## New in v0.6.0 — live cloud updates

With Cloud Sync connected and internet available, check-ins from other phones now appear on their own: while a shoot (or the watchlist) is on screen, the app checks the cloud every ~45 seconds and folds in new check-ins, photos, and undos with a small "☁ from cloud" toast — no manual sync needed. "Cloud Sync now" still exists for an immediate full push+pull (e.g., right before reading the Missing list to a coordinator).

Also in the 0.5.x line: forgiving cloud-URL entry (auto-https, strips pasted /rest/v1 tails).

## New in v0.5.2 — end-of-day cleanup for helper phones

Sync & Export sheet → **Delete shoot from this phone**: removes the roster and all reference photos from that device only — cloud and other phones keep everything. The temp-helper routine: they Cloud Sync (or you QR-huddle) at end of day, then Delete shoot + Settings → Disconnect cloud, and their phone is clean. Use the shared `helper@` login for temps (see setup guide) so you can reset their access after the season without touching your own phones.

## New in v0.5.1 — database lookups for walk-ups

With Cloud Sync connected and internet available, the Add Subject screen now searches every other shoot in your database as you type. Someone shows up who's not on today's CSV but was in last season's roster? Two or three letters in, their name appears — tap it and the form fills (including Grade/Team when the columns match). They're added to today's shoot as a normal walk-up. Offline, the screen just works the classic way.

Also fixed: the very first install no longer does a spurious self-update reload.

## New in v0.5.0 — Cloud Sync (photos between phones over the internet)

When there's signal, phones now share check-ins AND photos automatically, PhotoDay-style, through your own free Supabase project (see SUPABASE_SETUP.md — one-time, ~10 min). Each photo uploads in the background right after the shutter when online; **Cloud Sync now** (Sync & Export sheet) does a full two-way sync — pulls everyone else's photos down, pushes anything missing up. Undone check-ins propagate and clean up properly. No signal? Everything falls back to QR sync + ZIP merge exactly as before, and Cloud Sync reconciles when you're back in coverage. Settings → Cloud Sync card to connect; set up one phone, then "Share setup (QR)" to the others.

## New in v0.4.1 — merge photos across phones

Two people checking in means the reference photos are split across phones. After the shoot: each phone does its backup ZIP export, then on ONE device (the Windows install is ideal — same app, more memory) use download icon → **Merge backup ZIP** and pick the other phone's backup. Photos, walk-ups, handled marks, and statuses merge in; duplicates are skipped automatically, so re-merging is harmless. That device now holds the complete shoot and its **Export for PhotoDay** covers everyone in a single ZIP.

Quick alternative when you don't need a combined file: just run Export for PhotoDay on each phone and import all the ZIPs into the PhotoDay gallery — each covers only the people that phone photographed, so they add up cleanly.

## New in v0.4.0 — Share a whole shoot, phone to phone

A phone with nothing on it can now receive everything by camera. On the phone that has the shoot: download icon → **Share whole shoot to another phone**. On the empty phone: home screen → **Receive shoot from another phone** and point it at the codes (they rotate automatically). The roster with all its columns, walk-ups, check-in statuses, handled marks, and the watchlist setup all transfer — and the received copy is a full sync peer from then on. Reference photos do NOT transfer (each phone still exports its own PhotoDay ZIP for the people it photographed). A 60-person staff roster is ~4 codes / a few seconds; a 500-kid roster is ~25+ codes (~45 seconds of holding steady) — for big rosters, sending the CSV by Quick Share and importing it normally is faster.

Also new: the app now updates itself — when a new version is deployed, it shows "Updating MatchDay…" and restarts once, instead of silently running the old version until the second launch.

## New in v0.3.1 — Export for PhotoDay

Sync & Export sheet now has **Export for PhotoDay**: produces the exact ZIP PhotoDay's own check-in export makes (`Index.csv` + one reference JPEG per checked-in subject). Import it into your PhotoDay sales gallery and PhotoDay's face matching works as if its own capture app had done the check-in.

To make the round trip seamless: load PhotoDay's roster/check-in export CSV into MatchDay as the shoot roster — then Access Codes, emails, jersey numbers, teams, and grades ride along and come back out in the export. Walk-ups added on site are flagged `capture` (PhotoDay assigns them codes on import). Each phone exports its own subjects; the toast tells you if some check-ins live on another phone.

## New in v0.3.0 — add-on CSVs in the field

School hands you a late-registration list mid-shoot? Open the shoot → download icon → **Import add-on CSV**. New people join the roster as "added" subjects; anyone already on the roster is skipped automatically. Only ONE phone needs the file — the next QR sync huddle carries the new names (with their class/team info) to every other phone. It's also harmless if two phones import the same add-on file; nothing duplicates.

For a completely new roster that every phone needs as a file: Android↔Android use Quick Share (works offline), iPhone↔iPhone use AirDrop, mixed platforms use the LocalSend app over one phone's hotspot.

## New in v0.2.1 — undoing a mistaken check-in

Tap the person's row → tap the ✕ on the wrong photo (their last photo going away = check-in undone). The undo now carries through sync: at the next QR huddle, other phones clear that check-in too. Timestamps decide conflicts — if someone else has *actual photos* of that person, their photos always win over an undo, and re-checking someone in after an undo works normally.

Offline roster check-in and reference-photo capture for T&I shoots. Needs no server at all — everything lives on the phone, syncs phone-to-phone by QR code, and exports to a ZIP.

## What's in this folder

Eight files, all required, all in the same folder: `index.html` (the whole app), `sw.js` (offline caching), `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `qrcode.js` + `jsqr.js` (QR sync), `README.md`.

## New in v0.2

**QR huddle sync (no signal needed).** Any two phones with the same roster loaded can swap check-in status: on one phone open Sync & Export → "Show sync code"; on the other, "Scan sync code". Then swap roles. Both phones now show the merged picture — who's checked in on ANY phone, who's still missing. Works with any number of phones (each pair huddles once); walk-up subjects added on one phone carry over too, as do "handled" marks. A full shoot's status fits in 1–2 codes; multi-part codes rotate automatically, just hold the phones steady.

**Missing filter.** All / Missing / Done buttons under the search bar. At the end of the shoot, sync with the other phones, tap Missing, filter to a team or class, and read the coordinator the list.

**Watchlist (the seniors feature).** Star icon on the roster → pick a column and values (e.g. Grade = 12). You get a dedicated list, checked-in people at top with their reference photo (name refresher!), grayed-out for not-yet-arrived, and a big checkbox to mark each one personally handled. Check-ins from your wife's phone appear after a sync huddle.

**Note:** both phones must load the *same CSV file* — the sync identity is derived from the roster contents. Load it on both phones before the shoot.

## Hosting it (one-time, ~5 minutes)

The app must be served over HTTPS for the camera and offline mode to work. Any free static host does it:

**Easiest — Netlify Drop:** go to https://app.netlify.com/drop and drag this folder onto the page. You get a URL like `https://something.netlify.app` immediately. Free account keeps it permanent, and you can set a nicer subdomain.

**Alternative — Cloudflare Pages or GitHub Pages:** both free; push/upload these five files and enable Pages.

After any future update, re-upload the files and the phones pick up the new version next time they open the app online.

## Installing on the phones

1. Open the URL in Chrome (Android) or Safari (iPhone).
2. Android: menu ⋮ → **Add to Home screen** → Install. iPhone: Share → **Add to Home Screen**.
3. Open it once from the home-screen icon while online. From then on it works with zero signal.

Install it on both phones. Each phone gets a device name in Settings (e.g. "Bill", "Karen") so exports are labeled per device. On Windows, the same URL works in Chrome/Edge (installable there too).

## Shoot-day workflow

1. **Before leaving home (online):** open the app, New Shoot from CSV, load the roster. Check the column mapping preview, create. Do this on both phones — each carries the full roster independently.
2. **On site (offline):** search the name → tap the camera button on the row → snap. It saves and jumps back to the roster for the next person. Names can be edited (tap the row) and walk-ups added (person+ icon), even with no signal.
3. **After the shoot:** export icon → Download ZIP (or Share to Drive/email). One ZIP per phone.

## What the export contains

- `roster.csv` — the roster including every edit and added subject, with MatchDay IDs and photo counts
- `checkins.json` — machine-readable check-in data (feeds the upcoming matching tool and Supabase sync)
- `photos/Last_First_id_1.jpg` — every reference photo, human-readable names

## Notes

- Reference photos are stored at 1280px JPEG — small enough that an 800-subject shoot fits comfortably in phone storage, sharp enough for face matching.
- iPhone caution: install to the home screen. Safari can evict website data from sites you haven't visited in a while, but installed apps are protected. Exporting the ZIP after each shoot is your belt-and-suspenders.
- Nothing leaves the phone until you export. No accounts, no server yet.

## Roadmap

Phase 2: Supabase sync (both phones push check-ins/photos to your cloud database; merge handled there). Phase 3: Windows matching tool — face-matches your Lightroom exports against the reference photos, review screen, renamed/sorted output + gallery CSV.
