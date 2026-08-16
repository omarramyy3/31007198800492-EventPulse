const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listEvents = asyncHandler(async (req, res) => {
  const { category, city, dateFrom, dateTo, page = 1, limit = 10, sort, search } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (city) filter.city = new RegExp(`^${city}$`, 'i');
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
  const skip = (pageNum - 1) * limitNum;

  if (sort === 'registrations') {
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'registrations',
          let: { eventId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$event', '$$eventId'] },
                status: 'confirmed',
              },
            },
          ],
          as: 'regs',
        },
      },
      { $addFields: { registrationCount: { $size: '$regs' } } },
      { $sort: { registrationCount: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      { $project: { regs: 0 } },
    ];

    const events = await Event.aggregate(pipeline);
    await Event.populate(events, { path: 'category' });
    const total = await Event.countDocuments(filter);

    return res.status(200).json({
      status: 'success',
      results: events.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: { events },
    });
  }

  let query = Event.find(filter).populate('category');

  if (sort === 'date') {
    query = query.sort('date');
  } else if (sort === '-date') {
    query = query.sort('-date');
  } else {
    query = query.sort('-createdAt');
  }

  const total = await Event.countDocuments(filter);
  const events = await query.skip(skip).limit(limitNum);

  res.status(200).json({
    status: 'success',
    results: events.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    data: { events },
  });
});

const getEvent = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Event not found.', 404));
  }
  const event = await Event.findById(req.params.id).populate('category');
  if (!event) return next(new AppError('Event not found.', 404));
  res.status(200).json({ status: 'success', data: { event } });
});

const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user._id });
  await event.populate('category');
  res.status(201).json({ status: 'success', data: { event } });
});

const updateEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category');
  if (!event) return next(new AppError('Event not found.', 404));
  res.status(200).json({ status: 'success', data: { event } });
});

const deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return next(new AppError('Event not found.', 404));
  res.status(204).json({ status: 'success', data: null });
});

module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent };
