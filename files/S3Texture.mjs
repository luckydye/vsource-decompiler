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

    static fromDDS(buffer) {

        const view = new DataView(buffer);

        const DDS_HEADER = {
            dwMagic: 'char[4]',
            dwSize: 'unsigned int',
            dwFlags: 'unsigned int',
            dwHeight: 'unsigned int',
            dwWidth: 'unsigned int',
            dwPitchOrLinearSize: 'unsigned int',
            dwDepth: 'unsigned int',
            dwMipMapCount: 'unsigned int',
            dwReserved1: 'unsigned int[11]',
            dwSize_: 'unsigned int',
            dwFlags_: 'unsigned int',
            dwFourCC: 'char[4]',
            dwRGBBitCount: 'unsigned int',
            dwRBitMask: 'unsigned int',
            dwGBitMask: 'unsigned int',
            dwBBitMask: 'unsigned int',
            dwABitMask: 'unsigned int',
            dwCaps: 'unsigned int',
            dwCaps2: 'unsigned int',
            dwCaps3: 'unsigned int',
            dwCaps4: 'unsigned int',
            dwReserved2: 'unsigned int',
        }

        const header = S3Texture.unserialize(view, 0, DDS_HEADER);

        const tex = this.fromDataArray(
            new DataView(
                buffer, 
                header.byteOffset
            ),
            header.data.dwFourCC.data,
            header.data.dwWidth.data,
            header.data.dwHeight.data
        );

        tex.header = header;

        return tex;
    }

    decompress() {
        if(this.format === "DXT1")
            return S3Texture.decompressDXT1(this);
            
        if(this.format === "DXT3")
            return S3Texture.decompressDXT3(this);
            
        if(this.format === "DXT5")
            return S3Texture.decompressDXT5(this);
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

        // for a compressed texture, use the DDSD_LINEARSIZE and DDPF_FOURCC flags
        // 524288

        const DDS_PIXELFORMAT = {
            dwSize: { 'unsigned int': 32 },
            dwFlags: { 'unsigned int': DDPF_FOURCC },
            dwFourCC: { 'unsigned int': this.format },
            dwRGBBitCount: { 'unsigned int': 0 },
            dwRBitMask: { 'unsigned int': 0 },
            dwGBitMask: { 'unsigned int': 0 },
            dwBBitMask: { 'unsigned int': 0 },
            dwABitMask: { 'unsigned int': 0 },
        }

        const DDS_HEADER = {
            dwMagic: { 'unsigned int': "DDS " }, // 0x20534444 = "DDS "
            dwSize: { 'unsigned int': 124 },
            dwFlags: { 'unsigned int': 
                DDSD_LINEARSIZE + 
                DDSD_PIXELFORMAT + 
                DDSD_WIDTH + 
                DDSD_HEIGHT + 
                DDSD_CAPS
            },
            dwHeight: { 'unsigned int': this.height },
            dwWidth: { 'unsigned int': this.width },
            dwPitchOrLinearSize: { 'unsigned int': this.view.byteLength },
            dwDepth: { 'unsigned int': 0 },
            dwMipMapCount: { 'unsigned int': 0 },
            dwReserved1: { 'unsigned int': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            ddspf: { struct: DDS_PIXELFORMAT },
            dwCaps: { 'unsigned int': DDSCAPS_TEXTURE },
            dwCaps2: { 'unsigned int': 0 },
            dwCaps3: { 'unsigned int': 0 },
            dwCaps4: { 'unsigned int': 0 },
            dwReserved2: { 'unsigned int': 0 },
        }

        const serializedData = [];
        S3Texture.serialize(serializedData, DDS_HEADER);

        const headerBuffer = S3Texture.serializeData(serializedData);
        const ddsBuffer = S3Texture.concatBuffer(
            headerBuffer, 
            this.view.buffer.slice(this.view.byteOffset, this.view.byteOffset + this.view.byteLength)
        );

        return ddsBuffer;
    }

}
