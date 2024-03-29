console.log("loaded contentscript");

let pageMark;
let pageMarkAutoRemove;

document.addEventListener('contextmenu', function (event) {
  console.log("=====================================================");
  console.log("detected contextmenu event");

  let object = event.target;
  let parentElement = object.parentElement;
  // console.log("selected object : ");
  // console.log(object);

  // save selected element info: domain, href, localName, classList, id,
  // textContent, title
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
  current.textContent = object.textContent;
  current.title = object.getAttribute('title');

  // save parent element info: localName, classList, id, textContent
  current.parentElementLocalName = parentElement.localName;
  let parentElementClassList = "";
  for (let parentElementClassName of parentElement.classList) {
    parentElementClassList += "." + parentElementClassName;
  }
  current.parentElementClassList = parentElementClassList;
  current.parentElementId = parentElement.id;
  current.parentElementTextContent = parentElement.textContent;

  chrome.runtime.sendMessage({action: "ready to save", object: current});

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

    if (key === 'pageUp') {
      displayNavButton('up', storageChange.newValue);
      continue;
    } else if (key === 'pageDown') {
      displayNavButton('down', storageChange.newValue);
      continue;
    } else if (key === 'navTop') {
      displayNavButton('top', storageChange.newValue);
      continue;
    } else if (key === 'navBottom') {
      displayNavButton('bottom', storageChange.newValue);
      continue;
    } else if (key === 'pageClose') {
      displayNavButton('close', storageChange.newValue);
      continue;
    } else if (key === 'pageMark') {
      pageMark = storageChange.newValue;
      // remove lineMark if there is a previously existing one
      if (!pageMark) {
        let lineMark = document.body.querySelector('div.lineMark');
        if (lineMark != null) {
          lineMark.remove();
        }
      }
      continue;
    } else if (key === 'pageMarkAutoRemove') {
      pageMarkAutoRemove = storageChange.newValue;
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
  if (hotkeyInfo.anchorHrefLimit === false &&
      hotkeyInfo.href != "" && hotkeyInfo.href != null) {
    selector += "[href=\'" + hotkeyInfo.href + "\']";
  }
  if (hotkeyInfo.id != "") {
    selector += "#" + hotkeyInfo.id;
  }
  if (hotkeyInfo.title != "" && hotkeyInfo.title != null) {
    selector += "[title=\'" + hotkeyInfo.title + "\']";
  }
  // console.log("selector = " + selector);

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
  // console.log("parentElemSelector = " + parentElemSelector);

  // console.log("textContent = " + hotkeyInfo.textContent);
  // console.log("parentElementTextContent = " + hotkeyInfo.parentElementTextContent);

  // check whether the found element is our wanted
  let nodeList = document.querySelectorAll(selector);
  if (nodeList.length != 0) {
    for (let node of nodeList) {
      let parentElem = node.parentElement;
      if (parentElem != undefined && parentElem.matches(parentElemSelector)) {
        // make sure compatible with saved objectinfo which didn't include
        // textContent before v1.0.3
        if (hotkeyInfo.textContent == undefined ||
            hotkeyInfo.textContent == "") {
          console.log("found target element : ");
          console.log(node);
          target = node;
          break;
        } else if(hotkeyInfo.textContent != undefined
            && node.textContent == hotkeyInfo.textContent){
          // make sure compatible with saved objectinfo which didn't include
          // parentElementTextContent before v1.0.6
          if (hotkeyInfo.parentElementTextContent == undefined ||
              hotkeyInfo.parentElementTextContent == "") {
            console.log("found target element : ");
            console.log(node);
            target = node;
            break;
          } else if (hotkeyInfo.parentElementTextContent != undefined
              && node.parentElement.textContent ==
            hotkeyInfo.parentElementTextContent) {
            console.log("found target element : ");
            console.log(node);
            target = node;
            break;
          }
        }
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
    let hotkeySet = hotkeyInfo.hotkeySet.split('+');
    // the last element of hotkeySet is "", which is redundant
    hotkeySet.pop();

    let ctrlKey = hotkeySet.indexOf("ctrlKey");
    if (ctrlKey != -1) {
      if (!event.ctrlKey) return;
      hotkeySet.splice(ctrlKey, 1);
    }
    let altKey = hotkeySet.indexOf("altKey");
    if (altKey != -1) {
      if (!event.altKey) return;
      hotkeySet.splice(altKey, 1);
    }
    let shiftKey = hotkeySet.indexOf("shiftKey");
    if (shiftKey != -1) {
      if (!event.shiftKey) return;
      hotkeySet.splice(shiftKey, 1);
    }
    let metaKey = hotkeySet.indexOf("metaKey");
    if (metaKey != -1) {
      if (!event.metaKey) return;
      hotkeySet.splice(metaKey, 1);
    }
    // do not support more than one keycode left except keys above
    if (hotkeySet.length > 1) {
      return;
    } else if (hotkeySet.length == 1) {
      if (event.code != hotkeySet[0]) return;
    }

    switch (hotkeyInfo.operation) {
      case 'focus':
        console.log("focus the element through script!");
        if (targetElement == document.activeElement) {
          console.log("already focused! Ignore focus operation");
        } else {
          event.preventDefault(); //prevent display the input key in textarea
          targetElement.focus();
          targetElement.scrollIntoView({
            behavior: "smooth",
            block:    "center",
          });
        }
        break;
      case 'click':
        if (hotkeyInfo.validWhenVisible) {
          if (!isVisible(targetElement)) return;
        }
        console.log("click the element through script!");
        targetElement.click();
        break;
      default:
        break;
    }

  };
}

function isVisible(elem) {

  let coords = elem.getBoundingClientRect();

  let windowHeight = document.documentElement.clientHeight;

  // top elem edge is visible?
  let topVisible = coords.top > 0 && coords.top < windowHeight;

  // bottom elem edge is visible?
  let bottomVisible = coords.bottom < windowHeight && coords.bottom > 0;

  return topVisible || bottomVisible;
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

function displayNavigationButton() {
  chrome.storage.sync.get(['pageUp'], function (result) {
    displayNavButton('up', result.pageUp);
  });
  chrome.storage.sync.get(['pageDown'], function (result) {
    displayNavButton('down', result.pageDown);
  });
  chrome.storage.sync.get(['navTop'], function (result) {
    displayNavButton('top', result.navTop);
  });
  chrome.storage.sync.get(['navBottom'], function (result) {
    displayNavButton('bottom', result.navBottom);
  });
  chrome.storage.sync.get(['pageClose'], function (result) {
    displayNavButton('close', result.pageClose);
  });
  // these two values is not for display NavButtons, but they will be used with
  // the corresponding NavButtons, thus we sync them here
  chrome.storage.sync.get(['pageMark'], function (result) {
    pageMark = result.pageMark;
  });
  chrome.storage.sync.get(['pageMarkAutoRemove'], function (result) {
    pageMarkAutoRemove = result.pageMarkAutoRemove;
  });
}

function displayNavButton(direction, enable) {
  let shadowDiv = document.querySelector('div.navBtnContainer');
  if (shadowDiv === null) {
    shadowDiv = document.createElement('div');
    shadowDiv.setAttribute('class', 'navBtnContainer');
    shadowDiv.style = `display:flex;flex-direction:column;position:fixed;
        bottom:10%;right:8%;z-index:999`;

    document.addEventListener("fullscreenchange", function( event ) {
      // The event object doesn't carry information about the fullscreen state of the browser,
      // but it is possible to retrieve it through the fullscreen API
      if ( document.fullscreenElement !== null ) {
        // The target of the event is always the document,
        // but it is possible to retrieve the fullscreen element through the API
        // document.fullscreenElement. If it's not null, then it's an Element
        // currently being displayed in full-screen mode.
        console.log("enter fullscreen mode!");
        shadowDiv.style.visibility = "hidden";
      } else {
        console.log("exit fullscreen mode!");
        shadowDiv.style.visibility = "visible";
      }
    });

    document.body.append(shadowDiv);
  }
  let shadowRoot = shadowDiv.shadowRoot;
  if (shadowRoot === null) {
    shadowRoot = shadowDiv.attachShadow({mode: 'open'});
  }

  switch (direction) {
    case 'up' :
      let pageUp;
      if (enable) {
        pageUp = document.createElement("img");
        pageUp.setAttribute('class', 'navButton');
        pageUp.setAttribute('direction', 'up');
        pageUp.setAttribute('alt', 'page up');
        pageUp.setAttribute('title',
            chrome.i18n.getMessage("checkbox_page_up"));
        pageUp.src = chrome.runtime.getURL('images/page_up_white_48dp.png');
        pageUp.style =
            `background: rgba(0, 0, 0, 0.26); cursor: pointer; border: none;
            border-radius: 5px; width: 80px; display: block; margin: 10px;
            order: 1; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, .2),
            0 6px 20px 0 rgba(0, 0, 0, .19);`;
        pageUp.addEventListener('click', function () {
          window.scrollBy({
            top: -(window.innerHeight - 50),  // roll back a little space
            left: 0,
            behavior: "instant"
          });
        });
        shadowRoot.append(pageUp);
      } else {
        pageUp = shadowRoot.querySelector('.navButton[direction="up"]');
        if (pageUp != null) {
          pageUp.remove();
        }
      }
      break;
    case 'down' :
      let pageDown;
      if (enable) {
        pageDown = document.createElement("img");
        pageDown.setAttribute('class', 'navButton');
        pageDown.setAttribute('direction', 'down');
        pageDown.setAttribute('alt', 'page down');
        pageDown.setAttribute('title',
            chrome.i18n.getMessage("checkbox_page_down"));
        pageDown.src = chrome.runtime.getURL('images/page_down_white_48dp.png');
        pageDown.style =
            `background: rgba(0, 0, 0, 0.26); cursor: pointer; border: none;
            border-radius: 5px; width: 80px; display: block; margin: 10px;
            order: 2; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, .2),
            0 6px 20px 0 rgba(0, 0, 0, .19);`;
        pageDown.addEventListener('click', function () {
          if (pageMark) {
            let lineMark = document.body.querySelector('div.lineMark');
            if (lineMark != null) {
              lineMark.remove();
            }
            let bottomOffSet = window.pageYOffset + window.innerHeight;
            lineMark = document.createElement("div");
            lineMark.setAttribute('class', 'lineMark');
            lineMark.style =
                `position: absolute; width: 100%; height: 14px;
                background: #4cd137; box-sizing: border-box;
                padding-top:14px; padding-left: 4px;`;
            // padding-top and padding-left is for textContent
            lineMark.style.top = bottomOffSet - 14 + "px";
            lineMark.textContent =
                chrome.i18n.getMessage("tip_last_page_bottom");
            document.body.append(lineMark);
            if (pageMarkAutoRemove) {
              setTimeout(() => {
                if (lineMark != null) {
                  lineMark.remove();
                }
              }, 1200);
            }
          }
          window.scrollBy({
            top: window.innerHeight - 50,  // roll back a little space
            left: 0,
            behavior: "instant"
          });
        });
        shadowRoot.append(pageDown);
      } else {
        pageDown = shadowRoot.querySelector('.navButton[direction="down"]');
        if (pageDown != null) {
          pageDown.remove();
        }
      }
      break;
    case 'close' :
      let pageClose;
      if (enable) {
        pageClose = document.createElement("img");
        pageClose.setAttribute('class', 'navButton');
        pageClose.setAttribute('direction', 'close');
        pageClose.setAttribute('alt', 'page close');
        pageClose.setAttribute('title',
            chrome.i18n.getMessage("checkbox_page_close"));
            pageClose.src = chrome.runtime.getURL('images/page_close_white_48dp.png');
            pageClose.style =
            `background: rgba(0, 0, 0, 0.26); cursor: pointer; border: none;
            border-radius: 5px; width: 80px; display: block; margin: 10px;
            order: 3; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, .2),
            0 6px 20px 0 rgba(0, 0, 0, .19);`;
            pageClose.addEventListener('click', function () {
	        window.close();
        });
        shadowRoot.append(pageClose);
      } else {
        pageClose = shadowRoot.querySelector('.navButton[direction="close"]');
        if (pageClose != null) {
          pageClose.remove();
        }
      }
      break;
    case 'top':
      let navTop;
      if (enable) {
        navTop = document.createElement("img");
        navTop.setAttribute('class', 'navButton');
        navTop.setAttribute('direction', 'top');
        navTop.setAttribute('alt', 'navigate to top');
        navTop.setAttribute('data-pos-before', '-1');
        navTop.setAttribute('title',
            chrome.i18n.getMessage("checkbox_navigate_to_top"));
        navTop.src = chrome.runtime.getURL('images/nav_top_white_48dp.png');
        navTop.style =
            `background: rgba(0, 0, 0, 0.26); cursor: pointer; border: none;
            border-radius: 5px; width: 80px; display: block; margin: 10px;
            order: 4; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, .2),
            0 6px 20px 0 rgba(0, 0, 0, .19);`;
        navTop.addEventListener('click', function () {
          let posCurentY = window.pageYOffset;
          let posCurentX = window.pageXOffset;
          if (posCurentY != 0 && this.dataset.posBefore == -1) {
            // save & jump
            this.dataset.posBefore = posCurentY;
            window.scrollTo(posCurentX, 0);
            this.src =
                chrome.runtime.getURL('images/nav_back_white_48dp.png');
            this.setAttribute('title',
                chrome.i18n.getMessage("tip_navigate_back"));
          } else if (posCurentY == 0 && this.dataset.posBefore != -1) {
            // jump back
            window.scrollTo(posCurentX, this.dataset.posBefore);
            this.dataset.posBefore = -1;
            this.setAttribute('title',
                chrome.i18n.getMessage("checkbox_navigate_to_top"));
            this.src =
                chrome.runtime.getURL('images/nav_top_white_48dp.png');
          }
        });
        shadowRoot.append(navTop);
      } else {
        navTop = shadowRoot.querySelector('.navButton[direction="top"]');
        if (navTop != null) {
          navTop.remove();
        }
      }
      break;
    case 'bottom':
      let navBottom;
      if (enable) {
        navBottom = document.createElement("img");
        navBottom.setAttribute('class', 'navButton');
        navBottom.setAttribute('direction', 'bottom');
        navBottom.setAttribute('alt', 'navigate to bottom');
        navBottom.setAttribute('data-pos-before', '-1');
        navBottom.setAttribute('title',
            chrome.i18n.getMessage("checkbox_navigate_to_bottom"));
        navBottom.src =
            chrome.runtime.getURL('images/nav_bottom_white_48dp.png');
        navBottom.style =
            `background: rgba(0, 0, 0, 0.26); cursor: pointer; border: none;
            border-radius: 5px; width: 80px; display: block; margin: 10px;
            order: 5; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, .2),
            0 6px 20px 0 rgba(0, 0, 0, .19);`;
        navBottom.addEventListener('click', function () {
          let scrollHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
          );
          let posCurentY = window.pageYOffset;
          let posCurentX = window.pageXOffset;
          if (posCurentY != scrollHeight && this.dataset.posBefore == -1) {
            // save & jump
            this.dataset.posBefore = posCurentY;
            window.scrollTo(posCurentX, scrollHeight);
            this.src =
                chrome.runtime.getURL('images/nav_back_white_48dp.png');
            this.setAttribute('title',
                chrome.i18n.getMessage("tip_navigate_back"));
            reachableBottomPos = window.pageYOffset;
          } else if (posCurentY == reachableBottomPos &&
              this.dataset.posBefore != -1) {
            // jump back
          let posCurentX = window.pageXOffset;
            window.scrollTo(posCurentX, this.dataset.posBefore);
            this.dataset.posBefore = -1;
            this.setAttribute('title',
                chrome.i18n.getMessage("checkbox_navigate_to_bottom"));
            this.src =
                chrome.runtime.getURL('images/nav_bottom_white_48dp.png');
          }
        });
        shadowRoot.append(navBottom);
      } else {
        navBottom = shadowRoot.querySelector('.navButton[direction="bottom"]');
        if (navBottom != null) {
          navBottom.remove();
        }
      }
      break;
    default:
      break;
  }
}

// save the previous position in nav buttons as attribute 'data-pos-before',
// which initial value is -1; save the position in variable reachableBottomPos,
// where we can actually reach when click nav bottom button, cz we need to share
// this value both in window.onscroll & navBottom.onclick events, which initial
// value is -1.
let reachableBottomPos = -1;

window.addEventListener('scroll', (event) => {
  let shadowDiv = document.querySelector('div.navBtnContainer');
  if (shadowDiv != null) {
    let navTopBtn =
        shadowDiv.shadowRoot.querySelector('.navButton[direction="top"]');
    if (navTopBtn != null && navTopBtn.dataset.posBefore != -1 &&
        window.pageYOffset != 0) {
      navTopBtn.dataset.posBefore = -1;
      navTopBtn.src =
          chrome.runtime.getURL('images/nav_top_white_48dp.png');
      navTopBtn.setAttribute('title',
          chrome.i18n.getMessage("checkbox_navigate_to_top"));
    }
    let navBottomBtn =
        shadowDiv.shadowRoot.querySelector('.navButton[direction="bottom"]');
    if (navBottomBtn != null && navBottomBtn.dataset.posBefore != -1 &&
        window.pageYOffset != reachableBottomPos) {
      navBottomBtn.dataset.posBefore = -1;
      navBottomBtn.src =
          chrome.runtime.getURL('images/nav_bottom_white_48dp.png');
      navBottomBtn.setAttribute('title',
          chrome.i18n.getMessage("checkbox_navigate_to_bottom"));
    }
  }
});

displayNavigationButton();