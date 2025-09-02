module.exports = async (req, res) => {
  res.status(501).json({ error: 'UNSUPPORTED' });
};
