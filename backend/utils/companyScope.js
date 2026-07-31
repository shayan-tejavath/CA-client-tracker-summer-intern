const getCompanyId = (req) => {
  const companyId = req?.user?.companyId || req?.user?.company?.id || null;
  return companyId || null;
};

const getCompanyFilter = (req) => {
  const companyId = getCompanyId(req);
  return companyId ? { companyId } : null;
};

export { getCompanyFilter, getCompanyId };
export default getCompanyFilter;
