console.log("loaded contentscript");
document.addEventListener('contextmenu', function (event) {
  console.log("detected contextmenu event");

  let object = event.target;
  let parentElement = object.parentElement;

  // save selected element info: domain, href, localName, classList, id
  let current = {};
  current.domain = document.domain;
  current.href = object.getAttribute('href');
  //current.tagName = object.tagName;
  current.localName = object.localName;
  let classList = "";
  for (let className of object.classList) {
    classList += "." + className;
  }
  current.classList = classList;
  current.id = object.id;

  // save parent element info: localName, classList, id
  current.parentElement = {};
  current.parentElement.localName = parentElement.localName;
  let parentElementClassList = "";
  for (let parentElementClassName of parentElement.classList) {
    parentElementClassList += "." + parentElementClassName;
  }
  current.parentElement.classList = parentElementClassList;
  current.parentElement.id = parentElement.id;

  chrome.storage.sync.set({selectedObject: current}, function(){
    console.log("save current select object info for options page");
  });

});

//chrome.runtime.onMessage.addListener(
//  function(msg, sender, sendResponse) {
//    if (msg.content) {
//      console.log("Got message from options page: " + msg.content);
//    }
//});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (let key in changes) {
    var storageChange = changes[key];
    console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
    if (storageChange.oldValue != undefined) {
      console.log("oldValue = ");
      console.log(storageChange.oldValue);
    }
    if (storageChange.newValue != undefined) {
      console.log("newValue = ");
      console.log(storageChange.newValue);
    }

    // do not react to the temporary change
    if (key == 'selectedObject'){
      continue;
    }

    if (storageChange.oldValue === undefined) {
      console.log("add new hotkey");
      let change = storageChange.newValue;

      if (change.domain === document.domain) {
        let targetElement = locateElement(change);
        if (targetElement != undefined) {
          // todo: storage new hotkey listener
          let hotkeyhandler = createHotkeyHandler(targetElement, change);
          document.addEventListener('keydown', hotkeyhandler);
        }
      } else {
        console.log("the change is not about this domain, ignore");
      }
    } else if (storageChange.newValue === undefined) {
      console.log("remove hotkey");
      let change = storageChange.oldValue;
      if (change.domain === document.domain) {
        // todo: remove hotkey listener
      } else {
        console.log("the change is not about this domain, ignore");
      }
    } else {
      console.log("modify hotkey");
      // todo: remove the expired onkeydown listener

      // let's just focus on the newvalue cz we couldn't locate&remove the
      // expired onkeydown listener
      let change = storageChange.newValue;
      if (change.domain === document.domain) {
        let targetElement = locateElement(change);
        if (targetElement != undefined) {
          let hotkeyhandler = createHotkeyHandler(targetElement, change);
          document.addEventListener('keydown', hotkeyhandler);
        }
      } else {
        console.log("the change is not about this domain, ignore");
      }
    }
  }
});

function locateElement(hotkeyInfo) {
  let target;
  console.log("target in locateElement func = " + target);
  // css-selector of target element
  let selector = "";
  if (hotkeyInfo.localName != "") {
    selector += hotkeyInfo.localName;
  }
  if (hotkeyInfo.classList != "") {
    selector += hotkeyInfo.classList;
  }
  if (hotkeyInfo.href != "") {
    selector += "[href=\'" + hotkeyInfo.href + "\']";
  }
  if (hotkeyInfo.id != "") {
    selector += "#" + hotkeyInfo.id;
  }
  console.log("selector = " + selector);

  // css-selector of target parent element
  let parentElemSelector = "";
  if (hotkeyInfo.parentElement.localName != "") {
    parentElemSelector += hotkeyInfo.parentElement.localName;
  }
  if (hotkeyInfo.parentElement.classList != "") {
    parentElemSelector += hotkeyInfo.parentElement.classList;
  }
  if (hotkeyInfo.parentElement.id != "") {
    parentElemSelector += "#" + hotkeyInfo.parentElement.id;
  }
  console.log("parentElemSelector = " + parentElemSelector);

  // check whether the found element is our wanted
  let nodeList = document.querySelectorAll(selector);
  if (nodeList) {
    for (let node of nodeList) {
      let parentElem = node.parentElement;
      if (parentElem != undefined && parentElem.matches(parentElemSelector)) {
        console.log("found target element : ");
        console.log(node);
        target = node;
        break;
      }
    }
  }

  if (target === undefined){
    console.log("can't find target element!");
  }

  return target;
}

function createHotkeyHandler(targetElement, hotkeyInfo) {
  return function(event){
    let hotkeySet = hotkeyInfo.hotkeySet.split(',');

    //for (let hotkey of hotkeySet)
    // assume we only support single-key hotkey
    if(event.code == hotkeySet[0]) {
      console.log("click the element through script!");
      // todo: perform the action with user defined
      targetElement.click();
    }
  };
}

document.addEventListener('keydown', function(event) {
  console.log("onkeydown code : " + event.code);
});