const prisma = require('../lib/prisma');
const { newId, generateRecuNumber } = require('../lib/utils');

exports.list = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { boutiqueId: req.boutiqueId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const ventes = await prisma.vente.findMany({ where, orderBy: { date: 'desc' } });
    res.json(ventes);
  } catch (err) {
    console.error('list ventes error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.create = async (req, res) => {
  try {
    const { produitId, categorieId, clientId, salarieId, nomProduit, prixVente, prixAchat, vendeurNom, type } = req.body;

    if (!nomProduit || prixVente == null) {
      return res.status(400).json({ error: 'Nom produit et prix de vente requis' });
    }

    const venteId = newId();
    const benefice = Number(prixVente) - Number(prixAchat || 0);

    const result = await prisma.$transaction(async (tx) => {
      if (produitId) {
        const produit = await tx.produit.findFirst({ where: { id: produitId, boutiqueId: req.boutiqueId, vendu: false } });
        if (!produit) throw new Error('Produit déjà vendu ou introuvable');

        await tx.produit.update({ where: { id: produitId }, data: { vendu: true, dateVente: new Date() } });

        if (categorieId) {
          await tx.categorie.update({ where: { id: categorieId }, data: { quantite: { decrement: 1 } } });
        }
      }

      return tx.vente.create({
        data: {
          id: venteId,
          boutiqueId: req.boutiqueId,
          produitId: produitId || null,
          categorieId: categorieId || null,
          clientId: clientId || null,
          salarieId: salarieId || null,
          nomProduit,
          prixVente: Number(prixVente),
          prixAchat: Number(prixAchat || 0),
          benefice,
          vendeurNom: vendeurNom || 'Gérant',
          type: type || 'normal',
          numeroRecu: generateRecuNumber(),
        },
      });
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('create vente error:', err);
    res.status(400).json({ error: err.message || 'Erreur lors de la vente' });
  }
};

exports.bossStats = async (req, res) => {
  try {
    const { periode } = req.query;
    const where = { boutiqueId: req.boutiqueId };
    if (periode === '7j' || periode === '30j') {
      const days = periode === '7j' ? 7 : 30;
      const from = new Date();
      from.setDate(from.getDate() - days);
      from.setHours(0, 0, 0, 0);
      where.date = { gte: from };
    }

    const ventes = await prisma.vente.findMany({ where });
    const ca = ventes.reduce((s, v) => s + v.prixVente, 0);
    const benefice = ventes.reduce((s, v) => s + v.benefice, 0);
    const marge = ca > 0 ? Math.round((benefice / ca) * 100) : 0;

    const days7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const ventesJour = ventes.filter((v) => new Date(v.date) >= d && new Date(v.date) < next);
      days7.push({
        date: d.toISOString().slice(0, 10),
        ca: ventesJour.reduce((s, v) => s + v.prixVente, 0),
        benefice: ventesJour.reduce((s, v) => s + v.benefice, 0),
      });
    }

    const parCategorie = {};
    for (const v of ventes) {
      const key = v.categorieId || v.nomProduit;
      if (!parCategorie[key]) parCategorie[key] = { nom: v.nomProduit, ca: 0, benefice: 0, ventes: 0 };
      parCategorie[key].ca += v.prixVente;
      parCategorie[key].benefice += v.benefice;
      parCategorie[key].ventes += 1;
    }
    const topCategories = Object.values(parCategorie).sort((a, b) => b.benefice - a.benefice).slice(0, 5);

    res.json({ ca, benefice, marge, nombreVentes: ventes.length, days7, topCategories });
  } catch (err) {
    console.error('bossStats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
