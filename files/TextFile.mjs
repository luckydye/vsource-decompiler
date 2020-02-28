export class TextFile {

    constructor(string = "") {
        this.content = string;
    }

    append(str) {
        this.content += str;
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
