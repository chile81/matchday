// MatchDay v0.14.4 — add a field (column) to a job while on site, and have it reach the other phones.
// Run: node tests/test_v0144.js   (serves the app folder on :9144, drives Chromium)
// All names are fictional.
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
}).listen(9144);

(async () => {
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:9144/#/');
  await pg.waitForTimeout(600);

  await pg.evaluate(async () => {
    const sh = { id: 'J1', name: 'Test Valley Fall Sports', createdAt: nowISO(), columns: ['Student ID', 'Team'], syncKey: 'abcd1234' };
    await dbPut('shoots', sh);
    const mk = (id, first, last, team) => ({ id, shootId: 'J1', first, last, extra: { 'Student ID': first + ' ' + last, Team: team }, added: false, handled: false, flag: '', flagTs: 0, deviceId: 'cloud', updatedAt: '2026-01-01T00:00:00.000Z' });
    await dbPut('subjects', mk('a1', 'Avaline', 'Quesnel', 'MSVB'));
    await dbPut('subjects', mk('a2', 'Brody', 'Tamsin', 'HSFB'));
    await dbPut('subjects', mk('a3', 'Corinna', 'Vale', 'HSVB'));
  });
  const cols = () => pg.evaluate(async () => (await dbGet('shoots', 'J1')).columns);
  const sub = id => pg.evaluate(id => dbGet('subjects', ['J1', id]), id);

  console.log('§1 add a field from a person\'s page, fill it, save');
  await pg.evaluate(() => nav('/subject/J1/a1')); await pg.waitForTimeout(300);
  await pg.fill('#eLast', 'Quesnell');                       // an edit in progress must survive
  await pg.click('#addFieldBtn'); await pg.waitForTimeout(250);
  ok(await pg.$('#nfName') !== null, 'the name sheet opens');
  ok(await pg.evaluate(() => document.activeElement.id) === 'nfName', 'cursor is already in the name box');
  if (SHOTS) await pg.screenshot({ path: SHOTS + '/1_sheet.png' });
  await pg.fill('#nfName', '  Jersey   # ');
  await pg.click('#nfAdd'); await pg.waitForTimeout(300);
  ok(await pg.$('#nfName') === null, 'sheet closes');
  ok(JSON.stringify(await cols()) === JSON.stringify(['Student ID', 'Team', 'Jersey #']), 'job has the new column, name tidied, appended last');
  ok(await pg.evaluate(() => S.shoot.colsDirty === true), 'queued for the cloud');
  ok(await pg.$eval('#eLast', e => e.value) === 'Quesnell', 'the half-typed name edit is still in the form');
  ok(await pg.evaluate(() => { const a = document.activeElement; return a.classList.contains('eExtra') && a.dataset.col === 'Jersey #'; }), 'new box is in the form and has the cursor');
  if (SHOTS) await pg.screenshot({ path: SHOTS + '/2_form.png' });
  await pg.fill('.eExtra[data-col="Jersey #"]', '12');
  await pg.click('#saveBtn'); await pg.waitForTimeout(500);
  let s = await sub('a1');
  ok(s.extra['Jersey #'] === '12' && s.last === 'Quesnell' && s.dirty === 1, 'value and name edit saved, person queued for the cloud');
  ok((await pg.$eval('.subject[data-id="a1"] .sextra', e => e.textContent)).includes('12'), 'roster row shows the value');
  ok(await pg.$eval('.subject[data-id="a1"]', e => e.dataset.id) === 'a1' && (await pg.evaluate(() => S.shoot.syncKey)) === 'abcd1234', 'person id and job key untouched');

  console.log('§2 the field is on everyone; an empty new box is not an edit');
  await pg.evaluate(() => nav('/subject/J1/a2')); await pg.waitForTimeout(300);
  ok(await pg.$('.eExtra[data-col="Jersey #"]') !== null, 'another person\'s page has the Jersey # box');
  await pg.click('#addFieldBtn'); await pg.waitForTimeout(250);
  ok(!(await pg.$$eval('[data-idea]', a => a.map(e => e.dataset.idea))).includes('Jersey #'), 'suggestions leave out fields the job already has');
  await pg.click('[data-idea="Position"]'); await pg.waitForTimeout(100);
  await pg.click('#nfAdd'); await pg.waitForTimeout(300);
  await pg.click('.header .iconbtn'); await pg.waitForTimeout(400);
  s = await sub('a2');
  ok(s.updatedAt === '2026-01-01T00:00:00.000Z' && !s.dirty, 'leaving without typing writes nothing to the person');
  ok((await cols()).includes('Position'), 'but the field itself was kept');

  console.log('§3 names that are refused');
  await pg.evaluate(() => nav('/subject/J1/a3')); await pg.waitForTimeout(300);
  await pg.click('#addFieldBtn'); await pg.waitForTimeout(250);
  const n0 = (await cols()).length;
  for (const [bad, why] of [['', 'blank'], ['jersey#', 'duplicate ignoring case and spaces'], ['First Name', 'first name'], ['TEAM', 'an imported column']]) {
    await pg.fill('#nfName', bad); await pg.click('#nfAdd'); await pg.waitForTimeout(150);
    ok(await pg.$('#nfName') !== null && (await cols()).length === n0, `refused: ${why}`);
  }
  await pg.click('#nfCancel'); await pg.waitForTimeout(250);
  ok(await pg.$('#nfName') === null && (await cols()).length === n0 && await pg.$('#newFields input') === null, 'Cancel adds nothing');
  await pg.click('#addFieldBtn'); await pg.waitForTimeout(250);
  await pg.goBack(); await pg.waitForTimeout(300);
  ok(await pg.$('#nfName') === null && (await pg.evaluate(() => location.hash)) === '#/subject/J1/a3' && (await cols()).length === n0, 'phone back closes the sheet, stays on the person, adds nothing');

  console.log('§4 walk-up: add a field in the middle of adding a person');
  await pg.evaluate(() => nav('/subject/J1/new')); await pg.waitForTimeout(300);
  await pg.fill('#eFirst', 'Wren'); await pg.fill('#eLast', 'Okafor');
  await pg.click('#addFieldBtn'); await pg.waitForTimeout(250);
  await pg.fill('#nfName', 'Bus'); await pg.press('#nfName', 'Enter'); await pg.waitForTimeout(300);
  ok(await pg.$eval('#eFirst', e => e.value) === 'Wren' && await pg.$eval('#eLast', e => e.value) === 'Okafor', 'typed name survives; Enter submits the sheet');
  await pg.fill('.eExtra[data-col="Bus"]', '4');
  await pg.click('#saveBtn'); await pg.waitForTimeout(600);
  const w = await pg.evaluate(async () => (await dbAll('subjects', 'shootId', 'J1')).filter(x => x.last === 'Okafor'));
  ok(w.length === 1 && w[0].extra.Bus === '4' && w[0].added === true, 'one walk-up, saved with the new field');
  await pg.evaluate(() => nav('/shoot/J1')); await pg.waitForTimeout(300);

  console.log('§5 Sync & Export has the same button');
  await pg.click('#exportBtn'); await pg.waitForTimeout(250);
  await pg.click('#addFieldBtn2'); await pg.waitForTimeout(300);
  await pg.fill('#nfName', 'Notes'); await pg.click('#nfAdd'); await pg.waitForTimeout(300);
  ok((await cols()).includes('Notes') && (await pg.evaluate(() => location.hash)) === '#/shoot/J1', 'added from the roster screen');

  console.log('§6 cloud: the field goes up after a pull, and other phones\' fields come down');
  await pg.evaluate(() => {
    window.CL = { row: { sync_key: 'abcd1234', name: 'Renamed At The Desk', columns: ['Student ID', 'Team'], shoot_date: '', archived: false }, posts: [] };
    CLOUD = { url: 'http://cloud.test', anon: 'x', email: 'e', access: 't', refresh: 'r', exp: Date.now() + 3600e3 };
    window.sb = async (path, opts = {}) => {
      const body = opts.body && typeof opts.body === 'string' ? JSON.parse(opts.body) : null;
      let data = [];
      if (path.includes('/md_shoots')) {
        if (opts.method === 'POST') { CL.posts.push(body[0]); Object.assign(CL.row, body[0]); data = null; }
        else data = [CL.row];
      }
      return { ok: true, status: 200, json: async () => data, blob: async () => new Blob([]) };
    };
    clearTimeout(autoSyncTimer);
  });
  await pg.evaluate(() => autoSyncTick()); await pg.waitForTimeout(300);
  let c = await pg.evaluate(() => ({ posts: CL.posts, dirty: S.shoot.colsDirty, name: S.shoot.name }));
  ok(c.posts.length === 1 && ['Jersey #', 'Position', 'Bus', 'Notes'].every(x => c.posts[0].columns.includes(x)), 'tick sends the job row with every new field');
  ok(c.posts[0].name === 'Renamed At The Desk' && c.name === 'Renamed At The Desk', 'pull ran first — the desk\'s rename was adopted, not overwritten');
  ok(c.dirty === false, 'queue flag cleared once the cloud has it');
  await pg.evaluate(() => autoSyncTick()); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => CL.posts.length) === 1, 'nothing re-sent on the next tick');

  // another phone added "Shoe Size" and, racing us, overwrote the list without "Notes"
  await pg.evaluate(() => { CL.row.columns = ['Student ID', 'Team', 'Jersey #', 'Position', 'Bus', 'Shoe Size']; });
  await pg.evaluate(() => autoSyncTick()); await pg.waitForTimeout(300);
  c = await pg.evaluate(() => ({ local: S.shoot.columns, cloud: CL.row.columns, toast: document.querySelector('#toast').textContent }));
  ok(c.local.includes('Shoe Size') && c.local.includes('Notes'), 'their field came down; ours was not dropped');
  ok(c.cloud.includes('Shoe Size') && c.cloud.includes('Notes'), 'and the cloud list was repaired to hold both');
  await pg.evaluate(() => nav('/subject/J1/a2')); await pg.waitForTimeout(300);
  ok(await pg.$('.eExtra[data-col="Shoe Size"]') !== null, 'the other phone\'s field is on the form here');
  await pg.evaluate(() => nav('/shoot/J1')); await pg.waitForTimeout(300);

  console.log('§7 manual Cloud Sync and QR sync carry it too');
  await pg.evaluate(async () => { await addField('Parent Phone'); clearTimeout(autoSyncTimer); CL.posts = []; });
  await pg.evaluate(() => cloudSyncNow()); await pg.waitForTimeout(600);
  c = await pg.evaluate(() => ({ posts: CL.posts, dirty: S.shoot.colsDirty }));
  ok(c.posts.some(p => (p.columns || []).includes('Parent Phone')) && c.dirty === false, 'Cloud Sync now sends it and clears the flag');
  const qr = await pg.evaluate(async () => {
    clearTimeout(autoSyncTimer);
    const obj = await decodeSyncPayload(await buildSyncPayload());
    const sent = obj.c.slice();
    S.shoot.columns = ['Student ID', 'Team']; await dbPut('shoots', S.shoot);   // play the phone that never heard
    const res = await applySync(obj);
    return { v: obj.v, sent, after: S.shoot.columns, res: !!res };
  });
  ok(qr.v === 3 && qr.sent.includes('Jersey #'), 'QR payload carries the field list, format version unchanged');
  ok(qr.res && qr.after.includes('Jersey #') && qr.after.includes('Parent Phone'), 'the scanning phone picks the fields up with no signal');
  const old = await pg.evaluate(async () => { const o = await decodeSyncPayload(await buildSyncPayload()); delete o.c; return !!(await applySync(o)); });
  ok(old, 'a code from a phone still on v0.14.3 (no field list) still syncs');

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await br.close(); srv.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e); srv.close(); process.exitCode = 1; });
