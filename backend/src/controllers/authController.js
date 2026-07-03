const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

function signToken(boutiqueId) {
  return jwt.sign({ boutiqueId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

exports.register = async (req, res) => {
  try {
    const { nom, whatsapp, password, adresse } = req.body;
    if (!nom || !whatsapp || !password) {
      return res.status(400).json({ error: 'Nom, WhatsApp et mot de passe requis' });
    }

    const existing = await prisma.boutique.findUnique({ where: { whatsapp } });
    if (existing) {
      return res.status(409).json({ error: 'Ce numéro est déjà utilisé. Utilisez "J\'ai déjà une boutique".' });
    }

    const hash = await bcrypt.hash(password, 10);
    const boutique = await prisma.boutique.create({
      data: { nom, whatsapp, password: hash, adresse: adresse || null },
    });

    const token = signToken(boutique.id);
    const { password: _pw, ...safeBoutique } = boutique;
    res.status(201).json({ token, boutique: safeBoutique });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
};

exports.login = async (req, res) => {
  try {
    const { whatsapp, password } = req.body;
    if (!whatsapp || !password) {
      return res.status(400).json({ error: 'WhatsApp et mot de passe requis' });
    }

    const boutique = await prisma.boutique.findUnique({ where: { whatsapp } });
    if (!boutique) return res.status(404).json({ error: 'Aucune boutique avec ce numéro' });

    const valid = await bcrypt.compare(password, boutique.password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

    if (boutique.bloquee) {
      return res.status(403).json({ error: 'Boutique bloquée', bloquee: true });
    }

    const token = signToken(boutique.id);
    const { password: _pw, ...safeBoutique } = boutique;
    res.json({ token, boutique: safeBoutique });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
};

exports.me = async (req, res) => {
  const { password: _pw, ...safeBoutique } = req.boutique;
  res.json(safeBoutique);
};

exports.changePassword = async (req, res) => {
  try {
    const { ancien, nouveau } = req.body;
    if (!nouveau || nouveau.length < 4) {
      return res.status(400).json({ error: 'Nouveau mot de passe trop court' });
    }
    const valid = await bcrypt.compare(ancien || '', req.boutique.password);
    if (!valid) return res.status(401).json({ error: 'Ancien mot de passe incorrect' });

    const hash = await bcrypt.hash(nouveau, 10);
    await prisma.boutique.update({ where: { id: req.boutiqueId }, data: { password: hash } });
    res.json({ success: true });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.adminLogin = async (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe admin incorrect' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
};
