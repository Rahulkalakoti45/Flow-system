const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-secret';
const { createApp } = require('../src/app');
const { connectDB } = require('../src/config/db');

const app = createApp();
let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

async function registerUser(email = 'ada@example.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Ada', email, password: 'supersecret1' });
  return { token: res.body.token, user: res.body.user };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

test('register returns a token and never exposes the password hash', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Ada', email: 'Ada@Example.com', password: 'supersecret1' });

  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, 'ada@example.com');
  assert.equal(res.body.user.passwordHash, undefined);
});

test('register rejects duplicate emails and weak passwords', async () => {
  await registerUser();
  const dup = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Ada', email: 'ada@example.com', password: 'supersecret1' });
  assert.equal(dup.status, 409);

  const weak = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Bob', email: 'bob@example.com', password: 'short' });
  assert.equal(weak.status, 400);
  assert.equal(weak.body.errors[0].field, 'password');
});

test('login succeeds with correct credentials and fails otherwise', async () => {
  await registerUser();

  const ok = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ada@example.com', password: 'supersecret1' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const bad = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ada@example.com', password: 'wrong-password' });
  assert.equal(bad.status, 401);
});

test('protected routes reject missing or invalid tokens', async () => {
  const none = await request(app).get('/api/tasks');
  assert.equal(none.status, 401);

  const garbage = await request(app).get('/api/tasks').set(auth('not-a-jwt'));
  assert.equal(garbage.status, 401);
});

test('task CRUD works for the owner', async () => {
  const { token } = await registerUser();

  const created = await request(app)
    .post('/api/tasks')
    .set(auth(token))
    .send({ title: 'Write README', priority: 'high' });
  assert.equal(created.status, 201);
  const id = created.body.task.id;
  assert.equal(created.body.task.status, 'todo');

  const list = await request(app).get('/api/tasks').set(auth(token));
  assert.equal(list.body.tasks.length, 1);

  const updated = await request(app)
    .patch(`/api/tasks/${id}`)
    .set(auth(token))
    .send({ status: 'done' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.task.status, 'done');

  const deleted = await request(app).delete(`/api/tasks/${id}`).set(auth(token));
  assert.equal(deleted.status, 204);
});

test("users cannot read, edit or delete another user's tasks", async () => {
  const owner = await registerUser('owner@example.com');
  const intruder = await registerUser('intruder@example.com');

  const created = await request(app)
    .post('/api/tasks')
    .set(auth(owner.token))
    .send({ title: 'Private' });
  const id = created.body.task.id;

  const list = await request(app).get('/api/tasks').set(auth(intruder.token));
  assert.equal(list.body.tasks.length, 0);

  const patch = await request(app)
    .patch(`/api/tasks/${id}`)
    .set(auth(intruder.token))
    .send({ title: 'Hacked' });
  assert.equal(patch.status, 404);

  const del = await request(app).delete(`/api/tasks/${id}`).set(auth(intruder.token));
  assert.equal(del.status, 404);
});

test('invalid task input is rejected with field-level errors', async () => {
  const { token } = await registerUser();

  const res = await request(app)
    .post('/api/tasks')
    .set(auth(token))
    .send({ title: '', status: 'nope' });

  assert.equal(res.status, 400);
  const fields = res.body.errors.map((e) => e.field);
  assert.ok(fields.includes('title'));
  assert.ok(fields.includes('status'));
});

test('list can be filtered by status', async () => {
  const { token } = await registerUser();
  await request(app).post('/api/tasks').set(auth(token)).send({ title: 'A', status: 'done' });
  await request(app).post('/api/tasks').set(auth(token)).send({ title: 'B' });

  const res = await request(app).get('/api/tasks?status=done').set(auth(token));
  assert.equal(res.body.tasks.length, 1);
  assert.equal(res.body.tasks[0].title, 'A');
});
