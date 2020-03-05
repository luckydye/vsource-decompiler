import { TextFile } from "./TextFile.mjs";
import { S3Texture } from "./S3Texture.mjs";

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#gltf-basics
// https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_005_BuffersBufferViewsAccessors.md

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

function rotationToQuaternion(x, y, z) {
    const cy = Math.cos(x * 0.5);
    const sy = Math.sin(x * 0.5);
    const cp = Math.cos(y * 0.5);
    const sp = Math.sin(y * 0.5);
    const cr = Math.cos(z * 0.5);
    const sr = Math.sin(z * 0.5);

    const q = [0, 0, 0, 0];

    q[0] = cy * cp * sr - sy * sp * cr;
    q[1] = sy * cp * sr + cy * sp * cr;
    q[2] = sy * cp * cr - cy * sp * sr;
    q[3] = cy * cp * cr + sy * sp * sr;

    return q;
}

export default class GLTFFile extends TextFile {

    static fromGeometry(geometry = []) {
        const gltf = new this();

        for(let geo of geometry) {

            /* geometry structure:
                vertecies: [0, 0, 0],
                indices: [0, 0, 0],
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [0, 0, 0],
                materials: [ ... ]
            */
    
            /* material structure (vtf file):
                width: 1024,
                height: 1024,
                reflectivity: 0.512,
                imageData: [ ... ]
            */

            if(geo.vertecies.length > 0) {
                gltf.addObject(geo);
            }
        }

        return gltf;
    }

    static fromFile(gLTFFile) {
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
        };
    }

    get activeScene() {
        return this.asset.scenes[this.asset.scene];
    }

    createBuffer(bufferArray) {
        const buffer = Buffer.from(bufferArray.buffer);
        const gltfBuffer = {
            byteLength: bufferArray.buffer.byteLength,
            uri: "data:application/octet-stream;base64," + buffer.toString('base64')
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
        this.activeScene.nodes.push(nodeIndex);
        return nodeIndex;
    }

    createPrimitive(indices, vertecies) {
        const indexCount = indices.length;
        const vertexCount = vertecies.length / 8;

        // asset buffers
        const indexBuffer = new Uint32Array(indices);
        const vertexBuffer = new Float32Array(vertecies);

        const indexBufferIndex = this.createBuffer(indexBuffer);
        const vertexBufferIndex = this.createBuffer(vertexBuffer);

        // buffer views
        const byteStride =  type.VEC3.components * type.FLOAT.byteLength +
                            type.VEC2.components * type.FLOAT.byteLength +
                            type.VEC3.components * type.FLOAT.byteLength;

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

        return {
            attributes: {
                "POSITION": positionAccessor,
                "TEXCOORD_0": textureAccessor,
                "NORMAL": normalAccessor,
            },
            indices: indexAccessor,
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

    createMaterialFromVTX(objectMaterial) {

        const materialName = objectMaterial.name.toString().replace(/\//g, "_");

        const existingMaterial = this.getMaterialByName(materialName);

        if(existingMaterial) {
            return existingMaterial;
        }

        const textureImage = S3Texture.fromDataArray(
            objectMaterial.imageData, 
            objectMaterial.format.type,
            objectMaterial.format.width, 
            objectMaterial.format.height
        );
        const ddsBuffer = textureImage.toDDS();

        const texture = this.createTexture(ddsBuffer, {
            name: materialName + "_texture.dds",
        });

        return this.createMaterial({
            name: materialName,
            doubleSided: true,
            alphaMode: "MASK",
            pbrMetallicRoughness: {
                baseColorTexture: {
                    index: texture,
                    texCoord: 0
                },
                metallicFactor: 0,
                roughnessFactor: 1 - objectMaterial.reflectivity[0]
            }
        });
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

        const mesh = {
            name: object.name,
            primitives: []
        };

        let objectMaterial = object.material;

        if(objectMaterial && !objectMaterial.imageData) {
            throw new Error('Missing texture imageData');
        }

        if(objectMaterial && objectMaterial.imageData) {

            const material = this.createMaterialFromVTX(objectMaterial);
            const primitive = this.createPrimitive(indices, vertecies);
            
            mesh.primitives.push({
                attributes: primitive.attributes,
                indices: primitive.indices,
                material: material,
            });
        } else {
            const primitive = this.createPrimitive(indices, vertecies);
            
            mesh.primitives.push({
                attributes: primitive.attributes,
                indices: primitive.indices,
            });
        }

        // mesh
        return this.createMesh(mesh);
    }

    addObject(object) {
        let mesh = null;

        // find existing mesh with same name
        for(let assetMesh of this.asset.meshes) {
            if(object.name == assetMesh.name) {
                mesh = this.asset.meshes.indexOf(assetMesh);
            }
        }

        mesh = mesh || this.createObjectMesh(object);

        // node
        this.createNode({
            name: object.name,
            mesh: mesh,
            scale: [
                object.scale[0],
                object.scale[1],
                object.scale[2]
            ],
            rotation: rotationToQuaternion(
                object.rotation[0],
                object.rotation[1],
                object.rotation[2]
            ),
            translation: object.position,
        });
    }

    toString() {
        return JSON.stringify(this.asset, null, '\t');
    }
}
