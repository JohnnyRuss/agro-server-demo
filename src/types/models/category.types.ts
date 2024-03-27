import { Model, Document, Types as MongooseTypes } from "mongoose";

interface CategoryT extends Document {
  title: string;
  query: string;
}

type CategoryMethodsT = {};

type CategoryModelT = Model<CategoryT, {}, CategoryMethodsT>;

export type { CategoryT, CategoryModelT, CategoryMethodsT };
