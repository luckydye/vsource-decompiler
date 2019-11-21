import { BinaryFile } from './BinaryFile';
import { VTF, IMAGE_FORMAT } from './VTFFileTypes';

// https://developer.valvesoftware.com/wiki/Valve_Texture_Format

export default class VTFFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static readHeader(vtf) {
        const fileHeader = this.unserialize(vtf.view, 0, VTF.vtfheader).data;
        const sig = fileHeader.signature.data.split("").slice(0, 3).join("");

        let header;

        if(sig == "VTF") {
            const version = parseInt(fileHeader.version.data.join(""));
            header = fileHeader;
            header.version = version;
        }

        return header;
    }

    static fromDataArray(dataArray) {
        const vtf = this.createFile(dataArray);

        const header = this.readHeader(vtf);

        vtf.version = header.version;
        vtf.header = header;

        vtf.format = IMAGE_FORMAT[header.highResImageFormat.data] || { type: "NONE" };
        vtf.format.width = header.width.data;
        vtf.format.height = header.height.data;

        if(vtf.format) {
            const byteLength = vtf.format.width * vtf.format.height * (vtf.format.bits / 8);
            
            console.log(vtf.format);
            
            const imageDataBuffer = dataArray.slice(dataArray.byteLength - byteLength);
            vtf.imageData = imageDataBuffer;
        }

        return vtf;
    }

}