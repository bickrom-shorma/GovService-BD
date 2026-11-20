// In-memory MySQL-compatible query engine used ONLY when MySQL (DB_HOST) is unavailable.
// Matches the exact schema and parameterized queries in backend/database/schema.sql.

const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_FILE = path.join(os.tmpdir(), 'govservice-bd-mockdb.json');

const tables = {
  users: [],
  user_profiles: [],
  personal_documents: [],
  saved_services: [],
  document_checklists: [],
  feedback_reports: [],
  managed_services: [],
};

const autoInc = {
  users: 1,
  user_profiles: 1,
  personal_documents: 1,
  saved_services: 1,
  document_checklists: 1,
  feedback_reports: 1,
  managed_services: 1,
};

try {
  if (fs.existsSync(STATE_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (parsed?.tables && typeof parsed.tables === 'object') {
      for (const key of Object.keys(tables)) {
        if (Array.isArray(parsed.tables[key])) {
          tables[key] = parsed.tables[key];
        }
      }
    }
    if (parsed?.autoInc && typeof parsed.autoInc === 'object') {
      Object.assign(autoInc, parsed.autoInc);
    }
  }
} catch {
  // Start with clean in-memory tables if snapshot cannot be read
}

function persistState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ tables, autoInc }), { mode: 0o600 });
  } catch {
    // Ignore write failure
  }
}

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, ' ').trim();
}

async function query(sql, params = []) {
  const q = normalizeSql(sql);
  const upper = q.toUpperCase();
  const isMutation =
    upper.startsWith('INSERT') ||
    upper.startsWith('UPDATE') ||
    upper.startsWith('DELETE');

  const result = await executeQuery(q, upper, params);
  if (isMutation) {
    persistState();
  }
  return result;
}

async function executeQuery(q, upper, params) {

  // --- USERS ---
  if (upper.startsWith('SELECT COUNT(*) AS COUNT FROM USERS')) {
    return [[{ count: tables.users.length }], []];
  }

  if (upper.startsWith('SELECT ID FROM USERS WHERE EMAIL = ?')) {
    const email = String(params[0] || '').toLowerCase();
    const rows = tables.users
      .filter((u) => u.email.toLowerCase() === email)
      .map((u) => ({ id: u.id }));
    return [rows, []];
  }

  if (upper.startsWith('SELECT * FROM USERS WHERE EMAIL = ?')) {
    const email = String(params[0] || '').toLowerCase();
    const rows = tables.users.filter((u) => u.email.toLowerCase() === email);
    return [rows, []];
  }

  if (upper.startsWith('SELECT ID, PASSWORD_HASH FROM USERS WHERE ID = ?')) {
    const id = Number(params[0]);
    const rows = tables.users
      .filter((u) => u.id === id)
      .map((u) => ({ id: u.id, password_hash: u.password_hash }));
    return [rows, []];
  }

  if (upper.includes('FROM USERS') && upper.includes('WHERE ID = ?') && upper.startsWith('SELECT')) {
    const id = Number(params[0]);
    const rows = tables.users
      .filter((u) => u.id === id)
      .map(({ password_hash, ...safe }) => safe);
    return [rows, []];
  }

  if (upper.startsWith('SELECT ID, FULL_NAME, EMAIL, PHONE, ROLE, IS_ACTIVE, CREATED_AT FROM USERS')) {
    const rows = [...tables.users]
      .sort((a, b) => b.id - a.id)
      .map(({ password_hash, ...safe }) => safe);
    return [rows, []];
  }

  if (upper.startsWith('INSERT INTO USERS')) {
    const hasRole = upper.includes('ROLE');
    const id = autoInc.users++;
    const user = {
      id,
      full_name: params[0],
      email: String(params[1] || '').toLowerCase(),
      phone: params[2] || null,
      password_hash: params[3],
      role: hasRole ? (params[4] || 'user') : 'user',
      is_active: 1,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    tables.users.push(user);
    return [{ insertId: id, affectedRows: 1 }, []];
  }

  if (upper.startsWith('UPDATE USERS SET PASSWORD_HASH = ? WHERE ID = ?')) {
    const id = Number(params[1]);
    const user = tables.users.find((u) => u.id === id);
    if (!user) return [{ affectedRows: 0 }, []];
    user.password_hash = params[0];
    user.updated_at = nowIso();
    return [{ affectedRows: 1 }, []];
  }

  if (upper.startsWith('UPDATE USERS SET FULL_NAME = ?, PHONE = ? WHERE ID = ?')) {
    const id = Number(params[2]);
    const user = tables.users.find((u) => u.id === id);
    if (!user) return [{ affectedRows: 0 }, []];
    user.full_name = params[0];
    user.phone = params[1];
    user.updated_at = nowIso();
    return [{ affectedRows: 1 }, []];
  }

  if (upper.startsWith('UPDATE USERS SET ROLE = ?, IS_ACTIVE = ? WHERE ID = ?')) {
    const id = Number(params[2]);
    const user = tables.users.find((u) => u.id === id);
    if (!user) return [{ affectedRows: 0 }, []];
    user.role = params[0];
    user.is_active = Number(params[1]);
    user.updated_at = nowIso();
    return [{ affectedRows: 1 }, []];
  }

  // --- USER PROFILES ---
  if (upper.startsWith('SELECT ID FROM USER_PROFILES WHERE USER_ID = ?')) {
    const userId = Number(params[0]);
    return [tables.user_profiles.filter((p) => p.user_id === userId).map((p) => ({ id: p.id })), []];
  }

  if (upper.startsWith('SELECT * FROM USER_PROFILES WHERE USER_ID = ?')) {
    const userId = Number(params[0]);
    return [tables.user_profiles.filter((p) => p.user_id === userId), []];
  }

  if (upper.startsWith('INSERT INTO USER_PROFILES')) {
    const userId = Number(params[0]);
    let profile = tables.user_profiles.find((p) => p.user_id === userId);
    const data = {
      user_id: userId,
      nid_number: params[1] || null,
      date_of_birth: params[2] || null,
      father_name: params[3] || null,
      mother_name: params[4] || null,
      gender: params[5] || null,
      marital_status: params[6] || null,
      occupation: params[7] || null,
      present_address: params[8] || null,
      permanent_address: params[9] || null,
      updated_at: nowIso(),
    };
    if (profile) {
      Object.assign(profile, data);
      return [{ insertId: profile.id, affectedRows: 1 }, []];
    }
    const id = autoInc.user_profiles++;
    tables.user_profiles.push({ id, ...data });
    return [{ insertId: id, affectedRows: 1 }, []];
  }

  if (upper.startsWith('UPDATE USER_PROFILES SET') && upper.includes('WHERE USER_ID = ?')) {
    const userId = Number(params[9]);
    const profile = tables.user_profiles.find((p) => p.user_id === userId);
    if (!profile) return [{ affectedRows: 0 }, []];
    profile.nid_number = params[0] || null;
    profile.date_of_birth = params[1] || null;
    profile.father_name = params[2] || null;
    profile.mother_name = params[3] || null;
    profile.gender = params[4] || null;
    profile.marital_status = params[5] || null;
    profile.occupation = params[6] || null;
    profile.present_address = params[7] || null;
    profile.permanent_address = params[8] || null;
    profile.updated_at = nowIso();
    return [{ affectedRows: 1 }, []];
  }

  // --- PERSONAL DOCUMENTS ---
  if (upper.startsWith('INSERT INTO PERSONAL_DOCUMENTS')) {
    const id = autoInc.personal_documents++;
    const doc = {
      id,
      user_id: Number(params[0]),
      document_name: params[1],
      document_type: params[2] || null,
      file_name: params[3],
      file_path: params[4],
      file_size: params[5] ?? null,
      mime_type: params[6] ?? null,
      uploaded_at: nowIso(),
    };
    tables.personal_documents.push(doc);
    return [{ insertId: id, affectedRows: 1 }, []];
  }

  if (upper.includes('FROM PERSONAL_DOCUMENTS') && upper.includes('WHERE USER_ID = ?')) {
    const userId = Number(params[0]);
    const rows = tables.personal_documents
      .filter((d) => d.user_id === userId)
      .sort((a, b) => b.id - a.id);
    return [rows, []];
  }

  if (upper.includes('FROM PERSONAL_DOCUMENTS') && upper.includes('WHERE ID = ? AND USER_ID = ?') && upper.startsWith('SELECT')) {
    const id = Number(params[0]);
    const userId = Number(params[1]);
    return [tables.personal_documents.filter((d) => d.id === id && d.user_id === userId), []];
  }

  if (upper.includes('FROM PERSONAL_DOCUMENTS') && upper.includes('WHERE ID = ?') && upper.startsWith('SELECT')) {
    const id = Number(params[0]);
    return [tables.personal_documents.filter((d) => d.id === id), []];
  }

  if (upper.includes('FROM PERSONAL_DOCUMENTS D JOIN USERS U')) {
    const rows = tables.personal_documents
      .map((d) => {
        const u = tables.users.find((usr) => usr.id === d.user_id);
        return {
          ...d,
          user_name: u?.full_name || 'Unknown',
          user_email: u?.email || '',
        };
      })
      .sort((a, b) => b.id - a.id);
    return [rows, []];
  }

  if (upper.startsWith('DELETE FROM PERSONAL_DOCUMENTS WHERE ID = ? AND USER_ID = ?')) {
    const id = Number(params[0]);
    const userId = Number(params[1]);
    const idx = tables.personal_documents.findIndex((d) => d.id === id && d.user_id === userId);
    if (idx === -1) return [{ affectedRows: 0 }, []];
    tables.personal_documents.splice(idx, 1);
    return [{ affectedRows: 1 }, []];
  }

  if (upper.startsWith('DELETE FROM PERSONAL_DOCUMENTS WHERE ID = ?')) {
    const id = Number(params[0]);
    const idx = tables.personal_documents.findIndex((d) => d.id === id);
    if (idx === -1) return [{ affectedRows: 0 }, []];
    tables.personal_documents.splice(idx, 1);
    return [{ affectedRows: 1 }, []];
  }

  // --- SAVED SERVICES ---
  if (upper.startsWith('SELECT ID FROM SAVED_SERVICES WHERE USER_ID = ? AND SERVICE_KEY = ?')) {
    const userId = Number(params[0]);
    const key = params[1];
    return [tables.saved_services.filter((s) => s.user_id === userId && s.service_key === key).map((s) => ({ id: s.id })), []];
  }

  if (upper.startsWith('INSERT INTO SAVED_SERVICES')) {
    const id = autoInc.saved_services++;
    const item = {
      id,
      user_id: Number(params[0]),
      service_key: params[1],
      category_id: params[2] || null,
      service_index: params[3] ?? null,
      service_name: params[4],
      category_name: params[5] || null,
      saved_at: nowIso(),
    };
    tables.saved_services.push(item);
    return [{ insertId: id, affectedRows: 1 }, []];
  }

  if (upper.startsWith('SELECT * FROM SAVED_SERVICES WHERE USER_ID = ?')) {
    const userId = Number(params[0]);
    const rows = tables.saved_services.filter((s) => s.user_id === userId).sort((a, b) => b.id - a.id);
    return [rows, []];
  }

  if (upper.startsWith('DELETE FROM SAVED_SERVICES WHERE ID = ? AND USER_ID = ?')) {
    const id = Number(params[0]);
    const userId = Number(params[1]);
    const idx = tables.saved_services.findIndex((s) => s.id === id && s.user_id === userId);
    if (idx === -1) return [{ affectedRows: 0 }, []];
    tables.saved_services.splice(idx, 1);
    return [{ affectedRows: 1 }, []];
  }

  if (upper.startsWith('DELETE FROM SAVED_SERVICES WHERE SERVICE_KEY = ? AND USER_ID = ?')) {
    const key = params[0];
    const userId = Number(params[1]);
    const idx = tables.saved_services.findIndex((s) => s.service_key === key && s.user_id === userId);
    if (idx === -1) return [{ affectedRows: 0 }, []];
    tables.saved_services.splice(idx, 1);
    return [{ affectedRows: 1 }, []];
  }

  // --- DOCUMENT CHECKLISTS ---
  if (upper.startsWith('SELECT * FROM DOCUMENT_CHECKLISTS WHERE USER_ID = ?')) {
    const userId = Number(params[0]);
    const hasServiceKey = upper.includes('AND SERVICE_KEY = ?');
    const rows = tables.document_checklists
      .filter((c) => c.user_id === userId && (!hasServiceKey || c.service_key === params[1]))
      .sort((a, b) => b.id - a.id);
    return [rows, []];
  }

  if (upper.startsWith('SELECT ID FROM DOCUMENT_CHECKLISTS WHERE USER_ID = ? AND SERVICE_KEY = ? AND DOCUMENT_NAME = ?')) {
    const userId = Number(params[0]);
    const serviceKey = params[1];
    const docName = params[2];
    const rows = tables.document_checklists
      .filter((c) => c.user_id === userId && c.service_key === serviceKey && c.document_name === docName)
      .map((c) => ({ id: c.id }));
    return [rows, []];
  }

  if (upper.startsWith('INSERT INTO DOCUMENT_CHECKLISTS')) {
    const hasCompleted = upper.includes('IS_COMPLETED');
    const userId = Number(params[0]);
    const serviceKey = params[1];
    const docName = params[2];
    const isCompleted = hasCompleted ? (params[3] ? 1 : 0) : 0;
    const existing = tables.document_checklists.find(
      (c) => c.user_id === userId && c.service_key === serviceKey && c.document_name === docName
    );
    if (existing) {
      existing.is_completed = isCompleted;
      existing.updated_at = nowIso();
      return [{ insertId: existing.id, affectedRows: 1 }, []];
    }
    const id = autoInc.document_checklists++;
    tables.document_checklists.push({
      id,
      user_id: userId,
      service_key: serviceKey,
      document_name: docName,
      is_completed: isCompleted,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    return [{ insertId: id, affectedRows: 1 }, []];
  }

  if (upper.startsWith('UPDATE DOCUMENT_CHECKLISTS SET IS_COMPLETED = ? WHERE ID = ? AND USER_ID = ?')) {
    const completed = params[0] ? 1 : 0;
    const id = Number(params[1]);
    const userId = Number(params[2]);
    const item = tables.document_checklists.find((c) => c.id === id && c.user_id === userId);
    if (!item) return [{ affectedRows: 0 }, []];
    item.is_completed = completed;
    item.updated_at = nowIso();
    return [{ affectedRows: 1 }, []];
  }

  if (upper.startsWith('DELETE FROM DOCUMENT_CHECKLISTS WHERE ID = ? AND USER_ID = ?')) {
    const id = Number(params[0]);
    const userId = Number(params[1]);
    const idx = tables.document_checklists.findIndex((c) => c.id === id && c.user_id === userId);
    if (idx === -1) return [{ affectedRows: 0 }, []];
    tables.document_checklists.splice(idx, 1);
    return [{ affectedRows: 1 }, []];
  }

  // --- FEEDBACK REPORTS ---
  if (upper.startsWith('INSERT INTO FEEDBACK_REPORTS')) {
    const id = autoInc.feedback_reports++;
    const item = {
      id,
      user_id: Number(params[0]),
      feedback_type: params[1],
      subject: params[2],
      message: params[3],
      status: 'pending',
      admin_response: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    tables.feedback_reports.push(item);
    return [{ insertId: id, affectedRows: 1 }, []];
  }

  if (upper.startsWith('SELECT * FROM FEEDBACK_REPORTS WHERE USER_ID = ?')) {
    const userId = Number(params[0]);
    const rows = tables.feedback_reports.filter((f) => f.user_id === userId).sort((a, b) => b.id - a.id);
    return [rows, []];
  }

  if (upper.includes('FROM FEEDBACK_REPORTS F JOIN USERS U')) {
    const rows = tables.feedback_reports
      .map((f) => {
        const u = tables.users.find((usr) => usr.id === f.user_id);
        return {
          ...f,
          user_name: u?.full_name || 'Unknown',
          user_email: u?.email || '',
        };
      })
      .sort((a, b) => b.id - a.id);
    return [rows, []];
  }

  if (upper.startsWith('UPDATE FEEDBACK_REPORTS SET STATUS = ?, ADMIN_RESPONSE = ? WHERE ID = ?')) {
    const id = Number(params[2]);
    const item = tables.feedback_reports.find((f) => f.id === id);
    if (!item) return [{ affectedRows: 0 }, []];
    item.status = params[0];
    item.admin_response = params[1] || null;
    item.updated_at = nowIso();
    return [{ affectedRows: 1 }, []];
  }

  if (upper.startsWith('DELETE FROM FEEDBACK_REPORTS WHERE ID = ? AND USER_ID = ?')) {
    const id = Number(params[0]);
    const userId = Number(params[1]);
    const idx = tables.feedback_reports.findIndex((f) => f.id === id && f.user_id === userId);
    if (idx === -1) return [{ affectedRows: 0 }, []];
    tables.feedback_reports.splice(idx, 1);
    return [{ affectedRows: 1 }, []];
  }

  if (upper.startsWith('DELETE FROM FEEDBACK_REPORTS WHERE ID = ?')) {
    const id = Number(params[0]);
    const idx = tables.feedback_reports.findIndex((f) => f.id === id);
    if (idx === -1) return [{ affectedRows: 0 }, []];
    tables.feedback_reports.splice(idx, 1);
    return [{ affectedRows: 1 }, []];
  }

  // --- MANAGED SERVICES ---
  if (upper.startsWith('SELECT * FROM MANAGED_SERVICES WHERE IS_ACTIVE = 1')) {
    return [tables.managed_services.filter((s) => s.is_active === 1), []];
  }

  if (upper.startsWith('SELECT * FROM MANAGED_SERVICES WHERE SERVICE_KEY = ?')) {
    return [tables.managed_services.filter((s) => s.service_key === params[0]), []];
  }

  if (upper.startsWith('SELECT * FROM MANAGED_SERVICES')) {
    return [[...tables.managed_services].sort((a, b) => b.id - a.id), []];
  }

  if (upper.startsWith('INSERT INTO MANAGED_SERVICES')) {
    const existing = tables.managed_services.find((s) => s.service_key === params[0]);
    const record = {
      service_key: params[0],
      category_id: params[1],
      category_name: params[2],
      service_name: params[3],
      overview: params[4] || '',
      estimated_cost: params[5] || 'To be verified',
      processing_time: params[6] || 'To be verified',
      relevant_office: params[7] || 'To be verified',
      required_documents: params[8] || '[]',
      application_steps: params[9] || '{"online":[],"offline":[]}',
      official_link: params[10] || '',
      office_information: params[11] || '',
      is_active: params[12] ?? 1,
      updated_at: nowIso(),
    };
    if (existing) {
      Object.assign(existing, record);
      return [{ insertId: existing.id, affectedRows: 1 }, []];
    }
    const id = autoInc.managed_services++;
    tables.managed_services.push({ id, ...record, created_at: nowIso() });
    return [{ insertId: id, affectedRows: 1 }, []];
  }

  if (upper.startsWith('UPDATE MANAGED_SERVICES SET')) {
    const key = params[params.length - 1];
    const item = tables.managed_services.find((s) => s.service_key === key || s.id === Number(key));
    if (!item) return [{ affectedRows: 0 }, []];
    item.category_id = params[0];
    item.category_name = params[1];
    item.service_name = params[2];
    item.overview = params[3];
    item.estimated_cost = params[4];
    item.processing_time = params[5];
    item.relevant_office = params[6];
    item.required_documents = params[7];
    item.application_steps = params[8];
    item.official_link = params[9];
    item.office_information = params[10];
    item.is_active = params[11] ?? 1;
    item.updated_at = nowIso();
    return [{ affectedRows: 1 }, []];
  }

  if (upper.startsWith('DELETE FROM MANAGED_SERVICES WHERE SERVICE_KEY = ?')) {
    const idx = tables.managed_services.findIndex((s) => s.service_key === params[0] || s.id === Number(params[0]));
    if (idx === -1) return [{ affectedRows: 0 }, []];
    tables.managed_services.splice(idx, 1);
    return [{ affectedRows: 1 }, []];
  }

  // --- ADMIN STATS ---
  if (upper.includes('AS TOTALUSERS')) {
    return [[{
      totalUsers: tables.users.length,
      totalDocuments: tables.personal_documents.length,
      totalSavedServices: tables.saved_services.length,
      totalFeedback: tables.feedback_reports.length,
      pendingFeedback: tables.feedback_reports.filter((f) => f.status === 'pending').length,
      totalManagedServices: tables.managed_services.length,
    }], []];
  }

  return [[], []];
}

async function withTransaction(fn) {
  const snapshotTables = JSON.parse(JSON.stringify(tables));
  const snapshotAutoInc = { ...autoInc };
  try {
    const result = await fn({ query });
    persistState();
    return result;
  } catch (err) {
    for (const key of Object.keys(tables)) {
      tables[key] = snapshotTables[key] || [];
    }
    Object.assign(autoInc, snapshotAutoInc);
    persistState();
    throw err;
  }
}

module.exports = { query, tables, withTransaction };
