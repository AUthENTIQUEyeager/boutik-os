const prisma = require('../lib/prisma');

exports.list = async (req, res) => {
  try {
    const commandes = await prisma.commande.findMany({
      where: { boutiqueId: req.boutiqueId },
      orderBy: { createdAt: 'desc' },
      include: { lignes: true },
    });
    res.json(commandes);
  } catch (err) {
    console.error('list commandes error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.create = async (req, res) => {
  try {
    const { fournisseur, notes, lignes } = req.body;
    if (!Array.isArray(lignes) || lignes.length === 0) {
      return res.status(400).json({ error: 'Au moins une ligne de commande requise' });
    }

    const total = lignes.reduce((s, l) => s + Number(l.quantite) * Number(l.prixUnitaire), 0);

    const commande = await prisma.commande.create({
      data: {
        boutiqueId: req.boutiqueId,
        fournisseur,
        notes,
        total,
        lignes: {
          create: lignes.map((l) => ({
            nomProduit: l.nomProduit,
            quantite: Number(l.quantite),
            prixUnitaire: Number(l.prixUnitaire),
          })),
        },
      },
      include: { lignes: true },
    });

    res.status(201).json(commande);
  } catch (err) {
    console.error('create commande error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    if (!['en_attente', 'recue', 'annulee'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const commande = await prisma.commande.findFirst({
      where: { id, boutiqueId: req.boutiqueId },
      include: { lignes: true },
    });
    if (!commande) return res.status(404).json({ error: 'Commande introuvable' });

    if (statut === 'recue' && commande.statut !== 'recue') {
      const { generateProductId } = require('../lib/utils');
      for (const ligne of commande.lignes) {
        const cat = await prisma.categorie.findFirst({
          where: { boutiqueId: req.boutiqueId, nom: ligne.nomProduit },
        });
        if (cat) {
          const currentCount = await prisma.produit.count({ where: { categorieId: cat.id } });
          const produitsData = Array.from({ length: ligne.quantite }, (_, i) => ({
            id: generateProductId(cat.prefix, currentCount + i + 1),
            boutiqueId: req.boutiqueId,
            categorieId: cat.id,
            nom: cat.nom,
            prixAchat: ligne.prixUnitaire,
            prixVente: cat.prixVente,
          }));
          await prisma.produit.createMany({ data: produitsData });
          await prisma.categorie.update({ where: { id: cat.id }, data: { quantite: { increment: ligne.quantite } } });
        }
      }
    }

    const updated = await prisma.commande.update({ where: { id }, data: { statut }, include: { lignes: true } });
    res.json(updated);
  } catch (err) {
    console.error('updateStatut commande error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
