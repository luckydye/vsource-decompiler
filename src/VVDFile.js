import { BinaryFile } from './BinaryFile';
import { Structs } from './VVDFileTypes';

// https://developer.valvesoftware.com/wiki/VVD

export default class VVDFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static decompileVertexData(vvd) {
        let byteOffset = vvd.header.vertexDataStart.data;

        console.log('decompileing', vvd.vertexCount, 'vertecies.');

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
        const indexes = [];

        const numberOfIndecies = (verts.length - 2) * 3;

        for(let i = 0; i < numberOfIndecies / 3; i++) {
            indexes.push(i);
            indexes.push(1 + i);
            indexes.push(2 + i);
        }

        const parsedVertecies = verts.map(vert => ([
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

        return {
            vertecies: parsedVertecies,
            indecies: indexes,
        };
    }

}