#!/usr/bin/env node

import fs from 'fs';

import { Model } from '../source/ModelLoader.mjs';
import OBJFile from '../files/OBJFile.mjs';

function log(...str) {
    console.log('[INFO]', ...str);
}

const Commands = {

    async decompile(mapName) {
        if(!mapName)
            return log('Provide a map file.');

        const model = new Model();
        await model.loadMap(mapName);

        const obj = OBJFile.fromGeometry(model.geometry);

        log(model.name, 'decompiled.');

        fs.writeFileSync(model.name + '.obj', obj);

        return model;
    }

}

function main(command, args) {
    if(Commands[command]) {
        Commands[command](...args);
    } else {
        log('Commands:', Object.keys(Commands).join(", "));
    }
}

const command = process.argv.slice(2)[0];
const args = process.argv.slice(3);

main(command, args);
