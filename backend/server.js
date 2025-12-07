import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { createServer } from 'http';
import { initSocket } from './socket.js';
import { startScheduledJobs } from './services/schedulerService.js';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// Start scheduled jobs
startScheduledJobs();

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
