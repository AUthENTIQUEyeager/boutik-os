/**
 * BoutiK - Routes API
 */
import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { recordInstall, recordVisit, getPwaStats } from '../controllers/pwa.controller.js'

// Controllers
import { login, register, me, changePassword } from '../controllers/auth.controller.js'
import { getBoutique, updateBoutique, getStats } from '../controllers/boutique.controller.js'
import { getCategories, createCategorie, updateCategorie, deleteCategorie } from '../controllers/categories.controller.js'
import { getProduits, getProduit } from '../controllers/produits.controller.js'
import { getVentes, createVente, getBossStats } from '../controllers/ventes.controller.js'
import { sync, getSyncStatus } from '../controllers/sync.controller.js'
import { adminLogin, getAllBoutiques, bloquerBoutique, debloquerBoutique, getGlobalStats } from '../controllers/admin.controller.js'
import { pullData } from '../controllers/pull.controller.js'

router.get('/sync/pull', authMiddleware, pullData)

const router = Router()

// ─── AUTH ────────────────────────────────────────────────────────────────────
router.post('/auth/login', login)
router.post('/auth/register', register)
router.get('/auth/me', authMiddleware, me)
router.put('/auth/password', authMiddleware, changePassword)

// ─── BOUTIQUE ────────────────────────────────────────────────────────────────
router.get('/boutique', authMiddleware, getBoutique)
router.put('/boutique', authMiddleware, updateBoutique)
router.get('/boutique/stats', authMiddleware, getStats)

// ─── CATÉGORIES ──────────────────────────────────────────────────────────────
router.get('/categories', authMiddleware, getCategories)
router.post('/categories', authMiddleware, createCategorie)
router.put('/categories/:id', authMiddleware, updateCategorie)
router.delete('/categories/:id', authMiddleware, deleteCategorie)

// ─── PRODUITS ────────────────────────────────────────────────────────────────
router.get('/produits', authMiddleware, getProduits)
router.get('/produits/:id', authMiddleware, getProduit)

// ─── VENTES ──────────────────────────────────────────────────────────────────
router.get('/ventes', authMiddleware, getVentes)
router.post('/ventes', authMiddleware, createVente)
router.get('/ventes/stats/boss', authMiddleware, getBossStats)

// ─── SYNC ─────────────────────────────────────────────────────────────────────
router.post('/sync', authMiddleware, sync)
router.get('/sync/status', authMiddleware, getSyncStatus)

// ─── ADMIN ───────────────────────────────────────────────────────────────────
router.post('/admin/login', adminLogin)
router.get('/admin/boutiques', authMiddleware, adminMiddleware, getAllBoutiques)
router.put('/admin/boutiques/:id/bloquer', authMiddleware, adminMiddleware, bloquerBoutique)
router.put('/admin/boutiques/:id/debloquer', authMiddleware, adminMiddleware, debloquerBoutique)
router.get('/admin/stats', authMiddleware, adminMiddleware, getGlobalStats)

router.post('/pwa/install', recordInstall)
router.post('/pwa/visit', recordVisit)
router.get('/admin/pwa/stats', authMiddleware, adminMiddleware, getPwaStats)

export default router
