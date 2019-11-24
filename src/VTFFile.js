import { BinaryFile } from './BinaryFile';

// https://developer.valvesoftware.com/wiki/Valve_Texture_Format

export const VTF = {
    vtfheader: {
        signature: 'char[4]',
        version: 'unsigned int[2]',
        headerSize: 'unsigned int',
        width: 'unsigned short',
        height: 'unsigned short',
        flags: 'unsigned int',
        frames: 'unsigned short',
        firstFrame: 'unsigned short',
        padding0: 'unsigned char[4]',
        reflectivity: 'float[3]',
        padding1: 'unsigned char[4]',
        bumpmapScale: 'float',
        highResImageFormat: 'unsigned int',
        mipmapCount: 'byte',
        lowResImageFormat: 'unsigned int',
        lowResImageWidth: 'byte',
        lowResImageHeight: 'byte',
        depth: 'unsigned short',
        padding2: 'unsigned char[3]',
        numResources: 'unsigned int',
    }
}

export const IMAGE_FORMAT = {
	0: { type: "RGBA8888", bits: 32, compressed: false },
	1: { type: "ABGR8888", bits: 32, compressed: false },
	2: { type: "RGB888", bits: 32, compressed: false },
	3: { type: "BGR888", bits: 24, compressed: false },
	4: { type: "RGB565", bits: 16, compressed: false },
	5: { type: "I8", bits: 8, compressed: false },
	6: { type: "IA88", bits: 16, compressed: false },
	7: { type: "P8", bits: 8, compressed: false },
	8: { type: "A8", bits: 8, compressed: false },
	9: { type: "RGB888_BLUESCREEN", bits: 24, compressed: false },
	10: { type: "BGR888_BLUESCREEN", bits: 24, compressed: false },
	11: { type: "ARGB8888", bits: 32, compressed: false },
	12: { type: "BGRA8888", bits: 32, compressed: false },
	13: { type: "DXT1", bits: 4, compressed: true },
	14: { type: "DXT3", bits: 8, compressed: true },
	15: { type: "DXT5", bits: 8, compressed: true },
	16: { type: "BGRX8888", bits: 32, compressed: false },
	17: { type: "BGR565", bits: 16, compressed: false },
	18: { type: "BGRX5551", bits: 16, compressed: false },
	19: { type: "BGRA4444", bits: 16, compressed: false },
	20: { type: "DXT1_ONEBITALPHA", bits: 4, compressed: true },
	21: { type: "BGRA5551", bits: 16, compressed: false },
	22: { type: "UV88", bits: 16, compressed: false },
	23: { type: "UVWQ8888", bits: 32, compressed: false },
	24: { type: "RGBA16161616F", bits: 64, compressed: false },
	25: { type: "RGBA16161616", bits: 64, compressed: false },
	26: { type: "UVLX8888", bits: 32, compressed: false }
}

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
            const byteLength = header.width.data * header.height.data * (vtf.format.bits / 8);
            const imageDataBuffer = dataArray.slice(dataArray.byteLength - byteLength);
            vtf.imageData = imageDataBuffer;
        }

        return vtf;
    }

}