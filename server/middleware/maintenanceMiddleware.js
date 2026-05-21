const SystemSetting = require('../models/SystemSetting');

const checkMaintenanceMode = async (req, res, next) => {
    // Skip for Admin routes, Login, and static assets if any
    if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth')) {
        return next();
    }

    try {
        const setting = await SystemSetting.findOne({ key: 'maintenanceMode' });
        if (setting && setting.value === true) {
            // Allow admins to pass through even on normal routes?
            // Usually we check user role, but middleware runs before auth sometimes.
            // If protect middleware ran before this, req.user exists.
            // Let's assume protect runs first for protected routes.
            if (req.user && req.user.role === 'admin') {
                return next();
            }

            return res.status(503).json({
                message: 'System is currently under maintenance. Please try again later.',
                maintenance: true
            });
        }
        next();
    } catch (err) {
        console.error("Maintenance Check Error:", err);
        next(); // Fail open to avoid blocking site on DB error
    }
};

module.exports = checkMaintenanceMode;
