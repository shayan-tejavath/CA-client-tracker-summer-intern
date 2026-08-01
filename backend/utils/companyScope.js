import Permission from "../models/Permission.js";

const getCompanyId = (req) => {
  const companyId =
    req?.companyId ||
    req?.user?.companyId ||
    req?.user?.company?.id ||
    null;
  return companyId || null;
};

const getCompanyFilter = (req) => {
  const companyId = getCompanyId(req);
  return companyId ? { companyId } : null;
};

const findPermissionForRole = async (role, companyId) => {
  if (companyId) {
    const scoped = await Permission.findOne({
      role,
      companyId,
    }).lean();
    if (scoped) return scoped;
  }
  return Permission.findOne({ role, companyId: null }).lean();
};

export { getCompanyFilter, getCompanyId, findPermissionForRole };
export default getCompanyFilter;
