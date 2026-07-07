const db = require("../config/db");

exports.createNotification = async (citizenId, notification) => {
  const query = `
    MATCH (c:Citizen { id: $citizenId })
    CREATE (c)-[:HAS_NOTIFICATION]->(n:Notification {
      id: $id,
      type: $type,
      title: $title,
      message: $message,
      read: false,
      createdAt: datetime()
    })
    RETURN n
  `;
  const params = {
    citizenId,
    id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: notification.type,
    title: notification.title,
    message: notification.message,
  };
  return db.runQuery(query, params);
};

exports.getNotificationsByCitizen = async (citizenId) => {
  const query = `
    MATCH (c:Citizen { id: $citizenId })-[:HAS_NOTIFICATION]->(n:Notification)
    RETURN n
    ORDER BY n.createdAt DESC
  `;
  return db.runQuery(query, { citizenId });
};

exports.markNotificationRead = async (notificationId) => {
  const query = `
    MATCH (n:Notification { id: $notificationId })
    SET n.read = true
    RETURN n
  `;
  return db.runQuery(query, { notificationId });
};

exports.deleteNotification = async (notificationId) => {
  const query = `
    MATCH (n:Notification { id: $notificationId })
    WITH n, n.id as deletedId
    DETACH DELETE n
    RETURN deletedId
  `;
  return db.runQuery(query, { notificationId });
};
