import { BinaryFile } from 'binary-file-lib';

const FileHeader = {
    magic: 'char[8]',
    demProtocol: 'unsigned int',
    netProtocol: 'unsigned int',
    serverName: 'char[260]',
    clientName: 'char[260]',
    mapName: 'char[260]',
    gameDirectory: 'char[260]',
    playbackTime: 'float',
    ticks: 'unsigned int',
    frames: 'unsigned int',
    signOnLength: 'unsigned int',
}

export default class DEMFile extends BinaryFile {

    static parseFile(file) {

        const header = this.unserialize(file, 0, FileHeader);

        console.log(header);

    }

}
