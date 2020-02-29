import { BinaryFile } from './BinaryFile.mjs';

// https://developer.valvesoftware.com/wiki/VVD

const MAX_NUM_LODS = 8;
const MAX_NUM_BONES_PER_VERT = 3;

const Structs = {
    vertexFileHeader_t: {
        id: 'char[4]',
        version: 'int',
        checksum: 'int',
        numLODs: 'int',
        numLODVertexes: `int[${MAX_NUM_LODS}]`,
        numFixups: 'int',
        fixupTableStart: 'int',
        vertexDataStart: 'int',
        tangentDataStart: 'int',
    },
    vertexFileFixup_t: {
        lod: 'int',			
        sourceVertexID: 'int',
        numVertexes: 'int',
    },
    mstudiovertex_t: {
        // m_BoneWeights: 'byte[16]',

        pos_x: 'float',
        pos_y: 'float',
        pos_z: 'float',

        norm_x: 'float',
        norm_y: 'float',
        norm_z: 'float',

        tex_u: 'float',
        tex_v: 'float',
    },
    mstudioboneweight_t: {
        weight: `float[${MAX_NUM_BONES_PER_VERT}]`,
        bone: `byte[${MAX_NUM_BONES_PER_VERT}]`,
        numbones: 'byte',
    },
    mstudiotangent_t: {
        tangent: 'vector4d'
    },
}

export default class VVDFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static decompileVertexData(vvd) {
        let byteOffset = vvd.header.vertexDataStart.data;

        for(let v = 0; v < vvd.vertexCount; v++) {
            byteOffset += 16;
            const vert = this.unserialize(vvd.view, byteOffset, Structs.mstudiovertex_t);
            byteOffset = vert.byteOffset;
            vvd.vertecies.push(vert.data);
        }
    }

    static fromDataArray(dataArray) {
        const vvd = this.createFile(dataArray);

        vvd.header = this.unserialize(vvd.view, 0, Structs.vertexFileHeader_t).data;

        vvd.vertexCount = vvd.header.numLODVertexes.data[0];

        vvd.vertecies = [];
        vvd.tangents = [];

        this.decompileVertexData(vvd);

        return vvd;
    }

    convertToMesh() {
        const verts = this.vertecies;

        const parsedVertecies = verts.map((vert, i) => ([
            vert.pos_x.data,
            vert.pos_z.data,
            vert.pos_y.data,
            
            vert.tex_u.data,
            vert.tex_v.data,
            0,

            vert.norm_x.data,
            vert.norm_z.data,
            vert.norm_y.data,
        ]));

        return parsedVertecies;
    }

}