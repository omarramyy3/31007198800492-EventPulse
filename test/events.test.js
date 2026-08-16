const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

let mongoServer;
let app;
let User;
let Category;

const buildToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  await mongoose.connect(process.env.MONGODB_URI);

  app = require('../app');
  User = require('../models/User');
  Category = require('../models/Category');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Events API', () => {
  let adminToken;
  let attendeeToken;
  let categoryId;

  beforeEach(async () => {
    const hashed = await bcrypt.hash('Password123!', 4);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: hashed,
      role: 'admin',
    });
    const attendee = await User.create({
      name: 'Attendee',
      email: 'attendee@test.com',
      password: hashed,
      role: 'attendee',
    });

    adminToken = buildToken(admin);
    attendeeToken = buildToken(attendee);

    const category = await Category.create({ name: 'Tech' });
    categoryId = category._id.toString();
  });

  it('creates an event as admin', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'DevCon',
        description: 'A developer conference',
        category: categoryId,
        date: new Date(Date.now() + 86400000).toISOString(),
        city: 'Cairo',
        capacity: 100,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.event.name).toBe('DevCon');
    expect(res.body.data.event.category._id).toBe(categoryId);
  });

  it('rejects event creation from a non-admin attendee', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        name: 'DevCon',
        description: 'A developer conference',
        category: categoryId,
        date: new Date().toISOString(),
        city: 'Cairo',
        capacity: 100,
      });

    expect(res.status).toBe(403);
  });

  it('rejects event creation with missing required fields', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete Event' });

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('lists events', async () => {
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'DevCon',
        description: 'A developer conference',
        category: categoryId,
        date: new Date(Date.now() + 86400000).toISOString(),
        city: 'Cairo',
        capacity: 100,
      });

    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data.events[0].name).toBe('DevCon');
  });

  it('filters events by city', async () => {
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Cairo Meetup',
        description: 'Meetup in Cairo',
        category: categoryId,
        date: new Date(Date.now() + 86400000).toISOString(),
        city: 'Cairo',
        capacity: 50,
      });
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Alex Meetup',
        description: 'Meetup in Alexandria',
        category: categoryId,
        date: new Date(Date.now() + 86400000).toISOString(),
        city: 'Alexandria',
        capacity: 50,
      });

    const res = await request(app).get('/api/events').query({ city: 'Cairo' });

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data.events[0].city).toBe('Cairo');
  });

  it('returns 404 for a non-existent event', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/events/${fakeId}`);
    expect(res.status).toBe(404);
  });
});