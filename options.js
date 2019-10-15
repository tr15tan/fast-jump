//let messageTabId;

//chrome.storage.sync.get(null, function(result){
//for (let key in result) {
//  console.log("key = " + key + " value = " + JSON.stringify(result[key]));
//}

//let tabId;
//
//chrome.tabs.onActivated.addListener((activeInfo) => {
//  //console.log("tabs.onActivated, tabId = " + activeInfo.tabId);
//  if (activeInfo.tabId === tabId) {
//    console.log("focus on this tab, refresh");
//    displayAddHotkey();
//  }
//})
//
//chrome.tabs.getCurrent((tab) => {
//  //console.log("current tabId = " + tab.id);
//  tabId = tab.id;
//})

// save the selected element from background.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'save this') {
    console.log("Got message from background : ");
    console.log(request.object);
    objectInfo = request.object;
    displayAddHotkey();
  }
});

let addHotkeyItem = document.getElementById('add_hotkey_item');
let operationName = addHotkeyItem.querySelector('.operation_name');
let hotkeySet = addHotkeyItem.querySelector('.hotkey_set');
hotkeySet.onkeydown = hotkeyInputHandler;
let validWhenVisible = addHotkeyItem.querySelector('.valid_when_visible');
let operation = addHotkeyItem.querySelector('.operation');
let saveButton = addHotkeyItem.querySelector('.save');
let clearButton = addHotkeyItem.querySelector('.clear');
let warning = addHotkeyItem.querySelector('.warning');
// global variable for add new hotkey
let objectInfo;

saveButton.onclick = () => {
  if (operationName.value.trim() == "") {
    console.log("the operation name can not be empty, ignore save action!");
    warning.textContent = "the operation name can not be empty!";
    return;
  }
  if (operationName.value.trim().includes('\'')) {
    console.log("the operation name invalid, ignore save action!");
    warning.textContent = "the operation name can not include '\''!";
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
    console.log("saved hotkey!");
    operationName.value = "";
    hotkeySet.value = "";
    validWhenVisible.checked = true;
    operation.options[0].selected = true;
    warning.hidden = true;
    displayAddedHotkey(objectInfo);
    objectInfo = undefined;
    displayAddHotkey();
    alert("saved hotkey!");
  });
};

clearButton.onclick = () => {
  operationName.value = "";
  hotkeySet.value = "";
  validWhenVisible.checked = true;
  operation.options[0].selected = true;
};

function hotkeyInputHandler(event) {
  event.preventDefault(); // prevent display the input key after event code
  if (event.ctrlKey) {
    if (!this.value.includes("ctrlKey")) this.value += "ctrlKey+";
  }
  if (event.altKey) {
    if (!this.value.includes("altKey")) this.value += "altKey+";
  }
  if (event.shiftKey) {
    if (!this.value.includes("shiftKey")) this.value += "shiftKey+";
  }
  if (event.metaKey) {
    if (!this.value.includes("metaKey")) this.value += "metaKey+";
  }
  if (event.code != "ControlLeft" && event.code != "ControlRight" &&
      event.code != "AltLeft" && event.code != "AltRight" &&
      event.code != "ShiftLeft" && event.code != "ShiftRight" &&
      event.code != "MetaLeft" && event.code != "MetaRight") {
    this.value += event.code + "+";
  }
}

function displayAddHotkey() {
  if (objectInfo === undefined) {
    // hide new hotkey form while opening options page without contextMenu
    addHotkeyItem.hidden = true;
  } else {
    addHotkeyItem.hidden = false;
  }
}

let background = chrome.extension.getBackgroundPage();
console.log(background.domainMap);

let savedHotkeyContainer = document.getElementById('saved_hotkey_container');

function displayHotkeys() {
  background.domainMap.forEach((value, key, map) => {
    let createdCard = createCard(key);
    createCardItems(createdCard, value);
  });
}

function displayAddedHotkey(hotkeyInfo) {
  let createdCard = createCard(hotkeyInfo.domain);
  createCardItem(createdCard, hotkeyInfo);
}

displayAddHotkey();
displayHotkeys();

function createCard(domainName) {
  let cardSelector = '[domain-name=\'' + domainName + '\']';
  let existCardDiv = document.querySelector(cardSelector);
  if (existCardDiv != undefined) {
    return existCardDiv;
  }
  let domainCardDiv = document.createElement('div');
  let domainCardTemplate = document.getElementById('domain_card_template');
  domainCardDiv.append(domainCardTemplate.content.cloneNode(true));
  domainCardDiv.setAttribute('class', 'domain_card');
  domainCardDiv.setAttribute('domain-name', domainName);
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
  let itemSelector = '[hotkey-name=\'' + hotkeyInfo.name + '\']';
  let exitItemDiv = card.querySelector(itemSelector);
  if (exitItemDiv != undefined) {
    exitItemDiv.remove();
    console.log("remove the same name item");
  }
  let cardItems = card.querySelector('.domain_card_items');
  let cardItemTemplate = document.getElementById('domain_card_item_template');
  let cardItemDiv = document.createElement('div');
  cardItemDiv.append(cardItemTemplate.content.cloneNode(true));
  cardItemDiv.setAttribute('class', 'domain_card_item');
  cardItemDiv.setAttribute('hotkey-name', hotkeyInfo.name);
  let itemName = cardItemDiv.querySelector('.operation_name');
  itemName.value = hotkeyInfo.name;
  let itemHotkey = cardItemDiv.querySelector('.hotkey_set');
  itemHotkey.value = hotkeyInfo.hotkeySet;
  itemHotkey.onkeydown = hotkeyInputHandler;
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
    if (itemName.value.trim().includes('\'')) {
      console.log("the operation name invalid, ignore save action!");
      itemWarning.textContent = "the operation name can not include '\''!";
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
      cardItemDiv.setAttribute('hotkey-name', hotkeyInfo.name);
      alert("modified hotkey!");
    });
  };
  cardItemDiv.querySelector('.clear').onclick = () => {
    itemName.value = "";
    itemHotkey.value = "";
  };
  cardItemDiv.querySelector('.delete').onclick = () => {
    let result = confirm("Do you really want to delete this hotkey?");
    if (result) {
      chrome.storage.sync.remove([hotkeyInfo.domain + "~" + hotkeyInfo.name],
        function () {
          console.log("delete hotkey " + hotkeyInfo.domain + "~" + hotkeyInfo.name);
          cardItemDiv.remove();
          if (cardItems.childElementCount === 0) {
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