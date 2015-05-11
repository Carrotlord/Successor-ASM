function CodeLine(index, bytecode, originalLine) {
    this.index = index;
    this.bytecode = bytecode;
    this.originalLine = originalLine;
}

CodeLine.prototype.execute = function() {
    _g.previousStackPosition = getCurrentStackPosition();
    switch (this.getOpcode()) {
        case 0xC: // 0b1100: /* j */
            var addressPlusOne = this.getConstant();
            if (addressPlusOne === -1) {
                /* Exit program on j -1 */
                throw "Exiting...";
            } else {
                _g.lastIndex = _g.ip;
                _g.ip = addressPlusOne - 1;
            }
            break;
        case 0x3: //0b11: /* mov */
            // TODO: check for types
            this.registerOperation(function(x, y) { return y; },
                                   function(x, y) { return x + y; });
            break;
        case 0x4: //0b100: /* add */
            // TODO: check for types
            this.registerOperation(function(x, y) { return x + y; },
                                   function(x, y) { return x + y; });
            break;
        case 0x10: //0b10000: /* jge */
            this.compareOperation(function(a, b) { return a >= b; });
            break;
        case 0x12: //0b10010: /* jle */
            this.compareOperation(function(a, b) { return a <= b; });
            break;
        case 0xE: //0b1110: /* jeq */
            this.compareOperation(function(a, b) { return a === b; });
            break;
        case 0x5: //0b101: /* sub */
            this.registerOperation(function(x, y) { return x - y; },
                                   function(x, y) { return x + y; });
            break;
        case 0x18: //0b11000: /* save */
            var regAValue = _g.intRegisters[this.getRegA()];
            var regBValue = _g.intRegisters[this.getRegB()];
            var regCValue = _g.intRegisters[this.getRegC()];
            _g.intMemory[-(regBValue + regCValue + this.getConstant() - _g.STACK_BOUNDARY + 1)] = regAValue;
            break;
        case 0x17: //0b10111: /* load */
            var regBValue = _g.intRegisters[this.getRegB()];
            var regCValue = _g.intRegisters[this.getRegC()];
            _g.intRegisters[this.getRegA()] = _g.intMemory[-(regBValue + regCValue + this.getConstant() - _g.STACK_BOUNDARY + 1)];
            break;
        case 0x14: //0b10100: /* call */
            // _g.previousStackPosition = getCurrentStackPosition();
            pushStack(_g.ip + 1);
            var functionAddressPlusOne = this.getConstant();
            _g.lastIndex = _g.ip;
            _g.ip = functionAddressPlusOne - 1;
            // updateVisualStack();
            break;
        case 0x16: // 0b10110: /* ret */
            // _g.previousStackPosition = getCurrentStackPosition();
            var addressPlusOne = popStack();
            console.log("Just returning to... " + addressPlusOne);
            _g.lastIndex = _g.ip;
            _g.ip = addressPlusOne - 1;
            // updateVisualStack();
            break;
        case 0x6: //0b110: /* mul */
            this.registerOperation(function(x, y) { return x * y; },
                                   function(x, y) { return x + y; });
            break;
        default: /* nop */
            break;
    }
    updateVisualStack();
}

CodeLine.prototype.getOpcode = function() {
    return (this.bytecode[0] & 0x3ff80000) >> 19;//0b00111111111110000000000000000000) >> 19;
}

CodeLine.prototype.getType = function() {
    return (this.bytecode[0] & 0xc0000000) >> 30;//0b11000000000000000000000000000000) >> 30;
}

CodeLine.prototype.getRegA = function() {
    return (this.bytecode[0] & 0xfc0) >> 6;//0b00000000000000000000111111000000) >> 6;
}

CodeLine.prototype.getRegB = function() {
    return this.bytecode[0] & 0x3f;//0b00000000000000000000000000111111;
}

CodeLine.prototype.getRegC = function() {
    return (this.bytecode[0] & 0x3f000) >> 12;//0b00000000000000111111000000000000) >> 12;
}

CodeLine.prototype.getConstant = function() {
    return this.bytecode[1];
}

CodeLine.prototype.registerOperation = function(primaryOp, subordOp) {
    var regA = this.getRegA();
    /* if (regA === 62) {
        _g.previousStackPosition = getCurrentStackPosition();
    } */
    var regB = this.getRegB();
    var constant = this.getConstant();
    _g.intRegisters[regA] = primaryOp(_g.intRegisters[regA], subordOp(_g.intRegisters[regB], constant));
    /* Clobber rZERO. */
    _g.intRegisters[0] = 0;
    updateVisualRegister(regA);
    /* if (regA === 62) {
        updateVisualStack();
    } */
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

function getCurrentStackPosition() {
    return -(_g.intRegisters[62] - _g.STACK_BOUNDARY + 1);
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
        i: 0x0, //0b00,
        f: 0x1, //0b01,
        s: 0x2, //0b10,
        o: 0x3 //0b11
    };
    var opcodes = {
        mov: 0x3, //0b11,
        add: 0x4, //0b100,
        sub: 0x5, //0b101,
        and: 0x9, //0b1001,
        or: 0xA, //0b1010,
        xor: 0xB, //0b1011,
        mul: 0x6, //0b110,
        div: 0x7, //0b111,
        mod: 0x8, //0b1000,
        shlv: 0x0, //0b0,
        shrv: 0x1, //0b1,
        sharv: 0x2, //0b10,
        jeq: 0xE, //0b1110,
        jne: 0xF, //0b1111,
        jge: 0x10, //0b10000,
        jg: 0x11, //0b10001,
        jle: 0x12, //0b10010,
        jl: 0x13, //0b10011,
        j: 0xC, //0b1100,
        jmp: 0xD, //0b1101,
        call: 0x14, //0b10100,
        ret: 0x16, //0b10110,
        syscall: 0x15, //0b10101,
        load: 0x17, //0b10111,
        save: 0x18 //0b11000
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
            firstFields = 0xc << 19; //0b1100 << 19;
        } else if (results.mnemonic === "call") {
            firstFields = 0x14 << 19; //0b10100 << 19;
        } else if (results.mnemonic === "ret") {
            firstFields = 0x16 << 19; //0b10110 << 19;
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