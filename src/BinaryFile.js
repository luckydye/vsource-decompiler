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

// Resolving data types chain:
// -> typeMapping (int, float ... to TypedArray)
// -> nativeStructs (vector, color32 ..)
// -> File Structs
// -> throw Error "type not found"

export class BinaryFile {

    static Uint32ToBytes(int) {
        const bytes = [0, 0, 0, 0];
    
        bytes[0] = (int >> 24) & 0xFF;
        bytes[1] = (int >> 16) & 0xFF;
        bytes[2] = (int >> 8) & 0xFF;
        bytes[3] = int & 0xFF;
    
        return bytes;
    }

    static parseBytes(binary, byteOffset, type) {
        let data = null;

        if(type == 'char') {
            const byte = this.parseBytes(binary, byteOffset, 'byte');
            byteOffset = byte.byteOffset;
            data = String.fromCharCode(byte.data);

        } else if(type == 'unsigned char') {
            data = [];
            for(let i = 0; i < 255; i++) {
                const byte = this.parseBytes(binary, byteOffset, 'byte');
                byteOffset = byte.byteOffset;
                if(byte.data == 0x00) {
                    break;
                } else {
                    data.push(String.fromCharCode(byte.data));
                }
            }
            data = data.join("");

        } else {
            if(typeMapping[type]) {
                data = binary['get' + typeMapping[type].type](byteOffset, true);
                byteOffset += typeMapping[type].BYTES_PER_ELEMENT;

            } else if(this.STRUCT[type]) {
                const structData = this.unserialize(binary, byteOffset, this.STRUCT[type]);
                byteOffset = structData.byteOffset;
                data = structData.data;

            } else if(nativeStructs[type]) {
                const structData = this.unserialize(binary, byteOffset, nativeStructs[type]);
                byteOffset = structData.byteOffset;
                data = structData.data;

            } else {
                throw new Error('Unknown data type "' + type + '"');
            }
        }

        return { data, byteOffset };
    }

    static parseType(binary, byteOffset, type, inputs) {
        if(type[type.length-1] == "]") { // is array ?
            let arrayData = [];

            const arrayIdentifier = type.match(/\[[0-9a-zA-Z_]+\]/g)[0];
            const arrayDataType = type.replace(arrayIdentifier, '');

            let arrayLength = arrayIdentifier.replace(/(\[|\])/g, '');

            if(isNaN(arrayLength)) {
                if(arrayLength in inputs) {
                    arrayLength = inputs[arrayLength].data;
                } else if(arrayLength in this) {
                    arrayLength = this[arrayLength];
                } else {
                    throw new Error('Invalid type array length');
                }
            } else {
                arrayLength = parseInt(arrayLength);
            }

            for(let i = 0; i < arrayLength; i++) {
                const parsed = this.parseType(binary, byteOffset, arrayDataType, inputs);
                byteOffset = parsed.byteOffset;
                arrayData[i] = parsed.data;
            }

            if(arrayDataType == "char") {
                arrayData = arrayData.join("");
            }

            return {
                byteOffset,
                data: arrayData
            };

        } else {
            if(typeMapping[type] && binary.byteLength < byteOffset + typeMapping[type].BYTES_PER_ELEMENT) {
                throw new Error(`${type} to ${byteOffset + typeMapping[type].BYTES_PER_ELEMENT} offset out of bounds of ${binary.byteLength-1}`);
            }

            return this.parseBytes(binary, byteOffset, type);
        }
    }

    static unserialize(binary, byteOffset = 0, struct) {

        const structData = {};

        for(let key in struct) {
            const typeArray = struct[key].split(',');
            const typeCount = typeArray.length;
            const type = typeArray[0];

            if(typeCount > 1) {
                for(let i = 0; i < typeCount; i++) {
                    const parsedType = this.parseType(binary, byteOffset, type, structData);
                    byteOffset = parsedType.byteOffset;
                    structData[key + '_' + i] = parsedType.data;
                }
            } else {
                const parsedType = this.parseType(binary, byteOffset, type, structData);
                byteOffset = parsedType.byteOffset;
                structData[key] = parsedType;
            }
        }

        return {
            byteOffset: byteOffset,
            data: structData
        };
    }

    static unserializeArray(binary, byteOffset = 0, struct, count = 0) {
        const structs = [];

        let bytesPerElement = 0;

        if(count === 0) {
            const structData = this.unserialize(binary, byteOffset, struct);
            byteOffset = structData.byteOffset;
            bytesPerElement = structData.byteOffset;
            structs.push(structData.data);

            count = (binary.byteLength / bytesPerElement) - 1;
        }
        
        for(let i = 0; i < count; i++) {
            const byteStartOffset = byteOffset;
            const structData = this.unserialize(binary, byteOffset, struct);
            byteOffset = structData.byteOffset;
            structData.data.byteOffset = byteStartOffset;
            structs.push(structData.data);
        }

        return structs;
    }

    static unserializeASCI(lumpBuffer) {
        let string = "";
        const buff = new Uint8Array(lumpBuffer.buffer);

        for(let b of buff) {
            string += String.fromCharCode(b);
        }
        
        return string;
    }

    static createFile(dataArray) {
        const file = new this();
        file.buffer = dataArray;
        file.view = new DataView(dataArray);
        return file;
    }

    static fromDataArray(dataArray) {
        return this.createFile(dataArray);
    }

    static async fetch(path) {
        return fetch(path).then(async res => {
            if(res.status == 200) {
                const dataArray = await res.arrayBuffer();
                const file = this.fromDataArray(dataArray);
                return file;
            }
        });
    }

}
