const prisma = require('../lib/prisma');

exports.list = async (req, res) => {
  try {
    const { from, to, categorie } = req.query;
    const where = { boutiqueId: req.boutiqueId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    if (categorie) where.categorie = categorie;

    const depenses = await prisma.depense.findMany({ where, orderBy: { date: 'desc' } });
    res.json(depenses);
  } catch (err) {
    console.error('list depenses error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.create = async (req, res) => {
  try {
    const { montant, categorie, description, date } = req.body;
    if (!montant || !categorie) return res.status(400).json({ error: 'Montant et catégorie requis' });

    const depense = await prisma.depense.create({
      data: {
        boutiqueId: req.boutiqueId,
        montant: Number(montant),
        categorie,
        description,
        date: date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json(depense);
  } catch (err) {
    console.error('create depense error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const depense = await prisma.depense.findFirst({ where: { id, boutiqueId: req.boutiqueId } });
    if (!depense) return res.status(404).json({ error: 'Dépense introuvable' });
    await prisma.depense.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('remove depense error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
