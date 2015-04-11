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
    console.log(pieces);
    var typeRegex = /^(i|f|s|o)$/;
    var mnemonicRegex = /^[a-z]{2,}$/;
    var registerRegex = /^r(\d|[A-Z])+$/;
    var constantRegex = /^(\d+|0x\d+)$/;
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
            /* Shuffle registers: */
            results.rC = results.rA;
            results.rA = results.rB;
            results.rB = token;
        } else if (token.search(constantRegex) !== -1 && results.constant === null) {
            results.constant = token;
        }
    }
    return results;
}

function highlightLine(line) {
    if (startsWith(line, ";")) {
        var span = document.createElement("span");
        span.className = "comment";
        span.appendChild(document.createTextNode(line));
        return span;
    } else {
        var results = getParts(line);
    }
    return document.createTextNode(line);
}