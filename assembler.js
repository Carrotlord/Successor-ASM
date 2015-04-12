function CodeLine(index, bytecode, originalLine) {
    this.index = index;
    this.bytecode = bytecode;
    this.originalLine = originalLine;
}

CodeLine.prototype.execute = function() {
    console.log(_g.intMemory);
    switch (this.getOpcode()) {
        case 0b1100: /* j */
            var addressPlusOne = this.getConstant();
            if (addressPlusOne === -1) {
                /* Exit program on j -1 */
                throw "Exiting...";
            } else {
                _g.lastIndex = _g.ip;
                _g.ip = addressPlusOne - 1;
            }
            break;
        case 0b11: /* mov */
            // TODO: check for types
            this.registerOperation(function(x, y) { return y; },
                                   function(x, y) { return x + y; });
            break;
        case 0b100: /* add */
            // TODO: check for types
            this.registerOperation(function(x, y) { return x + y; },
                                   function(x, y) { return x + y; });
            break;
        case 0b10000: /* jge */
            this.compareOperation(function(a, b) { return a >= b; });
            break;
        case 0b1110: /* jeq */
            this.compareOperation(function(a, b) { return a === b; });
            break;
        case 0b101: /* sub */
            this.registerOperation(function(x, y) { return x - y; },
                                   function(x, y) { return x + y; });
            break;
        case 0b11000: /* save */
            var regAValue = _g.intRegisters[this.getRegA()];
            var regBValue = _g.intRegisters[this.getRegB()];
            var regCValue = _g.intRegisters[this.getRegC()];
            _g.intMemory[-(regBValue + regCValue + this.getConstant() - _g.STACK_BOUNDARY + 1)] = regAValue;
            break;
        case 0b10111:
            var regBValue = _g.intRegisters[this.getRegB()];
            var regCValue = _g.intRegisters[this.getRegC()];
            _g.intRegisters[this.getRegA()] = _g.intMemory[-(regBValue + regCValue + this.getConstant() - _g.STACK_BOUNDARY + 1)];
            break;
        case 0b10100: /* call */
            pushStack(_g.ip + 1);
            var functionAddressPlusOne = this.getConstant();
            _g.lastIndex = _g.ip;
            _g.ip = functionAddressPlusOne - 1;
            break;
        case 0b10110: /* ret */
            console.log("reached!");
            var addressPlusOne = popStack();
            console.log("Just returning to... " + addressPlusOne);
            _g.lastIndex = _g.ip;
            _g.ip = addressPlusOne - 1;
            break;
        default: /* nop */
            break;
    }
}

CodeLine.prototype.getOpcode = function() {
    return (this.bytecode[0] & 0b00111111111110000000000000000000) >> 19;
}

CodeLine.prototype.getType = function() {
    return (this.bytecode[0] & 0b11000000000000000000000000000000) >> 30;
}

CodeLine.prototype.getRegA = function() {
    return (this.bytecode[0] & 0b00000000000000000000111111000000) >> 6;
}

CodeLine.prototype.getRegB = function() {
    return this.bytecode[0] & 0b00000000000000000000000000111111;
}

CodeLine.prototype.getRegC = function() {
    return (this.bytecode[0] & 0b00000000000000111111000000000000) >> 12;
}

CodeLine.prototype.getConstant = function() {
    return this.bytecode[1];
}

CodeLine.prototype.registerOperation = function(primaryOp, subordOp) {
    var regA = this.getRegA();
    var regB = this.getRegB();
    var constant = this.getConstant();
    _g.intRegisters[regA] = primaryOp(_g.intRegisters[regA], subordOp(_g.intRegisters[regB], constant));
    /* Clobber rZERO. */
    _g.intRegisters[0] = 0;
    updateVisualRegister(regA);
}

CodeLine.prototype.compareOperation = function(comparator) {
    var regA = this.getRegA();
    var regB = this.getRegB();
    var addressPlusOne = this.getConstant();
    if (comparator(_g.intRegisters[regA], _g.intRegisters[regB])) {
        if (addressPlusOne === -1) {
            throw "Exiting...";
        }
        _g.lastIndex = _g.ip;
        _g.ip = addressPlusOne - 1;
    }
}

function popStack() {
    var rSP = 62;
    var returnValue = _g.intMemory[-(_g.intRegisters[rSP] - _g.STACK_BOUNDARY + 1)];
    // var returnValue = _g.intMemory.pop();
    _g.intRegisters[rSP]++;
    updateVisualRegister(rSP);
    return returnValue;
}

function pushStack(value) {
    var rSP = 62;
    _g.intRegisters[rSP]--;
    _g.intMemory[-(_g.intRegisters[rSP] - _g.STACK_BOUNDARY + 1)] = value;
    // _g.intMemory.push(value);
    updateVisualRegister(rSP);
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
                        return value % 64;
                    }
            }
        }
    }
    var firstFields;
    try {
        firstFields = (types[results.type] << 30) | (opcodes[results.mnemonic] << 19) | (compileRegister(results.rA) << 6) | (compileRegister(results.rB));
    } catch (ex) {
        if (results.mnemonic === "j") {
            firstFields = 0b1100 << 19;
        } else if (results.mnemonic === "call") {
            firstFields = 0b10100 << 19;
        } else if (results.mnemonic === "ret") {
            firstFields = 0b10110 << 19;
        } else {
            return "invalid";
        }
    }
    var lastFields = parseInt(results.constant, 10);
    if (isNaN(lastFields)) {
        lastFields = 0;
    }
    return new CodeLine(index, [firstFields, lastFields], originalLine);
}