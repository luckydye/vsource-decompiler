import { BinaryFile } from './BinaryFile';
import { Structs } from './VVDFileTypes';

// https://developer.valvesoftware.com/wiki/VVD

export default class VVDFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static decompileVertexData(vvd, dataArray) {
        let byteOffset = vvd.header.vertexDataStart;

        for(let v = 0; v < vvd.vertexCount; v++) {
            const vert = this.unserializeStruct(dataArray.slice(byteOffset), Structs.mstudiovertex_t);
            byteOffset += vert.byteSize;
            vvd.vertecies.push(vert.data);
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

        if(vvd.vertexCount < 3000) {
            this.decompileVertexData(vvd, dataArray);
        }

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
            vert.m_vecPosition[0],
            vert.m_vecPosition[2],
            vert.m_vecPosition[1],

            vert.m_vecTexCoord[0],
            vert.m_vecTexCoord[1],
            0,

            vert.m_vecNormal[0],
            vert.m_vecNormal[2],
            vert.m_vecNormal[1],
        ]));

        return {
            vertecies: parsedVertecies,
            indecies: indexes,
        };
    }

}