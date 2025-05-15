import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';

export type UserData = {
  title: string;
  description: string;
  userID: string;
};

export const getUserID = cache(async () => {
  // We need to pass the request to auth() to get the user
  // This function should be called within a request context
  const { userId } = auth();

  console.log(10, userId);

  // For now, let's return some data including the user ID
  return {
    title: userId ? `User ID from clerk = ${userId}` : 'No user logged in',
    description: 'This description comes from the server',
    userID: userId ? userId : '',
  };
});
