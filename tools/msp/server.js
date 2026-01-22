const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3333;
const STATE_FILE = path.join(__dirname, '../../msp-state.json');

app.use(express.json());

// Initialize state if not exists
if (!fs.existsSync(STATE_FILE)) {
    const initialState = {
        features: {},
        currentFocus: null
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2));
}

function readState() {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function writeState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Get full state
app.get('/state', (req, res) => {
    res.json(readState());
});

// Create or update a feature
app.post('/feature', (req, res) => {
    const { name, description } = req.body;
    const state = readState();
    
    if (!state.features[name]) {
        state.features[name] = {
            description,
            backend: 'PENDING',
            frontend: 'PENDING',
            createdAt: new Date().toISOString()
        };
    }
    
    state.currentFocus = name;
    writeState(state);
    res.json({ message: `Feature '${name}' created/selected`, state: state.features[name] });
});

// Update status
app.post('/feature/:name/status', (req, res) => {
    const { name } = req.params;
    const { side, status } = req.body; // side: 'backend' | 'frontend', status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE'
    const state = readState();

    if (!state.features[name]) {
        return res.status(404).json({ error: 'Feature not found' });
    }

    // RULE: Cannot start Frontend if Backend is not COMPLETE
    if (side === 'frontend' && status === 'IN_PROGRESS') {
        if (state.features[name].backend !== 'COMPLETE') {
            return res.status(400).json({ 
                error: 'VIOLATION: Backend must be COMPLETE before starting Frontend.',
                currentBackendStatus: state.features[name].backend
            });
        }
    }

    state.features[name][side] = status;
    
    // Auto-update focus
    state.currentFocus = name;
    
    writeState(state);
    res.json({ message: `Updated ${name} ${side} to ${status}`, feature: state.features[name] });
});

app.listen(PORT, () => {
    console.log(`MSP Server running on http://localhost:${PORT}`);
    console.log('Use via CLI: npm run msp');
});
