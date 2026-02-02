import { Router } from "express";
import { InviteController } from "../controllers/invite.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../enums/userRoles.enums";

const inviteRoutes = Router();

// All routes require authentication
inviteRoutes.use(authenticate);
inviteRoutes.use(authorize([UserRole.ADMIN, UserRole.USER]));

// GET /invites - Get pending invites for current user
inviteRoutes.get("/", InviteController.getPendingInvites);

// GET /invites/:id - Get invite details
inviteRoutes.get("/:id", InviteController.getById);

// POST /invites/:id/accept - Accept invite
inviteRoutes.post("/:id/accept", InviteController.acceptInvite);

// POST /invites/:id/decline - Decline invite
inviteRoutes.post("/:id/decline", InviteController.declineInvite);

// DELETE /invites/:id - Cancel invite (admin/owner)
inviteRoutes.delete("/:id", InviteController.cancelInvite);

export default inviteRoutes;
