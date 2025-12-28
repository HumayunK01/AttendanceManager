import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sql } from '../config/db.js'

export const login = async (req, res) => {
  const { email, password } = req.body

  const user = await sql`
    SELECT id, name, email, password_hash, role, is_first_login FROM users WHERE email = ${email}
  `

  if (!user.length) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user[0].password_hash)

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
      role: user[0].role,
      isFirstLogin: user[0].is_first_login
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  )

  res.json({
    token,
    isFirstLogin: user[0].is_first_login
  })
}

export const changePassword = async (req, res) => {
  const { newPassword } = req.body
  const userId = req.user.id

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const hash = await bcrypt.hash(newPassword, 10)

  await sql`
    UPDATE users 
    SET password_hash = ${hash}, is_first_login = false 
    WHERE id = ${userId}
  `

  res.json({ success: true, message: 'Password updated successfully' })
  res.json({ success: true, message: 'Password updated successfully' })
}

export const forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email) return res.status(400).json({ error: 'Email required' })

  // Use parameterized query properly
  const user = await sql`SELECT id, name FROM users WHERE email = ${email}`

  // Always return success even if user not found (Security practice)
  if (!user.length) {
    return res.json({ success: true, message: 'Reset email sent if account exists' })
  }

  // Generate crypto random token
  const crypto = await import('crypto')
  const resetToken = crypto.randomBytes(32).toString('hex')
  // Expiry: 1 hour from now
  const resetTokenExpiry = new Date(Date.now() + 3600000)

  await sql`
    UPDATE users 
    SET reset_token = ${resetToken}, reset_token_expiry = ${resetTokenExpiry}
    WHERE id = ${user[0].id}
  `

  // Send Email (Async)
  // Use frontend URL from env or default specific to local setup
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080'
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`

  const mailerBaseUrl = process.env.MAILER_URL || 'http://127.0.0.1:5001'
  const mailerUrl = `${mailerBaseUrl}/api/send-password-reset`

  fetch(mailerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name: user[0].name,
      resetLink
    })
  }).catch(err => console.error('Failed to trigger mailer:', err))

  res.json({ success: true, message: 'Reset email sent if account exists' })
}

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const user = await sql`
    SELECT id FROM users 
    WHERE reset_token = ${token} 
    AND reset_token_expiry > NOW()
  `

  if (!user.length) {
    return res.status(400).json({ error: 'Invalid or expired token' })
  }

  const hash = await bcrypt.hash(newPassword, 10)

  // Reset token fields AND set is_first_login to false (just in case they forgot it on round 1)
  await sql`
    UPDATE users 
    SET password_hash = ${hash}, 
        reset_token = NULL, 
        reset_token_expiry = NULL,
        is_first_login = false,
        created_at = created_at
    WHERE id = ${user[0].id}
  `

  res.json({ success: true, message: 'Password has been reset successfully' })
}

export const verifyToken = async (req, res) => {
  const { token } = req.query

  if (!token) return res.status(400).json({ valid: false })

  const user = await sql`
    SELECT id FROM users 
    WHERE reset_token = ${token} 
    AND reset_token_expiry > NOW()
  `

  if (!user.length) {
    return res.status(400).json({ valid: false })
  }

  res.json({ valid: true })
}
