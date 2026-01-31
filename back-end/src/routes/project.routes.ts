import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";
import {
  authenticate,
  authorize,
  checkOwnership,
} from "../middleware/auth.middleware";
import {
  checkProjectAccess,
  checkProjectAdmin,
  checkProjectOwner
} from "../middleware/project.middleware";
import { UserRole } from "../enums/userRoles.enums";

const projectRoutes = Router();

projectRoutes.post(
  "/",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  ProjectController.create,
);

projectRoutes.get(
  "/user/:userId",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkOwnership,
  ProjectController.getByUserId,
);

projectRoutes.get(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectAccess,
  ProjectController.getById,
);

projectRoutes.put(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectAdmin,
  ProjectController.update,
);

// DELETE route - only owner can delete
projectRoutes.delete(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectOwner,
  ProjectController.delete,
);

// Invite user to project
projectRoutes.post(
  "/:id/invite",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectAdmin,
  ProjectController.invite,
);

// Get project invites
projectRoutes.get(
  "/:id/invites",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectAccess,
  ProjectController.getInvites,
);

// Get project members
projectRoutes.get(
  "/:id/members",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectAccess,
  ProjectController.getMembers,
);

// Remove member
projectRoutes.delete(
  "/:id/members/:memberId",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectAdmin,
  ProjectController.removeMember,
);

// Update member role
projectRoutes.patch(
  "/:id/members/:memberId",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectAdmin,
  ProjectController.updateMemberRole,
);

// Transfer ownership
projectRoutes.post(
  "/:id/transfer",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectOwner,
  ProjectController.transferOwnership,
);

// Audit logs
projectRoutes.get(
  "/:id/audit",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkProjectAdmin,
  ProjectController.getAuditLogs,
);

export default projectRoutes;
