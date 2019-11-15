import BSPFile from './BSPFile.js';

async function start() {
    const req = await fetch('../res/ar_shoots.bsp');
    // const req = await fetch('../res/de_dust2.bsp');

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

    canvas.width = 1280;
    canvas.height = 1280;

    const verts = bsp.vertecies;

    const c = [
        canvas.width / 2,
        canvas.height / 2 - 100,
    ];

    const s = 0.15;

    ctx.fillStyle = `rgba(255, 255, 255, 1)`;
    ctx.strokeStyle = `rgba(255, 255, 255, 1)`;
    ctx.lineWidth = 0.15;

    for(let vert of verts) {
        ctx.lineTo(
            c[0] + vert.x * s, 
            c[1] + vert.y * s
        );
    }

    ctx.stroke();

    document.body.appendChild(canvas);
}

start();
