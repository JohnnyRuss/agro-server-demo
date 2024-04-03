import { User } from "../models";
import { Async, AppError, JWT } from "../lib";

export const signIn = Async(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError(401, "please enter your email and password"));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new AppError(404, "incorrect email or password"));

  const isValidPassword = await user.checkPassword(password, user.password);

  if (!isValidPassword)
    return next(new AppError(404, "incorrect email or password"));

  const { accessToken } = JWT.assignToken({
    signature: {
      _id: user._id.toString(),
      email: user.email,
    },
    res,
  });

  const userData = {
    _id: user._id,
    email: user.email,
    username: user.username,
  };

  res.status(201).json({ user: userData, accessToken });
});

export const logout = Async(async (req, res, next) => {
  res.clearCookie("Authorization");
  res.status(204).json("user is logged out");
});

export const refresh = Async(async (req, res, next) => {
  const { authorization } = req.cookies;

  if (!authorization) return next(new AppError(401, "you are not authorized"));

  const verifiedToken = await JWT.verifyToken(authorization, true);

  if (!verifiedToken)
    return next(new AppError(401, "User does not exists. Invalid credentials"));

  const user = await User.findById(verifiedToken._id);

  if (!user) return next(new AppError(404, "user does not exists"));

  const userData = {
    _id: user._id.toString(),
    email: user.email,
  };

  const { accessToken } = JWT.assignToken({ signature: userData, res });

  res.status(200).json({ accessToken });
});

async function createAdmin() {
  await new User({ username: "", email: "", password: "" }).save();
}

// createAdmin();
