import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'vaanix-api',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

export { router as healthRouter };
