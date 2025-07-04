import { handleServerError } from "../lib/utils.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, getIO } from "../lib/socket.js";
export const getUserForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    console.log("req.user:", req.user);
    res.status(200).json({ filteredUsers });
  } catch (error) {
    handleServerError(res, error, "getUserForSidebar controller ");
  }
};
export const getMessages = async (req, res) => {
  try {
    const { id: userIdToChatId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userIdToChatId },
        { senderId: userIdToChatId, receiverId: myId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    handleServerError(res, error, "getMessage controller");
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;

    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadedResponse.secure_url;
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();
    // TODO realTile : For socket.io
    const io = getIO();
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(200).json(newMessage);
  } catch (error) {
    handleServerError(res, error, "sendMessage controller");
  }
};
