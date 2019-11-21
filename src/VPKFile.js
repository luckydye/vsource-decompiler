import { BinaryFile } from './BinaryFile';
import { Structs } from './VPKFileTypes';

// https://developer.valvesoftware.com/wiki/VPK_File_Format#Conception

const typeMapping = {
    'int': {
        type: 'Int32',
        BYTES_PER_ELEMENT: Int32Array.BYTES_PER_ELEMENT,
    },
    'long': {
        type: 'BigInt64',
        BYTES_PER_ELEMENT: BigInt64Array.BYTES_PER_ELEMENT,
    },
    'unsigned int': {
        type: 'Uint32',
        BYTES_PER_ELEMENT: Uint32Array.BYTES_PER_ELEMENT,
    },
    'float': {
        type: 'Float32',
        BYTES_PER_ELEMENT: Float32Array.BYTES_PER_ELEMENT,
    },
    'short': {
        type: 'Int16',
        BYTES_PER_ELEMENT: Int16Array.BYTES_PER_ELEMENT,
    },
    'unsigned short': {
        type: 'Uint16',
        BYTES_PER_ELEMENT: Uint16Array.BYTES_PER_ELEMENT,
    },
    'byte': {
        type: 'Int8',
        BYTES_PER_ELEMENT: Int8Array.BYTES_PER_ELEMENT,
    },
    'bool': {
        type: 'Int8',
        BYTES_PER_ELEMENT: Int8Array.BYTES_PER_ELEMENT,
    },
}

export default class VPKFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static fromDataArray(dataArray) {
        const vpk = new VPKFile();

        let readTime = performance.now();

        vpk.buffer = dataArray;
        vpk.view = new DataView(dataArray);

        let header;

        for(let i = 0; i < 100000; i++) {
            header = this.unserialize(dataArray, 0, Structs.VPKHeader_v2);
        }

        const time1 = performance.now() - readTime;
        readTime = performance.now();
        
        for(let i = 0; i < 100000; i++) {
            header = this.unserialize(vpk, 0, Structs.VPKHeader_v2);
        }

        const time2 = performance.now() - readTime;
        console.log(header);

        console.log(time1, time2, (time1 / time2).toFixed(2) + ' times faster');

        return vpk;
    }

}
