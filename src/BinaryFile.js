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

        let byteIndex = 0;
        let structData = {};

        const parseBytes = type => {
            type = type.toLocaleLowerCase();

            let data = null;
            let typeByteSize = 0;
            let typeBufferType = null;

            const structs = Object.assign(nativeStructs, this.STRUCT);

            const typeMapping = {
                'int': Int32Array,
                'long': BigInt64Array,
                'unsigned int': Uint32Array,
                'float': Float32Array,
                'short': Int16Array,
                'unsigned short': Uint16Array,
                'byte': Uint8Array,
                'bool': Uint8Array,
            }

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
                    if(type in typeMapping) {
                        typeBufferType = typeMapping[type];

                    } else if(type in structs) {
                        const bytes = byteArray.slice(byteIndex);
                        const structData = this.unserializeStruct(bytes, structs[type]);
                        byteIndex += structData.byteSize;
                        data = structData.data;

                    } else {
                        throw new Error('Unknown data type "' + type + '"');
                    }
                }
            }

            if(typeBufferType) {
                typeByteSize = typeBufferType.BYTES_PER_ELEMENT;
                data = new typeBufferType(byteArray.slice(byteIndex, byteIndex + typeByteSize))[0];
            }

            byteIndex += typeByteSize;

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
            let type = struct[key];

            const typeCount = type.split(',').length;

            type = type.split(',')[0];

            for(let i = 0; i < typeCount; i++) {
                if(typeCount > 1) {
                    structData[key + '_' + i] = parseType(type);
                } else {
                    structData[key] = parseType(type);
                }
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
