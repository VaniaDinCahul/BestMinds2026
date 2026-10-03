import { DOMNode } from './domNode.js';

export class SimpleDOMParser {
  parse(htmlString) {
    const document = new DOMNode('Document', '#document');
    let index = 0;

    // skip la white space
    function skipWhitespace() {
      while (index < htmlString.length && /\s/.test(htmlString[index])) {
        index++;
      }
    }

    
    function parseAttributes() {
      const attributes = {};
      while (index < htmlString.length && htmlString[index] !== '>' && htmlString[index] !== '/') {
        skipWhitespace();
        if (htmlString[index] === '>' || htmlString[index] === '/') break;

        // Extract numele keie
        let key = '';
        while (index < htmlString.length && !/[\s=>/]/ .test(htmlString[index])) {
          key += htmlString[index++];
        }

        skipWhitespace();
        let value = true; 

        if (htmlString[index] === '=') {
          index++; // Skip la '='
          skipWhitespace();
          const quote = htmlString[index];
          
          if (quote === '"' || quote === "'") {
            index++; //skip la prima
            const start = index;
            while (index < htmlString.length && htmlString[index] !== quote) {
              index++;
            }
            value = htmlString.slice(start, index);
            index++; //skip doua
          } else {
            
            const start = index;
            while (index < htmlString.length && !/[\s>]/.test(htmlString[index])) {
              index++;
            }
            value = htmlString.slice(start, index);
          }
        }

        if (key) attributes[key] = value;
        skipWhitespace();
      }
      return attributes;
    }

    // prase la toate elementele si textul
    function parseNode() {
      // 1. Parse la text
      if (htmlString[index] !== '<') {
        let text = '';
        while (index < htmlString.length && htmlString[index] !== '<') {
          text += htmlString[index++];
        }
        return new DOMNode('Text', '#text', text);
      }

      // ignor commentari
      if (htmlString.startsWith('<!--', index)) {
        index = htmlString.indexOf('-->', index);
        if (index === -1) index = htmlString.length;
        else index += 3;
        return null;
      }

      // verifica pentru closing tag
      if (htmlString[index + 1] === '/') {
        return null;
      }

      index++; // Skip '<'

      // numele la tag
      let tagName = '';
      while (index < htmlString.length && !/[\s/>]/.test(htmlString[index])) {
        tagName += htmlString[index++];
      }

      const node = new DOMNode('Element', tagName);
      node.attributes = parseAttributes();

      // check pentru tag (<img />, <input ... >)
      const isSelfClosing = htmlString[index] === '/' || 
        ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName.toLowerCase());

      if (htmlString[index] === '/') index++; // Skip '/'
      if (htmlString[index] === '>') index++; // Skip '>'

      if (isSelfClosing) return node;

      // parse la kids pana da de final
      while (index < htmlString.length) {
        if (htmlString.startsWith(`</${tagName}`, index)) {
          // skip peste closing tag
          index = htmlString.indexOf('>', index) + 1;
          break;
        }

        const child = parseNode();
        if (child) {
          // ignor whitespace
          if (child.type === 'Text' && !child.value.trim()) {
            continue;
          }
          node.children.push(child);
        }
      }

      return node;
    }

    // parse la noduri root in doc
    while (index < htmlString.length) {
      skipWhitespace();
      if (index >= htmlString.length) break;
      const node = parseNode();
      if (node) document.children.push(node);
    }

    return document;
  }
}