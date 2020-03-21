import BSPFile from "../files/BSPFile.mjs";

export default class PakLoader {

    constructor(fileSystem) {
        this.fileSystem = fileSystem;
    }

    async loadPakfile(mapName) {
        const mapPath = `maps/${mapName}.bsp`;
        log('Loading map', mapPath);

        const map = await this.fileSystem.getFile(mapPath);
        const bsp = BSPFile.fromDataArray(await map.arrayBuffer());

        log('Reading pakfile...');
        const pakfile = Buffer.from(bsp.pakfile.buffer);
        
        return pakfile;
    }

}
