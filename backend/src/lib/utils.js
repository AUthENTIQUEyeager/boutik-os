const { v4: uuidv4 } = require('uuid');

function generatePrefix(nom) {
  const clean = nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
  return (clean.slice(0, 3) || 'PRD').padEnd(3, 'X');
}

function generateProductId(prefix, index) {
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

function newId() {
  return uuidv4();
}

function generateRecuNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BTK-${ymd}-${rand}`;
}

module.exports = { generatePrefix, generateProductId, newId, generateRecuNumber };
