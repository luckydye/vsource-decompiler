import { VVDFile, BSPFile, VPKFile, MDLFile, VMTFile, VTFFile, VTXFile } from '../index.mjs';

import path from 'path';
import fs from 'fs';

async function fetch(resourcePath) {
    return new Promise((resolve, reject) => {
        const file = fs.readFileSync(path.resolve('res', resourcePath));

        resolve({ 
            file, 
            status: 200,
            arrayBuffer() {
                return file.buffer;
            }
        });
    })
}

class SourceDecoder {

    directories = {
        maps: ['/maps'],
        models: ['/models'],
        materials: ['/materials/models', '/materials'],
    }
    
    target_folders = [ "materials", "models", "particles", "scenes" ];
    file_types = [ "vmt", "vtf", "mdl", "phy", "vtx", "vvd", "pcf" ];

    static async loadMap(bspMapPath) {
        return fetch(bspMapPath).then(async res => {
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

        const prop = {};

        // mdl
        const mdl = await fetch('../res/' + propType).then(async res => {
            if(res.status !== 200) return;
            
            const arrayBuffer = await res.arrayBuffer();
            const mdl = MDLFile.fromDataArray(arrayBuffer);

            return mdl;
        });

        const textures = [];

        const path = propType.split("/");
        path[path.length-1] = mdl.textures[0].name.data + ".vmt";
        const texPath = path.slice(1).join("/");

        const vmt = await fetch(`../res/materials/models/${texPath.toLocaleLowerCase()}`).then(async res => {
            if(res.status == 200) {
                const dataArray = await res.arrayBuffer();
                return VMTFile.fromDataArray(dataArray);
            }
        });

        prop.material = vmt;

        const vtf = await fetch(`../res/materials/models/${texPath.toLocaleLowerCase().replace('.vmt', '.vtf')}`).then(async res => {
            if(res.status == 200) {
                const dataArray = await res.arrayBuffer();
                return VTFFile.fromDataArray(dataArray);
            }
        });

        prop.texture = vtf;
        
        const vtx = await fetch('../res/' + propType.replace('.mdl', '.dx90.vtx')).then(async res => {
            if(res.status !== 200) return;
            const arrayBuffer = await res.arrayBuffer();
            return VTXFile.fromDataArray(arrayBuffer);
        });
        
        const vdd = await fetch('../res/' + propType.replace('.mdl', '.vvd')).then(async res => {
            if(res.status !== 200) return;

            const arrayBuffer = await res.arrayBuffer();

            const vvd = VVDFile.fromDataArray(arrayBuffer);
            const vertecies = vvd.convertToMesh();

            const realVertecies = vtx.vertexIndecies;
            const realIndecies = vtx.indecies;

            prop.vertecies = realVertecies.map(rv => {
                return vertecies[rv];
            });
            prop.indecies = realIndecies;

            return prop;
        });

        return vdd;
    }

}

const propTypes = new Map();

export class Model {

    static async getMap(mapName) {
        return SourceDecoder.loadMap('../res/maps/' + mapName + '.bsp');
    }

    static async getProp(propName) {
        return SourceDecoder.loadProp('../res/models/' + propName + '.mdl');
    }

    constructor(name = "unknown") {
        this.geometry = new Set();
        this.name = name;
    }
    
    registerProp(prop) {
        if(prop.PropType)
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

    loadTextures(textureArray) {
        return new Promise(async (resolve, reject) => {
            const textures = new Map();
            
            for(let texture of textureArray) {
                const resPath = `../res/materials/${texture.toLocaleLowerCase()}.vmt`;
                const vmt = await fetch(resPath).then(async res => {
                    if(res.status == 200) {
                        const dataArray = await res.arrayBuffer();
                        return VMTFile.fromDataArray(dataArray);
                    }
                }).catch(err => console.error('Missing file ' + resPath));

                if(vmt && vmt.data.lightmappedgeneric) {
                    const materialTexture = vmt.data.lightmappedgeneric['$basetexture'];

                    if(materialTexture) {
                        const resPath = `../res/materials/${materialTexture.toLocaleLowerCase()}.vtf`;
                        await fetch(resPath).then(async res => {
                            if(res.status == 200) {
                                const dataArray = await res.arrayBuffer();
                                const vtf = VTFFile.fromDataArray(dataArray);
                                
                                textures.set(texture, vtf);
                            }
                        }).catch(err => console.error('Missing file ' + resPath));
                    }
                }
                if(vmt && vmt.data.worldvertextransition) {
                    const materialTexture = vmt.data.worldvertextransition['$basetexture'];

                    if(materialTexture) {
                        const resPath = `../res/materials/${materialTexture.toLocaleLowerCase()}.vtf`;
                        await fetch(resPath).then(async res => {
                            if(res.status == 200) {
                                const dataArray = await res.arrayBuffer();
                                const vtf = VTFFile.fromDataArray(dataArray);
                                
                                textures.set(texture, vtf);
                            }
                        }).catch(err => console.error('Missing file ' + resPath));
                    }
                }

                if(!textures.has(texture)) {
                    console.warn('Missing texture', texture);
                }
            }
            resolve(textures);
        })
    }

    async loadMap(mapName) {

        this.name = mapName;

        const bsp = await Model.getMap(mapName);

        const textures = await this.loadTextures(bsp.bsp.textures);

        // world
        const meshData = bsp.meshData;

        const vertexData = {
            vertecies: meshData.vertecies.map(vert => ([
                ...vert.vertex,
                vert.uv[0], vert.uv[1], vert.uv[2], // <-- textureIndex
                ...vert.normal
            ])).flat(),
            indecies: meshData.indecies
        };

        await this.loadMapProps(bsp.bsp.gamelumps.sprp);

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
            scale: [-0.01, 0.01, 0.01],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
        });
    }

    async loadMapProps(props) {
        return new Promise((resolve, reject) => {
            for(let prop of props) {

                this.registerProp(prop);

                const type = propTypes.get(this.getPropType(prop));

                if(type) {
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
                            scale: [-0.01, 0.01, 0.01],
                            position: [
                                prop.Origin.data[0].data * -0.01,
                                prop.Origin.data[2].data * 0.01,
                                prop.Origin.data[1].data * 0.01,
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
            }

            let propCounter = 0;

            for(let [_, propType] of propTypes) {
                SourceDecoder.loadProp(propType.mdlPath).then(p => {
                    for(let listener of propType.listeners) {
                        listener(p);
                    }
                    
                }).catch(err => {
                    console.error('Missing prop ' + propType.mdlPath);
                    
                }).finally(() => {
                    propCounter++;
                    if(propCounter == propTypes.size) resolve();
                })
            }
        })
    }

}
