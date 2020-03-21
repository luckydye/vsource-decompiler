import VPKFile from "../files/VPKFile.mjs";

export default class VpkLoader {

    constructor(fileSystem) {
        this.fileSystem = fileSystem;
    }

    async loadVPK(vpkPath) {
        const vpkFetch = await this.fileSystem.getFile(vpkPath);
        const vpkData = await vpkFetch.arrayBuffer();
        const vpk = VPKFile.fromDataArray(vpkData);
        return vpk;
    }

}
