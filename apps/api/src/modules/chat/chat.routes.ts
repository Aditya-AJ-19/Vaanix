import { Router } from 'express';
import { requireAuthentication, requireOrganization, requirePermission } from '../../core/auth.middleware';
import { PERMISSIONS } from '@vaanix/shared';
import { chatController } from './chat.controller';

const router = Router();

// All chat routes require authentication + org context + agent read permission
router.use(requireAuthentication);
router.use(requireOrganization);

// Session CRUD
router.post('/sessions', requirePermission(PERMISSIONS.AGENT_READ), chatController.createSession);
router.get('/sessions', requirePermission(PERMISSIONS.AGENT_READ), chatController.listSessions);
router.get('/sessions/:id', requirePermission(PERMISSIONS.AGENT_READ), chatController.getSession);

// Chat interaction
router.post('/sessions/:id/messages', requirePermission(PERMISSIONS.AGENT_READ), chatController.sendMessage);
router.post('/sessions/:id/end', requirePermission(PERMISSIONS.AGENT_READ), chatController.endSession);

export { router as chatRouter };
