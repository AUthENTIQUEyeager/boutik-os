const Papa = require('papaparse');
const prisma = require('../lib/prisma');
const { generatePrefix, generateProductId, newId } = require('../lib/utils');

function parseCsv(csvText) {
  return Papa.parse(csvText, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
}

exports.importProduits = async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ error: 'Contenu CSV requis' });

    const { data, errors } = parseCsv(csv);
    if (errors.length) return res.status(400).json({ error: 'CSV invalide', details: errors });

    const created = [];
    const failed = [];

    for (const [i, row] of data.entries()) {
      try {
        const nom = row.nom?.trim();
        const prixAchat = Number(row.prixAchat) || 0;
        const prixVente = Number(row.prixVente);
        const quantite = Number(row.quantite);

        if (!nom || !prixVente || !quantite) {
          failed.push({ ligne: i + 2, error: 'Champs manquants ou invalides' });
          continue;
        }

        const prefix = generatePrefix(nom);
        const catId = newId();

        const categorie = await prisma.categorie.create({
          data: { id: catId, boutiqueId: req.boutiqueId, nom, prefix, prixAchat, prixVente, quantite },
        });

        const produitsData = Array.from({ length: quantite }, (_, j) => ({
          id: generateProductId(prefix, j + 1),
          boutiqueId: req.boutiqueId,
          categorieId: catId,
          nom,
          prixAchat,
          prixVente,
        }));
        await prisma.produit.createMany({ data: produitsData });

        created.push(categorie);
      } catch (err) {
        failed.push({ ligne: i + 2, error: err.message });
      }
    }

    res.json({ created: created.length, failed });
  } catch (err) {
    console.error('importProduits error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.importClients = async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ error: 'Contenu CSV requis' });

    const { data, errors } = parseCsv(csv);
    if (errors.length) return res.status(400).json({ error: 'CSV invalide', details: errors });

    const failed = [];
    let createdCount = 0;

    for (const [i, row] of data.entries()) {
      const nom = row.nom?.trim();
      if (!nom) {
        failed.push({ ligne: i + 2, error: 'Nom manquant' });
        continue;
      }
      try {
        await prisma.client.create({
          data: {
            boutiqueId: req.boutiqueId,
            nom,
            telephone: row.telephone || null,
            email: row.email || null,
            adresse: row.adresse || null,
          },
        });
        createdCount++;
      } catch (err) {
        failed.push({ ligne: i + 2, error: err.message });
      }
    }

    res.json({ created: createdCount, failed });
  } catch (err) {
    console.error('importClients error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
