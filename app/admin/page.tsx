import { getHistory } from '@/lib/siddur-generation';
import AdminPageContent from './admin-content';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const history = await getHistory();

    return (
        <AdminPageContent history={history} />
    );
}
