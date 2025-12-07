import { getHistory } from '@/lib/siddur-generation';
import { TriggerButton } from './trigger-button';

export const dynamic = 'force-dynamic'; // Ensure we always fetch fresh history

export default async function AdminPage() {
    const history = await getHistory();

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Siddur Admin</h1>
            
            <div className="mb-12 bg-gray-50 p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                <p className="mb-4 text-gray-600">
                    Manually trigger the daily generation process. This will generate a new PDF, validate it, and upload it to the blob.
                </p>
                <TriggerButton />
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Generation History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-2 px-4 border-b text-left">Date</th>
                                <th className="py-2 px-4 border-b text-left">Timestamp</th>
                                <th className="py-2 px-4 border-b text-left">Status</th>
                                <th className="py-2 px-4 border-b text-left">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                                        No history found.
                                    </td>
                                </tr>
                            ) : (
                                history.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{item.date}</td>
                                        <td className="py-2 px-4 border-b text-sm text-gray-500">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </td>
                                        <td className="py-2 px-4 border-b">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                item.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-2 px-4 border-b">
                                            {item.url ? (
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    Download PDF
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
