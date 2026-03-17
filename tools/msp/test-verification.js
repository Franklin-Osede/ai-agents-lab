const { spawn } = require('child_process');
const http = require('http');

const SERVER_PORT = 3333;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCli(args) {
    return new Promise((resolve, reject) => {
        const cli = spawn('node', ['tools/msp/cli.js', ...args]);
        let output = '';
        cli.stdout.on('data', data => output += data.toString());
        cli.stderr.on('data', data => output += data.toString());
        cli.on('close', code => resolve({ code, output }));
    });
}

async function test() {
    console.log('Starting MSP Server...');
    const server = spawn('node', ['tools/msp/server.js'], { detached: false });
    server.stdout.on('data', d => console.log('SERVERLOG:', d.toString().trim()));

    await sleep(2000); // Wait for boot

    try {
        console.log('Test 1: Create Feature "auth"');
        let res = await runCli(['new', 'auth']);
        console.log(res.output);

        console.log('Test 2: Try to start Frontend "auth" (Should FAIL)');
        res = await runCli(['start', 'frontend', 'auth']);
        console.log(res.output);
        if (!res.output.includes('VIOLATION')) throw new Error('Failed to block Frontend start');

        console.log('Test 3: Start Backend "auth"');
        res = await runCli(['start', 'backend', 'auth']);
        console.log(res.output);

        console.log('Test 4: Complete Backend "auth"');
        res = await runCli(['complete', 'backend', 'auth']);
        console.log(res.output);

        console.log('Test 5: Try to start Frontend "auth" (Should SUCCEED)');
        res = await runCli(['start', 'frontend', 'auth']);
        console.log(res.output);
        if (res.output.includes('VIOLATION')) throw new Error('Blocked valid Frontend start');

        console.log('SUCCESS: All checks passed.');
    } catch (e) {
        console.error('TEST FAILED:', e);
    } finally {
        server.kill();
        process.exit(0);
    }
}

test();
