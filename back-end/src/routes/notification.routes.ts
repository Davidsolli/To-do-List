import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../enums/userRoles.enums";

const notificationRoutes = Router();

// All routes require authentication
notificationRoutes.use(authenticate);
notificationRoutes.use(authorize([UserRole.ADMIN, UserRole.USER]));

// GET /notifications - Get all notifications with pagination
notificationRoutes.get("/", NotificationController.getAll);

// GET /notifications/unread - Get unread notifications
notificationRoutes.get("/unread", NotificationController.getUnread);

// GET /notifications/count - Get unread count
notificationRoutes.get("/count", NotificationController.getUnreadCount);

// PATCH /notifications/:id/read - Mark as read
notificationRoutes.patch("/:id/read", NotificationController.markAsRead);

// PATCH /notifications/read-all - Mark all as read
notificationRoutes.patch("/read-all", NotificationController.markAllAsRead);

// DELETE /notifications/:id - Delete notification
notificationRoutes.delete("/:id", NotificationController.delete);

export default notificationRoutes;
