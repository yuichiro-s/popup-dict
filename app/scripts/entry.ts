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

function renderType(type: string[]) {
  let elements = type.join('+');
  return `<span class="popup-dict-entry-type">${elements}</span>`;
}

const TENSE_ORDER = [
  'INF', 'GER', 'PP', 'PRES', 'IMPERF', 'PRET', 'FUT', 'COND', 'SBJV', 'SBJV-IMPERF', 'IMP',
];

function organizeTypes(types: string[][]) {
  // sort types
  types = types.sort((a: string[], b: string[]) => {
    // this assumes that tense is the first item
    return TENSE_ORDER.indexOf(a[0]) - TENSE_ORDER.indexOf(b[0]);
  });

  // merge similar types
  let merged = [];
  let arrayEqual = (a: string[], b: string[]) => (a.length === b.length) && true;
  for (let i = 0; i < types.length; i++) {
    let type = types[i];
    let isNew = true;
    if (merged.length > 0) {
      let type2 = merged[merged.length - 1];
      if (JSON.stringify(type.slice(0, type.length - 1)) === JSON.stringify(type2.slice(0, type2.length - 1))) {
        // if type[i][:-1] == type[i-1][:-1]
        type2[type2.length - 1] += '/' + type[type.length - 1];
        isNew = false;
      }
    }
    if (isNew) {
      // use copy because this will be modified in-place when merging types
      merged.push(type.slice());
    }
  }
  return merged;
}

function renderTypes(types: VariantType[]) {
  let spans = '';
  let nonLemmaTypes = [];
  for (let type of types) {
    if (type !== LEMMA) {
      nonLemmaTypes.push(type);
    }
  }
  for (let type of organizeTypes(nonLemmaTypes)) {
    spans += renderType(type);
  }
  return spans;
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
  let typeSpans = renderTypes(types);
  let features = renderFeatures(entry.features);

  let html = `
    <div class="popup-dict-entry">
      <div class="popup-dict-entry-headline">
        <span class="popup-dict-entry-lemma">${entry.lemma}</span>
        <span class="popup-dict-entry-pos">${entry.pos}</span>
        <span class="popup-dict-entry-features">${features}</span>
        <span class="popup-dict-entry-types">${typeSpans}</span>
      </div>
      <div class="popup-dict-entry-definitions">${definitionSpans}</div>
    </div>`;
  return html;
}