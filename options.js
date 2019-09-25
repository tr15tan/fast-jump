//let messageTabId;

//chrome.storage.sync.get(null, function(result){
chrome.storage.sync.get(['selectedObject'], function(result){
  //for (let key of result) {
  //  console.log("key = " + key + " value = " + JSON.stringify(result[key]));
  //}
  //let key = Object.keys(result)[0];
  //result[key].href);
  console.log("current select object href is " +
  result.selectedObject.href);
  //console.log("current select object key is " + key);

  let operationName = document.getElementById('operation_name');

  let hotkeySet = document.getElementById('hotkey_set');
  hotkeySet.onkeydown = function(event) {
    event.preventDefault(); // prevent display the input key after event code
    let text = event.code;
    this.value += text + ",";
  }

  let saveButton = document.getElementById('button_save');
  saveButton.onclick = function(event) {
    let hotkeyInfo = result.selectedObject;
    hotkeyInfo['name'] = operationName.value;
    hotkeyInfo['hotkeySet'] = hotkeySet.value;
    console.log("name = " + hotkeyInfo['name'] +
                "\nhotkeySet = " + hotkeyInfo['hotkeySet'] +
                "\ndomain = " + hotkeyInfo['domain'] +
                "\nclassList = " + hotkeyInfo['classList'] +
                "\nlocalName = " + hotkeyInfo['localName'] +
                "\nhref = " + hotkeyInfo['href'] +
                "\nid = " + hotkeyInfo['id']);
    chrome.storage.sync.set({
      [hotkeyInfo.domain + "~" + hotkeyInfo.name]: hotkeyInfo,
    },function(result){
        //chrome.tabs.sendMessage(
        //  messageTabId, {content:"send from options page"});
        console.log("saved hotkey!");
    });
  }

  let cancelButton = document.getElementById('button_cancel');
  cancelButton.onclick = function (event) {
    operationName.value = "";
    hotkeySet.value = "";
  }
});

// save the tab.id from background.js if want to send message to target page
chrome.runtime.onMessage.addListener(
  function(msg, sender, sendResponse) {
    if (msg.tabId) {
      console.log("Got message(tab.id) : " + msg.tabId);
      messageTabId = msg.tabId;
    }
});
