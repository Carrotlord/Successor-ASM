var _g = {};
_g.sourceCode = "; Begin coding..."
_g.labelTable = {};
_g.programCode = [];
_g.instructionDelay = 200; // 5 instructions per second
_g.ip = 0; // instruction pointer
_g.programTimeoutID = -1;

/**
 * Adapted from:
 * http://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
 */
function removeAllChildren(node) {
    while (node.firstChild !== null) {
        node.removeChild(node.firstChild);
    }
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
        alert("You're not in the editor tab.")
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
    table.style = "border: 1px solid black;";
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
    codeTd.appendChild(pre);
    mainRow.appendChild(codeTd);
    table.appendChild(mainRow);
    getMainTab().appendChild(table);
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
    var wrapper = document.getElementById("ln" + _g.ip);
    var lastIndex = _g.ip - 1;
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
        _g.ip = 0;
    }
    _g.programTimeoutID = window.setTimeout(executeSuccessorStep, _g.instructionDelay);
}