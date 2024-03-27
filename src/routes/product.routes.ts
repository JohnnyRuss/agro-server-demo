import { Router as ExpressRouter } from "express";
import * as productController from "../controllers/product.controller";
import { checkAuth } from "../middlewares";

const Router = ExpressRouter();

Router.route("/")
  .post(
    checkAuth,
    productController.file_upload,
    productController.createProduct
  )
  .get(productController.getProducts);

Router.route("/filter").get(productController.getProductsFilter);
Router.route("/filter/:categoryId").get(
  productController.getProductsSizeFilter
);

Router.route("/:productId")
  .delete(checkAuth, productController.deleteProduct)
  .get(productController.getProduct)
  .put(
    checkAuth,
    productController.file_upload,
    productController.updateProduct
  );

Router.route("/:productId/:categoryId").get(
  productController.getRelatedProducts
);

export default Router;
