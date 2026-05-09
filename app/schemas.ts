import { z } from "zod";

export const gstTypeSchema = z.enum(["CGST_SGST", "IGST", "B2C", "exempt"]);
export type GstType = z.infer<typeof gstTypeSchema>;

export const invoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const recurringFrequencySchema = z.enum([
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const expenseCategorySchema = z.enum([
  "software",
  "hardware",
  "travel",
  "office",
  "marketing",
  "professional",
  "utilities",
  "other",
]);

const idSchema = z.string().min(1);
const textSchema = z.string().trim();
const optionalText = z.string().trim().default("");
const nullableText = z.string().trim().nullable().optional();

export const customChargeSchema = z.object({
  id: idSchema,
  label: textSchema.min(1),
  amount: z.number().finite(),
});
export type CustomCharge = z.infer<typeof customChargeSchema>;

export const invoiceLineSchema = z.object({
  id: idSchema,
  description: textSchema.min(1),
  quantity: z.number().finite(),
  rate: z.number().finite(),
  hsnSacCode: z.string().trim().default(""),
});
export type InvoiceLine = z.infer<typeof invoiceLineSchema>;

export const invoicePartySchema = z.object({
  name: textSchema.min(1),
  company: optionalText,
  email: optionalText,
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  state: optionalText,
  stateCode: optionalText,
  postalCode: optionalText,
  country: optionalText,
  gstin: optionalText,
});

export const invoiceDataSchema = z.object({
  invoiceNumber: textSchema.min(1),
  issuedOn: textSchema.min(1),
  dueDate: textSchema.min(1),
  paid: z.boolean(),
  from: invoicePartySchema,
  to: invoicePartySchema,
  currency: textSchema.min(1),
  notes: textSchema,
  taxRate: z.number().finite(),
  gstType: gstTypeSchema.optional(),
  status: invoiceStatusSchema.optional(),
  customCharges: z.array(customChargeSchema),
  lines: z.array(invoiceLineSchema),
});
export type InvoiceData = z.infer<typeof invoiceDataSchema>;

export const invoiceDefaultsSchema = z.object({
  invoiceNumber: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  currency: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  taxRate: z.number().finite().optional(),
  customCharges: z
    .array(
      z.object({
        label: z.string().trim().optional(),
        amount: z.number().finite().optional(),
      }),
    )
    .optional(),
  from: z
    .object({
      name: z.string().trim().optional(),
      company: z.string().trim().optional(),
      email: z.string().trim().optional(),
      addressLine1: z.string().trim().optional(),
      addressLine2: z.string().trim().optional(),
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      postalCode: z.string().trim().optional(),
      country: z.string().trim().optional(),
    })
    .optional(),
});

export const parseInvoiceRequestSchema = z.object({
  prompt: z.string().trim().max(2000).optional().default(""),
  defaults: invoiceDefaultsSchema.optional(),
});

export const clientDraftSchema = z.object({
  name: textSchema.min(1),
  company: optionalText,
  email: optionalText,
  phone: optionalText,
  address_line1: optionalText,
  address_line2: optionalText,
  city: optionalText,
  state: optionalText,
  postal_code: optionalText,
  country: optionalText,
});

export const clientRowSchema = clientDraftSchema.extend({
  id: idSchema,
  user_id: idSchema,
  created_at: nullableText,
});

export const itemDraftSchema = z.object({
  name: textSchema.min(1),
  hsn_sac_code: optionalText,
  type: z.enum(["service", "goods"]),
  default_rate: z.number().finite().nonnegative(),
  gst_rate: z.number().finite().nonnegative(),
  unit: optionalText,
  description: optionalText,
});

export const itemRowSchema = itemDraftSchema.extend({
  id: idSchema,
  user_id: idSchema,
  created_at: nullableText,
  updated_at: nullableText,
});

export const expenseDraftSchema = z.object({
  vendor: textSchema.min(1),
  description: optionalText,
  amount: z.number().finite().nonnegative(),
  gst_paid: z.number().finite().nonnegative(),
  category: expenseCategorySchema,
  expense_date: z.string().trim().min(1),
  itc_eligible: z.boolean(),
  receipt_url: z.string().trim().nullable(),
});

export const expenseRowSchema = expenseDraftSchema.extend({
  id: idSchema,
  user_id: idSchema,
  created_at: nullableText,
  updated_at: nullableText,
});

export const userSettingsSchema = z.object({
  user_id: idSchema,
  currency: z.string().trim().min(1),
  from_name: optionalText,
  from_company: optionalText,
  from_email: optionalText,
  from_gstin: optionalText,
  from_state_code: optionalText,
  from_address_line1: optionalText,
  from_address_line2: optionalText,
  from_city: optionalText,
  from_state: optionalText,
  from_postal_code: optionalText,
  from_country: optionalText,
  updated_at: z.string().trim().optional(),
});

export const invoiceRowSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  invoice_number: textSchema.min(1),
  issued_on: textSchema.min(1),
  due_date: textSchema.min(1),
  paid: z.boolean(),
  status: invoiceStatusSchema,
  currency: textSchema.min(1),
  notes: nullableText,
  tax_rate: z.number().finite(),
  gst_type: gstTypeSchema,
  custom_charges: z.array(
    z.object({
      label: z.string().trim().optional(),
      amount: z.number().finite().optional(),
    }),
  ),
  from_name: nullableText,
  from_company: nullableText,
  from_email: nullableText,
  from_address_line1: nullableText,
  from_address_line2: nullableText,
  from_city: nullableText,
  from_state: nullableText,
  from_state_code: nullableText,
  from_postal_code: nullableText,
  from_country: nullableText,
  from_gstin: nullableText,
  to_name: nullableText,
  to_company: nullableText,
  to_email: nullableText,
  to_address_line1: nullableText,
  to_address_line2: nullableText,
  to_city: nullableText,
  to_state: nullableText,
  to_state_code: nullableText,
  to_postal_code: nullableText,
  to_country: nullableText,
  to_gstin: nullableText,
  deleted_at: nullableText,
  razorpay_payment_link_id: nullableText,
  razorpay_payment_link_url: nullableText,
  created_at: nullableText,
  updated_at: nullableText,
});

export const invoiceLineRowSchema = z.object({
  id: idSchema,
  invoice_id: idSchema,
  description: textSchema.min(1),
  quantity: z.number().finite(),
  rate: z.number().finite(),
  hsn_sac_code: nullableText,
  sort_order: z.number().int().optional(),
  created_at: nullableText,
  updated_at: nullableText,
});

export const recurringInvoiceLineSchema = z.object({
  description: textSchema.min(1),
  quantity: z.number().finite(),
  rate: z.number().finite(),
  hsnSacCode: z.string().trim().optional().default(""),
});

export const recurringInvoiceDraftSchema = z.object({
  frequency: recurringFrequencySchema,
  next_run_date: z.string().trim().min(1),
  from_name: optionalText,
  from_company: optionalText,
  from_email: optionalText,
  from_address_line1: optionalText,
  from_address_line2: optionalText,
  from_city: optionalText,
  from_state: optionalText,
  from_state_code: optionalText,
  from_postal_code: optionalText,
  from_country: optionalText,
  from_gstin: optionalText,
  to_name: optionalText,
  to_company: optionalText,
  to_email: optionalText,
  to_address_line1: optionalText,
  to_address_line2: optionalText,
  to_city: optionalText,
  to_state: optionalText,
  to_state_code: optionalText,
  to_postal_code: optionalText,
  to_country: optionalText,
  to_gstin: optionalText,
  currency: z.string().trim().min(1),
  tax_rate: z.number().finite(),
  gst_type: gstTypeSchema,
  due_date_days: z.number().int().nonnegative(),
  notes: optionalText,
  lines: z.array(recurringInvoiceLineSchema).min(1),
  custom_charges: z.array(customChargeSchema).default([]),
  active: z.boolean().optional(),
});

export const recurringInvoicePatchSchema = recurringInvoiceDraftSchema
  .partial()
  .extend({
    id: idSchema,
  });

export const recurringInvoiceRowSchema = recurringInvoiceDraftSchema.extend({
  id: idSchema,
  user_id: idSchema,
  last_run_date: nullableText,
  active: z.boolean(),
  created_at: nullableText,
  updated_at: nullableText,
});

export const createRazorpayLinkRequestSchema = z.object({
  invoiceId: idSchema,
});

export const aiInsightsRequestSchema = z.object({
  type: z
    .enum(["cash_flow", "payment_prediction", "question"])
    .default("cash_flow"),
  question: z.string().trim().max(500).optional(),
});
