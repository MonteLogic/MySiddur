
import { CustomerInformationProps } from '../settings-types';

export function CustomerInformation({ email, created }: Readonly<CustomerInformationProps>) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Customer Information</h3>
      <div className="mt-2 space-y-2">
        <p>Email: {email ?? 'N/A'}</p>
        <p>Created: {new Date(created * 1000).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
