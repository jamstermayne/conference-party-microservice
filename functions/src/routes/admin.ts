import express from 'express';
const router = express.Router();

/**
 * Placeholder admin router
 */
router.get('/', (_req, res) => {
  res.status(501).json({ ok: false, error: 'Admin API not implemented yet' });
});

export default router;