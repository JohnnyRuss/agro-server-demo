import {
  OrderT,
  OrderModelT,
  OrderMethodsT,
  EncryptedFieldT,
} from "../types/models/order.types";
import { model, Schema } from "mongoose";

import crypto from "crypto";

const OrderSchema = new Schema<OrderT, OrderModelT, OrderMethodsT>(
  {
    products: [
      {
        productType: {
          type: String,
          enum: ["PRODUCT", "COMBO"],
          required: true,
        },
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },
        combo: {
          type: Schema.Types.ObjectId,
          ref: "Combo",
          required: false,
        },
        quantity: Number,
        size: String,
      },
    ],
    invoiceNumber: String,
    customerName: String,
    customerAddress: String,
    customerPhone: {
      type: { value: String, iv: String, key: String },
    },
    customerId: {
      type: { value: String, iv: String, key: String },
    },
    totalPrice: Number,
    status: {
      type: String,
      enum: ["PENDING", "REJECTED", "SUCCESS"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

const generateKeys = () => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  return { key, iv };
};

const generateHash = (text: string) => {
  const { key, iv } = generateKeys();

  let cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);

  let encryption = cipher.update(text);
  encryption = Buffer.concat([encryption, cipher.final()]);

  return {
    iv: iv.toString("hex"),
    key: key.toString("hex"),
    encryption: encryption.toString("hex"),
  };
};

const decryptHash = (params: EncryptedFieldT) => {
  let decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(params.key, "hex"),
    Buffer.from(params.iv, "hex")
  );

  let decryption = decipher.update(Buffer.from(params.value, "hex"));
  decryption = Buffer.concat([decryption, decipher.final()]);

  return decryption.toString();
};

OrderSchema.pre("save", async function (next) {
  if (
    !this.isModified("customerId.value") ||
    !this.isModified("customerPhone.value")
  )
    return next();

  if (this.isModified("customerId.value")) {
    const { encryption, iv, key } = generateHash(this.customerId.value);
    this.customerId = { iv, key, value: encryption };
  }

  if (this.isModified("customerPhone.value")) {
    const { encryption, iv, key } = generateHash(this.customerPhone.value);
    this.customerPhone = { iv, key, value: encryption };
  }

  next();
});

OrderSchema.methods.decryptOrder = (params) => ({
  id: decryptHash(params.id),
  phone: decryptHash(params.phone),
});

const Order = model<OrderT, OrderModelT>("Order", OrderSchema);

export default Order;
