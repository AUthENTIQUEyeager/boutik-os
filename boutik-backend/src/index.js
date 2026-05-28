/**
 * BoutiK - Serveur Express principal
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import routes from './routes/index.js'
import prisma from './config/database.js'

const app = express()
const PORT = process.env.PORT || 3001

// ─── SÉCURITÉ ────────────────────────────────────────────────────────────────
app.use(helmet())

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:4173',
  ],
  credentials: true
}))

// Rate limiting — 100 requêtes par minute par IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' }
})
app.use('/api', limiter)

// Rate limiting strict pour auth — 10 tentatives par minute
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion. Attendez 1 minute.' }
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' })) // 5mb pour les syncs importantes
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use('/api', routes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'BoutiK API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} introuvable` })
})

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message
  })
})

// ─── DÉMARRAGE ───────────────────────────────────────────────────────────────
async function start() {
  try {
    await prisma.$connect()
    console.log('Base de données connectée')

    app.listen(PORT, () => {
      console.log(`BoutiK API démarré sur http://localhost:${PORT}`)
      console.log(`Environnement : ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (err) {
    console.error('Erreur démarrage :', err)
    process.exit(1)
  }
}

// Fermeture propre
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

start()
