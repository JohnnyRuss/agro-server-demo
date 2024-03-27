import { Router as ExpressRouter } from "express";
import { checkAuth } from "../middlewares";
import * as authController from "../controllers/auth.controller";

const Router = ExpressRouter();

Router.route("/signin").post(authController.signIn);

Router.route("/refresh").post(authController.refresh);

Router.route("/logout").post(checkAuth, authController.logout);

export default Router;
