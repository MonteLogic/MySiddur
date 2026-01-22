import { clerkClient } from '@clerk/nextjs/server';

// Types for our data structures
export interface UserData {
  id: string;
  clerkID: string;
  organizationID: string;
  userNiceName: string;
  email: string;
  phone: string;
  dateHired: string;
  dateAddedToCB: string;
  img?: string;
}

export interface RouteData {
  id: string;
  organizationID: string;
  routeNiceName: string;
  routeIDFromPostOffice?: string;
  dateRouteAcquired: string;
  dateAddedToCB: string;
  img?: string;
}

export interface RouteShiftInfoData {
  id: string;
  organizationID: string;
  routeId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  dateAddedToCB: string;
}

export interface WorkTimeShiftData {
  id: string;
  organizationID: string;
  occupied: boolean;
  userId: string;
  shiftWorked: string;
  dayScheduled: string;
  dateAddedToCB: string;
  routeId: string;
  summary?: string;
}

export class ClerkMetadataService {
  private static readonly METADATA_KEYS = {
    USERS: 'users',
    ROUTES: 'routes',
    ROUTE_SHIFT_INFO: 'routeShiftInfo',
    WORK_TIME_SHIFTS: 'workTimeShifts',
  };

  // User operations
  static async createUser(userData: Omit<UserData, 'id'>): Promise<UserData> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: UserData = { ...userData, id };

    // Store in Clerk user's public metadata
    await clerkClient.users.updateUserMetadata(userData.clerkID, {
      publicMetadata: {
        [this.METADATA_KEYS.USERS]: user,
      },
    });

    return user;
  }

  static async getUser(clerkID: string): Promise<UserData | null> {
    try {
      const user = await clerkClient.users.getUser(clerkID);
      return user.publicMetadata?.[this.METADATA_KEYS.USERS] as UserData || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  static async updateUser(clerkID: string, userData: Partial<UserData>): Promise<UserData | null> {
    try {
      const existingUser = await this.getUser(clerkID);
      if (!existingUser) return null;

      const updatedUser = { ...existingUser, ...userData };
      
      await clerkClient.users.updateUserMetadata(clerkID, {
        publicMetadata: {
          [this.METADATA_KEYS.USERS]: updatedUser,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Route operations
  static async createRoute(routeData: Omit<RouteData, 'id'>): Promise<RouteData> {
    const id = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const route: RouteData = { ...routeData, id };

    // Store in organization's metadata
    await clerkClient.organizations.updateOrganizationMetadata(routeData.organizationID, {
      publicMetadata: {
        [this.METADATA_KEYS.ROUTES]: route,
      },
    });

    return route;
  }

  static async getRoutes(organizationID: string): Promise<RouteData[]> {
    try {
      const org = await clerkClient.organizations.getOrganization({ organizationId: organizationID });
      const routes = org.publicMetadata?.[this.METADATA_KEYS.ROUTES] as RouteData[] || [];
      return Array.isArray(routes) ? routes : [];
    } catch (error) {
      console.error('Error fetching routes:', error);
      return [];
    }
  }

  static async updateRoute(organizationID: string, routeId: string, routeData: Partial<RouteData>): Promise<RouteData | null> {
    try {
      const routes = await this.getRoutes(organizationID);
      const routeIndex = routes.findIndex(route => route.id === routeId);
      
      if (routeIndex === -1) return null;

      routes[routeIndex] = { ...routes[routeIndex], ...routeData };
      
      await clerkClient.organizations.updateOrganizationMetadata(organizationID, {
        publicMetadata: {
          [this.METADATA_KEYS.ROUTES]: routes,
        },
      });

      return routes[routeIndex];
    } catch (error) {
      console.error('Error updating route:', error);
      return null;
    }
  }

  static async deleteRoute(organizationID: string, routeId: string): Promise<boolean> {
    try {
      const routes = await this.getRoutes(organizationID);
      const filteredRoutes = routes.filter(route => route.id !== routeId);
      
      await clerkClient.organizations.updateOrganizationMetadata(organizationID, {
        publicMetadata: {
          [this.METADATA_KEYS.ROUTES]: filteredRoutes,
        },
      });

      return true;
    } catch (error) {
      console.error('Error deleting route:', error);
      return false;
    }
  }

  // Route Shift Info operations
  static async createRouteShiftInfo(shiftData: Omit<RouteShiftInfoData, 'id'>): Promise<RouteShiftInfoData> {
    const id = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shift: RouteShiftInfoData = { ...shiftData, id };

    const existingShifts = await this.getRouteShiftInfo(shiftData.organizationID);
    const updatedShifts = [...existingShifts, shift];

    await clerkClient.organizations.updateOrganizationMetadata(shiftData.organizationID, {
      publicMetadata: {
        [this.METADATA_KEYS.ROUTE_SHIFT_INFO]: updatedShifts,
      },
    });

    return shift;
  }

  static async getRouteShiftInfo(organizationID: string): Promise<RouteShiftInfoData[]> {
    try {
      const org = await clerkClient.organizations.getOrganization({ organizationId: organizationID });
      const shifts = org.publicMetadata?.[this.METADATA_KEYS.ROUTE_SHIFT_INFO] as RouteShiftInfoData[] || [];
      return Array.isArray(shifts) ? shifts : [];
    } catch (error) {
      console.error('Error fetching route shift info:', error);
      return [];
    }
  }

  // Work Time Shift operations
  static async createWorkTimeShift(workData: Omit<WorkTimeShiftData, 'id'>): Promise<WorkTimeShiftData> {
    const id = `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workShift: WorkTimeShiftData = { ...workData, id };

    const existingWorkShifts = await this.getWorkTimeShifts(workData.organizationID);
    const updatedWorkShifts = [...existingWorkShifts, workShift];

    await clerkClient.organizations.updateOrganizationMetadata(workData.organizationID, {
      publicMetadata: {
        [this.METADATA_KEYS.WORK_TIME_SHIFTS]: updatedWorkShifts,
      },
    });

    return workShift;
  }

  static async getWorkTimeShifts(organizationID: string): Promise<WorkTimeShiftData[]> {
    try {
      const org = await clerkClient.organizations.getOrganization({ organizationId: organizationID });
      const workShifts = org.publicMetadata?.[this.METADATA_KEYS.WORK_TIME_SHIFTS] as WorkTimeShiftData[] || [];
      return Array.isArray(workShifts) ? workShifts : [];
    } catch (error) {
      console.error('Error fetching work time shifts:', error);
      return [];
    }
  }

  static async updateWorkTimeShift(organizationID: string, workShiftId: string, workData: Partial<WorkTimeShiftData>): Promise<WorkTimeShiftData | null> {
    try {
      const workShifts = await this.getWorkTimeShifts(organizationID);
      const shiftIndex = workShifts.findIndex(shift => shift.id === workShiftId);
      
      if (shiftIndex === -1) return null;

      workShifts[shiftIndex] = { ...workShifts[shiftIndex], ...workData };
      
      await clerkClient.organizations.updateOrganizationMetadata(organizationID, {
        publicMetadata: {
          [this.METADATA_KEYS.WORK_TIME_SHIFTS]: workShifts,
        },
      });

      return workShifts[shiftIndex];
    } catch (error) {
      console.error('Error updating work time shift:', error);
      return null;
    }
  }

  // Sync function to replace the old database sync
  static async syncClerkAndMetadata(clerkUserId: string, orgId: string): Promise<{ isNewUser: boolean; localUser: UserData | null }> {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

      if (!userEmail) {
        throw new Error('User email not found');
      }

      // Check if user exists in metadata
      let existingUser = await this.getUser(clerkUserId);

      if (!existingUser) {
        // User doesn't exist in metadata, create new record
        const newUser = await this.createUser({
          clerkID: clerkUserId,
          organizationID: orgId,
          userNiceName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User',
          email: userEmail,
          phone: '', // Add default value or get from Clerk if available
          dateHired: new Date().toISOString(),
          dateAddedToCB: new Date().toISOString(),
        });

        return { isNewUser: true, localUser: newUser };
      }

      return { isNewUser: false, localUser: existingUser };
    } catch (error) {
      console.error('Error syncing user with metadata:', error);
      throw error;
    }
  }
}
