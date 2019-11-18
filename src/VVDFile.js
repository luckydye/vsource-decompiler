import { BinaryFile } from './BinaryFile';
import { Structs } from './VVDFileTypes';

// https://developer.valvesoftware.com/wiki/VVD

export default class VVDFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static decompileVertexData(vvd, dataArray) {
        let byteOffset = vvd.header.vertexDataStart;

        for(let v = 0; v < vvd.header.numLODVertexes[0]; v++) {
            const vert = this.unserializeStruct(dataArray.slice(byteOffset), Structs.mstudiovertex_t);
            byteOffset += vert.byteSize;
            vvd.vertecies.push(vert.data);
        }

        byteOffset = vvd.header.tangentDataStart;

        for(let v = 0; v < vvd.header.numLODVertexes[0]; v++) {
            const vert = this.unserializeStruct(dataArray.slice(byteOffset), Structs.mstudiotangent_t);
            byteOffset += vert.byteSize;
            vvd.tangents.push(vert.data);
        }
    }

    static fromDataArray(dataArray) {
        const vvd = new VVDFile();

        vvd.byteSize = dataArray.byteLength;

        vvd.header = this.unserializeStruct(dataArray, Structs.vertexFileHeader_t).data;
        vvd.vertecies = [];
        vvd.tangents = [];

        this.decompileVertexData(vvd, dataArray);

        return vvd;
    }

}