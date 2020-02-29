import { Model } from '../source/ModelLoader.mjs';
import OBJFile from '../files/OBJFile.mjs';

import fs from 'fs';

const args = process.argv.slice(2);

function log(...str) {
    console.log('[INFO]', ...str);
}

async function main(mapname) {

    if(!mapname)
        return log('Provide a map file.');

    const model = new Model();
    await model.loadMap(mapname);

    const obj = OBJFile.fromGeometry(model.geometry);

    console.log(model.name, 'loaded.');

    fs.writeFileSync(model.name + '.obj', obj);

    return model;
}

main(args[0]);
