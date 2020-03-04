import { BinaryFile } from "./BinaryFile.mjs";

export default class GLBFile extends BinaryFile {

    /*  Format
    

    */

    constructor(geometry) {
        super();
        
        this.gltf = GLTFFile.fromGeometry(geometry);

        const fileLength = 0;

        const header = {
            magic: { 'unsigned int': 'glTF' },
            version: { 'unsigned int': 2 },
            length: { 'unsigned int': fileLength },
        }

        const chunkLength = 0;

        const JSON = 0x4E4F534A;
        const BIN = 0x004E4942;

        const chunkData = new Float32Array();

        // JSON chunk:
        // encode:
        // new TextEncoder().encode(JSON.stringify({ asd: 123 }))

        // decode: 
        // JSON.parse(new TextDecoder().decode(Uint8Array))

        const chunk = {
            chunkLength: { 'unsigned int': chunkLength },
            chunkType: { 'unsigned int': 'JSON' }, // or 'BIN'
            chunkData: { 'binary': chunkData },
        }
    }

}
