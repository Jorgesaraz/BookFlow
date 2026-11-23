// Re-exporta los middlewares desde la ubicación estándar auth.middleware.js
const { authenticate, authorizeRoles, protect, authorize } = require('../middlewares/auth.middleware');

module.exports = {
  authenticate,
  authorizeRoles,
  protect,
  authorize
};
