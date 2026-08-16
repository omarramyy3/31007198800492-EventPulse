const AppError = require('../utils/AppError');

describe('AppError', () => {
  it('sets message and statusCode', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
  });

  it('marks 4xx errors as status "fail"', () => {
    const err = new AppError('Bad request', 400);
    expect(err.status).toBe('fail');
  });

  it('marks 5xx errors as status "error"', () => {
    const err = new AppError('Server exploded', 500);
    expect(err.status).toBe('error');
  });

  it('is flagged as operational', () => {
    const err = new AppError('Something', 403);
    expect(err.isOperational).toBe(true);
  });

  it('is an instance of Error', () => {
    const err = new AppError('Oops', 400);
    expect(err instanceof Error).toBe(true);
  });
});
