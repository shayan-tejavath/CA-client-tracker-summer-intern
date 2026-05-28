const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'QwikCA Practice Management Backend',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealthStatus,
};
