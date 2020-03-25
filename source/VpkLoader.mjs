import VPKFile from "../files/valve/VPKFile.mjs";

export default class VpkLoader {

    constructor() {
        
    }

    async loadVPK(fileBuffer) {
        const vpk = VPKFile.fromDataArray(fileBuffer);
        return vpk;
    }

}
