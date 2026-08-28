import { Schema, model, type InferSchemaType } from "mongoose";

const addressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export type AddressDocument = InferSchemaType<typeof addressSchema>;
export const AddressModel = model("Address", addressSchema);
