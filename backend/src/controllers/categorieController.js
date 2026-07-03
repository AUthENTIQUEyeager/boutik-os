const prisma = require('../lib/prisma');
const { generatePrefix, generateProductId, newId } = require('../lib/utils');

exports.list = async (req, res) => {
  try {
    const categories = await prisma.categorie.findMany({
      where: { boutiqueId: req.boutiqueId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(categories);
  } catch (err) {
    console.error('list categories error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nom, prixAchat, prixVente, quantite } = req.body;
    if (!nom || prixVente == null || !quantite) {
      return res.status(400).json({ error: 'Nom, prix de vente et quantité requis' });
    }

    const prefix = generatePrefix(nom);
    const catId = newId();

    const categorie = await prisma.categorie.create({
      data: {
        id: catId,
        boutiqueId: req.boutiqueId,
        nom,
        prefix,
        prixAchat: Number(prixAchat) || 0,
        prixVente: Number(prixVente),
        quantite: Number(quantite),
      },
    });

    const produitsData = Array.from({ length: Number(quantite) }, (_, i) => ({
      id: generateProductId(prefix, i + 1),
      boutiqueId: req.boutiqueId,
      categorieId: catId,
      nom,
      prixAchat: Number(prixAchat) || 0,
      prixVente: Number(prixVente),
    }));

    await prisma.produit.createMany({ data: produitsData });

    res.status(201).json(categorie);
  } catch (err) {
    console.error('create categorie error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prixAchat, prixVente } = req.body;
    const cat = await prisma.categorie.findFirst({ where: { id, boutiqueId: req.boutiqueId } });
    if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' });

    const data = {};
    if (nom !== undefined) data.nom = nom;
    if (prixAchat !== undefined) data.prixAchat = Number(prixAchat);
    if (prixVente !== undefined) data.prixVente = Number(prixVente);

    const updated = await prisma.categorie.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error('update categorie error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await prisma.categorie.findFirst({ where: { id, boutiqueId: req.boutiqueId } });
    if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' });
    if (cat.quantite > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer : stock non épuisé' });
    }
    await prisma.categorie.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('remove categorie error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.listProduits = async (req, res) => {
  try {
    const { categorieId, vendu } = req.query;
    const where = { boutiqueId: req.boutiqueId };
    if (categorieId) where.categorieId = categorieId;
    if (vendu !== undefined) where.vendu = vendu === 'true';

    const produits = await prisma.produit.findMany({ where, orderBy: { id: 'asc' } });
    res.json(produits);
  } catch (err) {
    console.error('listProduits error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getProduit = async (req, res) => {
  try {
    const produit = await prisma.produit.findFirst({
      where: { id: req.params.id, boutiqueId: req.boutiqueId },
    });
    if (!produit) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(produit);
  } catch (err) {
    console.error('getProduit error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
