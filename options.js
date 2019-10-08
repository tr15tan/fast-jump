//let messageTabId;

//chrome.storage.sync.get(null, function(result){
//for (let key in result) {
//  console.log("key = " + key + " value = " + JSON.stringify(result[key]));
//}

let newHotkeyItem = document.getElementById('new_hotkey_item');
let operationName = newHotkeyItem.querySelector('.operation_name');
let hotkeySet = newHotkeyItem.querySelector('.hotkey_set');
hotkeySet.onkeydown = function (event) {
  event.preventDefault(); // prevent display the input key after event code
  let text = event.code;
  this.value += text + "-";
};
let validWhenVisible = newHotkeyItem.querySelector('.valid_when_visible');
let operation = newHotkeyItem.querySelector('.operation');
let saveButton = newHotkeyItem.querySelector('.save');
let clearButton = newHotkeyItem.querySelector('.clear');
let warning = newHotkeyItem.querySelector('.warning');
let objectInfo;

// hide new hotkey form while opening options page without contextMenu
chrome.storage.sync.get(['selectedObject'], function (result) {
  if (result.selectedObject === undefined) {
    console.log("selectedObject is undefined, hidden");
    newHotkeyItem.hidden = true;
  } else {
    objectInfo = result.selectedObject;
  }
});
saveButton.onclick = () => {
  if (operationName.value.trim() == "") {
    console.log("the operation name can not be empty, ignore save action!");
    warning.textContent = "the operation name can not be empty";
    return;
  }
  if (hotkeySet.value.trim() == "") {
    console.log("the hotkey can not be empty, ignore save action!");
    warning.textContent = "the hotkey can not be empty";
    return;
  }
  if (operation.value == "") {
    console.log("the operation can not be empty, ignore save action!");
    return;
  }
  objectInfo['name'] = operationName.value;
  objectInfo['hotkeySet'] = hotkeySet.value;
  objectInfo['validWhenVisible'] = validWhenVisible.checked;
  objectInfo['operation'] = operation.value;
  console.log(objectInfo);
  chrome.storage.sync.set({
    [objectInfo.domain + "~" + objectInfo.name]: objectInfo,
  }, function (result) {
    //chrome.tabs.sendMessage(
    //  messageTabId, {content:"send from options page"});
    console.log("saved hotkey!");
    chrome.storage.sync.remove(['selectedObject'], function () {
      operationName.value = "";
      hotkeySet.value = "";
      validWhenVisible.checked = true;
      operation.options[0].selected = true;
      warning.hidden = true;
      console.log("remove selectedObject cz we don't need it!");
    });
  });
};

clearButton.onclick = () => {
  operationName.value = "";
  hotkeySet.value = "";
  validWhenVisible.checked = true;
  operation.options[0].selected = true;
};

let background = chrome.extension.getBackgroundPage();
console.log(background.domainMap);

let savedHotkeyContainer = document.getElementById('saved_hotkey_container');

function displayHotkeys() {
  background.domainMap.forEach((value, key, map) => {
    let createdCard = createCard(key);
    createCardItems(createdCard, value);
  });
}

displayHotkeys();

function createCard(domainName) {
  let domainCardDiv = document.createElement('div');
  let domainCardTemplate = document.getElementById('domain_card_template');
  domainCardDiv.append(domainCardTemplate.content.cloneNode(true));
  domainCardDiv.querySelector('.domain_name').textContent = domainName;
  domainCardDiv.addEventListener('delete-hotkey-item', event => {
    if (event.detail === 'clearAllHotkeys') {
      domainCardDiv.remove();
    }
  });
  savedHotkeyContainer.append(domainCardDiv);
  return domainCardDiv;
}

function createCardItems(card, sameOriginMap) {
  sameOriginMap.forEach((value, key, map) => {
    createCardItem(card, value);
  });
}

function createCardItem(card, hotkeyInfo) {
  let cardItems = card.querySelector('.domain_card_items');
  let cardItemTemplate = document.getElementById('domain_card_item_template');
  let cardItemDiv = document.createElement('div');
  cardItemDiv.append(cardItemTemplate.content.cloneNode(true));
  let itemName = cardItemDiv.querySelector('.operation_name');
  itemName.value = hotkeyInfo.name;
  let itemHotkey = cardItemDiv.querySelector('.hotkey_set');
  itemHotkey.value = hotkeyInfo.hotkeySet;
  itemHotkey.onkeydown = function (event) {
    event.preventDefault(); // prevent display the input key after event code
    let text = event.code;
    this.value += text + "-";
  };
  let itemValidCondition = cardItemDiv.querySelector('.valid_when_visible');
  itemValidCondition.checked = hotkeyInfo.validWhenVisible;
  let itemOperation = cardItemDiv.querySelector('.operation');
  itemOperation.value = hotkeyInfo.operation;
  let itemWarning = cardItemDiv.querySelector('.warning');
  cardItemDiv.querySelector('.save').onclick = () => {
    if (itemName.value.trim() == "") {
      console.log("the operation name can not be empty, ignore save action!");
      itemWarning.textContent = "the operation name can not be empty";
      return;
    }
    if (itemHotkey.value.trim() == "") {
      console.log("the hotkey can not be empty, ignore save action!");
      itemWarning.textContent = "the hotkey can not be empty";
      return;
    }
    if (itemOperation.value == "") {
      console.log("the operation can not be empty, ignore save action!");
      return;
    }
    if (itemName.value != hotkeyInfo['name']) {
      // before modify hotkey name, we should delete the object with old name
      chrome.storage.sync.remove([hotkeyInfo.domain + "~" + hotkeyInfo.name],
          function () {
      });
    }
    hotkeyInfo['name'] = itemName.value;
    hotkeyInfo['hotkeySet'] = itemHotkey.value;
    hotkeyInfo['validWhenVisible'] = itemValidCondition.checked;
    hotkeyInfo['operation'] = itemOperation.value;
    console.log(hotkeyInfo);
    chrome.storage.sync.set({
      [hotkeyInfo.domain + "~" + hotkeyInfo.name]: hotkeyInfo,
    }, function (result) {
      console.log("modified hotkey!");
      itemWarning.hidden = true;
    });
  };
  cardItemDiv.querySelector('.clear').onclick = () => {
    itemName.value = "";
    itemHotkey.value = "";
  };
  cardItemDiv.querySelector('.delete').onclick = () => {
    let result = confirm("Do you really want to delete this hotkey?");
    if(result) {
      chrome.storage.sync.remove([hotkeyInfo.domain + "~" + hotkeyInfo.name],
          function () {
        console.log("delete hotkey " + hotkeyInfo.domain + "~" + hotkeyInfo.name);
        cardItemDiv.remove();
        if (cardItems.childElementCount === 0)  {
          let event = new CustomEvent("delete-hotkey-item", {
            bubbles: true,
            detail: 'clearAllHotkeys'
          });
          cardItems.dispatchEvent(event);
        }
      });
    }
  };
  cardItems.append(cardItemDiv);
}


// save the tab.id from background.js if want to send message to target page
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.tabId) {
    console.log("Got message(tab.id) : " + msg.tabId);
    messageTabId = msg.tabId;
  }
});
