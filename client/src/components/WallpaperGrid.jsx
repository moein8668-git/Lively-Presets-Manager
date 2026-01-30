import React, { useState } from 'react'

export default function WallpaperGrid({ wallpapers, onSelect }) {
    if (wallpapers.length === 0) {
        return (
            <div className="text-center opacity-60 py-12">
                No wallpapers found. Make sure Lively Wallpaper is installed.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wallpapers.map(wp => (
                <div
                    key={wp.id}
                    onClick={() => onSelect(wp)}
                    className="group bg-[var(--card-bg)] rounded-lg overflow-hidden cursor-pointer border border-[var(--card-border)] hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="aspect-video bg-gray-800 relative overflow-hidden">
                        {wp.thumbnail ? (
                            <img
                                src={`http://localhost:3001/api/wallpapers/${wp.id}/thumb`}
                                alt={wp.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}

                        <div className={`absolute inset-0 flex items-center justify-center text-gray-500 bg-black/20 ${wp.thumbnail ? 'hidden' : 'flex'}`}>
                            <span>No Preview</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-lg group-hover:text-purple-500 transition-colors truncate">
                            {wp.title}
                        </h3>
                        <p className="text-xs opacity-50 mt-1 font-mono truncate">{wp.id}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
