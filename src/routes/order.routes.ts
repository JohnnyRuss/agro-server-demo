import { Router as ExpressRouter } from "express";
import * as orderController from "../controllers/order.controller";
import { checkAuth } from "../middlewares";

const Router = ExpressRouter();

Router.route("/")
  .post(orderController.createOrder)
  .get(checkAuth, orderController.getOrders);

Router.route("/:orderId").get(orderController.getOrder);

export default Router;
