import { config } from 'dotenv';

import { app } from './app';
import { logger } from './core/logger';

config({ path: '../../.env' });

const PORT = process.env.API_PORT || 4000;

app.listen(PORT, () => {
    logger.info(`🚀 Vaanix API server running on http://localhost:${PORT}`);
    logger.info(`📋 Health check: http://localhost:${PORT}/api/health`);
});
