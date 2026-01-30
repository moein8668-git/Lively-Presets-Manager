import React, { useState, useEffect } from 'react'

export default function PresetManager({ wallpaperId }) {
    const [presets, setPresets] = useState([])
    const [monitors, setMonitors] = useState([])
    const [selectedMonitor, setSelectedMonitor] = useState('1')
    const [newPresetName, setNewPresetName] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }

    const API_BASE = 'http://localhost:3001/api'

    useEffect(() => {
        loadPresets()
        loadMonitors()
    }, [wallpaperId])

    const loadPresets = () => {
        fetch(`${API_BASE}/wallpapers/${wallpaperId}/presets`)
            .then(res => res.json())
            .then(setPresets)
            .catch(console.error)
    }

    const loadMonitors = () => {
        fetch(`${API_BASE}/wallpapers/${wallpaperId}/monitors`)
            .then(res => res.json())
            .then(data => {
                setMonitors(data)
                if (data.length > 0) {
                    // Default to '1' if available, else first one
                    if (data.includes('1')) setSelectedMonitor('1')
                    else setSelectedMonitor(data[0])
                }
            })
            .catch(console.error)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!newPresetName.trim()) return

        setLoading(true)
        try {
            // 1. Get current config (from selected monitor)
            const configRes = await fetch(`${API_BASE}/wallpapers/${wallpaperId}/config?monitorId=${selectedMonitor}`)

            if (!configRes.ok) {
                const err = await configRes.json()
                throw new Error(err.error || 'Failed to read current config')
            }
            const config = await configRes.json()

            // 2. Save preset (with monitor metadata)
            const saveRes = await fetch(`${API_BASE}/wallpapers/${wallpaperId}/presets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPresetName,
                    config,
                    monitorId: selectedMonitor
                })
            })

            const saveJson = await saveRes.json()
            if (!saveRes.ok) throw new Error(saveJson.error || 'Failed to save preset')

            setNewPresetName('')
            loadPresets()
            showStatus('success', 'Preset saved successfully!')
        } catch (err) {
            showStatus('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleApply = async (preset) => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/wallpapers/${wallpaperId}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config: preset.config,
                    monitorId: selectedMonitor
                })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to apply preset')
            showStatus('success', `Applied preset: ${preset.name} to Monitor ${selectedMonitor}`)
        } catch (err) {
            showStatus('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (name) => {
        if (!confirm(`Delete preset "${name}"?`)) return

        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/wallpapers/${wallpaperId}/presets/${name}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete preset')
            loadPresets()
            showStatus('success', 'Preset deleted')
        } catch (err) {
            showStatus('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    const showStatus = (type, message) => {
        setStatus({ type, message })
        setTimeout(() => setStatus(null), 3000)
    }

    return (
        <div>
            {/* Monitor Selection */}
            <div className="mb-6 flex items-center gap-4 bg-[var(--bg-color)] p-4 rounded-lg border border-[var(--card-border)]">
                <label className="font-semibold text-sm uppercase tracking-wide opacity-80">Target Monitor:</label>
                {monitors.length > 0 ? (
                    <div className="flex gap-2">
                        {monitors.map(m => (
                            <button
                                key={m}
                                onClick={() => setSelectedMonitor(m)}
                                className={`px-4 py-2 rounded-md transition-all ${selectedMonitor === m
                                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                                        : 'bg-[var(--card-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)]'
                                    }`}
                            >
                                Monitor {m}
                            </button>
                        ))}
                    </div>
                ) : (
                    <span className="text-yellow-500 italic">No monitors detected</span>
                )}
            </div>

            {/* Save New Preset */}
            <div className="bg-[var(--bg-color)] p-4 rounded-lg mb-8 border border-[var(--card-border)]">
                <h3 className="text-lg font-semibold mb-3">Save Current State</h3>
                <form onSubmit={handleSave} className="flex gap-4">
                    <input
                        type="text"
                        value={newPresetName}
                        onChange={e => setNewPresetName(e.target.value)}
                        placeholder="Preset Name (e.g. 'Chill Night')"
                        className="flex-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded px-4 py-2 text-[var(--text-color)] focus:outline-none focus:border-purple-500 placeholder-opacity-50 placeholder-[var(--text-color)]"
                    />
                    <button
                        type="submit"
                        disabled={loading || !newPresetName.trim() || !selectedMonitor}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded font-medium transition-colors text-white"
                    >
                        {loading ? 'Saving...' : 'Save Preset'}
                    </button>
                </form>
            </div>

            {status && (
                <div className={`mb-4 p-3 rounded ${status.type === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                    {status.message}
                </div>
            )}

            {/* Preset List */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Saved Presets</h3>
                {presets.length === 0 ? (
                    <p className="italic opacity-50">No presets saved yet.</p>
                ) : (
                    <div className="space-y-3">
                        {presets.map(preset => (
                            <div key={preset.name} className="flex items-center justify-between bg-[var(--bg-color)] p-4 rounded hover:bg-opacity-80 transition-colors border border-[var(--card-border)]">
                                <div>
                                    <h4 className="font-medium">{preset.name}</h4>
                                    <div className="flex gap-2 text-xs opacity-50">
                                        <span>{new Date(preset.updatedAt).toLocaleDateString()}</span>
                                        {preset.sourceMonitor && <span>• Source: Mon {preset.sourceMonitor}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApply(preset)}
                                        disabled={loading || !selectedMonitor}
                                        className="bg-blue-600/80 hover:bg-blue-500 px-4 py-1.5 rounded text-sm transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!selectedMonitor ? "Select a monitor to apply" : ""}
                                    >
                                        Apply to Monitor {selectedMonitor}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(preset.name)}
                                        disabled={loading}
                                        className="bg-red-600/20 hover:bg-red-600/40 text-red-500 px-3 py-1.5 rounded text-sm transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
