export type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
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
  };
  currency: string;
  notes: string;
  lines: InvoiceLine[];
};
