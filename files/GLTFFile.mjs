import { TextFile } from "./TextFile.mjs";

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#gltf-basics

class ComponentType extends Number {
    
    get byteLength() {
        return this._byteLength;
    }

    constructor(type, n, byteLength) {
        super(n);

        this._type = type;
        this._byteLength = byteLength;
    }
}

class Type extends String {

    get components() {
        return this._components;
    }

    constructor(type, components) {
        super(type);

        this._components = components;
    }
}

// type

const type = {
    BYTE: new ComponentType("BYTE", 5120, 1),
    UNSIGNED_BYTE: new ComponentType("UNSIGNED_BYTE", 5121, 1),
    SHORT: new ComponentType("SHORT", 5122, 2),
    UNSIGNED_SHORT: new ComponentType("UNSIGNED_SHORT", 5123, 2),
    UNSIGNED_INT: new ComponentType("UNSIGNED_INT", 5125, 4),
    FLOAT: new ComponentType("FLOAT", 5126, 4),
    SCALAR: new Type("SCALAR", 1),
    VEC2: new Type("VEC2", 2),
    VEC3: new Type("VEC3", 3),
    VEC4: new Type("VEC4", 4),
    MAT2: new Type("MAT2", 4),
    MAT3: new Type("MAT2", 9),
    MAT4: new Type("MAT4", 16),
}

export default class GLTFFile extends TextFile {

    /*  Format
    
        {
            "asset": {
                "version": "2.0",
                "generator": "collada2gltf@f356b99aef8868f74877c7ca545f2cd206b9d3b7",
                "copyright": "2020 (c) Tim Havlicek"
            },
            "buffers": [
                {
                    "byteLength": 504,
                    "uri": "external.bin"
                }
            ],
            "bufferViews": [
                {
                    "buffer": 0,
                    "byteLength": 76768,
                    "byteOffset": 25272,
                    "byteStride": 32,
                    "target": 34962
                }
            ],
            "accessors": [
                {
                    "bufferView": 1,
                    "byteOffset": 0,
                    "componentType": 5126,
                    "count": 2399,
                    "max": [
                        0.961799,
                        1.6397,
                        0.539252
                    ],
                    "min": [
                        -0.692985,
                        0.0992937,
                        -0.613282
                    ],
                    "type": "VEC3"
                }
            ],
            "nodes": [
                {
                    "name": "Car",
                    "children": [ 1 ]
                    "matrix": [],
                    "scale": [0, 0, 0, 0],
                    "rotation": [0, 0, 0, 0],
                    "translation": [0, 0, 0, 0],
                },
                {
                    "name": "camera",
                    "camera": 1,
                }
            ],
            "skins": [
                {
                    "name": "skin_0",
                    "inverseBindMatrices": 0,
                    "joints": [ 1, 2 ],
                    "skeleton": 1
                }
            ],
            "scenes": [
                {
                    "name": "singleScene",
                    "nodes": [ 0, 1, 2 ]
                }
            ],
            "scene": 0,
            "cameras": [
                {
                    "name": "Camera_A",
                    "type": "perspective",
                    "perspective": {
                        "aspectRatio": 1.5,
                        "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    }      
                }
            ],
            "meshes": [
                {
                    "primitives": [
                        {
                            "attributes": {
                                "NORMAL": 23,
                                "POSITION": 22,
                                "TANGENT": 24,
                                "TEXCOORD_0": 25
                            },
                            "indices": 21,
                            "material": 3,
                            "mode": 0
                        }
                    ]
                }
            ],
            "textures": [
                {
                    "sampler": 0,
                    "source": 2
                }
            ],
            "samplers": [
                {
                    "magFilter": 9729,
                    "minFilter": 9987,
                    "wrapS": 10497,
                    "wrapT": 10497
                }
            ],
            "images": [
                {
                    "uri": "duckCM.png"
                },
                {
                    "bufferView": 14,
                    "mimeType": "image/jpeg" 
                }
            ],
            "materials": [
                {
                    "name": "Material0",
                    "pbrMetallicRoughness": {
                        "baseColorFactor": [ 0.5, 0.5, 0.5, 1.0 ],
                        "baseColorTexture": {
                            "index": 1,
                            "texCoord": 1
                        },
                        "metallicFactor": 1,
                        "roughnessFactor": 1,
                        "metallicRoughnessTexture": {
                            "index": 2,
                            "texCoord": 1
                        }
                    },
                    "normalTexture": {
                        "scale": 2,
                        "index": 3,
                        "texCoord": 1
                    },
                    "emissiveFactor": [ 0.2, 0.1, 0.0 ]
                }
            ]
        }
    */

    static fromGeometry(geometry = []) {
        const gltf = new GLTFFile();

        for(let geo of geometry) {

            /* geometry structure
    
                vertecies: [0, 0, 0],
                indecies: [0, 0, 0],
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [0, 0, 0],
                materials: [ ... ]
            */
    
            /* material structure (vtf file)
    
                width: 1024,
                height: 1024,
                reflectivity: 0.512,
                imageData: [ ... ]
            */

            gltf.addObject(geo);
        }

        return gltf.toString();
    }

    static fromFile(GLTFFile) {
        // read gltf file and create instance
    }

    constructor() {
        super();
        
        this.asset = {
            asset: {
                copyright: "2020 (c) Valve Software",
                generator: "Khronos glTF @uncut/file-format-lib v1.0.0",
                version: "2.0"
            },
            scene: 0,
            scenes: [
                {
                    name: "Scene",
                    nodes: []
                }
            ],
            nodes: [],
            meshes: [],
            cameras: [],
            textures: [],
            images: [],
            samplers: [
                {
                    "magFilter": 9729,
                    "minFilter": 9987,
                    "wrapS": 10497,
                    "wrapT": 10497
                }
            ],
            materials: [],
            buffers: [],
            bufferViews: [],
            accessors: [],
        };
    }

    get activeScene() {
        return this.asset.scenes[this.asset.scene];
    }

    addObject(object) {

        const asset = this.asset;

        // geometry buffer
        const vertecies = object.vertecies.filter((v, i) => ((i + 4) % 9));
        const indices = object.indecies;

        const vertexCount = vertecies.length / 8;
        const indexCount = indices.length;

        const vertBuffer = new Float32Array(vertecies);
        const indexBuffer = new Uint32Array(indices);
        const bufferData = new Float32Array(vertBuffer.byteLength + indexBuffer.byteLength);

        bufferData.set(vertBuffer, 0);
        bufferData.set(indexBuffer, vertBuffer.byteLength);

        // asset buffers
        const base64Buffer = Buffer.from(bufferData.buffer).toString('base64');

        const geometryBuffer = {
            byteLength: bufferData.byteLength,
            uri: "data:application/octet-stream;base64," + base64Buffer
        }

        const bufferIndex = asset.buffers.push(geometryBuffer) - 1;
        const byteStride =  type.VEC3.components * type.FLOAT.byteLength +
                            type.VEC2.components * type.FLOAT.byteLength +
                            type.VEC3.components * type.FLOAT.byteLength;

        // buffer vies
        const posBufferView = {
            buffer: bufferIndex,
            byteOffset: 0,
            byteStride: byteStride,
            byteLength: type.VEC3.components * type.FLOAT.byteLength * vertexCount,
        }
        const texBufferView = {
            buffer: bufferIndex,
            byteOffset: type.VEC3.components * type.FLOAT.byteLength,
            byteStride: byteStride,
            byteLength: type.VEC2.components * type.FLOAT.byteLength * vertexCount,
        }
        const normBufferView = {
            buffer: bufferIndex,
            byteOffset: type.VEC3.components * type.FLOAT.byteLength +
                        type.VEC2.components * type.FLOAT.byteLength,
            byteStride: byteStride,
            byteLength: type.VEC3.components * type.FLOAT.byteLength * vertexCount,
        }
        const indexBufferView = {
            buffer: bufferIndex,
            byteOffset: 0,
            byteLength: type.UNSIGNED_INT.byteLength * indexCount,
        }

        const posBufferViewIndex = asset.bufferViews.push(posBufferView) - 1;
        const texBufferViewIndex = asset.bufferViews.push(texBufferView) - 1;
        const normBufferViewIndex = asset.bufferViews.push(normBufferView) - 1;
        const indexBufferViewIndex = asset.bufferViews.push(indexBufferView) - 1;

        // accessors
        const indexAccessor = {
            bufferView: indexBufferViewIndex,
            componentType: type.FLOAT,
            count: indexCount,
            type: type.VEC3,
        }

        const positionAccessor = {
            bufferView: posBufferViewIndex,
            componentType: type.FLOAT,
            count: vertexCount,
            type: type.VEC3,
        }

        const textureAccessor = {
            bufferView: texBufferViewIndex,
            componentType: type.FLOAT,
            count: vertexCount,
            type: type.VEC3,
        }

        const normalAccessor = {
            bufferView: normBufferViewIndex,
            componentType: type.FLOAT,
            count: vertexCount,
            type: type.VEC3,
        }

        const indexAccessorIndex = asset.accessors.push(indexAccessor) - 1;
        const positionAccessorIndex = asset.accessors.push(positionAccessor) - 1;
        const textureAccessorIndex = asset.accessors.push(textureAccessor) - 1;
        const normalAccessorIndex = asset.accessors.push(normalAccessor) - 1;

        // mesh
        const mesh = {
            primitives: [
                {
                    attributes: {
                        "POSITION": positionAccessorIndex,
                        "TEXCOORD_0": textureAccessorIndex,
                        "NORMAL": normalAccessorIndex,
                    },
                    indices: indexAccessorIndex,
                    // material: asset.materials.length,
                }
            ]
        }

        const meshIndex = asset.meshes.push(mesh) - 1;
        
        // node
        const node = {
            mesh: meshIndex,
            name: object.name,
            scale: object.scale,
            rotation: object.rotation,
            translation: object.position,
        }

        const nodeIndex = asset.nodes.push(node) - 1;

        this.activeScene.nodes.push(nodeIndex);

        // materials
        // for(let mat of geo.materials) {
        //     const material = {
        //         name: "Material0",
        //         pbrMetallicRoughness: {
        //             baseColorTexture: {
        //                 index: 1,
        //                 texCoord: 1
        //             },
        //             metallicFactor: mat.reflectivity,
        //             roughnessFactor: 1,
        //             metallicRoughnessTexture: {
        //                 index: 2,
        //                 texCoord: 1
        //             }
        //         }
        //     }

        //     const texture = {
        //         sampler: 0,
        //         source: 2
        //     }

        //     const image = {
        //         uri: "duckCM.png"
        //     }
        // }
    }

    addMaterial(object) {
        
    }

    addTexture(object) {

    }

    toString() {
        return JSON.stringify(this.asset, null, '  ');
    }
}
