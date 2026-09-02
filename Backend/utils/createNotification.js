const Notification = require("../models/Notification");

const createNotification = async ({
  title,
  message,
  type,
  moduleId,
  moduleModel,
  recipient,
  createdBy,
  link,
}) => {
  try {
    if (!recipient) return null;

    return await Notification.create({
      title,
      message,
      type,
      moduleId,
      moduleModel,
      recipient,
      createdBy,
      link,
    });
  } catch (error) {
    console.log("NOTIFICATION ERROR:", error.message);
    return null;
  }
};

module.exports = createNotification;