import { BinaryFile } from 'binary-file-lib';

const FileHeader = {
    size: 'unsigned int',
    headerVersion: 'unsigned short',
    version: 'unsigned short',
}

const FileBlockInfo = {
    blockOffset: 'unsigned int',
    blockCount: 'unsigned int',
}

const FileBlock = {
    blockType: 'char[4]',
    offset: 'unsigned int',
    size: 'unsigned int',
}

const BlockTypes = {
    RERL: 'RERL',
    REDI: 'REDI',
    NTRO: 'NTRO',
    DATA: 'DATA',
    VBIB: 'VBIB',
    VXVS: 'VXVS',
    SNAP: 'SNAP',
    CTRL: 'CTRL',
    MDAT: 'MDAT',
    MRPH: 'MRPH',
    MBUF: 'MBUF',
    ANIM: 'ANIM',
    ASEQ: 'ASEQ',
    AGRP: 'AGRP',
    PHYS: 'PHYS',
}

export default class ValveFile extends BinaryFile {

    static parseFile(file) {

        const header = this.unserialize(file, 0, FileHeader);

        console.log(header);

        if(this.getValue(header, 'headerVersion') !== 12) {
            throw new Error('unknown version');
        }

        const blockInfo = this.unserialize(file, header.byteOffset, FileBlockInfo);
        const blockOffset = this.getValue(blockInfo, 'blockOffset');
        const blockCount = this.getValue(blockInfo, 'blockCount');

        const blocks = this.unserializeArray(file, header.byteOffset + blockOffset, FileBlock, blockCount);

        file.blocks = [];

        for(let block of blocks) {
            const type = this.getValue(block, 'blockType');
            const offset = block.blockType.byteOffset + this.getValue(block, 'offset');
            const size = this.getValue(block, 'size');

            if(size > 0) {
                file.blocks.push({
                    type,
                    offset, 
                    size,
                });
            }
        }

        for(let block of file.blocks) {
            this.readBlock(file, block);
        }
    }

    static readBlock(file, block) {

        console.log(block.type);

        if(block.type == BlockTypes.VBIB) {

        }

        if(block.type == BlockTypes.DATA) {

        }

        if(block.type == BlockTypes.RERL) {

            // const info = this.unserialize(file, block.offset, {
            //     offset: 'unsigned int',
            //     size: 'unsigned int',
            // });

            // const blockData = this.unserialize(file, block.offset, {
            //     offset: 'unsigned int',
            //     size: 'unsigned int',
            //     id: 'long',
            //     offset: 'long',
            //     name: 'unsigned char'
            // });

            // console.log(blockData);

        }

        if(block.type == BlockTypes.REDI) {

            // console.log(block.size);

            // const blockData = this.unserializeArray(file, block.offset, {
            //     offset: 'unsigned int',
            //     size: 'unsigned int'
            // }, block.size / 8);

        }
    }

}
