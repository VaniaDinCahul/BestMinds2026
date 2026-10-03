export class DOMNode {
    constructor(type, name = '', value = ''){
        this.type = type;
        this.name = name.toLocaleLowerCase;
        this.value = value;
        this.attributes = {};
        this.children = [];
    }
}