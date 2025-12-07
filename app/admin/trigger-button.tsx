'use client';

import { useState } from 'react';
import { triggerGenerationAction } from './actions';

export function TriggerButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleClick = async () => {
        setLoading(true);
        setMessage('Generating...');
        try {
            const result = await triggerGenerationAction();
            if (result.success) {
                setMessage('✅ Success! Refreshing...');
            } else {
                setMessage(`❌ Failed: ${result.error}`);
            }
        } catch (e) {
            setMessage('❌ Error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={handleClick}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Generating...' : 'Trigger Generation Now'}
            </button>
            {message && <span className="text-sm">{message}</span>}
        </div>
    );
}
