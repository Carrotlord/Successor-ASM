function startsWith(string, target) {
    return string.slice(0, target.length) == target;
}

function endsWith(string, target) {
    return string.slice(-target.length) == target;
}

function getParts(line) {
    var results = {
        type: null,
        mnemonic: null,
        rA: null,
        rB: null,
        rC: null,
        constant: null,
        shiftType: null,
        shiftAmount: null
    };
    var pieces = line.replace(/,/g, " ").split(" ");
    var typeRegex = /^(i|f|s|o)$/;
    var mnemonicRegex = /^[a-z]+$/;
    var registerRegex = /^r(\d|[A-Z])+$/;
    var constantRegex = /^-?(\d+|0x\d+)$/;
    for (var i = 0; i < pieces.length; i++) {
        var token = pieces[i];
        if (token.search(typeRegex) !== -1 && results.type === null) {
            results.type = token;
        } else if (token.search(mnemonicRegex) !== -1 && results.mnemonic === null) {
            results.mnemonic = token;
        } else if (token.search(registerRegex) !== -1 && results.rA === null) {
            results.rA = token;
        } else if (token.search(registerRegex) !== -1 && results.rB === null) {
            results.rB = token;
        } else if (token.search(registerRegex) !== -1 && results.rC === null) {
            results.rC = token;
        } else if (token.search(constantRegex) !== -1 && results.constant === null) {
            results.constant = token;
        }
    }
    return results;
}

function highlightLine(index, line, onlyGetAnnotation) {
    if (startsWith(line, ";")) {
        if (onlyGetAnnotation) {
            return "";
        }
        _g.programCode[index] = makeNop(index, line);
        var span = document.createElement("span");
        span.className = "comment";
        span.appendChild(document.createTextNode(line));
        return span;
    } else {
        var results = getParts(line);
        /* Try to compile this line first. */
        var compiled = assembleLine(index, results, line);
        var annotation;
        if (compiled === "invalid") {
            annotation = " [SyntaxError]";
            if (onlyGetAnnotation) {
                return annotation;
            }
            _g.programCode[index] = makeNop(index, line);
            var span = document.createElement("span");
            span.className = "bad_syntax";
            /* if (_g.programCode.hasOwnProperty("" + index)) {
                compiled.originalLine += " [SyntaxError]";
            } */
            span.appendChild(document.createTextNode(line + annotation));
            return span;
        } else {
            annotation = "[0x" + compiled.bytecode[0].toString(16) + ":" + compiled.bytecode[1].toString(16) + "]";
            if (onlyGetAnnotation) {
                return " " + annotation;
            }
            _g.programCode[index] = compiled;
        }
        var group = document.createElement("span");
        /* Reconstruct the line. */
        var highlighted;
        for (var key in results) {
            if (results.hasOwnProperty(key) && results[key] !== null) {
                highlighted = document.createElement("span");
                highlighted.appendChild(document.createTextNode(results[key]));
                group.appendChild(highlighted);
                if (key === "rA" || key === "rB" || key === "rC") {
                    highlighted.className = "register";
                    group.appendChild(document.createTextNode(", "));
                } else {
                    highlighted.className = key;
                    group.appendChild(document.createTextNode(" "));
                }
            }
        }
        group.appendChild(document.createTextNode(annotation));
        return group;
    }
    //return document.createTextNode(line);
}