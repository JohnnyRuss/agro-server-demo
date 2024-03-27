import { Model, Document, Types as MongooseTypes } from "mongoose";

interface ComboT extends Document {
  title: string;
  description: string;
  price: number;
  assets: Array<string>;
  products: Array<{
    product: MongooseTypes.ObjectId;
    size: {
      size: string;
      quantity: number;
    };
  }>;
}

type ComboMethodsT = {};

type ComboModelT = Model<ComboT, {}, ComboMethodsT>;

export type { ComboT, ComboModelT, ComboMethodsT };
