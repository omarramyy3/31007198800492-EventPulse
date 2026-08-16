const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventPulse API',
      version: '1.0.0',
      description:
        'Event management API: authentication, role-based authorization, events with filtering/pagination/search, registrations with capacity limits, and real-time announcements via Socket.io.',
    },
    servers: [
      { url: '/', description: 'Current server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },

  apis: ['./routes/*.js'],
};

module.exports = swaggerJSDoc(options);
