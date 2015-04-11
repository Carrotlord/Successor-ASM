var _g = {};
_g.sourceCode = "; Begin coding..."
_g.labelTable = {};

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
    for (var i = 0; i < lines.length; i++) {
        var lineOfCode = document.createTextNode(lines[i]);
        if (i == 0) {
            var wrapper = document.createElement("span");
            wrapper.className = "selected_line";
            wrapper.appendChild(lineOfCode);
            pre.appendChild(wrapper);
        } else {
            pre.appendChild(highlightLine(i, lines[i]));
        }
        pre.appendChild(document.createElement("br"));
    }
    codeTd.appendChild(pre);
    mainRow.appendChild(codeTd);
    table.appendChild(mainRow);
    getMainTab().appendChild(table);
}