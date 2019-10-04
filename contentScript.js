console.log("loaded contentscript");

document.addEventListener('contextmenu', function (event) {
  console.log("=====================================================");
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
  current.parentElementLocalName = parentElement.localName;
  let parentElementClassList = "";
  for (let parentElementClassName of parentElement.classList) {
    parentElementClassList += "." + parentElementClassName;
  }
  current.parentElementClassList = parentElementClassList;
  current.parentElementId = parentElement.id;

  chrome.storage.sync.set({selectedObject: current}, function(){
    //console.log("save current select object info for options page");
  });

});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  console.log("=====================================================");
  for (let key in changes) {
    let storageChange = changes[key];
    console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);

    // do not react to the temporary change
    if (key == 'selectedObject'){
      console.log("ignore the temporary change");
      continue;
    }

    if (storageChange.oldValue != undefined) {
      console.log("oldValue = ");
      console.log(storageChange.oldValue);
    }
    if (storageChange.newValue != undefined) {
      console.log("newValue = ");
      console.log(storageChange.newValue);
    }

    if (storageChange.oldValue === undefined) {
      console.log("add new hotkey");
      let change = storageChange.newValue;

      if (change.domain === document.domain) {
        startListen(change);
      } else {
        console.log("the change is not about this domain, ignore");
      }
    } else if (storageChange.newValue === undefined) {
      console.log("remove hotkey");
      let change = storageChange.oldValue;
      if (change.domain === document.domain) {
        targetHotkeyMap.delete(change.name);
        stopListen(storageChange.oldValue);
      } else {
        console.log("the change is not about this domain, ignore");
      }
    } else {
      console.log("modify hotkey");
      let change = storageChange.newValue;
      if (change.domain === document.domain) {
        targetHotkeyMap.delete(change.name);
        stopListen(storageChange.oldValue);
        targetHotkeyMap.set(change.name, change);
        startListen(change);
      } else {
        console.log("the change is not about this domain, ignore");
      }
    }
  }
});

let targetHotkeyMap = new Map();

chrome.runtime.onMessage.addListener(
  function(msg, sender, sendResponse) {
    if (msg.action == 'prepare to listen') {
      console.log("Got hotkeyInfos from background: ");
      console.log(msg.objects);
      stopAll();
      // Object.entries(obj) returns an array of key/value pairs for an object
      targetHotkeyMap = new Map(Object.entries(msg.objects));
      targetHotkeyMap.forEach((value, key, map) => {
        startListen(value);
      });
    }
});

let listenedHotkeyMap = new Map();

function startListen(hotkeyInfo) {
  if (listenedHotkeyMap.has(hotkeyInfo.name)) return;
  let targetElement = locateElement(hotkeyInfo);
  if (targetElement != undefined) {
    let hotkeyhandler = createHotkeyHandler(targetElement, hotkeyInfo);
    document.addEventListener('keydown', hotkeyhandler);
    listenedHotkeyMap.set(hotkeyInfo.name, {object:hotkeyInfo, handler:hotkeyhandler});
    console.log("add hotkey listener! name = " + hotkeyInfo.name +
                " hotkey = " + hotkeyInfo.hotkeySet);
    console.log(listenedHotkeyMap);
  }
}

function stopListen(hotkeyInfo) {
  let uselessHandler;
  if (listenedHotkeyMap.has(hotkeyInfo.name)) {
    console.log("find former saved listener");
    uselessHandler = listenedHotkeyMap.get(hotkeyInfo.name).handler;
  }
  if (uselessHandler != undefined) {
    document.removeEventListener('keydown', uselessHandler);
    console.log("removed useless listener!");
    listenedHotkeyMap.delete(hotkeyInfo.name);
    console.log(listenedHotkeyMap);
  } else {
    console.log("can't find saved listener!");
  }
}

function stopAll() {
  if (listenedHotkeyMap.size != 0) {
    listenedHotkeyMap.forEach((value, key, map) => {
      stopListen(value.object);
    })
    console.log("cleared all listener!");
  }
}

function locateElement(hotkeyInfo) {
  let target;
  // css-selector of target element
  let selector = "";
  if (hotkeyInfo.localName != "") {
    selector += hotkeyInfo.localName;
  }
  if (hotkeyInfo.classList != "") {
    selector += hotkeyInfo.classList;
  }
  if (hotkeyInfo.href != "" && hotkeyInfo.href != null) {
    selector += "[href=\'" + hotkeyInfo.href + "\']";
  }
  if (hotkeyInfo.id != "") {
    selector += "#" + hotkeyInfo.id;
  }
  //console.log("selector = " + selector);

  // css-selector of target parent element
  let parentElemSelector = "";
  if (hotkeyInfo.parentElementLocalName != "") {
    parentElemSelector += hotkeyInfo.parentElementLocalName;
  }
  if (hotkeyInfo.parentElementClassList != "") {
    parentElemSelector += hotkeyInfo.parentElementClassList;
  }
  if (hotkeyInfo.parentElementId != "") {
    parentElemSelector += "#" + hotkeyInfo.parentElementId;
  }
  //console.log("parentElemSelector = " + parentElemSelector);

  // check whether the found element is our wanted
  let nodeList = document.querySelectorAll(selector);
  if (nodeList.length != 0) {
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
    let hotkeySet = hotkeyInfo.hotkeySet.split('-');

    //for (let hotkey of hotkeySet)
    // assume we only support single-key hotkey
    if(event.code == hotkeySet[0]) {
      console.log("click the element through script!");
      // todo: perform the action with user defined
      targetElement.click();
    }
  };
}

//document.addEventListener('keydown', function(event) {
//  console.log("onkeydown code : " + event.code);
//});

const mutationCallback = (mutationsList) => {
  console.log("detected change!");
  targetHotkeyMap.forEach((value, key, map) => {
    startListen(value);
  });
  if (listenedHotkeyMap.size != 0) {
    let locatedElements = [];
    for (let value of listenedHotkeyMap.values()) {
      let element = locateElement(value.object);
      if (element != undefined) {
        locatedElements.push({object: value.object, element: element});
      }
    }
    for(let mutation of mutationsList) {
      for (let element of locatedElements) {
        if (mutation.target.contains(element.element)) {
          console.log("this change is about hotkey element! Restart listen!");
          stopListen(element.object);
          startListen(element.object);
        }
      }
    }
  }
};

let observer = new MutationObserver(mutationCallback);

document.addEventListener('DOMContentLoaded', startObserver());

function startObserver() {
  observer.observe(document.body, {childList: true, subtree: true});
}