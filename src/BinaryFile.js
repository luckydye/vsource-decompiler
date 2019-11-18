const nativeStructs = {
    vector: {
        0: 'float',
        1: 'float',
        2: 'float',
    },
    vector4d: {
        0: 'float',
        1: 'float',
        2: 'float',
        3: 'float',
    },
    vector2d: {
        0: 'float',
        1: 'float',
    },
    color32: {
        0: 'byte',
        1: 'byte',
        2: 'byte',
        3: 'byte',
    },
}

// Resolving data types chain:
// -> typeMapping (int, float ... to TypedArray)
// -> nativeStructs (vector, color32 ..)
// -> File Structs
// -> throw Error "type not found"

const typeMapping = {
    'int': {
        type: 'Int32',
        BYTES_PER_ELEMENT: Int32Array.BYTES_PER_ELEMENT,
    },
    'long': {
        type: 'BigInt64',
        BYTES_PER_ELEMENT: BigInt64Array.BYTES_PER_ELEMENT,
    },
    'unsigned int': {
        type: 'Uint32',
        BYTES_PER_ELEMENT: Uint32Array.BYTES_PER_ELEMENT,
    },
    'float': {
        type: 'Float32',
        BYTES_PER_ELEMENT: Float32Array.BYTES_PER_ELEMENT,
    },
    'short': {
        type: 'Int16',
        BYTES_PER_ELEMENT: Int16Array.BYTES_PER_ELEMENT,
    },
    'unsigned short': {
        type: 'Uint16',
        BYTES_PER_ELEMENT: Uint16Array.BYTES_PER_ELEMENT,
    },
    'byte': {
        type: 'Int8',
        BYTES_PER_ELEMENT: Int8Array.BYTES_PER_ELEMENT,
    },
    'bool': {
        type: 'Int8',
        BYTES_PER_ELEMENT: Int8Array.BYTES_PER_ELEMENT,
    },
}

export class BinaryFile {

    static Uint32ToBytes(int) {
        const bytes = [0, 0, 0, 0];
    
        bytes[0] = (int >> 24) & 0xFF;
        bytes[1] = (int >> 16) & 0xFF;
        bytes[2] = (int >> 8) & 0xFF;
        bytes[3] = int & 0xFF;
    
        return bytes;
    }

    static unserializeStruct(byteArray, struct) {

        const dataView = new DataView(byteArray);

        let byteIndex = 0;
        let structData = {};

        const parseBytes = type => {
            let data = null;

            switch (type) {

                case 'char': {
                    data = String.fromCharCode(parseBytes('byte'));
                    break;
                }

                case 'unsigned char': {
                    data = [];
                    for(let i = 0; i < 255; i++) {
                        const byte = parseBytes('byte');
                        if(byte == 0x00) {
                            break;
                        } else {
                            data.push(String.fromCharCode(byte));
                        }
                    }
                    data = data.join("");
                    break;
                }
                
                default: {
                    if(typeMapping[type]) {
                        data = dataView['get' + typeMapping[type].type](byteIndex, true);
                        byteIndex += typeMapping[type].BYTES_PER_ELEMENT;

                    } else if(this.STRUCT[type]) {
                        const structData = this.unserializeStruct(byteArray.slice(byteIndex), this.STRUCT[type]);
                        byteIndex += structData.byteSize;
                        data = structData.data;

                    } else if(nativeStructs[type]) {
                        const structData = this.unserializeStruct(byteArray.slice(byteIndex), nativeStructs[type]);
                        byteIndex += structData.byteSize;
                        data = structData.data;

                    } else {
                        throw new Error('Unknown data type "' + type + '"');
                    }
                }
            }

            return data;
        }

        const parseType = type => {
            const isArray = type[type.length-1] == "]";
            if(isArray) {
                let arrayData = [];

                const arrayIdentifier = type.match(/\[[0-9a-zA-Z_]+\]/g)[0];
                const arrayDataType = type.replace(arrayIdentifier, '');

                let arrayLength = arrayIdentifier.replace(/(\[|\])/g, '');

                if(isNaN(arrayLength)) {
                    if(arrayLength in structData) {
                        arrayLength = structData[arrayLength];
                    } else if(arrayLength in this) {
                        arrayLength = this[arrayLength];
                    } else {
                        throw new Error('Invalid type array length');
                    }
                } else {
                    arrayLength = parseInt(arrayLength);
                }

                for(let i = 0; i < arrayLength; i++) {
                    arrayData[i] = parseType(arrayDataType);
                }

                if(arrayDataType == "char") {
                    arrayData = arrayData.join("");
                }

                return arrayData;
            } else {
                return parseBytes(type);
            }
        }

        for(let key in struct) {
            const typeArray = struct[key].split(',');
            const typeCount = typeArray.length;
            const type = typeArray[0];

            if(typeCount > 1) {
                for(let i = 0; i < typeCount; i++) {
                    structData[key + '_' + i] = parseType(type);
                }
            } else {
                structData[key] = parseType(type);
            }
        }

        return {
            byteSize: byteIndex,
            data: structData
        };
    }

    static unserializeStructArray(lumpBuffer, struct) {
        const structs = [];

        const lumpByteSize = lumpBuffer.byteLength;

        let lastByteOffset = 0;
        let guessByteSize = 255;

        while(lastByteOffset < lumpByteSize) {
            const byteArray = lumpBuffer.slice(lastByteOffset, lastByteOffset + guessByteSize);

            const structData = this.unserializeStruct(byteArray, struct);

            guessByteSize = structData.byteSize;
            lastByteOffset += structData.byteSize;

            structs.push(structData.data);
        }

        return structs;
    }

    static unserializeASCILump(lumpBuffer) {
        return String.fromCharCode(...new Uint8Array(lumpBuffer));
    }

    static fromDataArray(dataArray) {
        const file = new BinaryFile();
        file.source = dataArray;
        return file;
    }

}
