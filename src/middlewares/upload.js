import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { FILE_LIMITS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (FILE_LIMITS.ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`File type '${file.mimetype}' is not supported`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_LIMITS.MAX_SIZE_MB * 1024 * 1024,
    files: FILE_LIMITS.MAX_FILES,
  },
});
