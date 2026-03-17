const http = require('http');

const SERVER_URL = 'http://localhost:3333';

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3333,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(JSON.parse(data));
                }
            });
        });

        req.on('error', (e) => reject({ error: 'Server not reachable. Is MSP running? (npm run msp:start)' }));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

const args = process.argv.slice(2);
const command = args[0];

async function main() {
    try {
        if (!command || command === 'status') {
            const state = await request('GET', '/state');
            console.log('\n--- MSP Project State ---');
            console.log('Current Focus:', state.currentFocus || 'None');
            console.log('Features:');
            Object.keys(state.features).forEach(name => {
                const f = state.features[name];
                const marker = name === state.currentFocus ? '*' : ' ';
                console.log(`${marker} [${name}]: Backend[${f.backend}] | Frontend[${f.frontend}]`);
            });
            console.log('-------------------------\n');
        } 
        else if (command === 'new') {
            const name = args[1];
            if (!name) return console.error('Usage: msp new <feature-name>');
            await request('POST', '/feature', { name });
            console.log(`Feature '${name}' initialised.`);
        }
        else if (command === 'start') {
            const side = args[1]; // backend | frontend
            const feature = args[2]; // optional if focus exists
            
            // Need to fetch state to know current focus if feature not provided
            let targetFeature = feature;
            if (!targetFeature) {
                const state = await request('GET', '/state');
                targetFeature = state.currentFocus;
            }

            if (!targetFeature) return console.error('No feature specified and no current focus.');
            if (!['backend', 'frontend'].includes(side)) return console.error('Usage: msp start <backend|frontend> [feature]');

            const res = await request('POST', `/feature/${targetFeature}/status`, { side, status: 'IN_PROGRESS' });
            console.log(res.message);
        }
        else if (command === 'complete') {
            const side = args[1]; // backend | frontend
            const feature = args[2];
            
             // Need to fetch state to know current focus if feature not provided
             let targetFeature = feature;
             if (!targetFeature) {
                 const state = await request('GET', '/state');
                 targetFeature = state.currentFocus;
             }
 
             if (!targetFeature) return console.error('No feature specified and no current focus.');
             if (!['backend', 'frontend'].includes(side)) return console.error('Usage: msp complete <backend|frontend> [feature]');
 
             const res = await request('POST', `/feature/${targetFeature}/status`, { side, status: 'COMPLETE' });
             console.log(res.message);
        }
        else {
            console.log('Unknown command. Available: status, new, start, complete');
        }
    } catch (err) {
        console.error('Error:', err.error || err);
    }
}

main();
