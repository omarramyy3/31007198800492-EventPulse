const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listMyRegistrations, cancelRegistration } = require('../controllers/registrationController');

const router = express.Router();

/**
 * @swagger
 * /api/registrations/me:
 *   get:
 *     summary: Get the events the authenticated user is registered for
 *     tags: [Registrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of the user's registrations }
 */
router.get('/me', requireAuth, listMyRegistrations);

/**
 * @swagger
 * /api/registrations/{id}:
 *   delete:
 *     summary: Cancel a registration
 *     tags: [Registrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Registration cancelled }
 *       403: { description: Not your registration }
 *       404: { description: Registration not found }
 */
router.delete('/:id', requireAuth, cancelRegistration);

module.exports = router;