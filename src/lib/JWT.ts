import jwt from "jsonwebtoken";

import {
  NODE_MODE,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
} from "../config/env";
import { Response } from "express";
import { promisify } from "util";
import { ReqUserT } from "../index";

class JWT {
  assignToken({ signature, res }: { signature: ReqUserT; res: Response }): {
    accessToken: string;
  } {
    const payload: ReqUserT = {
      _id: signature._id.toString(),
      email: signature.email,
    };

    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET);

    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite?: boolean;
    } = {
      httpOnly: true,
      secure: false,
      sameSite: false,
    };

    if (NODE_MODE === "PROD") cookieOptions.secure = true;

    res.cookie("authorization", refreshToken, cookieOptions);

    return { accessToken };
  }

  async verifyToken(token: string, refresh?: boolean): Promise<jwt.JwtPayload> {
    try {
      type ValidatorT = (
        token: string,
        secret: jwt.Secret | jwt.GetPublicKeyOrSecret,
        options?: jwt.VerifyOptions
      ) => Promise<jwt.JwtPayload>;

      const validator: ValidatorT = promisify(jwt.verify);

      const verifiedToken = await validator(
        token,
        refresh ? JWT_REFRESH_SECRET : JWT_ACCESS_SECRET
      );

      return verifiedToken;
    } catch (error) {
      throw error;
    }
  }
}

export default new JWT();
