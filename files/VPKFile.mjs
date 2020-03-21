import { BinaryFile } from 'binary-file-lib';

// https://developer.valvesoftware.com/wiki/VPK_File_Format#Conception

const VPKHeader_v2 = {
    TreeSize: 'unsigned int',
    FileDataSectionSize: 'unsigned int',
    ArchiveMD5SectionSize: 'unsigned int',
    OtherMD5SectionSize: 'unsigned int',
    SignatureSectionSize: 'unsigned int',
}

const Structs = {
    VPKHeader_v2,
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
