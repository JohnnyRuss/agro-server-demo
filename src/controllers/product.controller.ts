import multer from "multer";

import { Product, Category } from "../models";
import { Async, AppError, API_FeatureUtils, S3 } from "../lib";

export const file_upload = multer({
  storage: multer.memoryStorage(),
}).array("new_assets[]", 30);

export const createProduct = Async(async (req, res, next) => {
  const body = req.body;

  const assets = await S3.uploadProductAssets(req);

  await Product.create({
    assets,
    title: body.title,
    description: body.description,
    price: +body.price,
    category: body.category,
    sizes: body.sizes,
  });

  res.status(201).json("Product is created");
});

export const updateProduct = Async(async (req, res, next) => {
  const body = req.body;
  const { productId } = req.params;
  const files = req.files as Express.Multer.File[];

  const product = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        title: body.title,
        description: body.description,
        price: +body.price,
        category: body.category,
        sizes: body.sizes,
      },
    },
    { new: true }
  );

  if (!product) return next(new AppError(404, "product does not exists"));

  const assets_to_delete: Array<string> = Array.isArray(body.assets_to_delete)
    ? body.assets_to_delete
    : [];

  if (assets_to_delete.length > 0)
    await S3.deleteProductAssets(assets_to_delete);

  const new_assets = files.length > 0 ? await S3.uploadProductAssets(req) : [];

  if (assets_to_delete.length > 0)
    product.assets = product.assets.filter(
      (asset) => !assets_to_delete.includes(asset)
    );

  if (new_assets.length > 0)
    product.assets = [...product.assets, ...new_assets];

  await product.save();

  res.status(201).json("Product is Updated");
});

export const deleteProduct = Async(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) return next(new AppError(404, "product does not exists"));

  const assets = product.assets || [];

  await S3.deleteProductAssets(assets);

  await product.deleteOne();

  res.status(204).json("product is deleted");
});

export const getProduct = Async(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .select("-__v")
    .populate({ path: "category", select: "-__v" });

  if (!product) return next(new AppError(404, "product does not exists"));

  res.status(200).json(product);
});

export const getProducts = Async(async (req, res, next) => {
  const queryUtils = new API_FeatureUtils(
    req.query as { [key: string]: string }
  );

  const paginationObject = queryUtils.getPaginationInfo();
  const sortObject = queryUtils.getAggregationSortQueryObject();

  const filterObject = queryUtils.productsFilter();

  const categoryLookup = {
    from: "categories",
    localField: "category",
    foreignField: "_id",
    as: "category",
    pipeline: [
      {
        $project: {
          _id: 1,
          title: 1,
          query: 1,
        },
      },
    ],
  };

  const [data] = await Product.aggregate([
    {
      $facet: {
        pagination: [
          {
            $lookup: { ...categoryLookup },
          },

          {
            $match: {
              ...filterObject,
            },
          },

          {
            $group: {
              _id: null,
              sum: { $sum: 1 },
            },
          },

          {
            $project: {
              _id: 0,
            },
          },
        ],
        articles: [
          {
            $unset: ["__v", "updatedAt"],
          },

          {
            $lookup: { ...categoryLookup },
          },

          {
            $unwind: "$category",
          },

          {
            $match: {
              ...filterObject,
            },
          },

          {
            $sort: {
              ...sortObject,
            },
          },

          {
            $skip: paginationObject.skip,
          },

          {
            $limit: paginationObject.limit,
          },
        ],
      },
    },
  ]);

  const { pagination, articles } = data;
  const total = pagination[0]?.sum || 0;
  const currentPage = paginationObject.currentPage;
  const pagesCount = Math.ceil(total / paginationObject.limit);

  res.status(200).json({
    currentPage,
    data: articles,
    hasMore: currentPage < pagesCount,
  });
});

export const getRelatedProducts = Async(async (req, res, next) => {
  const { productId, categoryId } = req.params;

  const relatedProducts = await Product.find({
    $and: [{ _id: { $ne: productId } }, { category: categoryId }],
  });

  res.status(200).json(relatedProducts);
});

export const getProductsFilter = Async(async (req, res, next) => {
  const expensiveProduct = await Product.find().sort("-price").limit(1);
  const cheapProduct = await Product.find().sort("price").limit(1);

  const maxPrice = expensiveProduct[0]?.price || 1;
  const minPrice = cheapProduct[0]?.price || 0;

  const categories = await Category.find();

  res.status(200).json({ minPrice, maxPrice, categories });
});

export const getProductsSizeFilter = Async(async (req, res, next) => {
  const { categoryId } = req.params;

  const products = await Product.find({ category: categoryId }).select("sizes");

  const sizes = Array.from(
    new Set(products.flatMap((product) => product.sizes))
  );

  res.status(200).json(sizes);
});
