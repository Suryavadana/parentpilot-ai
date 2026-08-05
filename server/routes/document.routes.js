import express from 'express';
import multer from 'multer';
import {
  listDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from '../controllers/document.controller.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File must be 10MB or smaller' });
      }

      return res.status(400).json({ error: error.message });
    }

    if (error) {
      return next(error);
    }

    return next();
  });
};

const router = express.Router();

router.get('/', listDocuments);
router.post('/', handleUpload, uploadDocument);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

export default router;
