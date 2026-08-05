import express from 'express';
import multer from 'multer';
import { extractCalendar } from '../controllers/ai.controller.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image must be 10MB or smaller' });
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

router.post('/extract-calendar', handleUpload, extractCalendar);

export default router;
