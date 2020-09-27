import { BinaryFile } from "@luckydye/binary-file-lib";
import GLTFFile from "./GLTFFile.mjs";

const TPYE_JSON = 0x4E4F534A;
const TYPE_BIN = 0x004E4942;

export default class GLBFile extends GLTFFile {

    static fromFile(fileBuffer) {
        const data = BinaryFile.unserialize(new DataView(fileBuffer), 0, {
            magic: 'char[4]',
            version: 'unsigned int',
            length: 'unsigned int',
            jsonChunkLength: 'unsigned int',
            jsonChunkType: 'unsigned int',
            jsonChunkData: 'byte[jsonChunkLength]',
            binChunkLength: 'unsigned int',
            binChunkType: 'unsigned int',
            binChunkData: 'byte[binChunkLength]'
        });

        // turn into file...
        return data;
    }

    createBuffer(bufferArray) {
        const gltfBuffer = {
            byteLength: bufferArray.byteLength,
        }
        this.buffers.push(bufferArray);
        return this.asset.buffers.push(gltfBuffer) - 1;
    }

    decodeJsonChunk(chunkBuffer) {
        return new TextDecoder().decode(chunkBuffer);
    }

    encodeJsonChunk() {

        const jsonEncodedData = new TextEncoder().encode(JSON.stringify(this.asset));
        const jsonPaddingLength = 4 - (jsonEncodedData.byteLength % 4);

        const jsonBinaryData = new Uint8Array(jsonEncodedData.byteLength + jsonPaddingLength);
        jsonBinaryData.set(jsonEncodedData, 0);

        for(let i = jsonEncodedData.byteLength; i < jsonEncodedData.byteLength + jsonPaddingLength; i++) {
            jsonBinaryData.set([ 0x20 ], i);
        }

        const jsonChunkHeader = {
            chunkLength: { 'unsigned int': jsonBinaryData.byteLength },
            chunkType: { 'unsigned int': TPYE_JSON }, // or 'JSON'
        }

        const headerBuffer = BinaryFile.serialize(jsonChunkHeader);

        const buffer = new Uint8Array(headerBuffer.byteLength + jsonBinaryData.byteLength);
        buffer.set(new Uint8Array(headerBuffer), 0);
        buffer.set(jsonBinaryData, headerBuffer.byteLength);

        return buffer;
    }

    encodeBinaryChunk() {

        let binaryDataLength = 0;
        for(let buffer of this.asset.buffers) {
            binaryDataLength += buffer.byteLength;
        }

        const binaryDataPaddingLength = 4 - (binaryDataLength % 4);
        const binaryData = new Float32Array(binaryDataLength + binaryDataPaddingLength);

        let bufferStartIndex = 0;

        for(let buffer of this.buffers) {
            binaryData.set(buffer, bufferStartIndex);
            bufferStartIndex += buffer.byteLength;
        }

        const binaryChunkHeader = {
            chunkLength: { 'unsigned int': binaryData.byteLength },
            chunkType: { 'unsigned int': TYPE_BIN }, // or 'BIN'
        }

        const headerBuffer = BinaryFile.serialize(binaryChunkHeader);

        const buffer = new Uint8Array(headerBuffer.byteLength + binaryData.byteLength);
        buffer.set(new Uint8Array(headerBuffer), 0);
        buffer.set(new Uint8Array(binaryData.buffer), headerBuffer.byteLength);

        return buffer;
    }

    toBinary() {
        const jsonBinaryData = this.encodeJsonChunk();
        const binaryData = this.encodeBinaryChunk();

        const glbHeader = {
            magic: { 'unsigned int': 0x46546C67 }, // 0x46546C67 = "glTF"
            version: { 'unsigned int': 2 },
            length: { 
                'unsigned int': 12 + jsonBinaryData.byteLength + binaryData.byteLength
            },
        }

        const fileHeaderBuffer = BinaryFile.serialize(glbHeader);


        const fileBuffer = new Uint8Array(
            fileHeaderBuffer.byteLength +
            jsonBinaryData.byteLength +
            binaryData.byteLength
        );

        fileBuffer.set(new Uint8Array(fileHeaderBuffer), 0);
        fileBuffer.set(jsonBinaryData, fileHeaderBuffer.byteLength);
        fileBuffer.set(binaryData, fileHeaderBuffer.byteLength + jsonBinaryData.byteLength);

        return fileBuffer.buffer;
    }

    constructor() {
        super();

        this.buffers = [];
    }

}
