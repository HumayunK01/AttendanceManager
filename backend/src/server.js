import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import routes from './routes/index.js'
import { db } from './config/db.js'
import { sql } from './config/db.js'
import { swaggerUi, swaggerSpec } from './config/swagger.js'

const app = express()

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}))
app.use(express.json())
app.use('/api', routes)

app.get('/health', async (_, res) => {
  const result = await sql`select 1 as ok`
  res.json({ status: 'alive', db: result[0] })
})

const PORT = process.env.PORT || 5000
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
)

