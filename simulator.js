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
    var button = document.createElement("input");
    button.type = "button";
    button.value = "Save";
    button.className = "simulator_tab";
    form.appendChild(textarea);
    var mainTab = getMainTab();
    mainTab.appendChild(document.createElement("br"));
    mainTab.appendChild(label);
    mainTab.appendChild(form);
    mainTab.appendChild(document.createElement("br"));
    mainTab.appendChild(button);
}