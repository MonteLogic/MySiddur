'use server';
import { UserButton } from '@clerk/nextjs';
export default async function Page() {
  return (
    <div className="relative z-0 space-y-10 text-white">
      <div className="space-y-5">
        <div className="text-gray-1800 text-xs font-semibold uppercase tracking-wider">
          <h3>Home Page</h3>
        </div>
      </div>
      <UserButton afterSignOutUrl="/" />
      <div className="space-y-5">
        <p>This is contractor buddy, sign-in </p>
        <p>Here you will see a summary of your work.</p>
      </div>
    </div>
  );
}
