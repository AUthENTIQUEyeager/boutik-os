const prisma = require('../lib/prisma');

exports.trackInstall = async (req, res) => {
  try {
    const { platform } = req.body;
    await prisma.pwaInstall.create({
      data: { platform: platform || 'unknown', userAgent: req.headers['user-agent'] || '' },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('trackInstall error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.trackVisit = async (req, res) => {
  try {
    const { platform, isInstalled } = req.body;
    await prisma.pwaVisit.create({
      data: { platform: platform || 'unknown', isInstalled: !!isInstalled },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('trackVisit error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
