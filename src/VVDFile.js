import { BinaryFile } from './BinaryFile';
import { Structs } from './VVDFileTypes';

// https://developer.valvesoftware.com/wiki/VVD

export default class VVDFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static decompileVertexData(vvd, dataArray) {
        let byteOffset = vvd.header.vertexDataStart;

        const view = new DataView(dataArray);

        for(let v = 0; v < vvd.vertexCount; v++) {
            byteOffset += 16;
            const vert = {
                pos_x: view.getFloat32(byteOffset, true),
                pos_y: view.getFloat32(byteOffset += 4, true),
                pos_z: view.getFloat32(byteOffset += 4, true),

                norm_x: view.getFloat32(byteOffset += 4, true),
                norm_y: view.getFloat32(byteOffset += 4, true),
                norm_z: view.getFloat32(byteOffset += 4, true),

                tex_u: view.getFloat32(byteOffset += 4, true),
                tex_v: view.getFloat32(byteOffset += 4, true),
            };
            vvd.vertecies.push(vert);
        }

        // byteOffset = vvd.header.tangentDataStart;

        // for(let v = 0; v < vvd.vertexCount; v++) {
        //     const vert = this.unserializeStruct(dataArray.slice(byteOffset), Structs.mstudiotangent_t);
        //     byteOffset += vert.byteSize;
        //     vvd.tangents.push(vert.data);
        // }
    }

    static fromDataArray(dataArray) {
        const vvd = new VVDFile();

        vvd.byteSize = dataArray.byteLength;

        vvd.header = this.unserializeStruct(dataArray, Structs.vertexFileHeader_t).data;

        vvd.vertexCount = vvd.header.numLODVertexes[0];

        vvd.vertecies = [];
        vvd.tangents = [];

        // if(vvd.vertexCount < 3000)
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