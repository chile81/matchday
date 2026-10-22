// MatchDay v0.14.3 — "No longer there" strikethrough + name edits that can't be lost.
// Run: node tests/test_v0143.js   (serves the app folder on :9143, drives Chromium)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'app');
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };

const srv = http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split('?')[0]); if (f === '/') f = '/index.html';
  const p = path.join(ROOT, f);
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { r.writeHead(404); return r.end(); }
  const ty = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' }[path.extname(p)] || 'application/octet-stream';
  r.writeHead(200, { 'Content-Type': ty }); fs.createReadStream(p).pipe(r);
}).listen(9143);

(async () => {
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:9143/#/');
  await pg.waitForTimeout(600);

  // seed one job: 4 people
  await pg.evaluate(async () => {
    const sh = { id: 'J1', name: 'Test Valley Fall Sports', createdAt: nowISO(), columns: ['Student ID', 'Team'], syncKey: '' };
    await dbPut('shoots', sh);
    const mk = (id, first, last, team, flag) => ({ id, shootId: 'J1', first, last, extra: { 'Student ID': first + ' ' + last, Team: team }, added: false, handled: false, flag: flag || '', flagTs: flag ? Date.now() : 0, deviceId: 'cloud', updatedAt: nowISO() });
    await dbPut('subjects', mk('a1', 'Avaline', 'Quesnel', 'MSVB'));
    await dbPut('subjects', mk('a2', 'Brody', 'Tamsin', 'HSFB', 'gone'));
    await dbPut('subjects', mk('a3', 'Corinna', 'Vale', 'HSVB', 'absent'));
    await dbPut('subjects', mk('a4', 'Dax', 'Halloran', 'HSFB'));
  });
  await pg.evaluate(() => nav('/shoot/J1')); await pg.waitForTimeout(500);

  console.log('§1 strikethrough on the roster');
  const rowCls = id => pg.$eval(`.subject[data-id="${id}"]`, el => ({ row: el.className, nm: el.querySelector('.nm').className, deco: getComputedStyle(el.querySelector('.nm')).textDecorationLine }));
  let r = await rowCls('a2');
  ok(/\bgone\b/.test(r.row) && /\bgone\b/.test(r.nm) && r.deco.includes('line-through'), 'Brody (No longer there) is struck through and dimmed');
  r = await rowCls('a3'); ok(!/gone/.test(r.nm) && !r.deco.includes('line-through'), 'Corinna (Absent) is NOT struck through');
  r = await rowCls('a1'); ok(!/gone/.test(r.nm), 'unflagged person is plain');
  ok(await pg.$eval('.subject[data-id="a2"] .tag:last-child', e => e.textContent) === 'no longer there', 'existing "no longer there" tag still shows');
  if (SHOTS) await pg.screenshot({ path: SHOTS + '/1_roster.png' });

  console.log('§2 strike toggles from the person page');
  await pg.evaluate(() => nav('/subject/J1/a4')); await pg.waitForTimeout(300);
  await pg.click('#flagRow [data-flag="gone"]'); await pg.waitForTimeout(200);
  ok(await pg.$eval('#subjName', e => e.classList.contains('gone')), 'header name strikes the moment the flag is set');
  await pg.click('#flagRow [data-flag="gone"]'); await pg.waitForTimeout(200);
  ok(!(await pg.$eval('#subjName', e => e.classList.contains('gone'))), 'and un-strikes when cleared');
  await pg.click('#flagRow [data-flag="gone"]'); await pg.waitForTimeout(200);
  await pg.evaluate(() => nav('/shoot/J1')); await pg.waitForTimeout(300);
  ok(/gone/.test((await rowCls('a4')).nm), 'roster reflects it after going back');

  console.log('§3 wrap-up (Who\'s missing) toggles live');
  await pg.evaluate(() => nav('/wrapup/J1')); await pg.waitForTimeout(300);
  const wu = id => pg.$eval(`.wurow[data-id="${id}"]`, el => el.classList.contains('gone') && el.querySelector('.nm').classList.contains('gone'));
  ok(await wu('a2'), 'Brody struck on Who\'s missing');
  await pg.click('.wurow[data-id="a1"] [data-flag="gone"]'); await pg.waitForTimeout(200);
  ok(await wu('a1'), 'tapping No longer there strikes Avaline immediately');
  if (SHOTS) await pg.screenshot({ path: SHOTS + '/2_wrapup.png' });
  await pg.click('.wurow[data-id="a1"] [data-flag="gone"]'); await pg.waitForTimeout(200);
  ok(!(await wu('a1')), 'tapping again clears it');

  console.log('§4 a photo clears the strike (flag cleared by check-in)');
  await pg.evaluate(async () => { const s = S.subjects.find(x => x.id === 'a2'); await setStatus('a2', 'in', Date.now(), 'test'); });
  await pg.evaluate(() => nav('/shoot/J1')); await pg.waitForTimeout(300);
  ok(!/gone/.test((await rowCls('a2')).nm), 'checked-in person is never struck even if the flag lingers');

  console.log('§5 fix a name, then tap the CAMERA without Save → the fix is kept');
  await pg.evaluate(() => nav('/subject/J1/a1')); await pg.waitForTimeout(300);
  await pg.fill('#eLast', 'Quesnell');
  await pg.click('#capBtn'); await pg.waitForTimeout(600);
  let s1 = await pg.evaluate(async () => { const r = await dbGet('subjects', ['J1', 'a1']); return { last: r.last, dirty: r.dirty, mem: S.subjects.find(x => x.id === 'a1').last, cap: (document.querySelector('.capName') || {}).textContent || '' }; });
  ok(s1.last === 'Quesnell' && s1.mem === 'Quesnell', 'saved to the database and memory');
  ok(s1.dirty === 1, 'queued for the cloud (dirty)');
  ok(s1.cap.startsWith('Avaline Quesnell'), 'camera screen shows the corrected name');
  ok(await pg.evaluate(() => S.subjects.filter(x => x.shootId === 'J1').length) === 4, 'no new person created');

  console.log('§6 fix a name, then BACK (header arrow and phone back) → kept');
  await pg.evaluate(() => nav('/subject/J1/a4')); await pg.waitForTimeout(300);
  await pg.fill('#eFirst', 'Daxx');
  await pg.click('.header .iconbtn'); await pg.waitForTimeout(400);
  ok((await pg.evaluate(() => dbGet('subjects', ['J1', 'a4']))).first === 'Daxx', 'header back arrow saves');
  await pg.evaluate(() => nav('/subject/J1/a4')); await pg.waitForTimeout(300);
  await pg.fill('#eFirst', 'Dax');
  await pg.goBack(); await pg.waitForTimeout(400);
  ok((await pg.evaluate(() => dbGet('subjects', ['J1', 'a4']))).first === 'Dax', 'phone back button saves');

  console.log('§7 untouched page → leaving writes nothing');
  const before = (await pg.evaluate(() => dbGet('subjects', ['J1', 'a3']))).updatedAt;
  await pg.evaluate(() => nav('/subject/J1/a3')); await pg.waitForTimeout(300);
  await pg.click('.header .iconbtn'); await pg.waitForTimeout(300);
  ok((await pg.evaluate(() => dbGet('subjects', ['J1', 'a3']))).updatedAt === before, 'no write, no cloud traffic');

  console.log('§8 Save button: one tap with the keyboard up; double tap harmless');
  await pg.evaluate(() => nav('/subject/J1/a3')); await pg.waitForTimeout(300);
  await pg.fill('#eFirst', 'Corinne');
  await pg.focus('#eFirst');
  const blurred = await pg.evaluate(() => { const b = document.querySelector('#saveBtn'); const ev = new PointerEvent('pointerdown', { bubbles: true, cancelable: true }); b.dispatchEvent(ev); return ev.defaultPrevented; });
  ok(blurred, 'pointerdown on Save is prevented (input keeps focus → no keyboard jump)');
  ok(await pg.$eval('.savebar', e => getComputedStyle(e).position) === 'sticky', 'Save sits in a sticky bar');
  await pg.evaluate(() => { const b = document.querySelector('#saveBtn'); b.click(); b.click(); });
  await pg.waitForTimeout(500);
  ok((await pg.evaluate(() => dbGet('subjects', ['J1', 'a3']))).first === 'Corinne', 'saved');
  ok((await pg.evaluate(() => location.hash)) === '#/shoot/J1', 'back on the roster');

  console.log('§9 Add subject: double tap makes ONE person; abandoned add makes none');
  await pg.evaluate(() => nav('/subject/J1/new')); await pg.waitForTimeout(300);
  await pg.fill('#eFirst', 'Test'); await pg.fill('#eLast', 'Walkup');
  await pg.evaluate(() => { const b = document.querySelector('#saveBtn'); b.click(); b.click(); });
  await pg.waitForTimeout(600);
  const n = await pg.evaluate(async () => (await dbAll('subjects', 'shootId', 'J1')).filter(x => x.last === 'Walkup').length);
  ok(n === 1, 'exactly one Test Walkup');
  ok(await pg.evaluate(() => S.subjects.filter(x => x.last === 'Walkup').length) === 1, 'one in memory too');
  await pg.evaluate(() => nav('/subject/J1/new')); await pg.waitForTimeout(300);
  await pg.fill('#eFirst', 'Ghost'); await pg.fill('#eLast', 'Person');
  await pg.click('.header .iconbtn'); await pg.waitForTimeout(300);
  ok(await pg.evaluate(async () => (await dbAll('subjects', 'shootId', 'J1')).every(x => x.last !== 'Person')), 'backing out of Add creates nobody');

  console.log('§10 delete person with an unsaved edit → stays deleted');
  await pg.evaluate(() => nav('/subject/J1/a4')); await pg.waitForTimeout(300);
  await pg.fill('#eFirst', 'Changed');
  pg.once('dialog', d => d.accept());
  await pg.click('#delSubBtn'); await pg.waitForTimeout(600);
  ok(!(await pg.evaluate(() => dbGet('subjects', ['J1', 'a4']))), 'not written back by the leave-save');

  console.log('§11 empty name + Back → not saved, original kept');
  await pg.evaluate(() => nav('/subject/J1/a1')); await pg.waitForTimeout(300);
  await pg.fill('#eFirst', ''); await pg.fill('#eLast', '');
  await pg.click('.header .iconbtn'); await pg.waitForTimeout(300);
  ok((await pg.evaluate(() => dbGet('subjects', ['J1', 'a1']))).last === 'Quesnell', 'blank name never overwrites');

  if (SHOTS) {
    await pg.evaluate(() => nav('/subject/J1/a2')); await pg.waitForTimeout(300);
    await pg.screenshot({ path: SHOTS + '/3_subject.png' });
  }
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await br.close(); srv.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e); srv.close(); process.exitCode = 1; });
