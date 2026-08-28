import { Schema, model, type InferSchemaType } from "mongoose";

const specificationSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },

    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userName: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
    initialStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    images: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    specifications: {
      type: [specificationSchema],
      default: [],
    },

    features: {
      type: [String],
      default: [],
    },

    highlights: {
      type: [String],
      default: [],
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  },
);

productSchema.index({
  name: "text",
  description: "text",
});

export type ProductDocument = InferSchemaType<typeof productSchema>;

export const ProductModel = model("Product", productSchema);
