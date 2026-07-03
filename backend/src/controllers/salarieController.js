const prisma = require('../lib/prisma');

exports.list = async (req, res) => {
  try {
    const salaries = await prisma.salarie.findMany({
      where: { boutiqueId: req.boutiqueId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { ventes: true } } },
    });
    res.json(salaries);
  } catch (err) {
    console.error('list salaries error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nom, poste, telephone, salaire } = req.body;
    if (!nom) return res.status(400).json({ error: 'Nom requis' });

    const salarie = await prisma.salarie.create({
      data: { boutiqueId: req.boutiqueId, nom, poste, telephone, salaire: Number(salaire) || 0 },
    });
    res.status(201).json(salarie);
  } catch (err) {
    console.error('create salarie error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const salarie = await prisma.salarie.findFirst({ where: { id, boutiqueId: req.boutiqueId } });
    if (!salarie) return res.status(404).json({ error: 'Salarié introuvable' });

    const { nom, poste, telephone, salaire, actif } = req.body;
    const data = {};
    if (nom !== undefined) data.nom = nom;
    if (poste !== undefined) data.poste = poste;
    if (telephone !== undefined) data.telephone = telephone;
    if (salaire !== undefined) data.salaire = Number(salaire);
    if (actif !== undefined) data.actif = actif;

    const updated = await prisma.salarie.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error('update salarie error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.performances = async (req, res) => {
  try {
    const { id } = req.params;
    const ventes = await prisma.vente.findMany({ where: { boutiqueId: req.boutiqueId, salarieId: id } });
    res.json({
      nombreVentes: ventes.length,
      ca: ventes.reduce((s, v) => s + v.prixVente, 0),
      benefice: ventes.reduce((s, v) => s + v.benefice, 0),
    });
  } catch (err) {
    console.error('performances error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
