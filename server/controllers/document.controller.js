import { promises as fs } from 'node:fs';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getPrismaClient } from '../lib/prisma.js';
import { encryptBuffer, decryptBuffer } from '../lib/encryption.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });

const DOCUMENT_CATEGORIES = ['medical', 'identification', 'school', 'insurance', 'other'];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const DOCUMENT_METADATA_SELECT = {
  id: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  category: true,
  childId: true,
  familyId: true,
  uploadedByUserId: true,
  createdAt: true,
  updatedAt: true,
};

const listDocuments = async (req, res, next) => {
  try {
    const client = getPrismaClient();
    const { childId } = req.query;

    const documents = await client.document.findMany({
      where: {
        familyId: req.familyId,
        // With a specific child selected, show that child's documents plus
        // family-wide documents (childId === null) that apply to everyone.
        ...(childId ? { OR: [{ childId }, { childId: null }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        ...DOCUMENT_METADATA_SELECT,
        child: {
          select: { fullName: true },
        },
      },
    });

    return res.status(200).json(documents);
  } catch (error) {
    return next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  let storagePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}` });
    }

    const { category, childId } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }

    if (!DOCUMENT_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}` });
    }

    const client = getPrismaClient();

    if (childId) {
      const child = await client.child.findFirst({
        where: { id: childId, familyId: req.familyId },
      });

      if (!child) {
        return res.status(400).json({ error: 'Invalid childId' });
      }
    }

    const { encrypted, iv, authTag } = encryptBuffer(req.file.buffer);

    // Named by a random id, never the original filename, so the filesystem
    // itself can't leak what a file is.
    storagePath = crypto.randomUUID();
    await fs.writeFile(path.join(UPLOADS_DIR, storagePath), encrypted);

    const document = await client.document.create({
      data: {
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        category,
        storagePath,
        iv,
        authTag,
        childId: childId || null,
        familyId: req.familyId,
        uploadedByUserId: req.user.userId,
      },
      select: DOCUMENT_METADATA_SELECT,
    });

    return res.status(201).json(document);
  } catch (error) {
    if (storagePath) {
      await fs.unlink(path.join(UPLOADS_DIR, storagePath)).catch(() => {});
    }

    return next(error);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const document = await client.document.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const encrypted = await fs.readFile(path.join(UPLOADS_DIR, document.storagePath));
    const decrypted = decryptBuffer(encrypted, document.iv, document.authTag);

    const asciiFallback = document.fileName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'");

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
    );
    res.setHeader('Content-Length', decrypted.length);

    return res.status(200).send(decrypted);
  } catch (error) {
    return next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = getPrismaClient();

    const document = await client.document.findFirst({
      where: { id, familyId: req.familyId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await client.document.delete({ where: { id } });

    await fs.unlink(path.join(UPLOADS_DIR, document.storagePath)).catch((error) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export {
  listDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
};
