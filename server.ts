import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const blockchain = require('./server/src/services/blockchain');
const store = require('./server/src/services/store');
const authRoutes = require('./server/src/routes/auth');
const organRoutes = require('./server/src/routes/batches');
const verifyRoutes = require('./server/src/routes/verify');
const statsRoutes = require('./server/src/routes/stats');

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Ensure initial seed includes all 6 role organs
  const currentOrgans = store.getOrgans();
  if (!currentOrgans.some((o: { organId?: string }) => o.organId === 'ORG-PAN-6210')) {
    store.resetToLifeLedger();
  }

  // Mount Backend API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/organs', organRoutes);
  app.use('/api/batches', organRoutes);
  app.use('/api/verify', verifyRoutes);
  app.use('/api/stats', statsRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      system: 'LifeLedger Decentralized Organ Procurement & Transplant Network',
      timestamp: new Date().toISOString(),
      isNodeConnected: blockchain.isNodeRunning(),
      contractInfo: blockchain.getContractInfo(),
    });
  });

  await blockchain.initBlockchain();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeLedger Unified Server running at http://0.0.0.0:${PORT}`);
  });

  if (PORT !== 5173) {
    const mirrorServer = app.listen(5173, '0.0.0.0', () => {
      console.log(`LifeLedger Mirror Port active at http://localhost:5173`);
    });
    mirrorServer.on('error', () => {
      // Port 5173 already in use or restricted; ignore silently
    });
  }
}

startServer();
