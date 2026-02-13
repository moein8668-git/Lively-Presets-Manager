const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Configuration file for the app (stores presets location)
const CONFIG_FILE = path.join(__dirname, 'config.json');
const DEFAULT_PRESETS_DIR = path.join(__dirname, 'presets');

// --- LOGGING ---
const log = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${message}`;
    console.log(logMsg);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
};

// --- APP CONFIGURATION ---

const getAppConfig = async () => {
    try {
        if (await fs.pathExists(CONFIG_FILE)) {
            return await fs.readJson(CONFIG_FILE);
        }
    } catch (e) {
        log('Error reading config:', e);
    }
    return { presetsDir: DEFAULT_PRESETS_DIR };
};

const updateAppConfig = async (newConfig) => {
    const current = await getAppConfig();
    const updated = { ...current, ...newConfig };
    await fs.writeJson(CONFIG_FILE, updated, { spaces: 2 });
    log('App config updated', updated);
    return updated;
};

const getPresetsDir = async () => {
    const config = await getAppConfig();
    return config.presetsDir || DEFAULT_PRESETS_DIR;
};

// --- LIVELY PATHS ---

// Helper to resolve Lively paths
const getLivelyPaths = () => {
    const localAppData = process.env.LOCALAPPDATA;

    // 1. Try EXE / portable version first
    const exePath = path.join(localAppData, 'Lively Wallpaper');
    if (fs.existsSync(exePath)) {
        return {
            wallpapersDir: path.join(exePath, 'Library', 'wallpapers'),
            saveDataDir: path.join(exePath, 'Library', 'SaveData', 'wpdata')
        };
    }

    // 2. Fallback to Microsoft Store version
    const baseX = path.join(localAppData, 'Packages');
    if (fs.existsSync(baseX)) {
        const dirs = fs.readdirSync(baseX);
        const found = dirs.find(d => d.startsWith('12030rocksdanister.LivelyWallpaper'));
        if (found) {
            const livelyDir = path.join(baseX, found, 'LocalCache', 'Local', 'Lively Wallpaper');
            return {
                wallpapersDir: path.join(livelyDir, 'Library', 'wallpapers'),
                saveDataDir: path.join(livelyDir, 'Library', 'SaveData', 'wpdata')
            };
        }
    }

    const err = 'Lively Wallpaper directory not found.';
    log(err);
    throw new Error(err);
};

// Get list of installed wallpapers
const getWallpapers = async () => {
    try {
        const { wallpapersDir, saveDataDir } = getLivelyPaths();

        if (!fs.existsSync(wallpapersDir)) {
            log('Wallpapers directory not found', wallpapersDir);
            return [];
        }

        const folders = await fs.readdir(wallpapersDir);
        const wallpapers = [];

        for (const folder of folders) {
            const infoPath = path.join(wallpapersDir, folder, 'LivelyInfo.json');

            if (fs.existsSync(infoPath)) {
                try {
                    const info = await fs.readJson(infoPath);

                    // Resolve thumbnail path from info or default
                    let thumbPath = null;
                    if (info.Thumbnail) {
                        const customThumb = path.join(wallpapersDir, folder, info.Thumbnail);
                        if (fs.existsSync(customThumb)) thumbPath = customThumb;
                    }
                    if (!thumbPath) {
                        const defaultThumb = path.join(wallpapersDir, folder, 'thumbnail.jpg');
                        if (fs.existsSync(defaultThumb)) thumbPath = defaultThumb;
                    }

                    // Check if it has a corresponding SaveData folder
                    const saveFolder = path.join(saveDataDir, folder);
                    const hasConfig = fs.existsSync(saveFolder);

                    if (hasConfig) {
                        wallpapers.push({
                            id: folder,
                            title: info.Title || folder,
                            thumbnail: thumbPath, // Absolute path to the file
                            info: info
                        });
                    }
                } catch (e) {
                    log(`Error reading info for ${folder}:`, e);
                }
            }
        }
        return wallpapers;
    } catch (error) {
        log("Failed to get wallpapers:", error);
        return [];
    }
};

// Get available monitors for a wallpaper
const getMonitors = async (id) => {
    try {
        const { saveDataDir } = getLivelyPaths();
        const wallpaperSaveDir = path.join(saveDataDir, id);

        if (!await fs.pathExists(wallpaperSaveDir)) {
            return [];
        }

        const entries = await fs.readdir(wallpaperSaveDir, { withFileTypes: true });
        // Monitors are directories inside the wallpaper's save data folder
        const monitors = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        return monitors;
    } catch (error) {
        log(`Failed to get monitors for ${id}:`, error);
        return [];
    }
};

// Get configuration for a wallpaper (current state)
const getWallpaperConfig = async (id, monitorId = null) => {
    const { saveDataDir } = getLivelyPaths();
    const wallpaperSaveDir = path.join(saveDataDir, id);

    if (!await fs.pathExists(wallpaperSaveDir)) {
        throw new Error('Configuration folder not found for this wallpaper.');
    }

    let targetMonitor = monitorId;

    // If no specific monitor requested, try to find a default
    if (!targetMonitor) {
        const monitors = await getMonitors(id);
        if (monitors.includes('1')) {
            targetMonitor = '1';
        } else if (monitors.length > 0) {
            targetMonitor = monitors[0];
        } else {
            throw new Error('No monitor configurations found.');
        }
    }

    const configPath = path.join(wallpaperSaveDir, targetMonitor, 'LivelyProperties.json');

    if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not found for monitor ${targetMonitor}.`);
    }

    log(`Reading config for ${id} on monitor ${targetMonitor}`);
    return await fs.readJson(configPath);
};

// Apply configuration to Lively
const saveWallpaperConfig = async (id, config, monitorId) => {
    const { saveDataDir } = getLivelyPaths();
    const wallpaperSaveDir = path.join(saveDataDir, id);

    if (!monitorId) {
        throw new Error('Monitor ID is required to apply configuration.');
    }

    const configPath = path.join(wallpaperSaveDir, monitorId, 'LivelyProperties.json');

    await fs.ensureDir(path.dirname(configPath));
    await fs.writeJson(configPath, config, { spaces: 2 });
    log(`Applied config to ${id} on monitor ${monitorId}`);
};

// --- PRESETS HANDLING ---

const getPresetsForWallpaper = async (wallpaperId) => {
    const presetsDir = await getPresetsDir();
    await fs.ensureDir(presetsDir);

    const wallpaperPresetsFile = path.join(presetsDir, `${wallpaperId}.json`);

    if (!await fs.pathExists(wallpaperPresetsFile)) {
        return [];
    }

    try {
        return await fs.readJson(wallpaperPresetsFile);
    } catch (e) {
        log('Error reading presets file:', e);
        return [];
    }
};

const savePreset = async (wallpaperId, presetName, configData, sourceMonitorId) => {
    const presetsDir = await getPresetsDir();
    await fs.ensureDir(presetsDir);

    const wallpaperPresetsFile = path.join(presetsDir, `${wallpaperId}.json`);
    let currentPresets = [];

    if (await fs.pathExists(wallpaperPresetsFile)) {
        currentPresets = await fs.readJson(wallpaperPresetsFile);
    }

    const existingIndex = currentPresets.findIndex(p => p.name === presetName);
    const newPreset = {
        id: Date.now().toString(),
        name: presetName,
        config: configData,
        sourceMonitor: sourceMonitorId,
        updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        currentPresets[existingIndex] = {
            ...currentPresets[existingIndex],
            ...newPreset,
            id: currentPresets[existingIndex].id
        };
    } else {
        currentPresets.push(newPreset);
    }

    await fs.writeJson(wallpaperPresetsFile, currentPresets, { spaces: 2 });
    log(`Saved preset "${presetName}" for ${wallpaperId}`);
};

const deletePreset = async (wallpaperId, presetName) => {
    const presetsDir = await getPresetsDir();
    const wallpaperPresetsFile = path.join(presetsDir, `${wallpaperId}.json`);

    if (await fs.pathExists(wallpaperPresetsFile)) {
        let currentPresets = await fs.readJson(wallpaperPresetsFile);
        currentPresets = currentPresets.filter(p => p.name !== presetName);
        await fs.writeJson(wallpaperPresetsFile, currentPresets, { spaces: 2 });
        log(`Deleted preset "${presetName}" from ${wallpaperId}`);
    }
};

module.exports = {
    log,
    getAppConfig,
    updateAppConfig,
    getWallpapers,
    getMonitors,
    getWallpaperConfig,
    saveWallpaperConfig,
    getPresets: getPresetsForWallpaper,
    savePreset,
    deletePreset
};
