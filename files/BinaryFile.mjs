// Resolving data types chain:
// -> typeMapping (int, float ... to TypedArray)
// -> nativeStructs (vector, color32 ..)
// -> File Structs
// -> throw Error "type not found"

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export class BinaryFile {

    static concatBuffer(buffer1, buffer2) {
        const newView = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

        newView.set(new Uint8Array(buffer1), 0);
        newView.set(new Uint8Array(buffer2), buffer1.byteLength);

        return newView.buffer;
    }

    static Uint32ToBytes(int) {
        const bytes = [0, 0, 0, 0];
    
        bytes[0] = (int >> 24) & 0xFF;
        bytes[1] = (int >> 16) & 0xFF;
        bytes[2] = (int >> 8) & 0xFF;
        bytes[3] = int & 0xFF;
    
        return bytes;
    }

    static StringToInt32(string) {
        const data = textEncoder.encode(string);
        const bin = new DataView(data.buffer);
        return bin.getUint32(0, true);
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

        return { 
            byteOffset,
            data, 
            toString() { return this.data; },
            valueOf() { return this.data; },
        };
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
                data: arrayData,
                toString() { return this.data; },
                valueOf() { return this.data; },
            };

        } else {
            if(typeMapping[type] && binary.byteLength < byteOffset + typeMapping[type].BYTES_PER_ELEMENT) {
                throw new Error(`${type} to ${byteOffset + typeMapping[type].BYTES_PER_ELEMENT} offset out of bounds of ${binary.byteLength-1}`);
            }

            return this.parseBytes(binary, byteOffset, type);
        }
    }

    static unserialize(binary, byteOffset = 0, struct) {

        if(binary.byteLength - byteOffset < 1) {
            throw new Error('File to small to unserialize');
        }

        const isDataView = binary instanceof Buffer || binary instanceof DataView;

        if(!isDataView) {
            throw new Error('to unserialize, provide a DataView object');
        }

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
            data: structData,
            toString() { return this.data; },
            valueOf() { return this.data; },
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
        const buff = new Uint8Array(
            lumpBuffer.buffer, 
            lumpBuffer.byteOffset, 
            lumpBuffer.byteLength
        );
        
        return textDecoder.decode(buff);
    }

    static serializeStruct(types, data) {
        const struct = mapTypesToValues(types, data);
        return this.serialize(struct);
    }

    static serialize(struct, resultData = []) {
        // actually serialize struct
        
        // build data array with type mappings
        for(let entry in struct) {

            const keys = Object.keys(struct[entry]);

            for(let key of keys) {
                if(key in typeMapping) {
                    const type = typeMapping[key];
                    const value = struct[entry][key];

                    if(Array.isArray(value)) {
                        // push ech value of array to result array
                        for(let val of value) {
                            resultData.push([ type, val ]);
                        }

                    } else {
                        // push to result array
                        resultData.push([ type, value ]);
                    }
    
                    break;

                } else if(key == "struct") {
                    const value = struct[entry][key];

                    // get struct and run through serialize again with current resultData
                    this.serialize(value, resultData);
                    break;
                }
            }
            
        }

        return this.serializeData(resultData);
    }

    static serializeData(resultData, littleEndian = true) {

        let byteLength = 0;
        for(let data of resultData) {
            const type = data[0];
            byteLength += type.BYTES_PER_ELEMENT;
        }

        const bin = new ArrayBuffer(byteLength);
        const view = new DataView(bin);

        let byteOffset = 0;

        for(let data of resultData) {
            const type = data[0];
            let value = data[1];

            if(typeof value == "string") {
                value = this.StringToInt32(value);
            }

            const typeFunction = 'set' + type.type;
            view[typeFunction](byteOffset, value, littleEndian);

            byteOffset += type.BYTES_PER_ELEMENT;
        }

        return bin;
    }

    static createFile(dataArray) {

        if(dataArray instanceof ArrayBuffer) {
            const file = new this();
            file.buffer = dataArray;
            file.view = new DataView(file.buffer);
            return file;
        }
        
        if(dataArray instanceof Buffer || dataArray instanceof DataView) {
            const file = new this();
            file.buffer = dataArray.buffer;
            file.view = new DataView(file.buffer, dataArray.byteOffset, dataArray.byteLength);
            return file;
        }

        throw new Error('Could not create Binary file.');
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

function mapTypesToValues(typesMap, valuesMap) {
    const typeValues = {};

    for(let key in valuesMap) {
        if(key in typesMap) {

            const type = typesMap[key];
            const value = valuesMap[key];

            typeValues[key] = {};
            typeValues[key][type] = value;

        } else {
            throw new Error(`type "${key}" not defined in types.`);
        }
    }

    return typeValues;
}

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
        type: 'Uint8',
        BYTES_PER_ELEMENT: Uint8Array.BYTES_PER_ELEMENT,
    },
    'bool': {
        type: 'Uint8',
        BYTES_PER_ELEMENT: Uint8Array.BYTES_PER_ELEMENT,
    },
}
