import { Router } from 'express'
import { login } from '../controllers/auth.controller.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT Token
 */

router.post('/login', login)

import { requireAuth } from '../middleware/auth.middleware.js'
import { changePassword } from '../controllers/auth.controller.js'
router.put('/change-password', requireAuth(), changePassword)

export default router
