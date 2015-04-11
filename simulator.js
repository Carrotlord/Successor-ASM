var _g = {};
_g.sourceCode = "; Begin coding..."

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

function saveCode() {
    if (elementExists("code_textarea")) {
        _g.sourceCode = document.getElementById("code_textarea").value;
        alert("Code saved!");
    } else {
        alert("Ypu're not in the editor tab.")
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
    button.onclick = saveCode;
    form.appendChild(textarea);
    var mainTab = getMainTab();
    mainTab.appendChild(document.createElement("br"));
    mainTab.appendChild(label);
    mainTab.appendChild(form);
    mainTab.appendChild(document.createElement("br"));
    mainTab.appendChild(button);
}

function switchToSimulator() {
    clearTab();
    var table = document.createElement("table");
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
            pre.appendChild(highlightLine(lines[i]));
        }
        pre.appendChild(document.createElement("br"));
    }
    codeTd.appendChild(pre);
    mainRow.appendChild(codeTd);
    table.appendChild(mainRow);
    getMainTab().appendChild(table);
}