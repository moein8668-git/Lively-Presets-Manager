import { useState, useEffect } from 'react'
import WallpaperGrid from './components/WallpaperGrid'
import PresetManager from './components/PresetManager'
import SettingsPanel from './components/SettingsPanel'

function App() {
  const [wallpapers, setWallpapers] = useState([])
  const [selectedWallpaper, setSelectedWallpaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    // Theme handling
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    fetch('http://localhost:3001/api/wallpapers')
      .then(res => res.json())
      .then(data => {
        setWallpapers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load wallpapers:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] p-8 flex flex-col transition-colors duration-300">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
            Lively Presets
          </h1>
          <p className="opacity-70 mt-2">Manage configurations for your wallpapers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 bg-[var(--card-bg)] hover:brightness-110 rounded-lg border border-[var(--card-border)] transition-all shadow-sm"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-[var(--card-bg)] hover:brightness-110 rounded-lg border border-[var(--card-border)] transition-all shadow-sm opacity-70 hover:opacity-100"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
        </div>
      </header>

      <main className="flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : selectedWallpaper ? (
          <div className="animate-fade-in">
            <button
              onClick={() => setSelectedWallpaper(null)}
              className="mb-4 flex items-center opacity-70 hover:opacity-100 transition-colors"
            >
              ← Back to Wallpapers
            </button>
            <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-xl border border-[var(--card-border)]">
              <div className="flex items-center gap-4 mb-6 border-b border-[var(--card-border)] pb-6">
                {selectedWallpaper.thumbnail && (
                  <img
                    src={`http://localhost:3001/api/wallpapers/${selectedWallpaper.id}/thumb`}
                    onError={(e) => e.target.style.display = 'none'}
                    alt={selectedWallpaper.title}
                    className="w-20 h-20 object-cover rounded-lg shadow-md"
                  />
                )}
                <h2 className="text-2xl font-bold">{selectedWallpaper.title}</h2>
              </div>

              <PresetManager wallpaperId={selectedWallpaper.id} />
            </div>
          </div>
        ) : (
          <WallpaperGrid
            wallpapers={wallpapers}
            onSelect={setSelectedWallpaper}
          />
        )}
      </main>

      <footer className="mt-12 text-center text-xs opacity-50 py-4 border-t border-[var(--card-border)]">
        Created by Moein using Gemini with <span className="text-red-500">♥</span>
      </footer>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
