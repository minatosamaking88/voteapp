import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { sessionStore } from '../src/auth/session-store.js';
import { disconnectDatabase, prisma } from '../src/db/prisma.js';

let app: ReturnType<typeof createApp>;
const origin = 'http://localhost:5173';
const validCredentials = {
  name: 'Casey Example',
  email: 'Casey@example.com',
  password: 'correct-horse-battery-staple',
};

beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  app = createApp();
});

afterAll(async () => {
  sessionStore.close();
  await disconnectDatabase();
});

describe('authentication API', () => {
  it('registers a normalized regular user and starts a refreshable session', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .set('Origin', origin)
      .send({ ...validCredentials, role: 'ADMIN' });

    expect(registration.status).toBe(201);
    expect(registration.body.user).toMatchObject({
      name: 'Casey Example',
      email: 'casey@example.com',
      role: 'USER',
    });
    expect(registration.body.user.passwordHash).toBeUndefined();
    expect(registration.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(registration.headers['set-cookie']?.[0]).toContain('SameSite=Lax');
    expect(registration.headers['set-cookie']?.[0]).toContain('Max-Age=604800');

    const created = await prisma.user.findUniqueOrThrow({
      where: { email: 'casey@example.com' },
    });
    expect(created.role).toBe('USER');
    expect(created.passwordHash).not.toBe(validCredentials.password);

    const cookie = sessionCookie(registration);
    const restored = await request(createApp()).get('/api/auth/me').set('Cookie', cookie);
    expect(restored.status).toBe(200);
    expect(restored.body).toMatchObject({ id: created.id, role: 'USER' });
  });

  it('preserves leading and trailing password whitespace', async () => {
    const password = '  keep-these-password-spaces  ';
    const registration = await request(app)
      .post('/api/auth/register')
      .set('Origin', origin)
      .send({ ...validCredentials, password });
    expect(registration.status).toBe(201);

    const accepted = await request(app)
      .post('/api/auth/login')
      .set('Origin', origin)
      .send({ email: validCredentials.email, password });
    const trimmed = await request(app)
      .post('/api/auth/login')
      .set('Origin', origin)
      .send({ email: validCredentials.email, password: password.trim() });

    expect(accepted.status).toBe(200);
    expect(trimmed.status).toBe(401);
  });

  it('rejects duplicate email after case and whitespace normalization', async () => {
    await register();

    const duplicate = await request(app)
      .post('/api/auth/register')
      .set('Origin', origin)
      .send({ ...validCredentials, email: '  CASEY@EXAMPLE.COM  ' });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('returns field validation errors without persisting invalid input', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', origin)
      .send({ name: ' A ', email: 'not-an-email', password: ' short ' });

    expect(response.status).toBe(400);
    expect(response.body.error.fieldErrors).toMatchObject({
      name: expect.any(Array),
      email: expect.any(Array),
      password: expect.any(Array),
    });
    expect(await prisma.user.count()).toBe(0);
  });

  it('logs in with a rotated session and uses a generic credential error', async () => {
    const registration = await register();
    const previousCookie = sessionCookie(registration);

    const login = await request(app)
      .post('/api/auth/login')
      .set('Origin', origin)
      .set('Cookie', previousCookie)
      .send({ email: ' CASEY@example.com ', password: validCredentials.password });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe('casey@example.com');
    expect(sessionCookie(login)).not.toBe(previousCookie);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .set('Origin', origin)
      .send({ email: 'casey@example.com', password: 'wrong-password-attempt' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .set('Origin', origin)
      .send({ email: 'unknown@example.com', password: 'wrong-password-attempt' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it('destroys the old session on logout and rejects unauthorized access', async () => {
    const registration = await register();
    const cookie = sessionCookie(registration);

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Origin', origin)
      .set('Cookie', cookie);
    expect(logout.status).toBe(204);
    expect(logout.headers['set-cookie']?.[0]).toContain('featurevote.sid=;');

    const oldCookie = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(oldCookie.status).toBe(401);
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });

  it('rate limits repeated authentication attempts', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Origin', origin)
        .send({ name: 'A', email: 'invalid', password: 'short' });
      expect(response.status).toBe(400);
    }

    const limited = await request(app)
      .post('/api/auth/register')
      .set('Origin', origin)
      .send(validCredentials);
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
  });

  it('blocks state changes that do not come from the configured origin', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'https://attacker.example')
      .send(validCredentials);

    expect(response.status).toBe(403);
    expect(await prisma.user.count()).toBe(0);
  });
});

async function register() {
  return request(app)
    .post('/api/auth/register')
    .set('Origin', origin)
    .send(validCredentials);
}

function sessionCookie(response: { headers: { 'set-cookie'?: string[] } }): string {
  const cookie = response.headers['set-cookie']?.[0]?.split(';')[0];
  if (!cookie) throw new Error('Registration did not issue a session cookie.');
  return cookie;
}
