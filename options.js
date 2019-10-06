//let messageTabId;

//chrome.storage.sync.get(null, function(result){
//for (let key in result) {
//  console.log("key = " + key + " value = " + JSON.stringify(result[key]));
//}

let operationName = document.getElementById('operation_name');

let hotkeySet = document.getElementById('hotkey_set');
hotkeySet.onkeydown = function (event) {
  event.preventDefault(); // prevent display the input key after event code
  let text = event.code;
  this.value += text + "-";
}

let validWhenVisible = document.getElementById('valid_when_visible');

let operation = document.getElementById('operation');

let saveButton = document.getElementById('button_save');
saveButton.onclick = function (event) {
  chrome.storage.sync.get(['selectedObject'], function (result) {
    if (result.selectedObject === undefined) {
      console.log("selectedObject is undefined, ignore saving");
      return;
    }
    let hotkeyInfo = result.selectedObject;
    if (operationName.value.trim() == "") {
      console.log("the operation name can not be empty, ignore save action!");
      return;
    }
    if (hotkeySet.value.trim() == "") {
      console.log("the hotkey can not be empty, ignore save action!");
      return;
    }
    hotkeyInfo['name'] = operationName.value;
    hotkeyInfo['hotkeySet'] = hotkeySet.value;
    hotkeyInfo['validWhenVisible'] = validWhenVisible.checked;
    hotkeyInfo['operation'] = operation.value;
    console.log(hotkeyInfo);
    chrome.storage.sync.set({
      [hotkeyInfo.domain + "~" + hotkeyInfo.name]: hotkeyInfo,
    }, function (result) {
      //chrome.tabs.sendMessage(
      //  messageTabId, {content:"send from options page"});
      console.log("saved hotkey!");
      chrome.storage.sync.remove(['selectedObject'], function () {
        operationName.value = "";
        hotkeySet.value = "";
        validWhenVisible.checked = true;
        operation.options[0].selected = true;
        console.log("remove selectedObject cz we don't need it!");
      });
    });
  });
}

let cancelButton = document.getElementById('button_cancel');
cancelButton.onclick = function (event) {
  operationName.value = "";
  hotkeySet.value = "";
  validWhenVisible.checked = true;
  operation.options[0].selected = true;
}

// save the tab.id from background.js if want to send message to target page
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.tabId) {
    console.log("Got message(tab.id) : " + msg.tabId);
    messageTabId = msg.tabId;
  }
});
