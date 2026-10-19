import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

const uploadDir = path.resolve(env.UPLOAD_DIR);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const getFilePath = (filename) => path.join(uploadDir, filename);

export const deleteFile = async (filename) => {
  try {
    const fullPath = path.join(uploadDir, filename);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  } catch (err) {
    console.error(`Failed to delete file ${filename}:`, err.message);
  }
};
