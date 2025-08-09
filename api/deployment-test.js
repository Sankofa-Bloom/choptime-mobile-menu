module.exports = function handler(req, res) {
  res.status(200).json({
    message: 'Deployment test v0.0.29',
    timestamp: new Date().toISOString(),
    deploymentTime: '2025-01-09 13:55:00'
  });
};
