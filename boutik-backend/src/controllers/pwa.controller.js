/**
 * BoutiK Backend — Contrôleur stats PWA enrichi
 * Inclut données par jour sur 7 jours pour les courbes
 */
import prisma from '../config/database.js'

// POST /api/pwa/install
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
  } catch {
    return res.json({ success: false })
  }
}

// POST /api/pwa/visit
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
  } catch {
    return res.json({ success: false })
  }
}

// GET /api/admin/pwa/stats
export async function getPwaStats(req, res) {
  try {
    const now = new Date()

    // ── Totaux globaux ────────────────────────────────────────────────────────
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
      prisma.pwaInstall.findFirst({
        orderBy: { installedAt: 'desc' },
        select: { installedAt: true, platform: true }
      })
    ])

    // ── Données par jour sur 7 jours ─────────────────────────────────────────
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Construire un tableau de 7 jours
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        androidInstalls: 0,
        iosInstalls: 0,
        totalInstalls: 0,
        visits: 0,
        activeUsers: 0, // visites depuis l'app installée
      })
    }

    // Installations Android par jour
    const androidByDay = await prisma.$queryRaw`
      SELECT DATE("installedAt") as day, COUNT(*)::int as count
      FROM pwa_installs
      WHERE platform = 'android' AND "installedAt" >= ${sevenDaysAgo}
      GROUP BY DATE("installedAt")
    `

    // Installations iOS par jour
    const iosByDay = await prisma.$queryRaw`
      SELECT DATE("installedAt") as day, COUNT(*)::int as count
      FROM pwa_installs
      WHERE platform = 'ios' AND "installedAt" >= ${sevenDaysAgo}
      GROUP BY DATE("installedAt")
    `

    // Visites (navigateur) par jour
    const visitsByDay = await prisma.$queryRaw`
      SELECT DATE("visitedAt") as day, COUNT(*)::int as count
      FROM pwa_visits
      WHERE "visitedAt" >= ${sevenDaysAgo}
      GROUP BY DATE("visitedAt")
    `

    // Utilisations depuis app installée par jour
    const activeByDay = await prisma.$queryRaw`
      SELECT DATE("visitedAt") as day, COUNT(*)::int as count
      FROM pwa_visits
      WHERE "isInstalled" = true AND "visitedAt" >= ${sevenDaysAgo}
      GROUP BY DATE("visitedAt")
    `

    // Fusionner dans le tableau de 7 jours
    for (const row of androidByDay) {
      const d = days.find(day => day.date === row.day.toISOString().split('T')[0])
      if (d) { d.androidInstalls = row.count; d.totalInstalls += row.count }
    }
    for (const row of iosByDay) {
      const d = days.find(day => day.date === row.day.toISOString().split('T')[0])
      if (d) { d.iosInstalls = row.count; d.totalInstalls += row.count }
    }
    for (const row of visitsByDay) {
      const d = days.find(day => day.date === row.day.toISOString().split('T')[0])
      if (d) d.visits = row.count
    }
    for (const row of activeByDay) {
      const d = days.find(day => day.date === row.day.toISOString().split('T')[0])
      if (d) d.activeUsers = row.count
    }

    // ── Aujourd'hui ───────────────────────────────────────────────────────────
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const [androidToday, iosToday, visitsToday, activeToday] = await Promise.all([
      prisma.pwaInstall.count({ where: { platform: 'android', installedAt: { gte: today } } }),
      prisma.pwaInstall.count({ where: { platform: 'ios', installedAt: { gte: today } } }),
      prisma.pwaVisit.count({ where: { visitedAt: { gte: today } } }),
      prisma.pwaVisit.count({ where: { isInstalled: true, visitedAt: { gte: today } } })
    ])

    return res.json({
      // Totaux
      totalInstalls,
      androidInstalls,
      iosInstalls,
      desktopInstalls,
      totalVisits,
      nonInstalledVisits: totalVisits - installedVisits,
      tauxInstallation: totalVisits > 0 ? Math.round((totalInstalls / totalVisits) * 100) : 0,
      lastInstall,
      // Aujourd'hui
      today: {
        androidInstalls: androidToday,
        iosInstalls: iosToday,
        visits: visitsToday,
        activeUsers: activeToday
      },
      // 7 derniers jours (pour les courbes)
      dailyData: days
    })
  } catch (err) {
    console.error('PWA stats error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
