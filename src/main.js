import BSPFile from './BSPFile.js';

async function start() {
    const req = await fetch('../res/ar_shoots.bsp');

    const startParse = performance.now();

    const bsp = BSPFile.fromDataArray(await req.arrayBuffer());

    window.bsp = bsp;

    console.log(bsp);
    console.log('File read in', performance.now() - startParse, 'ms');

    draw2dMap(bsp);
}

function draw2dMap(bsp) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 400;
    canvas.height = 400;

    const verts = bsp.vertecies;

    ctx.fillStyle = "#eee";

    const c = [
        canvas.width / 2,
        canvas.height / 2,
    ];

    const s = 20;

    for(let vert of verts) {
        ctx.fillRect(
            c[0] + vert.x * s, 
            c[1] + vert.y * s, 
            1, 
            1
        );
    }

    document.body.appendChild(canvas);
}

start();
