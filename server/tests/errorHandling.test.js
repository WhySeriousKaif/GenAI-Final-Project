// Tests for the unified error handling (P5): AppError + asyncHandler funnel
// into the central errorHandler. Uses a minimal Express app (no DB) + supertest.

const express = require('express');
const request = require('supertest');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../errors/AppError');
const errorHandler = require('../middleware/errorHandler');

const buildApp = () => {
  const app = express();

  app.get('/throws-app-error', asyncHandler(async () => {
    throw new AppError('not found here', 404);
  }));

  app.get('/throws-generic', asyncHandler(async () => {
    throw new Error('boom unexpected');
  }));

  app.get('/ok', asyncHandler(async (req, res) => {
    res.status(200).json({ success: true });
  }));

  app.use(errorHandler);
  return app;
};

describe('error handling pipeline', () => {
  const app = buildApp();

  test('AppError maps to its status code and message', async () => {
    const res = await request(app).get('/throws-app-error');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, message: 'not found here' });
  });

  test('generic errors default to 500', async () => {
    const res = await request(app).get('/throws-generic');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('boom unexpected');
  });

  test('happy path is unaffected', async () => {
    const res = await request(app).get('/ok');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
