import { BinaryFile } from './BinaryFile';
import { Structs } from './VVDFileTypes';

// https://developer.valvesoftware.com/wiki/VVD

export default class VVDFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static decompileVertexData(vvd, dataArray) {
        let byteOffset = vvd.header.vertexDataStart;

        console.log('decompileing', vvd.vertexCount, 'vertecies.');

        for(let v = 0; v < vvd.vertexCount; v++) {
            byteOffset += 16;
            const vert = this.unserializeStruct(dataArray.slice(byteOffset), Structs.mstudiovertex_t);
            byteOffset += vert.byteSize;
            vvd.vertecies.push(vert.data);
        }
    }

    static fromDataArray(dataArray) {
        const vvd = new VVDFile();

        vvd.byteSize = dataArray.byteLength;

        vvd.header = this.unserializeStruct(dataArray, Structs.vertexFileHeader_t).data;

        vvd.vertexCount = vvd.header.numLODVertexes[0];

        vvd.vertecies = [];
        vvd.tangents = [];

        this.decompileVertexData(vvd, dataArray);

        return vvd;
    }

    convertToMesh() {
        const verts = this.vertecies;
        const indexes = [];

        const numberOfIndecies = (verts.length - 2) * 3;

        for(let i = 0; i < numberOfIndecies / 3; i++) {
            indexes.push(i);
            indexes.push(1 + i);
            indexes.push(2 + i);
        }

        const parsedVertecies = verts.map(vert => ([
            vert.pos_x,
            vert.pos_z,
            vert.pos_y,
            
            vert.tex_u,
            vert.tex_v,
            0,

            vert.norm_x,
            vert.norm_z,
            vert.norm_y,
        ]));

        return {
            vertecies: parsedVertecies,
            indecies: indexes,
        };
    }

}