export type Guide = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: { h: string; p?: string[]; list?: string[] }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "gst-invoice-generator",
    title: "Free GST Invoice Generator for India",
    description:
      "Generate a GST-compliant tax invoice from one sentence. Magic Invoice fills GSTIN, HSN/SAC codes and the CGST, SGST or IGST split for Indian freelancers and small businesses.",
    h1: "GST invoice generator for Indian freelancers and small businesses",
    intro:
      "Type the job in plain words, like \"Website design for Acme Pvt Ltd, 15,000 rupees\", and Magic Invoice drafts a GST tax invoice with line items, SAC code and the correct tax split. You review it, then download or send it.",
    sections: [
      {
        h: "What a GST tax invoice must contain",
        p: ["Under Rule 46 of the CGST Rules, a tax invoice carries these details:"],
        list: [
          "Supplier name, address and GSTIN",
          "A unique, consecutive invoice number (up to 16 characters) and the date",
          "Recipient name, address and GSTIN (if registered)",
          "HSN code for goods or SAC code for services",
          "Description, quantity, unit and taxable value",
          "Rate and amount of CGST, SGST or IGST",
          "Place of supply, and the signature of the supplier",
        ],
      },
      {
        h: "How Magic Invoice builds it",
        p: [
          "The AI reads your sentence, splits it into line items, suggests a SAC or HSN code and sets the tax rate. It picks CGST plus SGST for same-state supply and IGST for inter-state supply, based on the supplier and place of supply.",
          "AI output can be wrong, so every draft is shown for review before it is saved. Check the codes and rates against your own records.",
        ],
      },
      {
        h: "When to issue the invoice",
        p: [
          "For services, the invoice is generally due within 30 days of the supply (Rule 47). For goods it is issued at or before removal or delivery. Registered businesses should confirm timelines for their specific case with a tax professional.",
        ],
      },
    ],
  },
  {
    slug: "sac-codes-for-freelancers",
    title: "SAC Codes for Freelancers and Service Providers",
    description:
      "Common SAC codes for freelancers in India: IT services, design, consulting and marketing. Learn how to pick the right code for a GST invoice.",
    h1: "SAC codes for freelancers and service providers in India",
    intro:
      "A SAC (Services Accounting Code) is a six-digit code that classifies a service on a GST invoice. Goods use HSN codes; services use SAC codes starting with 99.",
    sections: [
      {
        h: "Common SAC codes",
        p: ["These are frequently used by freelancers. Confirm the exact code and rate for your service before filing."],
        list: [
          "998313: IT consulting and support services",
          "998314: IT design and development services",
          "998311: Management consulting services",
          "998361: Advertising services",
          "998391: Specialty design services (graphic, interior, fashion)",
        ],
      },
      {
        h: "How to choose the right one",
        p: [
          "Match the code to what you actually deliver, not to your job title. A developer building a website uses an IT design and development code; a developer on a support retainer may fall under IT consulting and support.",
          "Most professional services are taxed at 18% GST, but rates are set by notification and can change. Check the current rate when you are unsure.",
        ],
      },
      {
        h: "Let the invoice suggest it",
        p: ["Magic Invoice infers a SAC code from your job description and fills it into each line item. You can edit it before saving."],
      },
    ],
  },
  {
    slug: "cgst-sgst-igst-explained",
    title: "CGST, SGST and IGST Explained With Examples",
    description:
      "When to charge CGST plus SGST and when to charge IGST on an Indian invoice, with a worked example at 18% GST.",
    h1: "CGST, SGST and IGST: which tax goes on your invoice",
    intro:
      "India splits GST by where the supply happens. Same-state supply charges CGST and SGST. Supply between states charges IGST. The total rate is the same either way.",
    sections: [
      {
        h: "The rule",
        list: [
          "Supplier and place of supply in the same state: CGST (to the Centre) plus SGST (to the state), each half the rate",
          "Supplier and place of supply in different states: IGST at the full rate",
        ],
      },
      {
        h: "Worked example at 18%",
        p: [
          "Taxable value ₹10,000. Same state: CGST 9% = ₹900 and SGST 9% = ₹900, total ₹11,800. Different states: IGST 18% = ₹1,800, total ₹11,800.",
        ],
      },
      {
        h: "Where people go wrong",
        p: [
          "The split depends on place of supply, which is not always the client's billing address. Exports and SEZ supplies have their own rules. Magic Invoice works out the split from the states on the invoice and locks the rate per invoice, so later changes do not alter old invoices.",
        ],
      },
    ],
  },
  {
    slug: "gstr-1-gstr-3b-export",
    title: "GSTR-1 Export and GSTR-3B Summary From Your Invoices",
    description:
      "How invoice data maps to GSTR-1 and GSTR-3B returns, and how Magic Invoice exports GSTR-1 and summarises GSTR-3B.",
    h1: "GSTR-1 export and GSTR-3B summary from your invoices",
    intro:
      "Your invoices are the source for two monthly GST returns. Keeping them structured saves hours at filing time.",
    sections: [
      {
        h: "GSTR-1 vs GSTR-3B",
        list: [
          "GSTR-1: invoice-level details of outward supplies. Monthly filers generally file by the 11th of the next month.",
          "GSTR-3B: summary of outward supplies, input tax credit and tax payable. Generally due around the 20th.",
        ],
      },
      {
        h: "What Magic Invoice gives you",
        p: [
          "A GSTR-1 export built from your invoices, and a GSTR-3B summary that totals output tax and your recorded input tax credit from expenses. Due dates vary by filing scheme, so check the GST portal for yours.",
        ],
      },
      {
        h: "Before you file",
        p: ["Reconcile the export with your books and have a tax professional review it. Magic Invoice does not file returns for you."],
      },
    ],
  },
];
