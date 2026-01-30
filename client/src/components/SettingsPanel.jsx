import React, { useState, useEffect } from 'react';

export default function SettingsPanel({ onClose }) {
    const [presetsDir, setPresetsDir] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3001/api/config')
            .then(res => res.json())
            .then(data => setPresetsDir(data.presetsDir || ''))
            .catch(console.error);
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch('http://localhost:3001/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ presetsDir })
            });

            if (!res.ok) throw new Error('Failed to save configuration');

            const data = await res.json();
            setPresetsDir(data.presetsDir);
            setStatus({ type: 'success', message: 'Settings saved successfully!' });

            // Optional: Close after delay
            setTimeout(() => {
                setStatus(null);
            }, 3000);
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl w-full max-w-lg border border-[var(--card-border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--card-border)] flex justify-between items-center">
                    <h2 className="text-xl font-bold">Application Settings</h2>
                    <button
                        onClick={onClose}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium opacity-80 mb-2">
                                Presets Storage Directory
                            </label>
                            <input
                                type="text"
                                value={presetsDir}
                                onChange={(e) => setPresetsDir(e.target.value)}
                                className="w-full bg-[var(--bg-color)] border border-[var(--card-border)] rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="C:\Path\To\Presets"
                            />
                            <p className="text-xs opacity-50 mt-1">
                                Absolute path where preset JSON files will be stored.
                            </p>
                        </div>

                        {status && (
                            <div className={`p-3 rounded text-sm ${status.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                {status.message}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-[var(--bg-color)] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
