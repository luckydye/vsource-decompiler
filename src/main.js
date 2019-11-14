import BSPFile from './BSPFile.js';

async function start() {
    const req = await fetch('../res/ar_shoots.bsp');
    const bsp = new BSPFile(await req.arrayBuffer());

    console.log(bsp);
}

start();
