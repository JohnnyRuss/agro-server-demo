import { model, Schema } from "mongoose";
import {
  ComboT,
  ComboModelT,
  ComboMethodsT,
} from "../types/models/combo.types";

const ComboSchema = new Schema<ComboT, ComboModelT, ComboMethodsT>(
  {
    title: String,
    description: String,
    price: Number,
    assets: [String],
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        size: {
          size: String,
          quantity: Number,
        },
      },
    ],
  },
  { timestamps: true }
);

const Combo = model<ComboT, ComboModelT>("Combo", ComboSchema);

export default Combo;
