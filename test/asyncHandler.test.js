const asyncHandler = require('../utils/asyncHandler');

describe('asyncHandler', () => {
  it('calls the wrapped function with (req, res, next)', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    const fn = jest.fn().mockResolvedValue('ok');

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('does not call next on success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const next = jest.fn();

    await asyncHandler(fn)({}, {}, next);

    expect(next).not.toHaveBeenCalled();
  });

  it('forwards a rejected promise to next()', async () => {
    const error = new Error('boom');
    const fn = jest.fn().mockRejectedValue(error);
    const next = jest.fn();

    await asyncHandler(fn)({}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('forwards a thrown synchronous error to next()', async () => {
    const error = new Error('sync boom');
    const fn = jest.fn(() => {
      throw error;
    });
    const next = jest.fn();

    await asyncHandler(fn)({}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
