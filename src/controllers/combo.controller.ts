import multer from "multer";
import { Types as MongooseTypes } from "mongoose";

import { Combo } from "../models";
import { Async, AppError, S3, API_Features } from "../lib";
import { ProductT } from "../types/models/product.types";

export const file_upload = multer({
  storage: multer.memoryStorage(),
}).array("new_assets[]", 30);

export const createCombo = Async(async (req, res, next) => {
  const body = req.body;

  const new_assets = await S3.uploadProductAssets(req);

  await Combo.create({
    title: body.title,
    description: body.description,
    price: +body.price,
    products: body.products.map(
      (params: {
        product: string;
        size: { size: string; quantity: number };
      }) => ({
        product: new MongooseTypes.ObjectId(params.product),
        size: params.size,
      })
    ),
    assets: [...body.assets, ...new_assets],
  });

  res.status(201).json("combo is created");
});

export const updateCombo = Async(async (req, res, next) => {
  const { comboId } = req.params;
  const body = req.body;

  const product = await Combo.findByIdAndUpdate(
    comboId,
    {
      $set: {
        title: body.title,
        description: body.description,
        price: body.price,
        products: body.products.map(
          (params: {
            product: string;
            size: { size: string; quantity: number };
          }) => ({
            product: new MongooseTypes.ObjectId(params.product),
            size: params.size,
          })
        ),
        assets: body.assets,
      },
    },
    { new: true }
  );

  if (!product) return next(new AppError(404, "Combo does not exists"));

  const assets_to_delete: Array<string> = Array.isArray(body.assets_to_delete)
    ? body.assets_to_delete
    : [];

  if (assets_to_delete.length > 0) {
    product.assets = product.assets.filter(
      (asset) => !assets_to_delete.includes(asset)
    );

    await S3.deleteProductAssets(assets_to_delete);
  }

  const new_assets = await S3.uploadProductAssets(req);
  product.assets = [...product.assets, ...new_assets];

  await product.save();

  res.status(201).json("Combo is Updated");
});

export const deleteCombo = Async(async (req, res, next) => {
  const { comboId } = req.params;

  const combo = await Combo.findById(comboId).populate({
    path: "products.product",
  });

  if (!combo) return next(new AppError(404, "Combo does not exists"));

  const comboProductsAssets = combo.products.flatMap(
    (product) => (product.product as unknown as ProductT).assets
  );

  const comboAssets = combo.assets;

  const assetsToDelete = comboAssets.filter(
    (asset) => !comboProductsAssets.includes(asset)
  );

  if (assetsToDelete.length > 0) await S3.deleteProductAssets(assetsToDelete);

  await combo.deleteOne();

  res.status(204).json("combo is deleted");
});

export const getCombo = Async(async (req, res, next) => {
  const { comboId } = req.params;

  const combo = await Combo.findById(comboId)
    .select("-__v")
    .populate({ path: "products.product", select: "title price assets sizes" });

  if (!combo) return next(new AppError(404, "combo does not exists"));

  res.status(200).json(combo);
});

export const getCombos = Async(async (req, res, next) => {
  const { dashboard } = req.query;

  const query = new API_Features(
    Combo.find().select("-__v -createdAt -updatedAt"),
    req.query as { [key: string]: string }
  );

  let combosQuery = query.filterCombos().sort().paginate().getQuery();

  if (dashboard === "1")
    combosQuery.populate({
      path: "products.product",
      select: "title price assets sizes",
    });

  const combos = await combosQuery;

  const { pagesCount, currentPage } = await query.countDocuments();

  res.status(200).json({
    currentPage,
    data: combos,
    hasMore: currentPage < pagesCount,
  });
});
