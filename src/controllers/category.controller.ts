import { Async, AppError, API_Features } from "../lib";
import { Category } from "../models";

export const createCategory = Async(async (req, res, next) => {
  const { title } = req.body;

  if (!title) return next(new AppError(400, "please enter category title"));

  const category = await new Category({ title }).save();

  res.status(201).json(category);
});

export const updateCategory = Async(async (req, res, next) => {
  const { categoryId } = req.params;
  const { title } = req.body;

  const category = await Category.findById(categoryId).select("-__v");

  if (!category) return next(new AppError(404, "category does not exists"));
  else if (!title)
    return next(new AppError(400, "please enter category title"));

  category.title = title;

  await category.save();

  res.status(201).json(category);
});

export const deleteCategory = Async(async (req, res, next) => {
  const { categoryId } = req.params;

  const category = await Category.findByIdAndDelete(categoryId);

  if (!category) return next(new AppError(404, "category does not exists"));

  res.status(204).json("category is deleted");
});

export const getCategory = Async(async (req, res, next) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId).select("-__v");

  if (!category) return next(new AppError(404, "category does not exists"));

  res.status(200).json(category);
});

export const getCategories = Async(async (req, res, next) => {
  const query = new API_Features(
    Category.find(),
    req.query as { [key: string]: string }
  );

  const categories = await query.paginate().getQuery().select("-__v");

  const { pagesCount } = await query.countDocuments();
  const currentPage = req.query.page ? +req.query.page : 1;
  const hasMore = pagesCount > +currentPage;

  res.status(200).json({ data: categories, hasMore, currentPage });
});
