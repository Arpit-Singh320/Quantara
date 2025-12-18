/**
 * Document Management Routes
 * Handles document uploads, storage, and retrieval
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// For now, we'll store documents as base64 in the database metadata
// In production, this would be S3/CloudFlare R2

// GET /api/documents - List all documents
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { clientId, policyId, renewalId, quoteId, type } = req.query;

    const documents = await prisma.document.findMany({
      where: {
        userId,
        ...(clientId && { clientId: clientId as string }),
        ...(policyId && { policyId: policyId as string }),
        ...(renewalId && { renewalId: renewalId as string }),
        ...(quoteId && { quoteId: quoteId as string }),
        ...(type && { type: type as any }),
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        type: true,
        mimeType: true,
        size: true,
        version: true,
        uploadedAt: true,
        clientId: true,
        policyId: true,
        renewalId: true,
        quoteId: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:documentId - Get a specific document
router.get('/:documentId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { documentId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      next(createError('Document not found', 404));
      return;
    }

    res.json({ document });
  } catch (error) {
    next(error);
  }
});

// POST /api/documents - Upload a new document
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const {
      name,
      originalName,
      type,
      mimeType,
      size,
      content, // Base64 encoded file content
      clientId,
      policyId,
      renewalId,
      quoteId,
      extractedText,
    } = req.body;

    if (!name || !originalName || !type || !mimeType || !size) {
      next(createError('name, originalName, type, mimeType, and size are required', 400));
      return;
    }

    // Generate a unique storage key
    const storageKey = `${userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${originalName}`;

    const document = await prisma.document.create({
      data: {
        userId,
        clientId,
        policyId,
        renewalId,
        quoteId,
        name,
        originalName,
        type,
        mimeType,
        size,
        storageKey,
        metadata: content ? { content } : undefined, // Store base64 content in metadata for now
        extractedText,
      },
    });

    // Log activity if linked to client or renewal
    if (clientId || renewalId) {
      await prisma.activity.create({
        data: {
          clientId,
          renewalId,
          type: 'DOCUMENT_UPLOADED',
          title: 'Document Uploaded',
          description: `Uploaded ${type.toLowerCase().replace('_', ' ')}: ${name}`,
          metadata: { documentId: document.id },
        },
      });
    }

    res.status(201).json({
      document: {
        id: document.id,
        name: document.name,
        originalName: document.originalName,
        type: document.type,
        mimeType: document.mimeType,
        size: document.size,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/documents/:documentId - Update document metadata
router.patch('/:documentId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { documentId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!existing) {
      next(createError('Document not found', 404));
      return;
    }

    const { name, type, extractedText } = req.body;

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(extractedText !== undefined && { extractedText }),
      },
    });

    res.json({ document });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:documentId - Delete a document
router.delete('/:documentId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { documentId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!existing) {
      next(createError('Document not found', 404));
      return;
    }

    // In production, also delete from S3/R2
    await prisma.document.delete({
      where: { id: documentId },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/renewal/:renewalId - Get all documents for a renewal
router.get('/renewal/:renewalId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { renewalId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Verify renewal belongs to user
    const renewal = await prisma.renewal.findFirst({
      where: { id: renewalId, userId },
    });

    if (!renewal) {
      next(createError('Renewal not found', 404));
      return;
    }

    const documents = await prisma.document.findMany({
      where: { renewalId },
      select: {
        id: true,
        name: true,
        originalName: true,
        type: true,
        mimeType: true,
        size: true,
        version: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    // Group by type
    const grouped = documents.reduce((acc: any, doc) => {
      if (!acc[doc.type]) acc[doc.type] = [];
      acc[doc.type].push(doc);
      return acc;
    }, {});

    res.json({ documents, grouped });
  } catch (error) {
    next(error);
  }
});

// POST /api/documents/:documentId/version - Create a new version
router.post('/:documentId/version', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { documentId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!existing) {
      next(createError('Document not found', 404));
      return;
    }

    const { content, size, extractedText } = req.body;

    if (!content || !size) {
      next(createError('content and size are required', 400));
      return;
    }

    // Generate new storage key
    const storageKey = `${userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${existing.originalName}`;

    // Create new version
    const newVersion = await prisma.document.create({
      data: {
        userId,
        clientId: existing.clientId,
        policyId: existing.policyId,
        renewalId: existing.renewalId,
        quoteId: existing.quoteId,
        name: existing.name,
        originalName: existing.originalName,
        type: existing.type,
        mimeType: existing.mimeType,
        size,
        storageKey,
        version: existing.version + 1,
        parentId: existing.id,
        metadata: { content },
        extractedText,
      },
    });

    res.status(201).json({ document: newVersion });
  } catch (error) {
    next(error);
  }
});

export default router;
