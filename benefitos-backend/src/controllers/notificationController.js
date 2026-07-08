const notificationQueries = require("../queries/notificationQueries");

exports.getNotifications = async (req, res, next) => {
  try {
    const { citizenId } = req.params;
    const result = await notificationQueries.getNotificationsByCitizen(citizenId);
    res.json({ notifications: result });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const { citizenId } = req.params;
    const result = await notificationQueries.markAllNotificationsRead(citizenId);
    res.json({ status: "Success", message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const result = await notificationQueries.markNotificationRead(notificationId);
    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ status: "Success", notification: result[0] });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const result = await notificationQueries.deleteNotification(notificationId);
    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ status: "Success", message: "Notification deleted." });
  } catch (err) {
    next(err);
  }
};
