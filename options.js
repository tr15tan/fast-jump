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
operation.onchange = function (event) {
  if (this.value === "focus") {
    validWhenVisible.checked = false;
    validWhenVisible.disabled = true;
  } else {
    validWhenVisible.disabled = false;
  }
}
let anchorHrefLimit = addHotkeyItem.querySelector('.anchor_href_limit');
let saveButton = addHotkeyItem.querySelector('.save');
let clearButton = addHotkeyItem.querySelector('.clear');
let warning = addHotkeyItem.querySelector('.warning');
// global variable for add new hotkey
let objectInfo;

saveButton.onclick = () => {
  if (operationName.value.trim() == "") {
    console.log("the operation name can not be empty, ignore save action!");
    warning.textContent = chrome.i18n.getMessage("warning_operation_name_empty");
    return;
  }
  if (operationName.value.trim().includes('\'') ||
      operationName.value.trim().includes('\"')) {
    console.log("the operation name invalid, ignore save action!");
    warning.textContent = chrome.i18n.getMessage("warning_operation_name_invalid");
    return;
  }
  if (hotkeySet.value.trim() == "") {
    console.log("the hotkey can not be empty, ignore save action!");
    warning.textContent = chrome.i18n.getMessage("warning_hotkey_empty");
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
  objectInfo['anchorHrefLimit'] = anchorHrefLimit.checked;
  console.log(objectInfo);
  chrome.storage.sync.set({
    [objectInfo.domain + "~" + objectInfo.name]: objectInfo,
  }, function (result) {
    console.log("saved hotkey!");
    operationName.value = "";
    hotkeySet.value = "";
    validWhenVisible.checked = true;
    anchorHrefLimit.checked = false;
    operation.options[0].selected = true;
    warning.hidden = true;
    displayAddedHotkey(objectInfo);
    internationalize();
    objectInfo = undefined;
    displayAddHotkey();
    alert(chrome.i18n.getMessage("alert_save_sucess"));
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
let emptyView = document.getElementById('empty_view');

function displayHotkeys() {
  if (background.domainMap.size == 0) {
    emptyView.hidden = false;
  } else {
    emptyView.hidden = true;
  }
  background.domainMap.forEach((value, key, map) => {
    let createdCard = createCard(key);
    createCardItems(createdCard, value);
  });
}

function displayAddedHotkey(hotkeyInfo) {
  let createdCard = createCard(hotkeyInfo.domain);
  createCardItem(createdCard, hotkeyInfo);
}

function createCard(domainName) {
  let cardSelector = '[domain-name=\'' + domainName + '\']';
  let existCardDiv = document.querySelector(cardSelector);
  if (existCardDiv != undefined) {
    return existCardDiv;
  }
  let domainCardDiv = document.createElement('div');
  let domainCardTemplate = document.getElementById('domain_card_template');
  domainCardDiv.append(domainCardTemplate.content.cloneNode(true));
  domainCardDiv.setAttribute('class', 'domain_card card my-3 shadow-sm');
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
  let validConditionId = hotkeyInfo.domain + "~" + hotkeyInfo.name +
      "~" + "valid_condition";
  let itemValidCondition = cardItemDiv.querySelector('.valid_when_visible');
  itemValidCondition.setAttribute('id', validConditionId);
  let validConditionLabel = cardItemDiv.querySelector('.valid_condition_label');
  validConditionLabel.setAttribute('for', validConditionId);
  itemValidCondition.checked = hotkeyInfo.validWhenVisible;
  if (hotkeyInfo.operation === "focus") {
    itemValidCondition.checked = false;
    itemValidCondition.disabled = true;
  }
  let itemOperation = cardItemDiv.querySelector('.operation');
  itemOperation.value = hotkeyInfo.operation;
  itemOperation.onchange = function (event) {
    if (this.value === "focus") {
      itemValidCondition.checked = false;
      itemValidCondition.disabled = true;
    } else {
      itemValidCondition.disabled = false;
    }
  }
  let anchorHrefLimitId = hotkeyInfo.domain + "~" + hotkeyInfo.name +
      "~" + "anchor_href_limit";
  let itemAnchorHrefLimit = cardItemDiv.querySelector('.anchor_href_limit');
  itemAnchorHrefLimit.setAttribute('id', anchorHrefLimitId);
  let AnchorHrefLimitLabel =
      cardItemDiv.querySelector('.anchor_href_limit_label');
  AnchorHrefLimitLabel.setAttribute('for', anchorHrefLimitId);
  itemAnchorHrefLimit.checked = hotkeyInfo.anchorHrefLimit;
  let itemWarning = cardItemDiv.querySelector('.warning');
  cardItemDiv.querySelector('.save').onclick = () => {
    if (itemName.value.trim() == "") {
      console.log("the operation name can not be empty, ignore save action!");
      itemWarning.textContent = chrome.i18n.getMessage("warning_operation_name_empty");
      return;
    }
    if (itemName.value.trim().includes('\'') ||
        itemName.value.trim().includes('\"')) {
      console.log("the operation name invalid, ignore save action!");
      itemWarning.textContent = chrome.i18n.getMessage("warning_operation_name_invalid");
      return;
    }
    if (itemHotkey.value.trim() == "") {
      console.log("the hotkey can not be empty, ignore save action!");
      itemWarning.textContent = chrome.i18n.getMessage("warning_hotkey_empty");
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
    hotkeyInfo['anchorHrefLimit'] = itemAnchorHrefLimit.checked;
    console.log(hotkeyInfo);
    chrome.storage.sync.set({
      [hotkeyInfo.domain + "~" + hotkeyInfo.name]: hotkeyInfo,
    }, function (result) {
      console.log("modified hotkey!");
      itemWarning.hidden = true;
      cardItemDiv.setAttribute('hotkey-name', hotkeyInfo.name);
      alert(chrome.i18n.getMessage("alert_modify_sucess"));
    });
  };
  cardItemDiv.querySelector('.clear').onclick = () => {
    itemName.value = "";
    itemHotkey.value = "";
  };
  cardItemDiv.querySelector('.delete').onclick = () => {
    let result = confirm(chrome.i18n.getMessage("confirm_delete_item"));
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

function displayOtherOptions() {
  let otherOptions = document.getElementById('other_options');
  let pageUp = otherOptions.querySelector('.page_up');
  chrome.storage.sync.get(['pageUp'], function (result) {
    pageUp.checked = result.pageUp;
  });
  let pageDown = otherOptions.querySelector('.page_down');
  chrome.storage.sync.get(['pageDown'], function (result) {
    pageDown.checked = result.pageDown;
  });
  let navTop = otherOptions.querySelector('.nav_top');
  chrome.storage.sync.get(['navTop'], function (result) {
    navTop.checked = result.navTop;
  });
  let navBottom = otherOptions.querySelector('.nav_bottom');
  chrome.storage.sync.get(['navBottom'], function (result) {
    navBottom.checked = result.navBottom;
  });
  let pageClose = otherOptions.querySelector('.page_close');
  chrome.storage.sync.get(['pageClose'], function (result) {
    pageClose.checked = result.pageClose;
  });
  let pageMark = otherOptions.querySelector('.page_mark');
  chrome.storage.sync.get(['pageMark'], function (result) {
    pageMark.checked = result.pageMark;
    if (result.pageMark) {
      pageMarkAutoRemove.disabled = false;
    } else {
      pageMarkAutoRemove.disabled = true;
    }
  });
  let pageMarkAutoRemove = otherOptions.querySelector('.page_mark_auto_remove');
  chrome.storage.sync.get(['pageMarkAutoRemove'], function (result) {
    pageMarkAutoRemove.checked = result.pageMarkAutoRemove;
  });
  pageUp.onclick = function (event) {
    let checked = this.checked;
    chrome.storage.sync.set({
      pageUp: checked
    }, function () {

    });
  }
  pageDown.onclick = function (event) {
    let checked = this.checked;
    chrome.storage.sync.set({
      pageDown: checked
    }, function () {

    });
  }
  navTop.onclick = function (event) {
    let checked = this.checked;
    chrome.storage.sync.set({
      navTop: checked
    }, function (result) {
      //chrome.storage.sync.get(['navTop'], function (result) {
      //  console.log("set navTop = " + result.navTop);
      //});
    });
  }
  navBottom.onclick = function (event) {
    let checked = this.checked;
    chrome.storage.sync.set({
      navBottom: checked
    }, function (result) {
      //chrome.storage.sync.get(['navBottom'], function (result) {
      //  console.log("set navBottom = " + result.navBottom);
      //});
    });
  }
  pageClose.onclick = function (event) {
    let checked = this.checked;
    chrome.storage.sync.set({
      pageClose: checked
    }, function (result) {

    });
  }
  pageMark.onclick = function (event) {
    let checked = this.checked;
    chrome.storage.sync.set({
      pageMark: checked
    }, function () {
      if (checked) {
        pageMarkAutoRemove.disabled = false;
      } else {
        pageMarkAutoRemove.disabled = true;
      }
    });
  }
  pageMarkAutoRemove.onclick = function (event) {
    let checked = this.checked;
    chrome.storage.sync.set({
      pageMarkAutoRemove: checked
    }, function () {

    });
  }
  let exportButton = otherOptions.querySelector('.export-button');
  exportButton.onclick = function (event) {
    chrome.storage.sync.get(null, function(result) {
      let link = document.createElement('a');
      link.download = 'fast-jump.options';
      let config = [JSON.stringify(result)];
      let blob = new Blob(config, {type: 'text/plain'});
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }
  let importButton = otherOptions.querySelector('.import-button > input');
  importButton.onchange = function (event) {
    let file = event.target.files[0];
    if (file.name != "fast-jump.options") {
      console.log("selected wrong file, ignore import.");
      alert(chrome.i18n.getMessage("alert_import_fail"));
      return;
    }
    let reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function() {
      console.log('load success!');
      //console.log(reader.result);
      let loadResult = JSON.parse(reader.result);
      for (let key in loadResult) {
        chrome.storage.sync.set({
          [key]: loadResult[key],
        }, function (saveResult) {
          displayHotkeys();
          displayOtherOptions();
          internationalize();
        });
      }
      alert(chrome.i18n.getMessage("alert_import_sucess"));
    };

    reader.onerror = function() {
      console.log('load error...');
      console.log(reader.error);
      alert(chrome.i18n.getMessage("alert_import_fail"));
    };
  }
  let deleteAll = otherOptions.querySelector('.delete-all');
  deleteAll.onclick = function (event) {
    let result = confirm(chrome.i18n.getMessage("confirm_delete_all_hotkeys"));
    if (result) {
      chrome.storage.sync.clear(() => {
        console.log("clear all storage successfully!");
        let container = document.querySelector('div#saved_hotkey_container');
        //console.log(container.childNodes);
        while (container.firstChild) {
          //console.log(container.firstChild);
          container.removeChild(container.firstChild);
        }
        let checkboxes = otherOptions
            .querySelectorAll('div.checkbox > input[type="checkbox"]');
        for (let box of checkboxes) {
          box.checked = false;
        }
      });
    }
  }
}

// internationalization
function internationalize() {
  document.querySelectorAll('[data-i18n-content]').forEach(function(element) {
    let message = chrome.i18n.getMessage(element.getAttribute('data-i18n-content'));
    if (message) {
      element.textContent = message;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(element) {
    let message = chrome.i18n.getMessage(element.getAttribute('data-i18n-placeholder'));
    if (message) {
      element.setAttribute('placeholder', message);
    }
  });
}

displayAddHotkey();
displayHotkeys();
displayOtherOptions();
internationalize();