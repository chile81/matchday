# MatchDay — version record (source of truth for the live app)

LIVE on vvpmatchingapp.netlify.app: v0.14.1 until Bill deploys v0.14.3.
Deploy = drag the zip contents (index.html, sw.js, manifest.webmanifest, icon-192.png,
icon-512.png, qrcode.js, jsqr.js) onto Netlify. SQL migrations are NOT run by a deploy.
Supabase migrations run: v0.10, v0.12, v0.14 (all done). v0.14.3 needs no SQL.

- v0.14.3 (2026-10-22) — "No longer there" names struck through + dimmed (roster, search,
  Excused, Who's missing, watchlist, person header; live toggle; a photo clears it; Absent
  unchanged). Name edits can't be lost: leaving a person's page (Back, phone back, camera,
  photo grid, gallery) saves changed fields first — this was the 09-21 misspelling
  bug (edit → camera → photo on old spelling, edit never saved). Save button: sticky bar,
  pointerdown keeps keyboard focus (first tap counts), double-tap latch. Add subject:
  double tap = one person. tests/test_v0143.js (28 checks). Built on live v0.14.1.
- v0.14.2 (2026-09-11) — same-name fold at import + "Merge same-name rows". DELIVERED BUT
  NEVER DEPLOYED; source lost. Not in v0.14.3. Rebuild only if needed.
- v0.14.1 — dual-sport kid visible on other team's Missing view. (live baseline, recovered
  from Netlify 2026-10-22)
- v0.14.0 — subjects re-keyed [shootId,id] (IndexedDB v3), provenance (added_at/added_by).
  NEVER deploy anything older than v0.14.0: older code can't open the v3 database.
