import chalk from 'chalk';
import { BSPFile } from '../index.mjs';
import PropLoader from './PropLoader.mjs';
import MaterialLoader from './MaterialLoader.mjs';

const propTypes = new Map();

export default class MapLoader {

    constructor(fileSystem) {
        this.fileSystem = fileSystem;

        this.propLoader = new PropLoader(fileSystem);
        this.materialLoader = new MaterialLoader(fileSystem);

        this.geometry = {
            map: [],
            lights: [],
            sky_camera: [],
            prop_static: [],
            prop_dynamic: [],
        };
    }

    async loadMap(mapName) {
        const fileSystem = this.fileSystem;
        
        this.name = mapName;

        const mapPath = `maps/${mapName}.bsp`;
        log('Loading map', mapPath);

        const map = await fileSystem.getFile(mapPath);
        const bsp = BSPFile.fromDataArray(await map.arrayBuffer());

        log('Reading pakfile...');
        this.pakfile = Buffer.from(bsp.pakfile.buffer);
        fileSystem.attatchPakfile(this.pakfile);

        log('Load map textures...');

        const textures = new Map();
            
        for(let texture of bsp.textures) {
            const mat = await this.materialLoader.loadMaterial(texture.toLocaleLowerCase()).catch(err => {
                error(err);
                log(texture);
            });

            if(mat) {
                textures.set(texture, mat);
            }
        }

        log(`${textures.size} of ${bsp.textures.length} textures loaded.`);
        
        // world
        function getMapTexture(textureIndex) {
            const tex = bsp.textures[textureIndex];
            return textures.get(tex);
        }

        log('Load map geometry...');

        // sky_camera
        if(bsp.skyCamera) {
            this.geometry.sky_camera.scale = [
                bsp.skyCamera.scale,
                bsp.skyCamera.scale,
                bsp.skyCamera.scale,
            ];
            this.geometry.sky_camera.position = [
                bsp.skyCamera.origin[1],
                bsp.skyCamera.origin[2],
                bsp.skyCamera.origin[0],
            ];
            this.geometry.sky_camera.rotation = [
                bsp.skyCamera.angles[0],
                -bsp.skyCamera.angles[2],
                bsp.skyCamera.angles[1],
            ];
        }

        // lights
        for(let light of bsp.lights) {
            this.geometry.lights.push(transformPropGeometry({
                name: bsp.lights.indexOf(light) + "_light",
                scale: [1, 1, 1],
                origin: light.origin,
                angles: [0, 0, 0],
            }));
        }

        // brushes
        const meshes = bsp.convertToMesh();

        for(let mesh of meshes) {
            if(!mesh) continue;

            const material = getMapTexture(mesh.material);

            this.geometry.map.push({
                name: meshes.indexOf(mesh) + "_" + mapName,
                color: mesh.color,
                vertecies: mesh.vertecies,
                uvs: mesh.uvs,
                normals: mesh.normals,
                indices: mesh.indices,
                material: material,
                scale: [1, 1, 1],
                origin: [0, 0, 0],
                position: mesh.position,
                rotation: mesh.angles,
            });
        }

        log('Load prop_dynamic ...');

        for(let prop of bsp.props) {
            const modelMeshes = await this.propLoader.loadProp(prop.model).catch(err => {
                console.log('');
                error('Failed loading prop_dynamic: ' + prop.model);
                log(err);
                console.log('');
            });

            if(!modelMeshes) continue;

            for(let propData of modelMeshes) {
                const propGeometry = transformPropGeometry({
                    name: getModelNameFromPath(prop.model) + '_' + modelMeshes.indexOf(propData),
                    vertecies: propData.vertecies,
                    uvs: propData.uvs,
                    normals: propData.normals,
                    indices: propData.indices,
                    material: propData.material,
                    origin: prop.origin,
                    angles: prop.angles,
                });
    
                this.geometry.prop_dynamic.push(propGeometry);
            }
        }

        log('Load prop_static ...');
        
        await this.loadMapProps(bsp.gamelumps.sprp, (type, prop, propMeshes) => {
            for(let propData of propMeshes) {
                const propGeometry = transformPropGeometry({
                    name: getModelNameFromPath(type.name) + '_' + propMeshes.indexOf(propData),
                    vertecies: propData.vertecies,
                    uvs: propData.uvs,
                    normals: propData.normals,
                    indices: propData.indices,
                    material: propData.material,
                    scale: [
                        prop.UniformScale ? prop.UniformScale.valueOf() : 1, 
                        prop.UniformScale ? prop.UniformScale.valueOf() : 1, 
                        prop.UniformScale ? prop.UniformScale.valueOf() : 1
                    ],
                    origin: [
                        prop.Origin.data[0].valueOf(),
                        prop.Origin.data[1].valueOf(),
                        prop.Origin.data[2].valueOf(),
                    ],
                    angles: [
                        prop.Angles.data[0].valueOf(),
                        prop.Angles.data[1].valueOf(),
                        prop.Angles.data[2].valueOf(),
                    ]
                });
    
                this.geometry.prop_static.push(propGeometry);
            }
        }).catch(err => {
            error(err);
        });

        log('Done loading map props.');

        return this.geometry;
    }
    
    registerProp(prop) {
        if(!propTypes.has(prop.PropType)) {
            propTypes.set(prop.PropType, {
                name: prop.PropType,
                mdlPath: prop.PropType,
                vvdPath: prop.PropType.replace('.mdl', '.vvd'),
                listeners: [],
            });
        }
    }

    async loadMapProps(props, callback) {
        return new Promise((resolve, reject) => {

            if(props.length == 0) {
                resolve();
                return;
            }

            // collect all different types of props
            for(let prop of props) {

                if(!prop.PropType) {
                    throw new Error('Error decompiling prop gamelump.');
                    continue;
                }

                this.registerProp(prop);
                const type = propTypes.get(prop.PropType);

                type.listeners.push(propData => callback(type, prop, propData));
            }

            // load all different types once
            let propCounter = 0;

            for(let [_, propType] of propTypes) {

                this.propLoader.loadProp(propType.mdlPath).then(meshes => {
                    for(let listener of propType.listeners) listener(meshes);
                    
                }).catch(err => {
                    console.log('');
                    error(chalk.red('Failed to load prop: ' + propType.mdlPath));
                    log(err);
                    console.log('');
                    
                }).finally(() => {
                    propCounter++;

                    process.stdout.cursorTo(0);
                    process.stdout.write(`[INFO] Loading props ${propCounter.toString()} / ${propTypes.size.toString()}`);
                    
                    if(propCounter == propTypes.size) {
                        resolve();
                        process.stdout.write(`\n`);
                    }
                })
            }
        })
    }

}

function getModelNameFromPath(modelPath) {
    const parts = modelPath.split(/\/|\\/g);
    return parts[parts.length-1].replace(/\\+|\/+/g, "_");
}

function transformPropGeometry(prop) {

    // coord conversion: y ; z ; x
    
    // prop.angles: y(0) ; z(1) ; x(2)
    const anglesXYZ = [
        prop.angles[0],
        -prop.angles[2],
        prop.angles[1],
    ];

    const originXYZ = [
        prop.origin[1],
        prop.origin[2],
        prop.origin[0],
    ];

    const propGeometry = {
        name: prop.name,
        vertecies: prop.vertecies,
        uvs: prop.uvs,
        normals: prop.normals,
        indices: prop.indices,
        material: prop.material,
        scale: [ 1, 1, 1 ],
        origin: [ 0, 0, 0 ],
        position: originXYZ,
        rotation: anglesXYZ,
    }
    return propGeometry;
}
