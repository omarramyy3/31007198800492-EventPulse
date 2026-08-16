const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const registerForEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  if (!mongoose.isValidObjectId(eventId)) {
    return next(new AppError('Event not found.', 404));
  }

  const event = await Event.findById(eventId);
  if (!event) return next(new AppError('Event not found.', 404));

  const existing = await Registration.findOne({
    user: req.user._id,
    event: eventId,
    status: 'confirmed',
  });
  if (existing) {
    return next(new AppError('You are already registered for this event.', 409));
  }

  const currentCount = await Registration.countDocuments({ event: eventId, status: 'confirmed' });
  if (currentCount >= event.capacity) {
    return next(new AppError('This event is full.', 409));
  }

  try {
    const registration = await Registration.create({ user: req.user._id, event: eventId });
    res.status(201).json({ status: 'success', data: { registration } });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('You are already registered for this event.', 409));
    }
    throw err;
  }
});

const listMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ user: req.user._id, status: 'confirmed' })
    .populate({ path: 'event', populate: { path: 'category' } })
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: registrations.length,
    data: { registrations },
  });
});

const cancelRegistration = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Registration not found.', 404));
  }

  const registration = await Registration.findById(id);
  if (!registration || registration.status === 'cancelled') {
    return next(new AppError('Registration not found.', 404));
  }

  if (!registration.user.equals(req.user._id)) {
    return next(new AppError('You cannot cancel a registration that belongs to another user.', 403));
  }

  registration.status = 'cancelled';
  await registration.save();

  res.status(200).json({ status: 'success', data: { registration } });
});

module.exports = { registerForEvent, listMyRegistrations, cancelRegistration };
