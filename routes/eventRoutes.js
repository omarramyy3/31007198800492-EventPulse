const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { registerForEvent } = require('../controllers/registrationController');
const { listEventMessages } = require('../controllers/messageController');

const router = express.Router();

const eventValidationRules = [
  body('name').trim().notEmpty().withMessage('Event name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isMongoId().withMessage('A valid category id is required'),
  body('date').isISO8601().withMessage('A valid date is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: List events with filtering, pagination, sorting and search
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [date, -date, registrations] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated list of events }
 */
router.get('/', listEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a single event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event found }
 *       404: { description: Event not found }
 */
router.get('/:id', getEvent);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create an event (admin only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Event created }
 *       403: { description: Not an admin }
 *       422: { description: Validation error }
 */
router.post('/', requireAuth, requireRole('admin'), eventValidationRules, validate, createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   patch:
 *     summary: Update an event (admin only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Event updated }
 *       403: { description: Not an admin }
 *       404: { description: Event not found }
 */
router.patch('/:id', requireAuth, requireRole('admin'), updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event (admin only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Event deleted }
 *       403: { description: Not an admin }
 *       404: { description: Event not found }
 */
router.delete('/:id', requireAuth, requireRole('admin'), deleteEvent);

/**
 * @swagger
 * /api/events/{eventId}/register:
 *   post:
 *     summary: Register the authenticated user for an event
 *     tags: [Registrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Registration created }
 *       409: { description: Already registered or event full }
 */
router.post('/:eventId/register', requireAuth, registerForEvent);

/**
 * @swagger
 * /api/events/{eventId}/messages:
 *   get:
 *     summary: Get the announcement history for an event
 *     tags: [Announcements]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Announcement history, ordered by time }
 */
router.get('/:eventId/messages', requireAuth, listEventMessages);

module.exports = router;