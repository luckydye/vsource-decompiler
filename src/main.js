import BSPFile from './BSPFile.js';

async function start() {
    const req = await fetch('../res/ar_shoots.bsp');

    const startParse = performance.now();

    const bsp = new BSPFile(await req.arrayBuffer());

    console.log(bsp);
    console.log('File read in', performance.now() - startParse, 'ms');
}

start();
