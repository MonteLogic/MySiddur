'use server';
import { InternalLink } from '#/ui/internal-link';

export default async function Page() {
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <h1 className="text-xl font-bold">Startup Page</h1>

      <ul>
        <li>
          <h3>
            You are currently <b>NOT*?</b> affiliated with any organizations.
          </h3>
        </li>
        <li>
          Wait for the organization to send you an invitation, create an
          organization or or continue to the app.
        </li>
      </ul>

      <div className="flex gap-2">
        <InternalLink href="/main/">Continue to App</InternalLink>
        <InternalLink href="/main/">Create Organization</InternalLink>
      </div>
    </div>
  );
}
