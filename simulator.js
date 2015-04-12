var _g = {};
_g.sourceCode = "; Begin coding..."
_g.labelTable = {};
_g.programCode = [];
_g.instructionDelay = 140;
_g.ip = 0; // instruction pointer
_g.programTimeoutID = -1;
_g.lastIndex = -1;
_g.intRegisters = [];
_g.lastModifiedReg = -1;
_g.STACK_BOUNDARY = 0x07E00000;
_g.intMemory = [];
_g.previousStackPosition = 0;

/**
 * Adapted from:
 * http://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
 */
function removeAllChildren(node) {
    while (node.firstChild !== null) {
        node.removeChild(node.firstChild);
    }
}

function resetSimulation() {
    _g.ip = 0;
    _g.programCode = [];
    _g.intRegisters = [];
    for (var i = 0; i < 64; i++) {
        _g.intRegisters.push(0);
    }
    _g.intRegisters[61] = 0x100000;
    _g.intRegisters[62] = _g.STACK_BOUNDARY;
    _g.intRegisters[63] = _g.STACK_BOUNDARY;
}

function getMainTab() {
    return document.getElementById("tab_contents");
}

/** Erases all content in the tab. */
function clearTab() {
    removeAllChildren(getMainTab());
}

function elementExists(elementId) {
    var element = document.getElementById(elementId);
    return element !== null;
}

function saveCode(shouldShowMessage) {
    if (elementExists("code_textarea")) {
        _g.sourceCode = document.getElementById("code_textarea").value;
        if (shouldShowMessage) {
            alert("Code saved!");
        }
    } else {
        if (shouldShowMessage) {
            alert("You're not in the editor tab.")
        }
    }
}

function toLines(codeBlock) {
    return codeBlock.split("\n");
}

/** Draws editor tab. */
function switchToEditor() {
    clearTab();
    var label = document.createElement("strong");
    label.appendChild(document.createTextNode("Your code here:"));
    var form = document.createElement("form");
    var textarea = document.createElement("textarea");
    textarea.rows = "25";
    textarea.cols = "80";
    textarea.innerHTML = _g.sourceCode;
    textarea.id = "code_textarea";
    var button = document.createElement("input");
    button.type = "button";
    button.value = "Save";
    button.className = "simulator_tab";
    button.onclick = function() {
        saveCode(true);
    };
    form.appendChild(textarea);
    var mainTab = getMainTab();
    mainTab.appendChild(document.createElement("br"));
    mainTab.appendChild(label);
    mainTab.appendChild(form);
    mainTab.appendChild(document.createElement("br"));
    mainTab.appendChild(button);
}

function switchToSimulator() {
    saveCode(false);
    clearTab();
    var table = document.createElement("table");
    //table.style = "border: 1px solid black;";
    var mainRow = document.createElement("tr");
    var codeTd = document.createElement("td");
    var pre = document.createElement("pre");
    var allLines = _g.sourceCode;
    var lines = toLines(allLines);
    var wrapper;
    for (var i = 0; i < lines.length; i++) {
        var lineOfCode = document.createTextNode(lines[i]);
        wrapper = document.createElement("span");
        wrapper.id = "ln" + i;
        if (i == 0) {
            highlightLine(i, lines[i], false);
            wrapper.className = "selected_line";
            wrapper.appendChild(lineOfCode);
            pre.appendChild(wrapper);
        } else {
            var highlighted = highlightLine(i, lines[i], false);
            wrapper.appendChild(highlighted);
            pre.appendChild(wrapper);
        }
        pre.appendChild(document.createElement("br"));
    }
    codeTd.style = "vertical-align: top;";
    codeTd.appendChild(pre);
    mainRow.appendChild(codeTd);
    spacerTd = document.createElement("td");
    spacerTd.style = "width: 45px;";
    mainRow.appendChild(spacerTd);
    regTableTd = document.createElement("table");
    regTableTd.appendChild(createRegisterTable(15));
    mainRow.appendChild(regTableTd);
    spacerTd = document.createElement("td");
    spacerTd.style = "width: 10px;";
    mainRow.appendChild(spacerTd);
    stackTableTd = document.createElement("table");
    stackTableTd.appendChild(createVisualStack(22));
    mainRow.appendChild(stackTableTd);
    table.appendChild(mainRow);
    getMainTab().appendChild(table);
    editVisualRegister(61);
    editVisualRegister(62);
    editVisualRegister(63);
}

function selectLine(wrapper, selectStyle, index) {
    removeAllChildren(wrapper);
    if (selectStyle.length > 0) {
        // Destroy existing styling and highlight line.
        var displayable = _g.programCode[index].originalLine + highlightLine(index, _g.programCode[index].originalLine, true);
        wrapper.appendChild(document.createTextNode(displayable));
    } else {
        // Restore original styling.
        wrapper.appendChild(highlightLine(index, _g.programCode[index].originalLine, false));
    }
    wrapper.className = selectStyle;
}

function executeSuccessorStep() {
    if (_g.ip >= _g.programCode.length || _g.ip < 0) {
        selectLine(wrapper, "stopped", _g.programCode.length - 1);
        alert("Program terminated (jumped to invalid address " + _g.ip + ")");
        return;
    }
    resetLastVisualRegister();
    var wrapper = document.getElementById("ln" + _g.ip);
    var lastIndex = _g.ip - 1;
    if (_g.lastIndex !== -1) {
        lastIndex = _g.lastIndex;
        _g.lastIndex = -1;
    }
    if (lastIndex < 0) {
        lastIndex += _g.programCode.length;
    }
    var lastWrapper = document.getElementById("ln" + lastIndex);
    if (wrapper !== null) {
        selectLine(wrapper, "selected_line", _g.ip);
    }
    if (lastWrapper !== null) {
        selectLine(lastWrapper, "", lastIndex);
    }
    var instruction = _g.programCode[_g.ip];
    try {
        instruction.execute();
    } catch (ex) {
        selectLine(wrapper, "stopped", _g.ip);
        return;
    }
    _g.ip++;
    if (_g.ip >= _g.programCode.length) {
        // _g.ip = 0;
        selectLine(wrapper, "stopped", _g.programCode.length - 1);
        alert("Program terminated (end of file)");
        return;
    }
    _g.programTimeoutID = window.setTimeout(executeSuccessorStep, _g.instructionDelay);
}

function resetLastVisualRegister() {
    if (_g.lastModifiedReg !== -1) {
        regDisplay = document.getElementById("r" + _g.lastModifiedReg);
        removeAllChildren(regDisplay);
        regDisplay.appendChild(document.createTextNode(_g.intRegisters[_g.lastModifiedReg]));
        regDisplay.style = "font-family: Consolas, 'Lucida Console', 'Courier New', monospace;" +
                           " -moz-border-radius:6px; -webkit-border-radius:6px; border-radius:6px;" +
                           " background-color: mediumseagreen; color: white; width: 65px; text-align: center;";
        _g.lastModifiedReg = -1;
    }
}

function updateVisualRegister(reg) {
    var regDisplay = document.getElementById("r" + reg);
    if (regDisplay !== null) {
        removeAllChildren(regDisplay);
        regDisplay.appendChild(document.createTextNode(_g.intRegisters[reg]));
        regDisplay.style = "font-family: Consolas, 'Lucida Console', 'Courier New', monospace;" +
                           " -moz-border-radius:6px; -webkit-border-radius:6px; border-radius:6px;" +
                           " background-color: green; color: white; width: 65px; text-align: center;";
    }
    _g.lastModifiedReg = reg;
}

function editVisualRegister(reg) {
    var regDisplay = document.getElementById("r" + reg);
    if (regDisplay !== null) {
        removeAllChildren(regDisplay);
        regDisplay.appendChild(document.createTextNode(_g.intRegisters[reg]));
    }
}

function updateVisualStackSlot(slotIndex, shouldActivate) {
    console.log("slotIndex: " + slotIndex);
    console.log("max size of stack: " + _g.intMemory.length);
    if (slotIndex < 0 || slotIndex >= _g.intMemory.length) {
        console.log("Illegal stack position chosen.");
        return;
    }
    var slotDisplay = document.getElementById("st" + slotIndex);
    if (slotDisplay !== null) {
        removeAllChildren(slotDisplay);
        slotDisplay.appendChild(document.createTextNode(_g.intMemory[slotIndex]));
        if (shouldActivate) {
            slotDisplay.style.backgroundColor = "green";
        } else {
            slotDisplay.style.backgroundColor = "slategray";
        }
    }
}

function updateVisualStack() {
    var currentStackPosition = getCurrentStackPosition();
    var difference = _g.previousStackPosition - currentStackPosition;
    var stackCursor = currentStackPosition;
    if (difference === 0) {
        return;
    } else if (difference === -1) {
        /* Single push occurred. */
        updateVisualStackSlot(currentStackPosition - 1, true);
    } else if (difference === 1) {
        /* Single pop occurred. */
        updateVisualStackSlot(currentStackPosition, false);
    } else if (difference < 0) {
        while (cursor > _g.previousStackPosition) {
            console.log("going down... " + cursor);
            updateVisualStackSlot(cursor, true);
            cursor--;
        }
    } else if (difference > 0) {
        while (cursor < _g.previousStackPosition) {
            console.log("going up... " + cursor);
            updateVisualStackSlot(cursor, false);
            cursor++;
        }
    }
}

function createRegisterTable(numRegisters) {
    // TODO: move styles to CSS file
    var monospaceFont = "font-family: Consolas, 'Lucida Console', 'Courier New', monospace;";
    var borderRadius = " -moz-border-radius:6px; -webkit-border-radius:6px; border-radius:6px;";
    var leftSideStyle = monospaceFont + borderRadius + " font-weight: bold; width: 40px;";
    var rightSideStyle = monospaceFont + borderRadius + " background-color: slategray; color: white; width: 65px; text-align: center;";
    var zeroStyle = monospaceFont + borderRadius + " background-color: brown; color: white; width: 65px; text-align: center;";
    var regTable = document.createElement("table");
    regTable.style = "border: 1px darkgray solid;" + borderRadius;
    
    var titleRow = document.createElement("tr");
    var titleInner = document.createElement("td");
    var titleTextLabel = document.createElement("span")
    titleTextLabel.style.fontWeight = "bold";
    titleInner.style.textAlign = "center";
    titleInner.colSpan = "2";
    titleTextLabel.appendChild(document.createTextNode("Registers"));
    titleInner.appendChild(titleTextLabel);
    titleRow.appendChild(titleInner);
    regTable.appendChild(titleRow);
    
    var rZero = document.createElement("tr");
    var leftSide = document.createElement("td");
    leftSide.style = monospaceFont + " font-weight: bold; width: 40px;";
    // leftSide.fontWeight = "bold";
    leftSide.appendChild(document.createTextNode("rZERO"));
    var rightSide = document.createElement("td");
    rightSide.style = zeroStyle;
    //rightSide.backgroundColor = "brown";
    //rightSide.color = "white";
    rightSide.appendChild(document.createTextNode("0"));
    rZero.appendChild(leftSide);
    rZero.appendChild(rightSide);
    regTable.appendChild(rZero);
    var regRow;
    for (var i = 1; i <= numRegisters; i++) {
        regRow = document.createElement("tr");
        leftSide = document.createElement("td");
        leftSide.style = leftSideStyle;
        leftSide.appendChild(document.createTextNode("r" + i));
        rightSide = document.createElement("td");
        rightSide.style = rightSideStyle;
        rightSide.appendChild(document.createTextNode("0"));
        rightSide.id = "r" + i;
        regRow.appendChild(leftSide);
        regRow.appendChild(rightSide);
        regTable.appendChild(regRow);
    }
    var specialRegisters = ["AT", "GP", "SP", "BP"];
    for (var i = 0; i < 4; i++) {
        regRow = document.createElement("tr");
        leftSide = document.createElement("td");
        leftSide.style = leftSideStyle;
        leftSide.appendChild(document.createTextNode("r" + specialRegisters[i]));
        rightSide = document.createElement("td");
        rightSide.style = rightSideStyle;
        rightSide.appendChild(document.createTextNode("0"));
        rightSide.id = "r" + (i + 60);
        regRow.appendChild(leftSide);
        regRow.appendChild(rightSide);
        regTable.appendChild(regRow);
    }
    return regTable;
}

function createVisualStack(numStackSlots) {
    var stackBoundary = _g.STACK_BOUNDARY;
    // TODO: move styles to CSS file
    var monospaceFont = "font-family: Consolas, 'Lucida Console', 'Courier New', monospace;";
    var borderRadius = " -moz-border-radius:6px; -webkit-border-radius:6px; border-radius:6px;";
    var slotStyle = monospaceFont + borderRadius + " background-color: slategray; color: white; width: 80px; text-align: center;";
    var stackTable = document.createElement("table");
    stackTable.style = "border: 1px darkgray solid;" + borderRadius;
    var stackRow = document.createElement("tr");
    var stackInner = document.createElement("td");
    var stackTextLabel = document.createElement("span")
    stackTextLabel.style.fontWeight = "bold";
    stackInner.style.textAlign = "center";
    stackTextLabel.appendChild(document.createTextNode("The Stack"));
    stackInner.appendChild(stackTextLabel);
    stackRow.appendChild(stackInner);
    stackTable.appendChild(stackRow);
    for (var i = 0; i < numStackSlots; i++) {
        stackRow = document.createElement("tr");
        stackInner = document.createElement("td");
        stackInner.style = slotStyle;
        stackInner.appendChild(document.createTextNode("0"));
        stackInner.id = "st" + i;
        stackRow.appendChild(stackInner);
        stackTable.appendChild(stackRow);
    }
    return stackTable;
}
