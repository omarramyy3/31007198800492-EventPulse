const mongoose = require('mongoose');
const Message = require('../models/Message');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listEventMessages = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  if (!mongoose.isValidObjectId(eventId)) {
    return next(new AppError('Event not found.', 404));
  }

  const messages = await Message.find({ event: eventId })
    .populate('sender', 'name email role')
    .sort('createdAt');

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: { messages },
  });
});

module.exports = { listEventMessages };
