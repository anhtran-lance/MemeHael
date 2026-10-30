const crypto = require('crypto');
const seed = require('../lib/seed');
const initial = require('../lib/snapshot.json');

// Dữ liệu lưu thành một file JSON trong repo GitHub (mỗi lần sửa là một commit nên có sẵn lịch sử và bản sao lưu).
const TOKEN = process.env.GH_TOKEN;
const REPO = process.env.GH_REPO || 'trananhhoai0-lang/MemeHael';
const BRANCH = process.env.GH_BRANCH || 'wbs-data';
const FILE = 'crm-wbs/state.json';

const ENUM = {
  status: ['todo', 'doing', 'done', 'hold'],
  priority: ['Cao', 'Trung bình', 'Thấp'],
  role: ['PM', 'PE'],
  solution: ['Lead', 'Sales', 'Automation', 'Prospect', 'Platform', 'Chung'],
  theme: ['0', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
};
const TEXT_LIMIT = { owner: 60, note: 500, deliverable: 200, name: 200, mark: 40, scope: 600, accept: 400, dep: 80 };
// Người biên tập cập nhật tiến độ; quản trị định nghĩa phạm vi và cấu trúc.
const EDITOR_FIELDS = ['status', 'owner', 'start', 'end', 'note', 'priority'];
const ADMIN_FIELDS = EDITOR_FIELDS.concat(['name', 'theme', 'role', 'solution', 'mark', 'deliverable', 'scope', 'accept', 'dep']);
const META_LIMIT = { name: 200, scale: 200, pm: 80, peLead: 80, peSales: 80, start: 10, deadline: 10 };
const SCOPE_KEYS = ['goals', 'inScope', 'outScope', 'assumptions', 'risks'];
const RACI_VALUES = ['R', 'A', 'A/R', 'C', 'I', '-'];
const LABEL = {
  status: 'trạng thái', owner: 'người phụ trách', start: 'bắt đầu', end: 'hạn', note: 'ghi chú', deliverable: 'thành phẩm',
  priority: 'ưu tiên', role: 'vai trò', solution: 'ứng dụng', mark: 'cột mốc', name: 'tên', theme: 'chủ đề',
  scope: 'phạm vi', accept: 'tiêu chí hoàn thành', dep: 'phụ thuộc',
};
const DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function same(a, b) {
  if (!a || !b) return false;
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

function roleOf(req) {
  const code = req.headers['x-access-code'] || '';
  if (same(code, process.env.WBS_ADMIN_CODE)) return 'admin';
  if (same(code, process.env.WBS_EDITOR_CODE)) return 'editor';
  return 'viewer';
}

const clean = (v, n) => String(v == null ? '' : v).split('').filter((c) => c.charCodeAt(0) >= 32).join('').slice(0, n);

// Bộ nhớ đệm ngắn trong hàm để giảm số lần gọi GitHub; sha dùng để chống ghi đè khi hai người sửa cùng lúc.
let cache = { t: 0, state: null, sha: '' };
const clone = (x) => JSON.parse(JSON.stringify(x));

function gh(method, body) {
  if (!TOKEN) throw new Error('Chưa cấu hình GH_TOKEN');
  return fetch('https://api.github.com/repos/' + REPO + '/contents/' + FILE + (method === 'GET' ? '?ref=' + BRANCH : ''), {
    method,
    headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'crm-wbs', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

async function save(state) {
  const msg = 'WBS rev ' + state.rev + ': ' + ((state.history && state.history[0] && state.history[0].msg) || 'cap nhat');
  const r = await gh('PUT', {
    message: msg.slice(0, 200),
    content: Buffer.from(JSON.stringify(state)).toString('base64'),
    branch: BRANCH,
    sha: cache.sha || undefined,
  });
  if (r.status === 409 || r.status === 422) { cache = { t: 0, state: null, sha: '' }; throw new Reject(409, 'Có người vừa chỉnh sửa, hãy tải lại trang rồi thử lại'); }
  if (!r.ok) throw new Error('Không ghi được dữ liệu (' + r.status + ')');
  const j = await r.json();
  cache = { t: Date.now(), state: clone(state), sha: j.content.sha };
}

async function load(fresh) {
  if (!fresh && cache.state && Date.now() - cache.t < 8000) return clone(cache.state);
  const r = await gh('GET');
  let state, sha = '';
  if (r.status === 404) {
    state = clone(initial);
    cache = { t: 0, state: null, sha: '' };
    await save(state);
    return state;
  }
  if (!r.ok) throw new Error('Không đọc được dữ liệu (' + r.status + ')');
  const j = await r.json();
  state = JSON.parse(Buffer.from(j.content, 'base64').toString('utf8'));
  sha = j.sha;
  cache = { t: Date.now(), state: clone(state), sha };
  return state;
}

class Reject extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

function checkField(f, v) {
  if (ENUM[f] && !ENUM[f].includes(v)) throw new Reject(400, 'Giá trị không hợp lệ cho ' + LABEL[f]);
  if ((f === 'start' || f === 'end') && !DATE_RE.test(v)) throw new Reject(400, 'Ngày không hợp lệ');
  if (f === 'name' && !v.trim()) throw new Reject(400, 'Tên không được trống');
}

const depth = (id) => id.split('.').length;
const children = (nodes, parent) => nodes.filter((n) => n.id.startsWith(parent + '.') && depth(n.id) === depth(parent) + 1);
function insertAfterBranch(nodes, parentId, node) {
  let last = nodes.findIndex((n) => n.id === parentId);
  nodes.forEach((n, i) => { if (n.id.startsWith(parentId + '.')) last = i; });
  nodes.splice(last + 1, 0, node);
}
function nextId(nodes, parentId) {
  const nums = children(nodes, parentId).map((n) => parseInt(n.id.split('.').pop(), 10) || 0);
  return parentId + '.' + (Math.max(0, ...nums) + 1);
}

// Đánh lại số thứ tự liên tục (1.1, 1.2, 1.3…) sau khi xóa hoặc thêm; cập nhật cả cột phụ thuộc.
function renumber(state) {
  const map = {}, counter = {};
  let changed = 0;
  state.nodes.forEach((n) => {
    const parts = n.id.split('.');
    if (parts.length === 1) { map[n.id] = n.id; return; }
    const parent = map[parts.slice(0, -1).join('.')];
    if (!parent) { map[n.id] = n.id; return; }
    counter[parent] = (counter[parent] || 0) + 1;
    map[n.id] = parent + '.' + counter[parent];
  });
  state.nodes.forEach((n) => {
    if (n.type === 'task' && n.dep) {
      n.dep = n.dep.split(',').map((x) => x.trim()).filter((x) => map[x]).map((x) => map[x]).join(', ');
    }
    if (map[n.id] !== n.id) { n.id = map[n.id]; changed += 1; }
  });
  return changed;
}

function apply(state, b, isAdmin) {
  if (b.op === 'update') {
    const node = state.nodes.find((x) => x.id === b.id);
    if (!node) throw new Reject(404, 'Không tìm thấy mục ' + b.id);
    const allowed = node.type === 'task' ? (isAdmin ? ADMIN_FIELDS : EDITOR_FIELDS) : (isAdmin ? ['name'] : []);
    const changes = [];
    for (const f of Object.keys(b.patch || {})) {
      if (!allowed.includes(f)) throw new Reject(403, 'Vai trò của bạn không được sửa trường ' + (LABEL[f] || f));
      const v = clean(b.patch[f], TEXT_LIMIT[f] || 20);
      checkField(f, v);
      if (node[f] !== v) { changes.push(LABEL[f] + ': ' + node[f] + ' → ' + v); node[f] = v; }
    }
    if (node.type === 'task' && node.start > node.end) throw new Reject(400, 'Ngày bắt đầu phải trước hoặc bằng hạn hoàn thành');
    return changes.length ? node.id + ' · ' + changes.join('; ') : '';
  }
  if (b.op === 'add' || b.op === 'addGroup') {
    if (!isAdmin) throw new Reject(403, 'Chỉ quản trị mới được thêm mục');
    const isGroup = b.op === 'addGroup';
    const parent = state.nodes.find((x) => x.id === b.parent && x.type === (isGroup ? 'phase' : 'group'));
    if (!parent) throw new Reject(400, isGroup ? 'Chọn nhóm đầu ra để thêm nhóm công việc' : 'Chọn nhóm công việc để thêm việc');
    const id = nextId(state.nodes, parent.id);
    const name = clean(b.name, 200).trim() || (isGroup ? 'Nhóm công việc mới' : 'Việc mới');
    const node = isGroup
      ? { id, type: 'group', name }
      : { id, type: 'task', theme: '0', name, owner: '', role: 'PE', solution: 'Chung', priority: 'Trung bình',
          start: state.meta.start, end: state.meta.start, mark: '', scope: '', deliverable: '', accept: '', dep: '',
          status: 'todo', note: '', milestone: false };
    insertAfterBranch(state.nodes, parent.id, node);
    return 'Thêm ' + id + ' · ' + name;
  }
  if (b.op === 'delete') {
    if (!isAdmin) throw new Reject(403, 'Chỉ quản trị mới được xóa mục');
    const i = state.nodes.findIndex((x) => x.id === b.id);
    if (i < 0) throw new Reject(404, 'Không tìm thấy mục ' + b.id);
    if (state.nodes.some((n) => n.id.startsWith(b.id + '.'))) throw new Reject(400, 'Hãy xóa các việc bên trong trước');
    const msg = 'Xóa ' + b.id + ' · ' + state.nodes[i].name;
    state.nodes.splice(i, 1);
    return msg;
  }
  if (b.op === 'meta') {
    if (!isAdmin) throw new Reject(403, 'Chỉ quản trị mới được sửa thông tin dự án');
    const changes = [];
    for (const f of Object.keys(b.patch || {})) {
      if (!META_LIMIT[f]) throw new Reject(400, 'Trường không hợp lệ');
      const v = clean(b.patch[f], META_LIMIT[f]);
      if ((f === 'start' || f === 'deadline') && !DATE_RE.test(v)) throw new Reject(400, 'Ngày không hợp lệ');
      if (state.meta[f] !== v) { changes.push(f + ': ' + state.meta[f] + ' → ' + v); state.meta[f] = v; }
    }
    return changes.length ? 'Thông tin dự án · ' + changes.join('; ') : '';
  }
  if (b.op === 'scope') {
    if (!isAdmin) throw new Reject(403, 'Chỉ quản trị mới được sửa phạm vi');
    if (!SCOPE_KEYS.includes(b.key)) throw new Reject(400, 'Mục phạm vi không hợp lệ');
    const items = String(b.text || '').split(String.fromCharCode(10)).map((s) => clean(s, 300).trim()).filter(Boolean).slice(0, 20);
    state.meta[b.key] = items;
    return 'Phạm vi · cập nhật mục ' + b.key + ' (' + items.length + ' dòng)';
  }
  if (b.op === 'raci') {
    const row = state.raci.rows[b.row];
    const v = clean(b.value, 4);
    if (!row || b.col < 0 || b.col >= state.raci.cols.length) throw new Reject(400, 'Ô RACI không hợp lệ');
    if (!RACI_VALUES.includes(v)) throw new Reject(400, 'Giá trị RACI không hợp lệ');
    if (row.v[b.col] === v) return '';
    const msg = 'RACI · ' + row.name + ' / ' + state.raci.cols[b.col] + ': ' + row.v[b.col] + ' → ' + v;
    row.v[b.col] = v;
    return msg;
  }
  if (b.op === 'setThemes') {
    if (!isAdmin) throw new Reject(403, 'Chỉ quản trị mới được chia lại chủ đề');
    const map = b.map && typeof b.map === 'object' ? b.map : {};
    let n = 0;
    state.nodes.forEach((x) => {
      const t = map[x.id];
      if (x.type === 'task' && ENUM.theme.includes(t) && x.theme !== t) { x.theme = t; n += 1; }
    });
    return n ? 'Chia lại chủ đề cho ' + n + ' việc' : '';
  }
  if (b.op === 'renumber') {
    if (!isAdmin) throw new Reject(403, 'Chỉ quản trị mới được đánh lại số thứ tự');
    const n = renumber(state);
    return n ? 'Đánh lại số thứ tự (' + n + ' mục)' : '';
  }
  if (b.op === 'reset') {
    if (!isAdmin) throw new Reject(403, 'Chỉ quản trị mới được đặt lại');
    const fresh = seed();
    state.meta = fresh.meta; state.nodes = fresh.nodes; state.raci = fresh.raci;
    return 'Đặt lại WBS về bản gốc';
  }
  throw new Reject(400, 'Thao tác không hợp lệ');
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const role = roleOf(req);
    if (req.method === 'GET') {
      const data = await load();
      return res.status(200).json({ data, role, badCode: !!req.headers['x-access-code'] && role === 'viewer' });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Phương thức không hỗ trợ' });
    if (role === 'viewer') return res.status(403).json({ error: 'Bạn chưa có quyền chỉnh sửa. Hãy đăng nhập bằng mã truy cập.' });

    const b = req.body && typeof req.body === 'object' ? req.body : {};
    const by = clean(b.by, 40).trim() || 'Ẩn danh';
    const state = await load(true);
    const msg = apply(state, b, role === 'admin');
    if (!msg) return res.status(200).json({ data: state, role });
    if (b.op !== 'renumber') renumber(state);

    state.rev = (state.rev || 0) + 1;
    state.updatedAt = new Date().toISOString();
    state.history = [{ t: state.updatedAt, by, role, msg }].concat(state.history || []).slice(0, 300);
    await save(state);
    return res.status(200).json({ data: state, role });
  } catch (e) {
    if (e instanceof Reject) return res.status(e.code).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: 'Lỗi máy chủ: ' + e.message });
  }
};
