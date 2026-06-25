/**
 * BoutiK Backend — Contrôleur stats PWA
 * Stocke et agrège les données d'installation PWA
 */
import prisma from '../config/database.js'

// POST /api/pwa/install — enregistrer une installation
export async function recordInstall(req, res) {
  try {
    const { platform, date, userAgent } = req.body

    await prisma.pwaInstall.create({
      data: {
        platform: platform || 'unknown',
        installedAt: date ? new Date(date) : new Date(),
        userAgent: userAgent || ''
      }
    })

    return res.json({ success: true })
  } catch (err) {
    // Silencieux — ne pas bloquer l'app si ça rate
    return res.json({ success: false })
  }
}

// POST /api/pwa/visit — enregistrer une visite
export async function recordVisit(req, res) {
  try {
    const { platform, isInstalled, date } = req.body

    await prisma.pwaVisit.create({
      data: {
        platform: platform || 'unknown',
        isInstalled: isInstalled || false,
        visitedAt: date ? new Date(date) : new Date()
      }
    })

    return res.json({ success: true })
  } catch (err) {
    return res.json({ success: false })
  }
}

// GET /api/admin/pwa/stats — stats pour le dashboard admin
export async function getPwaStats(req, res) {
  try {
    const [
      totalInstalls,
      androidInstalls,
      iosInstalls,
      desktopInstalls,
      totalVisits,
      installedVisits,
      lastInstall
    ] = await Promise.all([
      prisma.pwaInstall.count(),
      prisma.pwaInstall.count({ where: { platform: 'android' } }),
      prisma.pwaInstall.count({ where: { platform: 'ios' } }),
      prisma.pwaInstall.count({ where: { platform: 'desktop' } }),
      prisma.pwaVisit.count(),
      prisma.pwaVisit.count({ where: { isInstalled: true } }),
      prisma.pwaInstall.findFirst({ orderBy: { installedAt: 'desc' }, select: { installedAt: true, platform: true } })
    ])

    const nonInstalledVisits = totalVisits - installedVisits
    const tauxInstallation = totalVisits > 0
      ? Math.round((totalInstalls / totalVisits) * 100)
      : 0

    return res.json({
      totalInstalls,
      androidInstalls,
      iosInstalls,
      desktopInstalls,
      totalVisits,
      nonInstalledVisits,
      tauxInstallation,
      lastInstall
    })
  } catch (err) {
    console.error('PWA stats error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
