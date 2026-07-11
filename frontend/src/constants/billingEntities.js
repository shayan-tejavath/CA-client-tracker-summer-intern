export const billingEntities = [
  {
    id: "primary",
    name: "Primary",
    firmName: "Your Company",
    legalName: "Your Company",
    gstin: "08ABCDE1234A1ZJ",
    pan: "AAPDP2468B",
    address: ["Billing address line 1", "City, State", "India"],
    logoText: "YOUR LOGO",
    contact: {
      mobile: "9998887770",
      email: "billing@yourcompany.com",
    },
    bank: {
      accountName: "Your Company",
      accountNumber: "682502409571",
      bankName: "ICICI Bank",
      ifsc: "ICIC0000000",
      upi: "your_upi@bank",
    },
    defaultTerms:
      "This quotation is valid for 15 days from the date of issue. Payment is due upon receipt of the quotation unless otherwise agreed in writing.",
  },
  {
    id: "secondary",
    name: "Secondary",
    firmName: "Your Company - Advisory",
    legalName: "Your Company Advisory LLP",
    gstin: "24ABCDE1234A1Z4",
    pan: "AAPDP2468B",
    address: ["Billing address line 2", "City, State", "India"],
    logoText: "ADVISORY",
    contact: {
      mobile: "9887766550",
      email: "billing-secondary@yourcompany.com",
    },
    bank: {
      accountName: "Your Company Secondary",
      accountNumber: "652019304410",
      bankName: "HDFC Bank",
      ifsc: "HDFC0000000",
      upi: "your_upi_secondary@bank",
    },
    defaultTerms:
      "This quotation is valid for 10 days from the date of issue. Any additional work requested after the quotation date will be billed separately.",
  },
  {
    id: "amd",
    name: "AMD",
    firmName: "AMD Associates",
    legalName: "AMD Associates",
    gstin: "24AMDDE1234A1Z5",
    pan: "AMDPA2468B",
    address: ["CG Road, Ahmedabad", "Gujarat", "India"],
    logoText: "AMD",
    contact: {
      mobile: "9797979797",
      email: "accounts@amd.test",
    },
    bank: {
      accountName: "AMD Associates",
      accountNumber: "552244119876",
      bankName: "Axis Bank",
      ifsc: "UTIB0000000",
      upi: "amd@upi",
    },
    defaultTerms:
      "This quotation is valid for 30 days from the date of issue. Taxes and statutory changes will be charged extra as applicable.",
  },
];

export const getBillingEntities = async () => billingEntities;

export const getBillingEntityById = (id) => {
  const normalized = String(id || "primary").toLowerCase();
  return billingEntities.find((entity) => entity.id.toLowerCase() === normalized) || billingEntities[0];
};

export const getBillingEntityByName = (name) => {
  const normalized = String(name || "Primary").toLowerCase();
  return billingEntities.find((entity) => entity.name.toLowerCase() === normalized) || billingEntities[0];
};
