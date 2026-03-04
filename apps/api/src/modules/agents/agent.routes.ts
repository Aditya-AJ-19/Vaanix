import { Router } from 'express';
import { requireAuthentication, requireOrganization, requirePermission } from '../../core/auth.middleware';
import { PERMISSIONS } from '@vaanix/shared';
import { agentController } from './agent.controller';

const router = Router();

// All agent routes require authentication + org context
router.use(requireAuthentication);
router.use(requireOrganization);

// CRUD routes
router.get('/', requirePermission(PERMISSIONS.AGENT_READ), agentController.list);
router.get('/:id', requirePermission(PERMISSIONS.AGENT_READ), agentController.getById);
router.post('/', requirePermission(PERMISSIONS.AGENT_CREATE), agentController.create);
router.put('/:id', requirePermission(PERMISSIONS.AGENT_UPDATE), agentController.update);
router.delete('/:id', requirePermission(PERMISSIONS.AGENT_DELETE), agentController.remove);

// Action routes
router.post('/:id/duplicate', requirePermission(PERMISSIONS.AGENT_CREATE), agentController.duplicate);
router.post('/:id/publish', requirePermission(PERMISSIONS.AGENT_UPDATE), agentController.publish);
router.post('/:id/archive', requirePermission(PERMISSIONS.AGENT_UPDATE), agentController.archive);

export { router as agentRouter };
