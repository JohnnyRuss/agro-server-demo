import {
  CategoryT,
  CategoryModelT,
  CategoryMethodsT,
} from "../types/models/category.types";
import slugify from "slugify";
import { model, Schema } from "mongoose";

const CategorySchema = new Schema<CategoryT, CategoryModelT, CategoryMethodsT>({
  title: String,
  query: String,
});

CategorySchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  this.query = slugify(this.title, { lower: true, locale: "en", trim: true });

  next();
});

const Category = model<CategoryT, CategoryModelT>("Category", CategorySchema);

export default Category;
