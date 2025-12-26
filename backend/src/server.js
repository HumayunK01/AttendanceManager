import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import routes from './routes/index.js'
import { db } from './config/db.js'
import { sql } from './config/db.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', routes)

app.get('/health', async (_, res) => {
  const result = await sql`select 1 as ok`
  res.json({ status: 'alive', db: result[0] })
})

app.listen(5000, () => console.log('Server running on http://localhost:5000'))
