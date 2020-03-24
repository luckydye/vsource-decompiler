export const VPK =  {

    VPKHeader_v1: {
        Signature: 'unsigned int',
        Version: 'unsigned int',
        TreeSize: 'unsigned int',
    },

    VPKHeader_v2: {
        Signature: 'unsigned int',
        Version: 'unsigned int',
        TreeSize: 'unsigned int',
        FileDataSectionSize: 'unsigned int',
        ArchiveMD5SectionSize: 'unsigned int',
        OtherMD5SectionSize: 'unsigned int',
        SignatureSectionSize: 'unsigned int',
    },
    
    VPKDirectoryEntry: {
        CRC: 'unsigned int',
        PreloadBytes: 'unsigned short',
        ArchiveIndex: 'unsigned short',
        EntryOffset: 'unsigned int',
        EntryLength: 'unsigned int',
        Terminator: 'unsigned short',
    },
    
    VPK_ArchiveMD5SectionEntry: {
        ArchiveIndex: 'unsigned int',
        StartingOffset: 'unsigned int',
        Count: 'unsigned int',
        MD5Checksum: 'char[16]',
    },
    
    VPK_OtherMD5Section: {
        TreeChecksum: 'char[16]',
        ArchiveMD5SectionChecksum: 'char[16]',
        Unknown: 'char[16]',
    },
    
    VPK_SignatureSection: {
        PublicKeySize: 'unsigned int',
        PublicKey: 'char[PublicKeySize]',

        SignatureSize: 'unsigned int',
        Signature: 'char[SignatureSize]',
    },

}
