import { BinaryFile } from './BinaryFile';
import { Structs } from './MDLFileTypes';

export default class MDLFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static fromDataArray(dataArray) {
        const mdl = new MDLFile();

        mdl.byteSize = dataArray.byteLength;

        mdl.header = this.unserializeStruct(dataArray, Structs.studiohdr_t).data;

        // body parts
        mdl.bodyparts = [];

        for(let b = 0; b < mdl.header.bodypart_count; b++) {
            const buffer = dataArray.slice(mdl.header.bodypart_offset);
            const part = this.unserializeStruct(buffer, Structs.mstudiobodyparts_t);
            mdl.bodyparts.push(part.data);
        }

        mdl.models = [];

        for(let part of mdl.bodyparts) {

            const model = part.models[0];

            let byteOffset = part.model_offset + model.mesh_offset;

            for(let b = 0; b < model.mesh_count; b++) {

                const buffer = dataArray.slice(byteOffset);
                const part = this.unserializeStruct(buffer, Structs.mstudiomesh_t);

                byteOffset += part.byteSize;

                mdl.models.push(part.data);

            }
        }


        return mdl;
    }

}