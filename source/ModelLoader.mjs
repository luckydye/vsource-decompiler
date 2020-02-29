import { VVDFile, BSPFile, VPKFile, MDLFile, VMTFile, VTFFile, VTXFile } from '../index.mjs';

import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

async function fetch(resourcePath) {
    return new Promise((resolve, reject) => {

        const filePath = path.resolve(resourcePath);

        if(fs.existsSync(filePath)) {

            const file = fs.readFile(path.resolve(filePath), (err, data) => {
                if(!err) {
                    resolve({ 
                        file: data, 
                        status: 200,
                        arrayBuffer() {
                            return this.file.buffer;
                        }
                    });
                } else {
                    throw new Error('Error loading file: ' + err);
                }
            });

        } else {
            throw new Error('File not found: ' + filePath);
        }
    })
}

const propTypes = new Map();

export class Model {

    static resourceRoot = "csgo/";

    static directories = {
        get root() { 
            return Model.resourceRoot;
        },
        set root(val) { 
            Model.resourceRoot = val;
        },
        get maps() {
            return this.root + '/maps/';
        },
        get models() {
            return this.root + '/models/';
        },
        get materials() {
            return this.root + '/materials/';
        },
    }

    static async loadMap(bspMapName) {
        const mapPath = `${Model.directories.maps}${bspMapName}.bsp`;
        return fetch(mapPath).then(async res => {
            const arrayBuffer = await res.arrayBuffer();

            const bsp = BSPFile.fromDataArray(arrayBuffer);
            const meshData = bsp.convertToMesh();

            return { meshData, bsp };
        })
    }

    static loadVPK(vpkPath) {
        const load = async () => {
            const vpkFetch = await fetch(vpkPath);
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
        const mdl = await fetch(Model.directories.root + propMDLPath).then(async res => {
            if(res.status !== 200) return;
            return MDLFile.fromDataArray(await res.arrayBuffer());
        }).catch(err => {
            throw new Error('Could not load MDL file. ' + err);
        });

        const textures = [];

        // only use first texture for now

        const texPath = mdl.textures[0].path;

        const vmt = await fetch(`${Model.directories.materials}${texPath}.vmt`).then(async res => {
            if(res.status == 200) {
                return VMTFile.fromDataArray(await res.arrayBuffer());
            }
        }).catch(err => {
            throw new Error('Could not load VMT file. ' + err);
        });

        prop.material = vmt;

        const vtf = await fetch(`${Model.directories.materials}${texPath}.vtf`).then(async res => {
            if(res.status == 200) {
                return VTFFile.fromDataArray(await res.arrayBuffer());
            }
        }).catch(err => {
            throw new Error('Could not load VTF file. ' + err);
        });

        prop.texture = vtf;
        
        const vtx = await fetch(Model.directories.root + propVVDPath.replace('.vvd', '.dx90.vtx')).then(async res => {
            if(res.status !== 200) return;
            return VTXFile.fromDataArray(await res.arrayBuffer());
        }).catch(err => {
            throw new Error('Could not load VTX file. ' + err);
        });
        
        const vdd = await fetch(Model.directories.root + propVVDPath).then(async res => {
            if(res.status !== 200) return;

            const vvd = VVDFile.fromDataArray(await res.arrayBuffer());
            const vertecies = vvd.convertToMesh();

            const realVertecies = vtx.vertexIndecies;
            const realIndecies = vtx.indecies;

            prop.vertecies = realVertecies.map(rv => {
                return vertecies[rv];
            });
            prop.indecies = realIndecies;

            return prop;
        }).catch(err => {
            throw new Error('Could not load VVD file. ' + err);
        });

        return vdd;
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

                const resPath = `${Model.directories.materials}${texture.toLocaleLowerCase()}.vmt`;
                const vmt = await fetch(resPath).then(async res => {
                    if(res.status == 200) {
                        const dataArray = await res.arrayBuffer();
                        return VMTFile.fromDataArray(dataArray);
                    }
                }).catch(err => console.error('Missing map texture ' + texture.toLocaleLowerCase() + ".vmt"));

                if(vmt && vmt.data.lightmappedgeneric) {
                    const materialTexture = vmt.data.lightmappedgeneric['$basetexture'];

                    if(materialTexture) {
                        const resPath = `${Model.directories.materials}${materialTexture.toLocaleLowerCase()}.vtf`;
                        await fetch(resPath).then(async res => {
                            if(res.status == 200) {
                                const dataArray = await res.arrayBuffer();
                                const vtf = VTFFile.fromDataArray(dataArray);
                                
                                textures.set(texture, vtf);
                            }
                        }).catch(err => console.error('Missing map texture ' + resPath));
                    }
                }
                if(vmt && vmt.data.worldvertextransition) {
                    const materialTexture = vmt.data.worldvertextransition['$basetexture'];

                    if(materialTexture) {
                        const resPath = `${Model.directories.materials}${materialTexture.toLocaleLowerCase()}.vtf`;
                        await fetch(resPath).then(async res => {
                            if(res.status == 200) {
                                const dataArray = await res.arrayBuffer();
                                const vtf = VTFFile.fromDataArray(dataArray);
                                
                                textures.set(texture, vtf);
                            }
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

        const textures = await this.loadMapTextures(bsp.bsp.textures);

        // world
        const meshData = bsp.meshData;

        const vertexData = {
            vertecies: meshData.vertecies.map(vert => ([
                vert.vertex[0], vert.vertex[1], vert.vertex[2],
                vert.uv[0], vert.uv[1], vert.uv[2],
                vert.normal[0], vert.normal[1], vert.normal[2]
            ])).flat(),
            indecies: meshData.indecies
        };

        this.geometry.add({
            name: mapName,
            vertecies: vertexData.vertecies,
            indecies: vertexData.indecies,
            materials: meshData.textures.map(tex => {
                const vtf = textures.get(tex);
                if(vtf) {
                    return {
                        format: vtf.format, 
                        data: vtf.imageData
                    };
                }
            }),
            scale: [1, 1, 1],
            origin: [0, 0, 0],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
        });

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
                        material: mat(),
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
                    if(propCounter == propTypes.size) resolve();
                })
            }
        })
    }

}
