const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const {
    log,
    getWallpapers,
    getMonitors,
    getWallpaperConfig,
    saveWallpaperConfig,
    getPresets,
    savePreset,
    deletePreset,
    getAppConfig,
    updateAppConfig
} = require('./lively-paths');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
    log(`${req.method} ${req.url}`);
    next();
});

// --- CONFIGURATION ENDPOINTS ---

app.get('/api/config', async (req, res) => {
    try {
        const config = await getAppConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/config', async (req, res) => {
    try {
        const { presetsDir } = req.body;
        if (!presetsDir) {
            return res.status(400).json({ error: 'presetsDir is required' });
        }
        const updated = await updateAppConfig({ presetsDir });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- WALLPAPER ENDPOINTS ---

// Get all wallpapers
app.get('/api/wallpapers', async (req, res) => {
    try {
        const wallpapers = await getWallpapers();
        res.json(wallpapers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve thumbnail
app.get('/api/wallpapers/:id/thumb', async (req, res) => {
    try {
        const wallpapers = await getWallpapers();
        const wp = wallpapers.find(w => w.id === req.params.id);
        if (wp && wp.thumbnail && fs.existsSync(wp.thumbnail)) {
            res.sendFile(wp.thumbnail);
        } else {
            res.status(404).send('Thumbnail not found');
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get monitors for a wallpaper
app.get('/api/wallpapers/:id/monitors', async (req, res) => {
    try {
        const monitors = await getMonitors(req.params.id);
        res.json(monitors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get config for a specific wallpaper
app.get('/api/wallpapers/:id/config', async (req, res) => {
    try {
        const monitorId = req.query.monitorId; // Optional query param
        const config = await getWallpaperConfig(req.params.id, monitorId);
        res.json(config);
    } catch (error) {
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Apply config (restore preset)
app.post('/api/wallpapers/:id/config', async (req, res) => {
    try {
        const { config, monitorId } = req.body;
        if (!config) return res.status(400).json({ error: 'Config is required' });
        if (!monitorId) return res.status(400).json({ error: 'Monitor ID is required' });

        await saveWallpaperConfig(req.params.id, config, monitorId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get presets for a wallpaper
app.get('/api/wallpapers/:id/presets', async (req, res) => {
    try {
        const presets = await getPresets(req.params.id);
        res.json(presets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save new preset
app.post('/api/wallpapers/:id/presets', async (req, res) => {
    try {
        const { name, config, monitorId } = req.body;
        if (!name) return res.status(400).json({ error: 'Preset name is required' });

        // If config is provided, use it. Otherwise, read current config from file.
        let configToSave = config;
        let sourceMonitor = monitorId;

        if (!configToSave) {
            // If we don't have config, we MUST have a monitorId to read from
            if (!monitorId) return res.status(400).json({ error: 'Monitor ID is required to read current config' });
            configToSave = await getWallpaperConfig(req.params.id, monitorId);
        }

        await savePreset(req.params.id, name, configToSave, sourceMonitor);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete preset
app.delete('/api/wallpapers/:id/presets/:name', async (req, res) => {
    try {
        await deletePreset(req.params.id, req.params.name);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- STATIC FILES CALL ---
// Serve static client files (after API routes)
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    log('Serving static files from', clientBuildPath);

    // Handle client-side routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    log('Client build not found at', clientBuildPath);
}

app.listen(PORT, () => {
    log(`Server running at http://localhost:${PORT}`);
});
