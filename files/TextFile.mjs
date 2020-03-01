import fs from 'fs';
import path from 'path';

export class TextFile {

    constructor(content = "") {
        this.content = content;
        this.writeStream = null;
    }

    openWriteStream(filename) {
        const filepath = path.resolve(filename);
        this.writeStream = fs.createWriteStream(filepath);
        this.writeStream.on('error', function (err) {
            throw new Error('Error writing file.');
        });
    }

    closeWriteStream() {
        if(this.writeStream) {
            this.writeStream.destroy();
        }
    }

    append(str) {
        if(this.writeStream) {
            this.writeStream.write(str);
        } else {
            this.content += str;
        }
    }

    appendLine(str) {
        this.append(str + "\n");
    }

    valueOf() {
        return this.content;
    }

    toString() {
        return this.content;
    }

}
