import BSPFile from "../files/source/BSPFile.mjs";

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
        const pakfile = new DataView(bsp.pakfile.buffer);
        
        return pakfile;
    }

}
