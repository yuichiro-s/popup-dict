import 'chromereload/devonly';
import {createNodeFromString} from './util';
import { PopupEntry } from './search';

function getPopup() {
  let popup = document.getElementById('popup-dict-dialog');
  return popup;
}

function withPopup(callback: (popup: HTMLElement) => void) {
  let popup = getPopup();
  if (popup !== null) {
    callback(popup);
  }
}

/**
 * Check whether (x, y) is inside the popup dialog.
 */
export function isInsidePopup(x: number, y: number) {
  let popup = getPopup();
  return popup && popup.contains(document.elementFromPoint(x, y));
}

/**
 * Set the position of the popup dialog.
 */
export function setPopupPosision(x: number, y: number) {
  withPopup((popup) => {
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
  });
}

/**
 * Show the popup dialog with the specified content.
 * @param entries  Array of rendered dictionary entries.
 */
export function showPopup(entries: PopupEntry[]) {
  withPopup((popup) => {
    let popupContent = document.getElementById('popup-dict-dialog-content');
    if (popupContent !== null) {
      popup.style.display = 'block';
      popupContent.innerHTML = '';
      for (let i = 0; i < entries.length; i++) {
        if (i > 0) {
          let hr = document.createElement('hr');
          hr.classList.add('popup-dict-content-separator');
          popupContent.appendChild(hr);
        }
        let entry = entries[i];
        let node = createNodeFromString(entry.rendered);
        // add URL link
        node.addEventListener('click', () => {
          window.open(entry.url, '_blank', 'height=600,width=600');
        });
        popupContent.appendChild(node);
      }
    }
  });
}

/**
 * Hide the popup dialog.
 */
export function hidePopup() {
  withPopup((popup) => {
    popup.style.display = 'none';
  });
}

/**
 * Create the popup dialog.
 */
export function createPopup() {
  let html = `<div id="popup-dict-dialog"><div id="popup-dict-dialog-content"/></div>`;
  let node = createNodeFromString(html);
  document.body.appendChild(node);
}

/**
 * Remove the popup dialog.
 */
export function removePopup() {
  withPopup((popup) => {
    document.body.removeChild(popup);
  });
}
