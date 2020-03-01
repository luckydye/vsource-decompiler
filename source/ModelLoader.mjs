import { VVDFile, BSPFile, VPKFile, MDLFile, VMTFile, VTFFile, VTXFile } from '../index.mjs';

import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import Zip from 'node-zip';

class VirtualFileSystem {
    constructor() {
        // use this in the future   
    }
}

let pakfile;
let resourceRoot = "csgo/";
let resourcePool = null;

const walkSync = function(dir, filelist) {
    const files = fs.readdirSync(dir);
    filelist = filelist || {};
    files.forEach(function(file) {
        if (fs.statSync(dir + "\\" + file).isDirectory()) {
            filelist = walkSync(dir + '\\' + file + '/', filelist);
        } else {
            filelist[file.toLocaleLowerCase()] = dir + "\\" + file;
        }
    });
    return filelist;
};

async function fetchResource(resource) {
    return new Promise((resolve, reject) => {

        if(!resourcePool) {
            resourcePool = walkSync(path.resolve(resourceRoot));
        }

        const filePathParts = resource.split(/\/|\\/g);
        const fileName = filePathParts[filePathParts.length-1].toLocaleLowerCase();

        // look in the pakfile
        if(pakfile) {
            const entries = Object.keys(pakfile.files);

            for(let entry of entries) {
                if(entry.match(fileName)) {
                    resolve({ 
                        file: pakfile.files[entry].asNodeBuffer(), 
                        arrayBuffer() {
                            return this.file.buffer;
                        }
                    });
                    break;
                }
            }
        }

        // else look in filesystem
        if(fileName in resourcePool) {

            const file = fs.readFile(resourcePool[fileName], (err, data) => {
                if(!err) {
                    resolve({ 
                        file: data, 
                        arrayBuffer() {
                            return this.file.buffer;
                        }
                    });
                } else {
                    throw new Error('Error loading file: ' + err);
                }
            });

        } else {
            throw new Error('Resource File not found: ' + fileName);
        }
    })
}

const propTypes = new Map();

export class Model {

    static get resourceRoot() {
        return resourceRoot;
    }

    static set resourceRoot(val) {
        resourceRoot = val;
    }

    static async loadMap(bspMapName) {
        const mapPath = `${bspMapName}.bsp`;
        console.log('Loading map', mapPath);

        return fetchResource(mapPath).then(async res => {
            const arrayBuffer = await res.arrayBuffer();

            const bsp = BSPFile.fromDataArray(arrayBuffer);
            const meshData = bsp.convertToMesh();

            return { meshData, bsp };
        })
    }

    static loadVPK(vpkPath) {
        const load = async () => {
            const vpkFetch = await fetchResource(vpkPath);
            const vpkData = await vpkFetch.arrayBuffer();
            const vpk = VPKFile.fromDataArray(vpkData);
            return vpk;
        }
        return load();
    }

    static async loadProp(propType) {

        const propMDLPath = propType.mdlPath;
        const propVVDPath = propType.vvdPath;

        const prop = {};

        // mdl
        const mdlFile = await fetchResource(propMDLPath);
        const mdl = MDLFile.fromDataArray(await mdlFile.arrayBuffer());

        // only use first texture for now
        const texPath = mdl.textures[0].path;

        const vmtFile = await fetchResource(`${texPath}.vmt`);
        const vmt = VMTFile.fromDataArray(await vmtFile.arrayBuffer());
        prop.material = vmt;

        const vtfFile = await fetchResource(`${texPath}.vtf`);
        const vtf = VTFFile.fromDataArray(await vtfFile.arrayBuffer());
        prop.texture = vtf;

        const vvdFile = await fetchResource(propVVDPath);
        const vvd = VVDFile.fromDataArray(await vvdFile.arrayBuffer());
        const vertecies = vvd.convertToMesh();

        const vtxFile = await fetchResource(propVVDPath.replace('.vvd', '.dx90.vtx'));
        const vtx = VTXFile.fromDataArray(await vtxFile.arrayBuffer());

        const realVertecies = vtx.vertexIndecies;
        const realIndecies = vtx.indecies;

        prop.vertecies = realVertecies.map(rv => {
            return vertecies[rv];
        });
        prop.indecies = realIndecies;

        return prop;
    }

    constructor(name = "unknown") {
        this.geometry = new Set();
        this.name = name;
    }
    
    registerProp(prop) {
        if(!propTypes.has(prop.PropType)) {

            const nameParts = prop.PropType.split("/");

            propTypes.set(prop.PropType, {
                name: nameParts[nameParts.length-1].replace('.mdl', ''),
                mdlPath: prop.PropType,
                vvdPath: prop.PropType.replace('.mdl', '.vvd'),
                listeners: [],
            });
        }
    }

    getPropType(prop) {
        return prop.PropType;
    }

    loadMapTextures(textureArray) {
        return new Promise(async (resolve, reject) => {
            const textures = new Map();
            
            for(let texture of textureArray) {

                const resPath = `${texture.toLocaleLowerCase()}.vmt`;
                const vmtFile = await fetchResource(resPath);
                const vmt = VMTFile.fromDataArray(await vmtFile.arrayBuffer());

                if(vmt && vmt.data.lightmappedgeneric) {
                    const materialTexture = vmt.data.lightmappedgeneric['$basetexture'];

                    if(materialTexture) {
                        const resPath = `${materialTexture.toLocaleLowerCase()}.vtf`;
                        await fetchResource(resPath).then(async res => {
                            const vtf = VTFFile.fromDataArray(await res.arrayBuffer());
                            textures.set(texture, vtf);
                        }).catch(err => console.error('Missing map texture ' + resPath));
                    }
                }
                if(vmt && vmt.data.worldvertextransition) {
                    const materialTexture = vmt.data.worldvertextransition['$basetexture'];

                    if(materialTexture) {
                        const resPath = `${materialTexture.toLocaleLowerCase()}.vtf`;
                        await fetchResource(resPath).then(async res => {
                            const vtf = VTFFile.fromDataArray(await res.arrayBuffer());
                            textures.set(texture, vtf);
                        }).catch(err => console.error('Missing map texture ' + resPath));
                    }
                }

                // want to check if texture loaded correctly? check with "!textures.has(texture)"
            }

            resolve(textures);
        })
    }

    async loadMap(mapName) {

        this.name = mapName;

        const bsp = await Model.loadMap(mapName);

        console.log('Reading pakfile.');
        pakfile = new Zip(Buffer.from(bsp.bsp.pakfile.buffer));

        console.log('Load map textures.');
        // const textures = await this.loadMapTextures(bsp.bsp.textures);
        const textures = new Map();

        // world
        const meshData = bsp.meshData;

        this.geometry.add({
            name: mapName,
            vertecies: meshData.vertecies.map(vert => ([
                vert.vertex[0], vert.vertex[1], vert.vertex[2],
                vert.uv[0], vert.uv[1], vert.uv[2],
                vert.normal[0], vert.normal[1], vert.normal[2]
            ])).flat(),
            indecies: meshData.indecies,
            materials: meshData.textures.map(tex => {
                const vtf = textures.get(tex);
                if(vtf) {
                    return {
                        format: vtf.format, 
                        data: vtf.imageData
                    };
                } else {
                    return {};
                }
            }),
            scale: [1, 1, 1],
            origin: [0, 0, 0],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
        });

        console.log('Load map props.');
        await this.loadMapProps(bsp.bsp.gamelumps.sprp);
    }

    async loadMapProps(props) {
        return new Promise((resolve, reject) => {
            for(let prop of props) {

                if(!prop.PropType) {
                    throw new Error('Error decompiling prop gamelump.');
                    continue;
                }

                this.registerProp(prop);

                const type = propTypes.get(this.getPropType(prop));

                type.listeners.push(propData => {

                    const mat = () => {
                        if(propData.texture) {
                            return {
                                format: propData.texture.format,
                                data: propData.texture.imageData
                            }
                        } else {
                            return {
                                format: null,
                                data: null,
                            };
                        }
                    }

                    const propGeometry = {
                        name: type.name,
                        vertecies: propData.vertecies.flat(),
                        indecies: propData.indecies,
                        materials: [ mat() ],
                        scale: [1, 1, 1],
                        origin: [0, 0, 0],
                        position: [
                            -prop.Origin.data[0].data,
                            prop.Origin.data[2].data,
                            prop.Origin.data[1].data,
                        ],
                        rotation: [
                            prop.Angles.data[0].data * Math.PI / 180,
                            prop.Angles.data[1].data * Math.PI / 180,
                            prop.Angles.data[2].data * Math.PI / 180,
                        ],
                    };
                    
                    this.geometry.add(propGeometry);
                });
            }

            let propCounter = 0;

            for(let [_, propType] of propTypes) {

                Model.loadProp(propType).then(p => {
                    for(let listener of propType.listeners) {
                        listener(p);
                    }
                    
                }).catch(err => {
                    console.error(chalk.red('Failed to load prop: ' + propType.mdlPath));
                    console.log(err);
                    
                }).finally(() => {
                    propCounter++;

                    process.stdout.cursorTo(0);
                    process.stdout.write(`Loaded props ${propCounter.toString()} / ${propTypes.size.toString()}`);
                    
                    if(propCounter == propTypes.size) {
                        resolve();
                        process.stdout.write(`\n`);
                    }
                })
            }
        })
    }

}
