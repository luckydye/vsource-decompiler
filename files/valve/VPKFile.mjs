import { BinaryFile } from "@luckydye/binary-file-lib";
import { VPK } from './VPKStructure.mjs';

// https://developer.valvesoftware.com/wiki/VPK_File_Format#Conception

const vpkBufferCache = new Map();

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

            // if(fileData.data.Terminator.valueOf() !== 0xffff) {
            //     throw new Error('Failed parsing VPK.');
            // }

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
                preloadData: vpk.buffer.slice(
                    fileData.data.Terminator.byteOffset,
                    fileData.data.Terminator.byteOffset + fileData.data.PreloadBytes.valueOf()
                ),
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

        vpk._buffer = dataArray;
        vpk.view = new DataView(vpk._buffer);

        const versionSig = this.unserialize(vpk.view, 0, {
            Signature: 'unsigned int',
            Version: 'unsigned int',
        });

        if(versionSig.data.Signature.valueOf() != 0x55aa1234) {
            throw new Error('Wrong signature on .vpk');
        }

        switch(versionSig.data.Version.valueOf()) {
            case 1:
                vpk.header = this.unserialize(vpk.view, 0, VPK.VPKHeader_v1);
                break;
            case 2:
                vpk.header = this.unserialize(vpk.view, 0, VPK.VPKHeader_v2);
                break;
            default:
                vpk.header = this.unserialize(vpk.view, 0, VPK.VPKHeader_Unknown);
        }

        vpk.files = this.deserializeNodeTree(vpk, vpk.header.byteOffset);
        vpk.archives = [];

        return vpk;
    }

    addArchive(index, archiveFile) {
        this.archives[index] = archiveFile;
    }

    async getFile(fileKey) {
        const file = this.files[fileKey];
        const archiveIndex = file.ArchiveIndex;

        let archive = this.archives[archiveIndex];

        if(archiveIndex == 0x7fff) {

            const dataOffset = this.header.byteOffset + this.header.data.TreeSize.valueOf();

            const index = file.EntryOffset + dataOffset;
            const len = file.EntryLength;
            
            if(len > 0) {
                return this._buffer.slice(index, index + len);
            } else {
                return file.preloadData;
            }

        } else if(!archive) {
            throw new Error('Missing Archive ' + archiveIndex);
        }

        let buffer = null;

        if(vpkBufferCache.has(archiveIndex)) {
            buffer = vpkBufferCache.get(archiveIndex);
        } else {
            buffer = await archive.arrayBuffer();
            vpkBufferCache.set(archiveIndex, buffer);
        }

        const index = file.EntryOffset;
        const len = file.EntryLength;

		if (file.PreloadBytes !== 0) {
            return this.concatenate(file.preloadData, buffer.slice(index, index + len));
        }
        return buffer.slice(index, index + len);
    }
	
	concatenate(buffer1, buffer2) {
        var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
        return tmp.buffer;
    }

}
