import { Router } from 'express';
import { globalSearch } from '../services/leadList.service.js';
import { auth } from '../middlewares/auth.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const result = await globalSearch(req.user, req.query.q);
  ApiResponse.ok(res, 'Search results', result);
}));

export default router;
