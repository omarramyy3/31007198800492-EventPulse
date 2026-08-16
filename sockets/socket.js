const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Event = require('../models/Event');
const Message = require('../models/Message');
const User = require('../models/User');

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User no longer exists'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id} (user: ${socket.user?.email})`);

    socket.on('join-event', async ({ eventId }) => {
      if (!eventId) return;
      const event = await Event.findById(eventId);
      if (!event) {
        return socket.emit('error', { message: 'Event not found.' });
      }
      socket.join(`event:${eventId}`);
    });

    socket.on('send-announcement', async ({ eventId, content }) => {
      try {
        if (socket.user.role !== 'admin') {
          return socket.emit('error', { message: 'Only an admin can broadcast an announcement.' });
        }
        if (!eventId || !content) {
          return socket.emit('error', { message: 'eventId and content are required.' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
          return socket.emit('error', { message: 'Event not found.' });
        }

        const message = await Message.create({
          event: eventId,
          sender: socket.user._id,
          content,
        });

        io.to(`event:${eventId}`).emit('announcement', {
          id: message._id,
          event: eventId,
          sender: { id: socket.user._id, name: socket.user.name },
          content: message.content,
          createdAt: message.createdAt,
        });
      } catch (err) {
        socket.emit('error', { message: 'Could not send the announcement.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;