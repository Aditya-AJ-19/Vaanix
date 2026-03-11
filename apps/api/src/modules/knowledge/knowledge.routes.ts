import { Router } from 'express';
import { requireAuthentication, requireOrganization, requirePermission } from '../../core/auth.middleware';
import { PERMISSIONS } from '@vaanix/shared';
import { knowledgeController } from './knowledge.controller';

const router = Router();

// All knowledge routes require authentication + org context + knowledge:manage permission
router.use(requireAuthentication);
router.use(requireOrganization);

// Knowledge Base CRUD
router.get('/', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.list);
router.get('/:id', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.getById);
router.post('/', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.create);
router.put('/:id', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.update);
router.delete('/:id', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.remove);

// Document management (nested under KB)
router.get('/:id/documents', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.listDocuments);
router.post('/:id/documents', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.uploadDocument);
router.delete('/:id/documents/:docId', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.removeDocument);

// Agent ↔ KB linking
router.get('/:id/agents', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.getLinkedAgents);
router.post('/:id/agents', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.linkAgent);
router.delete('/:id/agents/:agentId', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), knowledgeController.unlinkAgent);

export { router as knowledgeRouter };
