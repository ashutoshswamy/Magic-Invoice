export type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

export type CustomCharge = {
  id: string;
  label: string;
  amount: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  issuedOn: string;
  dueDate: string;
  paid: boolean;
  from: {
    name: string;
    company: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  to: {
    name: string;
    company: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: string;
  notes: string;
  taxRate: number;
  customCharges: CustomCharge[];
  lines: InvoiceLine[];
};
