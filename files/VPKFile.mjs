import { BinaryFile } from 'binary-file-lib';
import { VPK } from './VPKStructure.mjs';

// https://developer.valvesoftware.com/wiki/VPK_File_Format#Conception

export default class VPKFile extends BinaryFile {

    static deserializeNodeTree(vpk, offset) {

        const files = {};

        let fileType;
        let filePath;
        let fileName;

        const readString = () => {
            const string = this.parseType(vpk.view, offset, 'unsigned char');
            offset = string.byteOffset;

            return string.valueOf() == "" ? null : string;
        }

        const readFile = () => {
            const fileData = this.unserialize(vpk.view, fileName.byteOffset, VPK.VPKDirectoryEntry);

            const preloadBytes = fileData.data.PreloadBytes.valueOf();
            const followsDirectory = fileData.data.ArchiveIndex.valueOf() === 0x7fff;

            if(fileData.data.Terminator.valueOf() !== 0xffff) {
                throw new Error('Failed parsing VPK.');
            }

            const entryOffset = fileData.data.EntryOffset.valueOf();
            const entryLength = fileData.data.EntryLength.valueOf();

            offset = fileData.byteOffset + preloadBytes;

            const filePathName = filePath.valueOf() + "/" + 
                                 fileName.valueOf() + "." +
                                 fileType.valueOf();

            files[filePathName] = {
                CRC: fileData.data.CRC.valueOf(),
                PreloadBytes: fileData.data.PreloadBytes.valueOf(),
                ArchiveIndex: fileData.data.ArchiveIndex.valueOf(),
                EntryOffset: fileData.data.EntryOffset.valueOf(),
                EntryLength: fileData.data.EntryLength.valueOf(),
                Terminator: fileData.data.Terminator.valueOf(),
            };

            return true;
        }

        while(true) {
            fileType = readString();
            if(!fileType) break;

            while(true) {
                filePath = readString();
                if(!filePath) break;

                while(true) {
                    fileName = readString();
                    if(fileName) {
                        readFile();
                    } else {
                        break;
                    }
                }
            }
        }

        return files;
    }

    static fromDataArray(dataArray) {
        const vpk = new VPKFile();

        vpk.buffer = dataArray;
        vpk.view = new DataView(dataArray);

        vpk.header = this.unserialize(vpk.view, 0, VPK.VPKHeader_v2);

        // const dataOffset = vpk.header.byteOffset + vpk.header.data.TreeSize.valueOf();

        vpk.files = this.deserializeNodeTree(vpk, vpk.header.byteOffset);

        return vpk;
    }

}
