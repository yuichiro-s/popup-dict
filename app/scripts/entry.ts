import {createNodeFromString} from './util';

export class Entry {
  lemma: string;
  pos: string;  // part-of-speech
  features: string[];
  definitions: string[];
  url: string;
}

export function renderEntry(entry: Entry): string {
  let html = `
    <div id="popup-dict-entry">
      <span class="popup-dict-entry-lemma">${entry.lemma}</span>
      &nbsp;
      <span class="popup-dict-entry-pos">${entry.pos}</span>
      <div style="float: right">
        <span class="popup-dict-entry-features">${entry.features.join('|')}</span>
      </div>
      <div class="popup-dict-entry-definitions">${entry.definitions.join('|')}</div>
    </div>`;
  return html;
}