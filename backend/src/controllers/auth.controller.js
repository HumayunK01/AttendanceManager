import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sql } from '../config/db.js'

export const login = async (req, res) => {
  const { email, password } = req.body

  const user = await sql`
    SELECT id, password_hash, role, is_first_login FROM users WHERE email = ${email}
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
}
