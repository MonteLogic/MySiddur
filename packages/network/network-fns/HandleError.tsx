import { SummaryObject } from '#/types/SummaryTypes';

export const handleError = (
  error: string,
  setSummaryObject: React.Dispatch<React.SetStateAction<SummaryObject | null>>,
) => {
  const errorObject: SummaryObject = {
    // @ts-ignore
    error: error,
  };

  setSummaryObject(errorObject);
  console.error('Error:', error);
};
