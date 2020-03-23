import VPKFile from "../files/VPKFile.mjs";

export default class VpkLoader {

    constructor() {
        
    }

    async loadVPK(fileBuffer) {
        const vpk = VPKFile.fromDataArray(fileBuffer);
        return vpk;
    }

}
