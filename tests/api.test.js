process.env.JWT_SECRET = 'test-secret';
process.env.DB_FILE = ':memory:';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

let server, base, token, taskId;
const call = async (path, method = 'GET', body, tok) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

before(() => new Promise(r => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; r(); }); }));
after(() => server.close());

test('AUTH: register returns 201 + JWT', async () => {
  const r = await call('/api/auth/register', 'POST', { name: 'Alice', email: 'a@x.com', password: 'secret123' });
  assert.equal(r.status, 201); assert.ok(r.body.token); token = r.body.token;
});
test('AUTH: duplicate email rejected (409)', async () => {
  const r = await call('/api/auth/register', 'POST', { name: 'A', email: 'a@x.com', password: 'secret123' });
  assert.equal(r.status, 409);
});
test('AUTH: wrong password rejected (401)', async () => {
  assert.equal((await call('/api/auth/login', 'POST', { email: 'a@x.com', password: 'nope' })).status, 401);
});
test('AUTH: login succeeds (200)', async () => {
  const r = await call('/api/auth/login', 'POST', { email: 'a@x.com', password: 'secret123' });
  assert.equal(r.status, 200); assert.ok(r.body.token);
});
test('PROTECTED: no token -> 401', async () => {
  assert.equal((await call('/api/tasks')).status, 401);
});
test('PROTECTED: bad token -> 401', async () => {
  assert.equal((await call('/api/tasks', 'GET', null, 'garbage')).status, 401);
});
test('PROTECTED: /me with token -> 200', async () => {
  const r = await call('/api/auth/me', 'GET', null, token);
  assert.equal(r.status, 200); assert.equal(r.body.email, 'a@x.com');
});
test('CRUD: Create task (201)', async () => {
  const r = await call('/api/tasks', 'POST', { title: 'Write report' }, token);
  assert.equal(r.status, 201); assert.equal(r.body.status, 'todo'); taskId = r.body.id;
});
test('CRUD: validation error (400)', async () => {
  assert.equal((await call('/api/tasks', 'POST', {}, token)).status, 400);
});
test('CRUD: Read list + single (200)', async () => {
  assert.equal((await call('/api/tasks', 'GET', null, token)).body.length, 1);
  assert.equal((await call('/api/tasks/' + taskId, 'GET', null, token)).body.title, 'Write report');
});
test('CRUD: Update task (200)', async () => {
  const r = await call('/api/tasks/' + taskId, 'PUT', { status: 'done' }, token);
  assert.equal(r.status, 200); assert.equal(r.body.status, 'done');
});
test('AUTHZ: other user cannot access my task (404)', async () => {
  const b = await call('/api/auth/register', 'POST', { name: 'Bob', email: 'b@x.com', password: 'secret123' });
  assert.equal((await call('/api/tasks/' + taskId, 'GET', null, b.body.token)).status, 404);
  assert.equal((await call('/api/tasks', 'GET', null, b.body.token)).body.length, 0);
});
test('CRUD: Delete task (204) then 404', async () => {
  assert.equal((await call('/api/tasks/' + taskId, 'DELETE', null, token)).status, 204);
  assert.equal((await call('/api/tasks/' + taskId, 'GET', null, token)).status, 404);
});
