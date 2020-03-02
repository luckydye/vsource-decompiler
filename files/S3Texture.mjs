import { BinaryFile } from "./BinaryFile.mjs";

// https://www.khronos.org/opengl/wiki/S3_Texture_Compression
// https://docs.microsoft.com/en-us/windows/win32/direct3ddds/dds-file-layout-for-textures

export class S3Texture extends BinaryFile {

    static decompressDXT1(s3texture) { }

    static decompressDXT3(s3texture) { }

    static decompressDXT5(s3texture) { }

    static fromDataArray(dataView, format, width, height) {
        const file = this.createFile(dataView);

        file.format = format;
        file.width = width;
        file.height = height;

        return file;
    }

    constructor(dataView, format, width, height) {
        super();

        this.view = this;
        this.format = format;
        this.width = width;
        this.height = height;
    }

    read() {
        // const header = S3Texture.unserialize(this.view, 0, {
        //     dword: "int",
        //     dwSize: "int",
        //     dwFlags: "int",
        //     dwHeight: "int",
        //     dwWidth: "int",
        // });

        // console.log(header);
    }

    toDDS() {

        /*  Filestructure:

            DWORD               dwMagic;
            DDS_HEADER          header;
            BYTE bdata[]        main surface data;
            BYTE bdata2[]       remaining surfaces;
        */

        const DDSD_CAPS = 0x1,
              DDSD_HEIGHT = 0x2,
              DDSD_WIDTH = 0x4,
              DDSD_PITCH = 0x8,
              DDSD_PIXELFORMAT = 0x1000,
              DDSD_MIPMAPCOUNT = 0x20000,
              DDSD_LINEARSIZE = 0x80000,
              DDSD_DEPTH = 0x800000;

        const DDPF_ALPHAPIXELS = 0x1,
              DDPF_ALPHA = 0x2,
              DDPF_FOURCC = 0x4,
              DDPF_RGB = 0x40,
              DDPF_YUV = 0x200,
              DDPF_LUMINANCE = 0x20000;

        const DDSCAPS_COMPLEX = 0x8,
              DDSCAPS_MIPMAP = 0x400000,
              DDSCAPS_TEXTURE = 0x1000;

        const DDSCAPS2_CUBEMAP = 0x200,
              DDSCAPS2_CUBEMAP_POSITIVEX = 0x400,
              DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800,
              DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000,
              DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000,
              DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000,
              DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000,
              DDSCAPS2_VOLUME = 0x200000;

        const DDS_PIXELFORMAT = {
            dwSize: 32,
            dwFlags: DDPF_FOURCC,
            dwFourCC: this.format,
            dwRGBBitCount: 0,
            dwRBitMask: 0,
            dwGBitMask: 0,
            dwBBitMask: 0,
            dwABitMask: 0,
        }

        const DDS_HEADER = {
            dword: 'DDS',
            dwSize: 124,
            // for a compressed texture, use the DDSD_LINEARSIZE and DDPF_FOURCC flags
            dwFlags: DDSD_LINEARSIZE,
            dwHeight: this.height,
            dwWidth: this.width,
            dwPitchOrLinearSize: this.view.byteLength,
            dwDepth: 0,
            dwMipMapCount: 0,
            dwReserved1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ddspf: DDS_PIXELFORMAT,
            dwCaps: DDSCAPS_TEXTURE,
            dwCaps2: 0,
            dwCaps3: 0,
            dwCaps4: 0,
            dwReserved2: 0,
        }

        console.log(DDS_HEADER, this.view);


        S3Texture.serialize(DDS_HEADER, this.view);
    }

    decompress() {
        if(this.format === "DXT1")
            return S3Texture.decompressDXT1(this);
            
        if(this.format === "DXT3")
            return S3Texture.decompressDXT3(this);
            
        if(this.format === "DXT5")
            return S3Texture.decompressDXT5(this);
    }

}
