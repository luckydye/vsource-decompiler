import { TextFile } from "@luckydye/binary-file-lib";
import { S3Texture } from "./S3Texture.mjs";

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#gltf-basics
// https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_005_BuffersBufferViewsAccessors.md

// type definitions
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

    static fromGeometry(geometry = {}) {
        const gltf = new this();

        for(let key in geometry) {

            if(Array.isArray(geometry[key])) {
                const geometryList = geometry[key];

                const parent = gltf.createNode({
                    name: key,
                    translation: geometryList.position || [0, 0, 0],
                    rotation: eulerDegreeToQuaternion(geometryList.rotation || [0, 0, 0]),
                    scale: geometryList.scale || [1, 1, 1],
                    children: []
                });

                gltf.rootNode.children.push(parent);

                while(geometryList.length > 0) {
                    /* geometry:
                        vertecies: [0, 0, 0],
                        uvs: [0, 0, 0],
                        normals: [0, 0, 0],
                        indices: [0, 0, 0],
                        position: [0, 0, 0],
                        rotation: [0, 0, 0],
                        scale: [0, 0, 0],
                        materials: [ ... ]
                    */

                   gltf.addObject(geometryList.pop(), parent);
                }
            }
        }

        return gltf;
    }

    static fromFile(gLTFFile) {
        // read gltf file and create instance
    }

    get loaded() {
        return this.loadedBufferCount == this.asset.buffers.length;
    }

    constructor() {
        super();

        this.loadedBufferCount = 0;
        
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
                    nodes: [ 0 ]
                }
            ],
            nodes: [
                {
                    name: "Map",
                    children: []
                }
            ],
            meshes: [],
            // cameras: [],
            materials: [],
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
            accessors: [],
            bufferViews: [],
            buffers: [],
            extensionsUsed: [
                "KHR_lights_punctual"
            ],
            extensionsRequired: [
                "KHR_lights_punctual"
            ],
            extensions: {
                KHR_lights_punctual: {
                    lights: []
                }
            }
        };
    }

    get rootNode() {
        return this.asset.nodes[0];
    }

    createLight(options) {
        return this.asset.extensions['KHR_lights_punctual'].lights.push(options) - 1;
    }

    createBuffer(bufferArray) {

        const gltfBuffer = {
            byteLength: bufferArray.buffer.byteLength,
            uri: "data:application/octet-stream;base64,"
        }

        if(typeof Buffer !== "undefined") {
            // nodejs
            gltfBuffer.uri += Buffer.from(bufferArray.buffer).toString('base64');
            this.loadedBufferCount++;

            if(this.loaded) {
                this._finalize();
            }
        } else {
            // chrome
            const blob = new Blob([ bufferArray.buffer ], {type : 'binary'});

            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;
                const base64 = dataUrl.split(',')[1];

                gltfBuffer.uri += base64;
                this.loadedBufferCount++;

                if(this.loaded) {
                    this._finalize();
                }
            };

            reader.readAsDataURL(blob);
        }

        return this.asset.buffers.push(gltfBuffer) - 1;
    }

    createBufferView(options) {
        const bufferView = options;
        return this.asset.bufferViews.push(bufferView) - 1;
    }

    createAccessor(options) {
        const accessors = options;
        return this.asset.accessors.push(accessors) - 1;
    }

    createMesh(options) {
        const mesh = options;
        return this.asset.meshes.push(mesh) - 1;
    }

    createNode(options) {
        const node = options;
        const nodeIndex = this.asset.nodes.push(node) - 1;
        return nodeIndex;
    }

    createPrimitive(indices, vertecies, normals, uvs, color) {
        const indexCount = indices.length;
        const vertexCount = vertecies.length;

        const vertexBufferArray = vertecies.map((vert, i) => {
            const vertex = [
                vert[0],
                vert[1],
                vert[2],

                uvs[i][0],
                uvs[i][1],

                normals[i][0],
                normals[i][1],
                normals[i][2]
            ];

            if(color) {
                vertex.push(
                    color[i][0],
                    color[i][1],
                    color[i][2],
                    color[i][3]
                );
            }

            return vertex;
        }).flat();

        // asset buffers
        const indexBuffer = new Uint32Array(indices);
        const vertexBuffer = new Float32Array(vertexBufferArray);

        const indexBufferIndex = this.createBuffer(indexBuffer);
        const vertexBufferIndex = this.createBuffer(vertexBuffer);

        // buffer views
        let byteStride =  type.VEC3.components * type.FLOAT.byteLength +
                            type.VEC2.components * type.FLOAT.byteLength +
                            type.VEC3.components * type.FLOAT.byteLength;

        if(color) {
            byteStride += type.VEC4.components * type.FLOAT.byteLength;
        }

        const indexBufferViewIndex = this.createBufferView({
            buffer: indexBufferIndex, 
            byteOffset: 0, 
            byteLength: indexBuffer.byteLength
        });

        const posBufferViewIndex = this.createBufferView({
            buffer: vertexBufferIndex, 
            byteOffset: 0, 
            byteLength: vertexBuffer.byteLength,
            byteStride: byteStride,
        });

        const texBufferByteOffset = type.VEC3.components * type.FLOAT.byteLength;
        const texBufferViewIndex = this.createBufferView({
            buffer: vertexBufferIndex, 
            byteOffset: texBufferByteOffset, 
            byteLength: vertexBuffer.byteLength - texBufferByteOffset,
            byteStride: byteStride,
        });

        const normalBufferByteOffset = texBufferByteOffset + type.VEC2.components * type.FLOAT.byteLength;
        const normBufferViewIndex = this.createBufferView({
            buffer: vertexBufferIndex, 
            byteOffset: normalBufferByteOffset,
            byteLength: vertexBuffer.byteLength - normalBufferByteOffset,
            byteStride: byteStride,
        });

        let colorBufferByteOffset;
        let colorBufferViewIndex;

        if(color) {
            colorBufferByteOffset = normalBufferByteOffset + type.VEC3.components * type.FLOAT.byteLength;
            colorBufferViewIndex = this.createBufferView({
                buffer: vertexBufferIndex, 
                byteOffset: colorBufferByteOffset,
                byteLength: vertexBuffer.byteLength - colorBufferByteOffset,
                byteStride: byteStride,
            });
        }

        // accessors
        const indexAccessor = this.createAccessor({
            bufferView: indexBufferViewIndex,
            componentType: type.UNSIGNED_INT,
            count: indexCount,
            type: type.SCALAR,
        });

        const positionAccessor = this.createAccessor({
            bufferView: posBufferViewIndex,
            componentType: type.FLOAT,
            count: vertexCount,
            max: [ 1000.0, 1000.0, 1000.0 ],
            min: [ -1000.0, -1000.0, -1000.0 ],
            type: type.VEC3,
        });

        const textureAccessor = this.createAccessor({
            bufferView: texBufferViewIndex,
            componentType: type.FLOAT,
            count: vertexCount,
            type: type.VEC2,
        });

        const normalAccessor = this.createAccessor({
            bufferView: normBufferViewIndex,
            componentType: type.FLOAT,
            count: vertexCount,
            max: [ 1, 1, 1 ],
            min: [ -1, -1, -1 ],
            type: type.VEC3,
        });

        if(color) {
            const colorAccessor = this.createAccessor({
                bufferView: colorBufferViewIndex,
                componentType: type.FLOAT,
                count: vertexCount,
                max: [ 1, 1, 1, 1 ],
                min: [ 0, 0, 0, 0 ],
                type: type.VEC4,
            });

            return {
                attributes: {
                    "POSITION": positionAccessor,
                    "TEXCOORD_0": textureAccessor,
                    "NORMAL": normalAccessor,
                    "COLOR_0": colorAccessor,
                },
                indices: indexAccessor,
            }

        } else {

            return {
                attributes: {
                    "POSITION": positionAccessor,
                    "TEXCOORD_0": textureAccessor,
                    "NORMAL": normalAccessor,
                },
                indices: indexAccessor,
            }
        }
    }

    createMaterial(options) {
        const material = options;
        return this.asset.materials.push(material) - 1;
    }

    createTexture(imageDataBuffer, options) {

        const imageBuffer = this.createBuffer({ buffer: imageDataBuffer });

        const imageBufferView = this.createBufferView({
            buffer: imageBuffer, 
            byteOffset: 0, 
            byteLength: imageDataBuffer.byteLength
        });

        const image = Object.assign({
            bufferView: imageBufferView,
            mimeType: "image/png"
        }, options);

        const textureSource = this.asset.images.push(image) - 1;

        const texture = {
            sampler: 0,
            source: textureSource,
        };

        return this.asset.textures.push(texture) - 1;
    }

    createMaterialFromObjectMaterial(objectMaterial) {

        const materialName = objectMaterial.name.toString().replace(/\//g, "_");

        const baseTexture = objectMaterial.texture;
        const baseTexture2 = objectMaterial.texture2;
        const bumpmapTexture = objectMaterial.bumpmap;
        const translucent = objectMaterial.translucent;

        const existingMaterial = this.getMaterialByName(materialName);

        if(existingMaterial) {
            return existingMaterial;
        }

        let texture = null, 
            texture2 = null, 
            bumpmap = null, 
            reflectivity = 0;

        if(baseTexture) {
            const textureImage = S3Texture.fromDataArray(
                baseTexture.imageData, 
                baseTexture.format.type,
                baseTexture.format.width, 
                baseTexture.format.height
            );
            const ddsBuffer = textureImage.toDDS();
    
            texture = this.createTexture(ddsBuffer, {
                name: materialName + "_texture.dds",
            });

            reflectivity = luminosity(...baseTexture.reflectivity);
        }

        if(bumpmapTexture) {
            const textureImage = S3Texture.fromDataArray(
                bumpmapTexture.imageData, 
                bumpmapTexture.format.type,
                bumpmapTexture.format.width, 
                bumpmapTexture.format.height
            );
            const ddsBuffer = textureImage.toDDS();
    
            bumpmap = this.createTexture(ddsBuffer, {
                name: materialName + "_normal_texture.dds",
            });
        }

        if(baseTexture2) {
            const textureImage = S3Texture.fromDataArray(
                baseTexture2.imageData, 
                baseTexture2.format.type,
                baseTexture2.format.width, 
                baseTexture2.format.height
            );
            const ddsBuffer = textureImage.toDDS();
    
            texture2 = this.createTexture(ddsBuffer, {
                name: materialName + "_normal_texture2.dds",
            });
        }

        const matOptions = {
            name: materialName,
            doubleSided: translucent ? true : false,
            alphaMode: translucent ? "MASK" : "OPAQUE",
            pbrMetallicRoughness: {
                baseColorFactor: [ 1, 1, 1, 1 ],
                metallicFactor: 0,
                roughnessFactor: 1 - reflectivity
            }
        };

        if(texture != null) {
            matOptions.pbrMetallicRoughness.baseColorTexture = {
                index: texture,
                texCoord: 0
            };
        }

        if(texture2 != null) {
            matOptions.occlusionTexture = {
                index: texture2,
                texCoord: 0
            };
        }

        if(bumpmap != null) {
            matOptions.normalTexture = {
                scale: 1,
                index: bumpmap,
                texCoord: 0
            }
        }

        return this.createMaterial(matOptions);
    }

    getMaterialByName(name) {
        for(let mat of this.asset.materials) {
            if(mat.name == name) {
                return this.asset.materials.indexOf(mat);
            }
        }
    }

    createObjectMesh(object) {
        // geometry buffer
        const indices = object.indices;
        const vertecies = object.vertecies;
        const normals = object.normals;
        const uvs = object.uvs;
        const color = object.color;

        const mesh = {
            name: object.name,
            primitives: []
        };

        let objectMaterial = object.material;

        if(objectMaterial) {
            const material = this.createMaterialFromObjectMaterial(objectMaterial);
            const primitive = this.createPrimitive(indices, vertecies, normals, uvs, color);
            
            mesh.primitives.push({
                attributes: primitive.attributes,
                indices: primitive.indices,
                material: material,
            });
        } else {
            const primitive = this.createPrimitive(indices, vertecies, normals, uvs, color);
            
            mesh.primitives.push({
                attributes: primitive.attributes,
                indices: primitive.indices,
            });
        }

        // mesh
        return this.createMesh(mesh);
    }

    addObject(object, parentNode) {
        let mesh = null;

        // find existing mesh with same name
        for(let assetMesh of this.asset.meshes) {
            if(object.name == assetMesh.name) {
                mesh = this.asset.meshes.indexOf(assetMesh);
            }
        }

        if(object.vertecies && object.vertecies.length > 0) {
            mesh = mesh || this.createObjectMesh(object);
        }

        const quat = eulerDegreeToQuaternion(object.rotation);

        let nodeIndex;

        // node
        if(object.light) {
            nodeIndex = this.createNode({
                extensions: {
                    KHR_lights_punctual : {
                        light: this.createLight({
                            color: [
                                object.light[0] / 255,
                                object.light[1] / 255,
                                object.light[2] / 255,
                            ],
                            intensity: luminosity(...object.light) / 255 * 100000,
                            type: object.type == "light_spot" ? "spot" : "point",
                            name: object.name + '_light',
                            spot: object.type == "light_spot" ? {
                                innerConeAngle: toRadians(object.inner_cone),
                                outerConeAngle: toRadians(object.cone)
                            } : null,
                        })
                    }
                },
                name: object.name,
                mesh: mesh,
                scale: [
                    object.scale[0],
                    object.scale[1],
                    object.scale[2]
                ],
                rotation: [
                    // blender import swaps z and y -,-
                    quat[0],
                    quat[2],
                    -quat[1],
                    quat[3],
                ],
                translation: object.position,
            });
        } else {
            nodeIndex = this.createNode({
                name: object.name,
                mesh: mesh,
                scale: [
                    object.scale[0],
                    object.scale[1],
                    object.scale[2]
                ],
                rotation: [
                    // blender import swaps z and y -,-
                    quat[0],
                    quat[2],
                    -quat[1],
                    quat[3],
                ],
                translation: object.position,
            });
        }

        if(parentNode) {
            const node = this.asset.nodes[parentNode];
            node.children = node.children || [];
            node.children.push(nodeIndex);
        } else {
            this.rootNode.children.push(nodeIndex);
        }

        return nodeIndex;
    }

    _finalize() { }

    async toString() {
        return new Promise((resolve) => {
            if(this.loaded) {
                resolve(JSON.stringify(this.asset, null, '\t'));
            } else {
                this._finalize = () => {
                    resolve(JSON.stringify(this.asset, null, '\t'));
                }
            }
        })
    }

    async toBlob() {
        const stringData = await this.toString();
        const blob = new Blob([ stringData ], { type: "model/gltf+json" });
        return blob;
    }
}

// helper functions

function toRadians(deg) {
    return deg * Math.PI / 180;
}

function luminosity(r, g, b) {
    return (0.299 * r + 0.587 * g + 0.114 * b);
}

function eulerDegreeToQuaternion([ roll, pitch, yaw ]) { // [ x, y, z ]

    roll = roll * (Math.PI / 180);
    pitch = pitch * (Math.PI / 180);
    yaw = yaw * (Math.PI / 180);

    // Abbreviations for the various angular functions
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);

    let q = {};
    q.w = cy * cp * cr + sy * sp * sr;
    q.x = cy * cp * sr - sy * sp * cr;
    q.y = sy * cp * sr + cy * sp * cr;
    q.z = sy * cp * cr - cy * sp * sr;

    return [
        Math.floor(q.x * 100000) / 100000, 
        Math.floor(q.y * 100000) / 100000, 
        Math.floor(q.z * 100000) / 100000, 
        Math.floor(q.w * 100000) / 100000,
    ];
}
