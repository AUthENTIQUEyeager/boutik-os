const prisma = require('../lib/prisma');

exports.list = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { boutiqueId: req.boutiqueId },
      orderBy: { nom: 'asc' },
    });
    res.json(clients);
  } catch (err) {
    console.error('list clients error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nom, telephone, email, adresse, notes } = req.body;
    if (!nom) return res.status(400).json({ error: 'Nom requis' });

    const client = await prisma.client.create({
      data: { boutiqueId: req.boutiqueId, nom, telephone, email, adresse, notes },
    });
    res.status(201).json(client);
  } catch (err) {
    console.error('create client error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findFirst({ where: { id, boutiqueId: req.boutiqueId } });
    if (!client) return res.status(404).json({ error: 'Client introuvable' });

    const { nom, telephone, email, adresse, notes } = req.body;
    const data = {};
    if (nom !== undefined) data.nom = nom;
    if (telephone !== undefined) data.telephone = telephone;
    if (email !== undefined) data.email = email;
    if (adresse !== undefined) data.adresse = adresse;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.client.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error('update client error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findFirst({ where: { id, boutiqueId: req.boutiqueId } });
    if (!client) return res.status(404).json({ error: 'Client introuvable' });
    await prisma.client.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('remove client error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getHistorique = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findFirst({
      where: { id, boutiqueId: req.boutiqueId },
      include: { ventes: { orderBy: { date: 'desc' } }, dettes: true },
    });
    if (!client) return res.status(404).json({ error: 'Client introuvable' });
    res.json(client);
  } catch (err) {
    console.error('getHistorique error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
