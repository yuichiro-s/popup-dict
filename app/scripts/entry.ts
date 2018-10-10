import 'chromereload/devonly';

import { LEMMA, VariantType } from './dictionary';

export class VariantEntry {
  type: VariantType;
  entry: Entry;
}
export class Entry {
  lemma: string;
  pos: string;  // part-of-speech
  features: string[];
  definitions: string[];
  url: string;
}

function renderDefinition(definition: string) {
  return `<span class="popup-dict-entry-definition">${definition}</span>`;
}

const MAX_CHARACTERS = 100;

function renderDefinitions(definitions: string[]) {
  let definitionSpans = '';
  let len = 0;
  for (let i = 0; i < definitions.length; i++) {
    let definition = definitions[i];
    definitionSpans += renderDefinition(definition);
    len += definition.length;
    if (len >= MAX_CHARACTERS && len) {
      definitionSpans += '<span>...</span>';
      break;
    }
  }
  return definitionSpans;
}

function renderFeatures(features: string[]) {
  let content = '';
  if (features.length > 0) {
    content += ' (';
    content += features.join(', ');
    content += ')';
  }
  return content;
}

export function renderEntry(entry: Entry, types: VariantType[]): string {
  let definitionSpans = renderDefinitions(entry.definitions);
  let features = renderFeatures(entry.features);

  let html = `
    <div class="popup-dict-entry">
      <div class="popup-dict-entry-headline">
        <span class="popup-dict-entry-lemma">${entry.lemma}</span>
        <span class="popup-dict-entry-pos">${entry.pos}</span>
        <span class="popup-dict-entry-features">${features}</span>
      </div>
      <div class="popup-dict-entry-definitions">${definitionSpans}</div>
    </div>`;
  return html;
}