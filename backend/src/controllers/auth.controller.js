import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sql } from '../config/db.js'

export const login = async (req, res) => {
  const { email, password } = req.body

  const user = await sql`
    SELECT id, password_hash, role FROM users WHERE email = ${email}
  `

  if (!user.length) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user[0].password_hash)

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { id: user[0].id, role: user[0].role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  )

  res.json({ token })
}
