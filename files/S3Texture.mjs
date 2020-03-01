import { BinaryFile } from "./BinaryFile.mjs";

// https://www.khronos.org/opengl/wiki/S3_Texture_Compression

export class S3Texture extends BinaryFile {

    static fromDataArray(buffer, format, width, height) {
        return new S3Texture(buffer, format, width, height);
    }

    static decompressDXT1(s3texture) {
        
    }

    static decompressDXT3(s3texture) {

    }

    static decompressDXT5(s3texture) {

    }

    constructor(buffer, format, width, height) {
        super();

        this.view = new DataView(buffer);
        this.format = format;
        this.width = width;
        this.height = height;
    }

    decompress() {
        if(this.format === "DXT1")
            return S3Texture.decompressDXT1(this);
            
        if(this.format === "DXT3")
            return S3Texture.decompressDXT3(this);
            
        if(this.format === "DXT5")
            return S3Texture.decompressDXT5(this);
    }

    toBlob(mimeType = "image/png") {
        return new Blob();
    }

}
