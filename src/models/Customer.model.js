import mongoose, { Schema } from 'mongoose';

const customerSchema = new Schema(
  {
    fromLead: { type: Schema.Types.ObjectId, ref: 'Lead', unique: true },
    customerName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, index: true },
    mobileFull: { type: String },
    email: { type: String, lowercase: true, trim: true },
    companyName: { type: String },
    address: { type: String },
    dealAmount: { type: Number, default: 0 },
    accountManager: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
