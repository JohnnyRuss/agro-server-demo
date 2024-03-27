import { Router as ExpressRouter } from "express";
import * as comboController from "../controllers/combo.controller";
import { checkAuth } from "../middlewares";

const Router = ExpressRouter();

Router.route("/")
  .post(checkAuth, comboController.file_upload, comboController.createCombo)
  .get(comboController.getCombos);

Router.route("/:comboId")
  .post(checkAuth, comboController.createCombo)
  .put(checkAuth, comboController.file_upload, comboController.updateCombo)
  .delete(checkAuth, comboController.deleteCombo)
  .get(comboController.getCombo);

export default Router;
