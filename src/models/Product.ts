import {
  ProductT,
  ProductModelT,
  ProductMethodsT,
} from "../types/models/product.types";
import { model, Schema } from "mongoose";

const ProductSchema = new Schema<ProductT, ProductModelT, ProductMethodsT>(
  {
    title: String,
    description: String,
    sizes: [String],
    price: Number,
    assets: Array<String>,
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
  },
  { timestamps: true }
);

const Product = model<ProductT, ProductModelT>("Product", ProductSchema);

export default Product;
