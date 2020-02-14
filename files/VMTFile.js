import { BinaryFile } from './BinaryFile';

// https://developer.valvesoftware.com/wiki/Valve_Texture_Format

export default class VMTFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static readHeader(vmt) {
        const fileHeader = this.unserialize(vmt.view, 0, VMT.vmtheader).data;
        return fileHeader;
    }

    static fromDataArray(dataArray) {
        const vmt = this.createFile(dataArray);

        const content = this.unserializeASCI(vmt.view);
        const data = this.unserializeKeyValueString(content);

        vmt.data = data;

        return vmt;
    }

    static unserializeKeyValueString(string) {
        const lines = string.split('\n');
        const classes = {};

        let blockIndex = -1;
        let insideBlock = false;
        let currentClass = null;

        for(let line of lines) {
            if(line[0] == "{") {
                blockIndex++;
                insideBlock = true;

            } else if(line[0] == "}") {
                blockIndex++;
                insideBlock = false;
                currentClass = null;

            } else if(!insideBlock) {
                currentClass = line.replace(/(\s|\W)+/g, '').toLocaleLowerCase();

            } else if(currentClass) {
                const lineParts = line.split(/\s+/g).filter(p => p != "");

                if(lineParts.length > 1) {
                    const key = lineParts[0].replace(/\"/g, '').toLocaleLowerCase();
                    let value = lineParts[1].replace(/\"/g, '').toLocaleLowerCase();

                    if(key[0] + key[1] == "//")
                        continue;

                    if(!isNaN(value)) {
                        value = parseFloat(value);
                    } else {
                        value = value.split(",");
                        if(value.length == 1) {
                            value = value[0];
                        }
                    }

                    classes[currentClass] = classes[currentClass] || {};
                    classes[currentClass][key] = value;
                }
            }
        }

        return classes;
    }

}
