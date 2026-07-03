const prisma = require('../lib/prisma');

exports.push = async (req, res) => {
  try {
    const { queue } = req.body;
    if (!Array.isArray(queue)) return res.status(400).json({ error: 'queue doit être un tableau' });

    const results = [];
    for (const op of queue) {
      try {
        const result = await applyOp(req.boutiqueId, op);
        results.push({ id: op.id, success: true, result });
      } catch (err) {
        results.push({ id: op.id, success: false, error: err.message });
      }
    }
    res.json({ results, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('sync push error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

async function applyOp(boutiqueId, op) {
  const { entity, action, data } = op;
  const models = {
    categorie: prisma.categorie,
    client: prisma.client,
    salarie: prisma.salarie,
    depense: prisma.depense,
    dette: prisma.dette,
    vente: prisma.vente,
  };
  const model = models[entity];
  if (!model) throw new Error(`Entité inconnue: ${entity}`);

  if (action === 'create') {
    return model.create({ data: { ...data, boutiqueId } });
  }
  if (action === 'update') {
    const { id, ...rest } = data;
    return model.update({ where: { id }, data: rest });
  }
  if (action === 'delete') {
    return model.delete({ where: { id: data.id } });
  }
  throw new Error(`Action inconnue: ${action}`);
}

exports.pull = async (req, res) => {
  try {
    const { since } = req.query;
    const boutiqueId = req.boutiqueId;
    const filter = since ? { updatedAt: { gte: new Date(since) } } : {};
    const venteFilter = since ? { createdAt: { gte: new Date(since) } } : {};

    const [categories, produits, ventes, clients, salaries, commandes, depenses, dettes] = await Promise.all([
      prisma.categorie.findMany({ where: { boutiqueId, ...filter } }),
      prisma.produit.findMany({ where: { boutiqueId, ...filter } }),
      prisma.vente.findMany({ where: { boutiqueId, ...venteFilter } }),
      prisma.client.findMany({ where: { boutiqueId, ...filter } }),
      prisma.salarie.findMany({ where: { boutiqueId, ...filter } }),
      prisma.commande.findMany({ where: { boutiqueId, ...filter }, include: { lignes: true } }),
      prisma.depense.findMany({ where: { boutiqueId, ...filter } }),
      prisma.dette.findMany({ where: { boutiqueId, ...filter }, include: { paiements: true } }),
    ]);

    res.json({
      categories, produits, ventes, clients, salaries, commandes, depenses, dettes,
      pulledAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('sync pull error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
