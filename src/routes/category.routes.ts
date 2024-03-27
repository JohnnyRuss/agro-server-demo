import { Router as ExpressRouter } from "express";
import * as categoryController from "../controllers/category.controller";
import { checkAuth } from "../middlewares";

const Router = ExpressRouter();

Router.route("/")
  .post(checkAuth, categoryController.createCategory)
  .get(categoryController.getCategories);

Router.route("/:categoryId")
  .patch(checkAuth, categoryController.updateCategory)
  .delete(checkAuth, categoryController.deleteCategory)
  .get(checkAuth, categoryController.getCategory);

export default Router;
