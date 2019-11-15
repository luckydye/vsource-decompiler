import BSPFile from './BSPFile.js';

async function start() {
    const req = await fetch('../res/ar_shoots.bsp');

    const startParse = performance.now();

    const bsp = BSPFile.fromDataArray(await req.arrayBuffer());

    window.bsp = bsp;

    console.log(bsp);
    console.log('File read in', performance.now() - startParse, 'ms');
}

start();
