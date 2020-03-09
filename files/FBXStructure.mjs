export const FBX = {
    header: {
        magic: 'unsigned char',
        unknown: 'byte[2]',
        version: 'unsigned int',
    },
    nodeRecord: {
        endOffset: 'int',
        numProperties: 'int',
        propertyListLen: 'int',
        nameLen: 'byte',
        name: 'char[nameLen]',
        
        propertyData: 'byte[propertyListLen]',
        // ... properties || Property[n], for n in 0:PropertyListLen
    },
    propertyRecord: {
        typeCode: 'char[1]',
    },
}
