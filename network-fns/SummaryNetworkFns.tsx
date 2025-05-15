import { SummaryObject } from '#/types/SummaryTypes';
import { handleError } from './HandleError';
import { API_ENDPOINTS } from './constants';

export const updateSummary = async (
  entryID: string,
  date: string,
  routeID: string,
  setSummaryObject: React.Dispatch<React.SetStateAction<SummaryObject | null>>,
  summaryObject: SummaryObject,
) => {
  try {
    const response = await fetch(API_ENDPOINTS.SEARCH_SHIFT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entryID, summaryObject }),
    });

    if (response.ok) {
      const responseData = await response.json();
      const fullSummaryResponse = responseData?.field?.[0]?.summary || [];

      if (fullSummaryResponse) {
        const updatedSummaryObject = {
          ...summaryObject,
          ...fullSummaryResponse,
        };
        setSummaryObject(updatedSummaryObject);
      } else {
        console.error('No route summary found');
      }

      return 'Has updated';
    } else {
      handleError('Error getting work time', setSummaryObject);
    }
  } catch (error) {
    handleError('Error getting work time', setSummaryObject);
  }
};

// createRecordForSummary.ts

export const createRecordForSummary = async (
  dateSelection: string,
  routeID: string,
  setSummaryObject: React.Dispatch<React.SetStateAction<SummaryObject | null>>,
  summaryObject: SummaryObject,
) => {
  try {
    const response = await fetch(API_ENDPOINTS.SEARCH_SHIFT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateSelection,
        routeID,
        summaryObject,
      }),
    });

    if (response.ok) {
      const responseData = await response.json();
      const fullSummaryResponse = responseData?.field?.[0]?.summary || [];

      if (fullSummaryResponse) {
        const updatedSummaryObject = {
          ...summaryObject,
          ...fullSummaryResponse,
        };
        setSummaryObject(updatedSummaryObject);
      } else {
        console.error('No route summary found');
        // Handle the case when fullSummaryResponse is null or undefined
        // For example, you can set a default value or show an error message
      }
      return 'Has updated';
    } else {
      handleError('Error getting work time', setSummaryObject);
    }
  } catch (error) {
    handleError('Error getting work time', setSummaryObject);
  }
};

export const updateSummaryWithAttachment = async (
  entryID: string | null,
  summaryObject: SummaryObject,
) => {
  try {
    const response = await fetch(API_ENDPOINTS.SEARCH_SHIFT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entryID, summaryObject }),
    });

    if (response.ok) {
      const responseData = await response.json();
      const fullSummaryResponse = responseData?.field?.[0]?.summary || [];

      if (fullSummaryResponse) {
        const updatedSummaryObject = {
          ...summaryObject,
          ...fullSummaryResponse,
        };
        // Do something with the updated summary object
      } else {
        console.error('No route summary found');
      }

      return 'Has updated';
    } else {
      console.error('Error updating summary with attachment');
    }
  } catch (error) {
    console.error('Error updating summary with attachment', error);
    // Handle the error appropriately
  }
};

export const handleSubmit = async (
  routeID: string,
  summaries: SummaryObject,
  dateSelection: string,
  setSummaries: React.Dispatch<React.SetStateAction<SummaryObject>>,
) => {
  try {
    const response = await fetch(API_ENDPOINTS.SEARCH_SHIFT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        routeID,
        summaryObject: summaries,
        dateSelection,
      }),
    });

    if (response.ok) {
      console.log('Summaries submitted successfully');
      setSummaries({});
    } else {
      console.error('Error submitting summaries');
    }
  } catch (error) {
    console.error('Error submitting summaries', error);
  }
};

/**
 * Searches for a summary based on the provided date and route ID.
 * Updates the state variables for entry ID, current PO route, and summary object.
 *
 * @param {string} date - The date to search for the summary.
 * @param {string} routeID - The route ID to search for the summary.
 * @param {React.Dispatch<React.SetStateAction<string | null>>} setEntryID - Function to update the entry ID state variable.
 * @param {React.Dispatch<React.SetStateAction<SummaryObject | null>>} setSummaryObject - Function to update the summary object state variable.
 * @returns {Promise<void>} - A promise that resolves when the search is complete.
 */
export const searchForSummaryNoURL = async (
  date: string,
  routeID: string,
  setEntryID: React.Dispatch<React.SetStateAction<string | null>>,
  setSummaryObject: React.Dispatch<React.SetStateAction<SummaryObject | null>>,
): Promise<void> => {
  try {
    const response = await fetch(API_ENDPOINTS.SEARCH_SHIFT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date, routeID }),
    });

    if (response.ok) {
      const data = await response.json();
      const receivedID = data['id'];

      if (receivedID) {
        setEntryID(receivedID);
      } else {
        setEntryID(null);
      }

      const routeIDCurrent = data?.field?.[0]?.routeIDFromPostOffice || '';
      const fullSummaryResponse = data?.field?.[0]?.summary || null;

      if (fullSummaryResponse) {
        setSummaryObject(fullSummaryResponse);
      } else {
        console.error('No route summary found');
        setSummaryObject(null);
      }
    } else {
      console.log('Could not find matching day, setting empty object.');
      setSummaryObject(null);
      setEntryID(null);
      handleError('Error updating work time', setSummaryObject);
    }
  } catch (error) {
    handleError('Error updating work time', setSummaryObject);
  }
};

/**
 * Handles the submission of the summary modal schedule.
 * Sends a POST request to the '/api/search-shift' endpoint with the route ID, summaries, and date selection.
 * Clears the summaries after a successful submission.
 * Logs any errors that occur during the submission process.
 */

export const handleSubmitSummaryModalSchedule = async (
  id: string,
  routeID: string,
  dateSelection: string,
  summaries: { [key: string]: string },
  setSummaries: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>,
) => {
  try {
    const response = await fetch('/api/search-shift', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        routeID,
        summaryObject: summaries,
        dateSelection,
      }),
    });

    if (response.ok) {
      console.log('Summaries submitted successfully');
      // Clear the summaries after successful submission

      // Parse the response data and return it
      const updatedData = await response.json();
      setSummaries(updatedData.data.summary);
      return updatedData.data;
    } else {
      console.error('Error submitting summaries');
      // Handle the error case, such as displaying an error message to the user
      throw new Error('Failed to submit summaries');
    }
  } catch (error) {
    console.error('Error submitting summaries', error);
    // Handle the error case, such as displaying an error message to the user
    throw error;
  }
};

// In here we need to have a call which changes the summaryObject.
export const searchForSummary = async (
  date: string,
  routeID: string,
  setEntryID: React.Dispatch<React.SetStateAction<string | null>>,
  setSummaryObject: React.Dispatch<React.SetStateAction<SummaryObject | null>>,
) => {
  try {
    const response = await fetch(API_ENDPOINTS.SEARCH_SHIFT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date, routeID }),
    });

    if (response.ok) {
      const data = await response.json();
      const receivedID = data['id'];

      if (receivedID) {
        setEntryID(receivedID);
      } else {
        setEntryID(null);
      }

      const routeIDCurrent = data?.field?.[0]?.routeIDFromPostOffice || '';
      const fullSummaryResponse = data?.field?.[0]?.summary || null;

      if (fullSummaryResponse) {
        setSummaryObject(fullSummaryResponse);
      } else {
        console.error('No route summary found');
        setSummaryObject(null);
      }
    } else {
      console.log('Could not find matching day, setting empty object.');
      setSummaryObject(null);
      setEntryID(null);
      handleError('Error updating work time', setSummaryObject);
    }
  } catch (error) {
    handleError('Error updating work time', setSummaryObject);
  }
};
