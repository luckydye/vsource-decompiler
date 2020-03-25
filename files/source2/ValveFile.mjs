import { BinaryFile } from 'binary-file-lib';

const FileHeader = {
    size: 'unsigned int',
    headerVersion: 'unsigned short',
    version: 'unsigned short',
    blockOffset: 'unsigned int',
    blockCount: 'unsigned int',
    blockType: 'char[4]',
}

export default class ValveFile extends BinaryFile {

    static parseFile(vmt) {

        const header = this.unserialize(vmt, 0, FileHeader);

        console.log(header);

    }

}
