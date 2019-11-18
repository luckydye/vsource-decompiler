import { BinaryFile } from './BinaryFile';
import { Structs } from './MDLFileTypes';

export default class MDLFile extends BinaryFile {

    static fromDataArray(dataArray) {
        const mdl = new MDLFile();

        mdl.byteSize = dataArray.byteLength;

        mdl.header = this.unserializeStruct(dataArray, Structs.studiohdr_t).data;
        mdl.id = String.fromCharCode(...this.Uint32ToBytes(mdl.header.id).reverse());

        // body parts
        mdl.bodyparts = [];

        for(let b = 0; b < mdl.header.bodypart_count; b++) {
            const buffer = dataArray.slice(mdl.header.bodypart_offset);
            const part = this.unserializeStruct(buffer, Structs.mstudiobodyparts_t);
            mdl.bodyparts.push(part.data);
        }

        console.log(mdl);

        return mdl;
    }

}