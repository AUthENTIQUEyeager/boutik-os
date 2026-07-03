const prisma = require('../lib/prisma');

exports.getBoutique = async (req, res) => {
  const { password: _pw, ...safe } = req.boutique;
  res.json(safe);
};

exports.updateBoutique = async (req, res) => {
  try {
    const { nom, adresse, logo, siteWeb, devise, fuseauHoraire } = req.body;
    const data = {};
    if (nom !== undefined) data.nom = nom;
    if (adresse !== undefined) data.adresse = adresse;
    if (logo !== undefined) data.logo = logo;
    if (siteWeb !== undefined) data.siteWeb = siteWeb;
    if (devise !== undefined) data.devise = devise;
    if (fuseauHoraire !== undefined) data.fuseauHoraire = fuseauHoraire;

    const updated = await prisma.boutique.update({ where: { id: req.boutiqueId }, data });
    const { password: _pw, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    console.error('updateBoutique error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const boutiqueId = req.boutiqueId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [ventesJour, categories, produitsDispo, produitsTotal] = await Promise.all([
      prisma.vente.findMany({ where: { boutiqueId, date: { gte: startOfDay } } }),
      prisma.categorie.findMany({ where: { boutiqueId } }),
      prisma.produit.count({ where: { boutiqueId, vendu: false } }),
      prisma.produit.count({ where: { boutiqueId } }),
    ]);

    const beneficeJour = ventesJour.reduce((s, v) => s + v.benefice, 0);
    const caJour = ventesJour.reduce((s, v) => s + v.prixVente, 0);

    res.json({
      beneficeJour,
      caJour,
      nombreVentesJour: ventesJour.length,
      stockTotal: produitsDispo,
      produitsTotal,
      nombreCategories: categories.length,
      alertesStock: categories.filter((c) => c.quantite <= 3 && c.quantite > 0).length,
      categoriesEpuisees: categories.filter((c) => c.quantite === 0).length,
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
