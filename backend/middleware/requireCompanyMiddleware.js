/**
 * Tenant Guard Middleware
 *
 * Ensures the authenticated request carries a company context.
 * `req.companyId` is set by authMiddleware from the authenticated DB user
 * (never trusted from the frontend). This middleware fails closed so that a
 * missing tenant context can never degrade into a global (all-company) scope.
 */
const requireCompany = (req, res, next) => {
  if (!req.companyId) {
    console.error("[TENANT] Request missing company context", {
      userId: req.user?._id,
    });
    return res.status(403).json({
      message: "No company associated with your account. Please contact your administrator.",
    });
  }

  next();
};

export default requireCompany;
