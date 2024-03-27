import { Model, Document, Types as MongooseTypes } from "mongoose";

export interface UserT extends Document {
  _id: MongooseTypes.ObjectId;
  username: string;
  email: string;
  password: string;
}

export interface UserMethodsT {
  checkPassword: (
    candidatePassword: string,
    password: string
  ) => Promise<boolean>;
}

export type UserModelT = Model<UserT, {}, UserMethodsT>;
