// Private publishing interface. Public visitors only receive the static Pages build.
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

function authorize(request, secret) {
  return Boolean(secret) && request.headers.get('Authorization') === `Bearer ${secret}`;
}

function validate(session, reports) {
  if (!session || !slug.test(session.id) || !/^\d{4}-\d{2}-\d{2}$/.test(session.date)
      || !session.title || !Array.isArray(session.participants) || !session.participants.length
      || !Array.isArray(session.sheets) || !session.sheets.length) throw Error('Incomplete session');
  const people = new Set(session.participants.map(p => p.id));
  if (people.size !== session.participants.length || [...people].some(id => !slug.test(id))) throw Error('Invalid participants');
  const ids = new Set();
  for (const sheet of session.sheets) {
    if (!slug.test(sheet.id) || ids.has(sheet.id) || !people.has(sheet.member_id)
        || !Number.isInteger(sheet.number) || sheet.number < 1
        || !Array.isArray(sheet.criteria) || !sheet.evaluation_basis
        || typeof reports[sheet.id] !== 'string' || !reports[sheet.id].trim()) throw Error('Invalid sheet or missing report');
    ids.add(sheet.id);
    const total = sheet.criteria.reduce((n, c) => n + Number(c.max), 0);
    if (total !== 100 || sheet.criteria.some(c => !Number.isFinite(c.score) || c.score < 0 || c.score > c.max)) throw Error('Invalid rubric');
    for (const path of [sheet.pdf, sheet.report]) if (typeof path !== 'string' || !path) throw Error('Missing document path');
  }
  if (Object.keys(reports).some(id => !ids.has(id))) throw Error('Unexpected report');
}

function s3Key(path) {
  if (path.startsWith('https://')) return new URL(path).pathname.replace(/^\//, '');
  if (!/^(documents\/|images\/)[a-zA-Z0-9/_.,-]+$/.test(path) || path.includes('..')) throw Error('Invalid S3 key');
  return path;
}

async function snapshot(db) {
  const [members, sessions, reports] = await Promise.all([
    db.prepare('SELECT payload FROM members ORDER BY name, id').all(),
    db.prepare('SELECT payload FROM sessions ORDER BY date, id').all(),
    db.prepare('SELECT r.sheet_id, r.html FROM reports r JOIN sheets f ON f.id = r.sheet_id').all()
  ]);
  return {
    members: members.results.map(row => JSON.parse(row.payload)),
    sessions: sessions.results.map(row => JSON.parse(row.payload)),
    reports: Object.fromEntries(reports.results.map(row => [row.sheet_id, row.html]))
  };
}

async function publish(db, session, reports) {
  validate(session, reports);
  const existing = await db.prepare('SELECT payload FROM sessions WHERE id = ?').bind(session.id).first();
  const queries = [];
  // Preserve the last documented grade without interpreting it as a promotion.
  for (const member of session.participants) {
    const old = await db.prepare('SELECT payload FROM members WHERE id = ?').bind(member.id).first();
    const prior = old ? JSON.parse(old.payload) : {};
    const newer = await db.prepare('SELECT MAX(date) AS last_date FROM sessions s JOIN participants p ON p.session_id = s.id WHERE p.member_id = ? AND s.id <> ?')
      .bind(member.id, session.id).first();
    const person = { ...prior, name: member.name };
    if (!prior.grade_updated_at && (!newer?.last_date || session.date >= newer.last_date)) person.grade = member.grade;
    queries.push(db.prepare('INSERT INTO members (id,name,grade,payload) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,grade=excluded.grade,payload=excluded.payload')
      .bind(member.id, person.name, person.grade || null, JSON.stringify(person)));
  }
  if (existing) {
    const previousReports = await db.prepare('SELECT r.sheet_id, r.html FROM reports r JOIN sheets f ON f.id = r.sheet_id WHERE f.session_id = ?')
      .bind(session.id).all();
    const revision = await db.prepare('SELECT COALESCE(MAX(revision), 0) + 1 AS next FROM session_versions WHERE session_id = ?')
      .bind(session.id).first();
    queries.push(db.prepare('INSERT INTO session_versions VALUES (?,?,?,?,?)')
      .bind(session.id, revision.next, new Date().toISOString(), existing.payload,
        JSON.stringify(Object.fromEntries(previousReports.results.map(row => [row.sheet_id, row.html])))));
    queries.push(db.prepare('DELETE FROM reports WHERE sheet_id IN (SELECT id FROM sheets WHERE session_id = ?)').bind(session.id));
    queries.push(db.prepare('DELETE FROM documents WHERE session_id = ?').bind(session.id));
    queries.push(db.prepare('DELETE FROM sheets WHERE session_id = ?').bind(session.id));
    queries.push(db.prepare('DELETE FROM grade_history WHERE session_id = ?').bind(session.id));
    queries.push(db.prepare('DELETE FROM participants WHERE session_id = ?').bind(session.id));
  }
  queries.push(db.prepare('INSERT INTO sessions (id,date,title,payload) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET date=excluded.date,title=excluded.title,payload=excluded.payload')
    .bind(session.id, session.date, session.title, JSON.stringify(session)));
  for (const member of session.participants) {
    queries.push(db.prepare('INSERT INTO participants VALUES (?,?,?)').bind(session.id, member.id, member.grade || null));
    if (member.grade) queries.push(db.prepare('INSERT INTO grade_history VALUES (?,?,?,?)').bind(session.id, member.id, member.grade, session.date));
  }
  if (session.minutes_pdf) queries.push(db.prepare('INSERT INTO documents VALUES (?,?,?,?,?)')
    .bind(`${session.id}:minutes`, session.id, null, 'minutes', s3Key(session.minutes_pdf)));
  for (const sheet of session.sheets) {
    const score = sheet.criteria.reduce((n, c) => n + c.score, 0);
    queries.push(db.prepare('INSERT INTO sheets VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(sheet.id, session.id, sheet.member_id, sheet.number, sheet.brand || null,
        sheet.cigar_score ?? null, score, sheet.rubric_id || null, JSON.stringify(sheet)));
    queries.push(db.prepare('INSERT INTO reports VALUES (?,?)').bind(sheet.id, reports[sheet.id]));
    queries.push(db.prepare('INSERT INTO documents VALUES (?,?,?,?,?)')
      .bind(`${sheet.id}:pdf`, session.id, sheet.id, 'fiche', s3Key(sheet.pdf)));
  }
  await db.batch(queries);
}

async function upsertMember(db, member) {
  if (!member || !slug.test(member.id) || typeof member.name !== 'string' || !member.name.trim()
      || (member.grade != null && (typeof member.grade !== 'string' || !member.grade.trim()))) {
    throw Error('Invalid member');
  }
  const current = await db.prepare('SELECT payload FROM members WHERE id = ?').bind(member.id).first();
  const previous = current ? JSON.parse(current.payload) : {};
  const person = { ...previous, ...member };
  const statements = [];
  if (member.grade && member.grade !== previous.grade) {
    person.grade_updated_at = new Date().toISOString();
  }
  statements.push(db.prepare('INSERT INTO members (id,name,grade,payload) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,grade=excluded.grade,payload=excluded.payload')
    .bind(member.id, person.name, person.grade || null, JSON.stringify(person)));
  if (member.grade && member.grade !== previous.grade) statements.push(db.prepare('INSERT INTO member_grade_events (member_id,previous_grade,new_grade,changed_at) VALUES (?,?,?,?)')
    .bind(member.id, previous.grade || null, member.grade, person.grade_updated_at));
  await db.batch(statements);
}

async function triggerDeploy(env) {
  if (!env.CRCC_DEPLOY_HOOK) return false;
  const response = await fetch(env.CRCC_DEPLOY_HOOK, { method: 'POST' });
  if (!response.ok) throw Error('Deploy trigger failed');
  return true;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/internal/snapshot' && request.method === 'GET') {
      if (!authorize(request, env.CRCC_EXPORT_TOKEN)) return json({ error: 'Unauthorized' }, 401);
      return json(await snapshot(env.DB));
    }
    const match = /^\/internal\/sessions\/([a-z0-9-]+)$/.exec(path);
    if (match && request.method === 'PUT') {
      if (!authorize(request, env.CRCC_PUBLISH_TOKEN)) return json({ error: 'Unauthorized' }, 401);
      try {
        const { session, reports } = await request.json();
        if (match[1] !== session?.id) return json({ error: 'Session ID mismatch' }, 400);
        await publish(env.DB, session, reports || {});
        await triggerDeploy(env);
        return json({ id: session.id, stored: true, deploy_pending: Boolean(env.CRCC_DEPLOY_HOOK) }, 202);
      } catch (error) {
        return json({ error: error.message || 'Invalid submission' }, error.message === 'Deploy trigger failed' ? 503 : 400);
      }
    }
    const memberMatch = /^\/internal\/members\/([a-z0-9-]+)$/.exec(path);
    if (memberMatch && request.method === 'PUT') {
      if (!authorize(request, env.CRCC_PUBLISH_TOKEN)) return json({ error: 'Unauthorized' }, 401);
      try {
        const member = await request.json();
        if (memberMatch[1] !== member?.id) return json({ error: 'Member ID mismatch' }, 400);
        await upsertMember(env.DB, member);
        await triggerDeploy(env);
        return json({ id: member.id, stored: true, deploy_pending: Boolean(env.CRCC_DEPLOY_HOOK) }, 202);
      } catch (error) {
        return json({ error: error.message || 'Invalid submission' }, error.message === 'Deploy trigger failed' ? 503 : 400);
      }
    }
    return json({ error: 'Not found' }, 404);
  }
};
