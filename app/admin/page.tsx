import { getHistory } from '@/lib/siddur-generation';
import { TriggerButton } from './trigger-button';

export const dynamic = 'force-dynamic'; // Ensure we always fetch fresh history

export default async function AdminPage() {
    const history = await getHistory();

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-white">Siddur Admin</h1>
                
                <div className="mb-12 bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-blue-400">Actions</h2>
                    <p className="mb-4 text-gray-300">
                        Manually trigger the daily generation process. This will generate a new PDF, validate it, and upload it to the blob.
                    </p>
                    <TriggerButton />
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-green-400">Generation History</h2>
                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                        <table className="min-w-full bg-gray-800 text-left text-sm text-gray-300">
                            <thead className="bg-gray-700 text-gray-100 uppercase font-medium">
                                <tr>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                                            No history found.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-750 transition-colors">
                                            <td className="py-3 px-4">{item.date}</td>
                                            <td className="py-3 px-4 text-gray-400">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                    item.status === 'success' 
                                                        ? 'bg-green-900 text-green-200 border border-green-800' 
                                                        : 'bg-red-900 text-red-200 border border-red-800'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {item.url ? (
                                                    <a 
                                                        href={item.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-blue-400 hover:text-blue-300 hover:underline"
                                                    >
                                                        Download PDF
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
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
        </div>
    );
}
