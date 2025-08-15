import express from 'express';
const router = express.Router();

/**
 * Placeholder until real Invites API lands.
 * Keeps Functions deploy green.
 */
router.get('/', (_req, res) => {
  res.status(501).json({ ok: false, error: 'Invites API not implemented yet' });
});

export default router;