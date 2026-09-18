/**
 * Permission Service
 * Centralized role-based access control
 */

const PERMISSIONS = {
  // Events
  CREATE_EVENT: ["admin"],
  EDIT_EVENT: ["admin"],
  DELETE_EVENT: ["admin"],
  REGISTER_EVENT: ["student", "maintainer", "admin"],

  // Grievances
  SUBMIT_GRIEVANCE: ["student", "maintainer", "admin"],
  VIEW_GRIEVANCE: ["student", "maintainer", "admin"],
  ACCEPT_GRIEVANCE: ["maintainer", "admin"],
  REJECT_GRIEVANCE: ["maintainer", "admin"],
  RESPOND_TO_GRIEVANCE: ["maintainer", "admin"],

  // Academic Materials
  UPLOAD_MATERIAL: ["student", "maintainer", "admin"],
  REVIEW_MATERIAL: ["maintainer", "admin"],
  APPROVE_MATERIAL: ["maintainer", "admin"],
  REJECT_MATERIAL: ["maintainer", "admin"],
  PUBLISH_MATERIAL: ["maintainer", "admin"],

  // Welfare
  APPLY_WELFARE: ["student", "maintainer", "admin"],
  REVIEW_APPLICATION: ["admin"],
  APPROVE_APPLICATION: ["admin"],
  REJECT_APPLICATION: ["admin"],

  // Blood Bank
  REGISTER_DONOR: ["student", "maintainer", "admin"],
  CREATE_REQUEST: ["admin"],
  RESPOND_TO_REQUEST: ["admin"],

  // Announcements
  CREATE_ANNOUNCEMENT: ["admin"],
  EDIT_ANNOUNCEMENT: ["admin"],
  DELETE_ANNOUNCEMENT: ["admin"],

  // Emergency
  RAISE_EMERGENCY: ["student", "maintainer", "admin"],
};

export const permissionService = {
  /**
   * Check if a user has permission for an action
   * @param {string} action - Permission key
   * @param {string} userRole - User's role (student, maintainer, admin)
   * @returns {boolean}
   */
  hasPermission(action, userRole) {
    if (!userRole) return false;
    const allowedRoles = PERMISSIONS[action] || [];
    return allowedRoles.includes(userRole);
  },

  /**
   * Check if a user is authenticated
   * @param {object} user - User object
   * @returns {boolean}
   */
  isAuthenticated(user) {
    return !!user;
  },

  /**
   * Check if a user has any of the specified roles
   * @param {string} userRole - User's current role
   * @param {array} roles - Array of allowed roles
   * @returns {boolean}
   */
  hasRole(userRole, roles) {
    return roles.includes(userRole);
  },

  /**
   * Get all permissions for a role
   * @param {string} role - User role
   * @returns {array} - Array of permissions
   */
  getPermissionsForRole(role) {
    return Object.entries(PERMISSIONS)
      .filter(([_, allowedRoles]) => allowedRoles.includes(role))
      .map(([permission]) => permission);
  },

  /**
   * Check if action is allowed and user is authenticated
   * Returns { allowed: boolean, reason: string }
   */
  canPerformAction(action, user) {
    if (!user) {
      return { allowed: false, reason: "LOGIN_REQUIRED" };
    }

    if (!this.hasPermission(action, user.role)) {
      return { allowed: false, reason: "INSUFFICIENT_PERMISSIONS" };
    }

    return { allowed: true, reason: "OK" };
  },
};

export default permissionService;
