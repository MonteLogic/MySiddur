'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { FormEventHandler, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uuid } from '#/utils/dbUtils';

/**
 * Generates a random alphanumeric ID for organization name
 * @returns {string} 8-character alphanumeric string
 */
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * Creates organization name in the format 'contract-driver-random-id'
 * @returns {string} Formatted organization name
 */
const generateOrganizationName = (): string => {
  return `contract-driver-${generateRandomId()}`;
};

/**
 * Interface for the shift slots in routes
 */
interface ShiftSlot {
  name: string;
  startTime: string;
  endTime: string;
}

/**
 * Interface for route data structure
 */
interface RouteData {
  id: string;
  routeNiceName: string;
  organizationID: string;
  routeIDFromPostOffice: string;
  dateRouteAcquired: string;
  dateAddedToCB: string;
  allocatedShifts: string;
  img: string;
}

/**
 * Creates a sample route with predefined data for a new organization
 * @param {string} organizationID - ID of the organization to associate with the route
 * @returns {RouteData} Sample route data object
 */
const createSampleRoute = (organizationID: string): RouteData => {
  const sampleShifts: ShiftSlot[] = [
    { name: "Morning Trip", startTime: "08:00", endTime: "12:00" },
    { name: "Afternoon Trip", startTime: "13:00", endTime: "17:00" }
  ];

  return {
    id: uuid(),
    routeNiceName: "Sample Route",
    organizationID: organizationID,
    routeIDFromPostOffice: "R123456",
    dateRouteAcquired: new Date().toISOString(),
    dateAddedToCB: new Date().toISOString(),
    allocatedShifts: JSON.stringify(sampleShifts),
    img: ''
  };
};

/**
 * Component for creating an organization with an automatic sample route
 * Handles user input for organization details and creates both the organization
 * and a sample route upon submission
 * @returns {JSX.Element | null} The component UI or null if not loaded
 */
export default function CreateOrganization(): JSX.Element | null {
  const { isLoaded, createOrganization, setActive } = useOrganizationList();
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState<string>(generateOrganizationName());
  const [employeeCount, setEmployeeCount] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  if (!isLoaded) return null;

  /**
   * Handles form submission to create organization and sample route
   * @param {React.FormEvent<HTMLFormElement>} e - Form event
   */
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    const count = parseInt(employeeCount) || 0;
    
    try {
      // Create the organization
      const organization = await createOrganization({ name: organizationName });
      
      if (organization) {
        // Store employee count in local storage
        localStorage.setItem(`${organizationName}_employeeCount`, count.toString());
        
        // Set the active organization and wait for it to complete
        await setActive({ organization: organization.id });
        
        // Create a sample route for the new organization
        await addSampleRouteForOrganization(organization.id);
        
        // Add a small delay to ensure the organization switch is complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force a refresh of the client-side data
        router.refresh();
        
        // Then redirect
        router.push('/main/schedule');
      }
    } catch (err) {
      console.error('Error creating organization:', err);
      setIsCreating(false);
    }
  };

  /**
   * Creates and adds a sample route for a newly created organization
   * @param {string} organizationId - ID of the organization
   */
  const addSampleRouteForOrganization = async (organizationId: string): Promise<void> => {
    const sampleRoute = createSampleRoute(organizationId);
    
    try {
      const response = await fetch('/api/add-new-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleRoute),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error adding sample route! status: ${response.status}`);
      }
    } catch (routeErr) {
      console.error('Error adding sample route:', routeErr);
      // Continue even if route creation fails
    }
  };

  return (
    <div className="max-w-md mx-auto bg-[#1a1f2e] rounded-lg shadow-lg overflow-hidden border border-dashed border-gray-600">
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-8 text-white tracking-wide">
          CREATE<br />ORGANIZATION
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">
              ORGANIZATION NAME
            </label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.currentTarget.value)}
              className="block w-full rounded-md border border-gray-700 bg-white shadow-sm p-3 text-black font-medium"
              placeholder="Enter organization name"
              disabled={isCreating}
            />
          </div>
          <div>
            <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">
              NUMBER OF EMPLOYEES
            </label>
            <input
              type="number"
              id="employeeCount"
              name="employeeCount"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.currentTarget.value)}
              className="block w-full rounded-md border border-gray-700 bg-white shadow-sm p-3 text-black font-medium"
              placeholder="Enter number of employees"
              min="0"
              disabled={isCreating}
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCreating}
          >
            {isCreating ? 'Creating Organization...' : 'Create Organization'}
          </button>
        </form>
      </div>
    </div>
  );
}