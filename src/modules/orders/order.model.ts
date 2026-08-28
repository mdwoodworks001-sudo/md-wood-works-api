import { Schema, model, type InferSchemaType } from "mongoose";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../common/constants/index.js";

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    image: {
      type: String,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  {
    _id: false,
  },
);

const trackingEventSchema = new Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUS,
      required: true,
    },
    location: {
      type: String,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
    },
    source: {
      type: String,
      enum: ["SYSTEM", "COURIER"],
      default: "SYSTEM",
    },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    consignmentNumber: {
      type: String,
      index: true,
      sparse: true,
    },

    courierProvider: {
      type: String,
      enum: ["INDIA_POST", "SPEED_POST"],
      default: "SPEED_POST",
    },

    lastTrackedAt: {
      type: Date,
    },

    trackingHistory: {
      type: [trackingEventSchema],
      default: [],
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pending",
      index: true,
    },

    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type OrderDocument = InferSchemaType<typeof orderSchema>;

export const OrderModel = model("Order", orderSchema);
