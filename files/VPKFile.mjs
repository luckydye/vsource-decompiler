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

        vpk.buffer = dataArray;
        vpk.view = new DataView(dataArray);

        vpk.header = this.unserialize(vpk.view, 0, Structs.VPKHeader_v2);

        console.log(vpk.header);

        return vpk;
    }

}
