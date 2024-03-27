import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import { UserT, UserMethodsT, UserModelT } from "../types/models/user.types";

const UserSchema = new Schema<UserT, UserModelT, UserMethodsT>({
  username: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    select: false,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  return next();
});

UserSchema.methods.checkPassword = async function (
  candidatePassword,
  password
) {
  return await bcrypt.compare(candidatePassword, password);
};

const User = model<UserT, UserModelT>("User", UserSchema);

export default User;
