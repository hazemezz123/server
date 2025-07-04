import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { handleServerError } from "../lib/utils.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt; // fixed here, added optional chaining
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized -- No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res
        .status(401)
        .json({ message: "Unauthorized -- Token is Invalid" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    req.user = user; // attach user to request object for next middlewares/controllers
    next();
  } catch (error) {
    handleServerError(res, error, "protectRoute Middleware");
  }
};
