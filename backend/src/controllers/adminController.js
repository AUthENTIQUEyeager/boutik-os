const prisma = require('../lib/prisma');

exports.listBoutiques = async (req, res) => {
  try {
    const boutiques = await prisma.boutique.findMany({ orderBy: { createdAt: 'desc' } });

    const enriched = await Promise.all(
      boutiques.map(async (b) => {
        const ventes = await prisma.vente.findMany({ where: { boutiqueId: b.id } });
        const ca = ventes.reduce((s, v) => s + v.prixVente, 0);
        const benefice = ventes.reduce((s, v) => s + v.benefice, 0);

        const abonnementFin = new Date(b.abonnementDebut);
        abonnementFin.setDate(abonnementFin.getDate() + 30);
        const joursRestants = Math.max(0, Math.ceil((abonnementFin - new Date()) / (1000 * 60 * 60 * 24)));

        const { password: _pw, ...safe } = b;
        return { ...safe, ca, benefice, nombreVentes: ventes.length, joursRestants };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('listBoutiques error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.bloquer = async (req, res) => {
  try {
    const updated = await prisma.boutique.update({ where: { id: req.params.id }, data: { bloquee: true } });
    const { password: _pw, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    console.error('bloquer error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.debloquer = async (req, res) => {
  try {
    const updated = await prisma.boutique.update({ where: { id: req.params.id }, data: { bloquee: false } });
    const { password: _pw, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    console.error('debloquer error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.globalStats = async (req, res) => {
  try {
    const [nombreBoutiques, ventes] = await Promise.all([
      prisma.boutique.count(),
      prisma.vente.findMany(),
    ]);
    res.json({
      nombreBoutiques,
      ca: ventes.reduce((s, v) => s + v.prixVente, 0),
      benefice: ventes.reduce((s, v) => s + v.benefice, 0),
      nombreVentes: ventes.length,
    });
  } catch (err) {
    console.error('globalStats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.pwaStats = async (req, res) => {
  try {
    const [installs, visits] = await Promise.all([
      prisma.pwaInstall.findMany(),
      prisma.pwaVisit.findMany(),
    ]);

    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      dailyData.push({
        date: d.toISOString().slice(0, 10),
        installs: installs.filter((x) => x.installedAt >= d && x.installedAt < next).length,
        visits: visits.filter((x) => x.visitedAt >= d && x.visitedAt < next).length,
      });
    }

    res.json({ totalInstalls: installs.length, totalVisits: visits.length, dailyData });
  } catch (err) {
    console.error('pwaStats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
