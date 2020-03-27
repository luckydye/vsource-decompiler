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

        file.header = {
            magic: this.getValue(header, 'magic'),
            demProtocol: this.getValue(header, 'demProtocol'),
            netProtocol: this.getValue(header, 'netProtocol'),
            serverName: this.getValue(header, 'serverName').replace(/\u0000+/g, ''),
            clientName: this.getValue(header, 'clientName').replace(/\u0000+/g, ''),
            mapName: this.getValue(header, 'mapName').replace(/\u0000+/g, ''),
            gameDirectory: this.getValue(header, 'gameDirectory').replace(/\u0000+/g, ''),
            playbackTime: this.getValue(header, 'playbackTime'),
            ticks: this.getValue(header, 'ticks'),
            frames: this.getValue(header, 'frames'),
            signOnLength: this.getValue(header, 'signOnLength'),
        }

        console.log(file.header);
    }

}
