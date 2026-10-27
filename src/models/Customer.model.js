import mongoose, { Schema } from 'mongoose';

const contactPersonSchema = new Schema(
  {
    name:        { type: String, trim: true },
    designation: { type: String, trim: true },
    mobile:      { type: String, trim: true },
    email:       { type: String, lowercase: true, trim: true },
  },
  { _id: false }
);

const customerSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    // Source
    fromLead: { type: Schema.Types.ObjectId, ref: 'Lead' },

    // Core identity
    customerName: { type: String, required: true, trim: true },
    companyName:  { type: String, trim: true },
    industry:     { type: String, trim: true },
    website:      { type: String, trim: true },

    // Contact
    mobile:      { type: String, required: true, trim: true },
    mobileFull:  { type: String },
    email:       { type: String, lowercase: true, trim: true },
    contactPersons: [contactPersonSchema],

    // Business details
    gstNumber:   { type: String, trim: true },
    pan:         { type: String, trim: true },
    tier:        { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'silver' },

    // Addresses
    billingAddress:  { type: String, trim: true },
    shippingAddress: { type: String, trim: true },

    // Deal & financials
    dealAmount:       { type: Number, default: 0 },
    annualRevenue:    { type: Number, default: 0 },
    paymentTerms:     { type: String, trim: true },

    // Relationships
    accountManager: { type: Schema.Types.ObjectId, ref: 'User' },

    // Meta
    notes:   { type: String, trim: true },
    tags:    [{ type: String }],
    isActive:{ type: Boolean, default: true },
  },
  { timestamps: true }
);

customerSchema.index({ workspace: 1, customerName: 1 });
customerSchema.index({ workspace: 1, mobile: 1 });
customerSchema.index({ workspace: 1, accountManager: 1 });
customerSchema.index({ customerName: 1 });
customerSchema.index({ mobile: 1 });
customerSchema.index({ accountManager: 1 });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;

