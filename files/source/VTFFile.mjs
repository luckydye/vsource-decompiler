import { BinaryFile } from "@luckydye/binary-file-lib";
import { IMAGE_FORMAT, VTF } from './VTFStructure.mjs';

// https://developer.valvesoftware.com/wiki/Valve_Texture_Format

// VTF Header
// Resource entries
//     VTF Low Resolution Image Data
//     Other resource data
//         For Each Mipmap (Smallest to Largest)
//             For Each Frame (First to Last)
//                 For Each Face (First to Last)
//                     For Each Z Slice (Min to Max; Varies with Mipmap)
//                         VTF High Resolution Image Data


export default class VTFFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    get reflectivity() {
        return this.header.reflectivity.valueOf();
    }

    get width() {
        return this.header.width.valueOf();
    }

    get height() {
        return this.header.height.valueOf();
    }

    static readHeader(vtf) {
        const fileSigVersion = this.unserialize(vtf.view, 0, VTF.vtfheader_sig_version).data;

        const sig = fileSigVersion.signature.data.split("").slice(0, 3).join("");
        if(sig !== "VTF") {
            throw new Error('wrong signature: ' + sig);
        }

        return this.unserialize(vtf.view, 0, VTF.vtfheader).data;
    }

    static fromDataArray(dataArray) {
        const vtf = this.createFile(dataArray);

        const header = this.readHeader(vtf);

        if(!header.version) {
            throw new Error('File not recognised');
        }

        vtf.version = header.version;
        vtf.header = header;

        vtf.mipmapCount = header.mipmapCount.data;

        const format = IMAGE_FORMAT[header.highResImageFormat.data];

        vtf.format = {
            type: format ? format.type : "NONE",
            width: header.width.data,
            height: header.height.data,
            bits: format ? format.bits : 8,
        }

        if(vtf.format.type != "NONE") {
            const byteLength = vtf.format.width * vtf.format.height * (vtf.format.bits / 8);
            const imageDataBuffer = dataArray.slice(dataArray.byteLength - byteLength);
            vtf.imageData = imageDataBuffer;
        }

        return vtf;
    }

}
