function CodeLine(index, bytecode, originalLine) {
    this.index = index;
    this.bytecode = bytecode;
    this.originalLine = originalLine;
}

CodeLine.prototype.execute = function() {
    // TODO: Execute myself
}

function makeNop(index, originalLine) {
    return new CodeLine(index, [0, 0], originalLine);
}

function assembleLine(index, results, originalLine) {
    var types = {
        i: 0b00,
        f: 0b01,
        s: 0b10,
        o: 0b11
    };
    var opcodes = {
        mov: 0b11,
        add: 0b100,
        sub: 0b101,
        and: 0b1001,
        or: 0b1010,
        xor: 0b1011,
        mul: 0b110,
        div: 0b111,
        mod: 0b1000,
        shlv: 0b0,
        shrv: 0b1,
        sharv: 0b10,
        jeq: 0b1110,
        jne: 0b1111,
        jge: 0b10000,
        jg: 0b10001,
        jle: 0b10010,
        jl: 0b10011,
        j: 0b1100,
        jmp: 0b1101,
        call: 0b10100,
        ret: 0b10110,
        syscall: 0b10101,
        load: 0b10111,
        save: 0b11000
    };
    var compileRegister = function(register) {
        if (!startsWith(register, "r")) {
            return "invalid";
        } else {
            register = register.slice(1);
            switch (register) {
                case "ZERO":
                    return 0;
                case "AT":
                    return 60;
                case "GP":
                    return 61;
                case "SP":
                    return 62;
                case "BP":
                    return 63;
                default:
                    var value = parseInt(register, 10);
                    if (isNaN(value)) {
                        return "invalid";
                    } else {
                        return value;
                    }
            }
        }
    }
    try {
        var firstFields = (types[results.type] << 30) | (opcodes[results.mnemonic] << 19) | (compileRegister(results.rA) << 6) | (compileRegister(results.rB));
    } catch (ex) {
        return "invalid";
    }
    var lastFields = parseInt(results.constant, 10);
    if (isNaN(lastFields)) {
        lastFields = 0;
    }
    return new CodeLine(index, [firstFields, lastFields], originalLine);
}