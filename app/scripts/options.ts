import { sendCommand } from './command';
import { SUPPORTED_LANGUAGES, Language, GERMAN, ENGLISH, CHINESE } from './languages';
import { Entry, State } from './entry';
import { DictionaryItem } from './dictionary';

async function exportCommand() {
  const json = await sendCommand({ type: 'export-entries' });
  let blob = new Blob([json], { type: 'text/json' });
  let e = document.createEvent('MouseEvents');
  let a = document.createElement('a');
  a.download = 'highlighter_backup.json';
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
  e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  a.dispatchEvent(e);
}

async function importCommand() {
  let fileElem = document.getElementById('fileElem')!;
  fileElem.click();
}

async function clearCommand() {
  sendCommand({ type: 'clear-entries' }).then(() => {
    alert('Claered all entries.');
  });
}

function handleFiles(evt: Event) {
  let target = <HTMLInputElement>evt.target;
  let files = target.files!;
  if (files.length !== 0) {
    let file = files[0];
    let reader = new FileReader();
    reader.onload = (e) => {
      sendCommand({ type: 'import-entries', data: (<any>e.target).result }).then(() => {
        alert('Import completed.');
        sortByFreqCommand();
      });
    };
    reader.readAsText(file);
  }
}

const DICTIONARIES = new Map<string, Map<string, string>>([
  [GERMAN, new Map([
    ['Linguee', 'https://www.linguee.de/deutsch-englisch/search?source=auto&query={}'],
    ['dict.cc', 'https://www.dict.cc/?s={}'],
    ['Wiktionary (de)', 'https://de.wiktionary.org/wiki/{}'],
    ['Wiktionary (en)', 'https://en.wiktionary.org/wiki/{}'],
  ])],
  [ENGLISH, new Map([
    ['The Free Dictionary', 'https://www.thefreedictionary.com/{}'],
    ['Wiktionary', 'https://en.wiktionary.org/wiki/{}'],
    ['Dictionary.com', 'https://www.dictionary.com/browse/{}'],
  ])],
  [CHINESE, new Map([
    ['Weblio日中中日辞典', 'https://cjjc.weblio.jp/content/{}'],
    ['句酷', 'http://www.jukuu.com/search.php?q={}'],
  ])],
]);

function mouseClickListener(evt: MouseEvent) {
  let word = (<HTMLElement>evt.target).textContent!;
  let selector = <HTMLSelectElement>document.getElementById('dictionarySelector')!;
  let url = selector.value!.replace('{}', word);
  window.open(url);
}

function splitIntoTags(sentence: string, marked: boolean, lang: Language) {
  let tags = [];
  for (let word of sentence.split(' ')) {
    let tag = document.createElement('span');
    tag.classList.add('word');
    if (marked) {
      tag.classList.add('marked');
    }
    tag.appendChild(document.createTextNode(word));
    tag.addEventListener('click', mouseClickListener);
    if (lang !== CHINESE) {
      tag.append(document.createTextNode(' ')); // trailing space
    }
    tags.push(tag);
  }
  return tags;
}

function createRows(entry: Entry, item: DictionaryItem | undefined, withDef: boolean, lang: Language): HTMLTableRowElement[] {
  let row = document.createElement('tr');
  /*
  let sourceStr = '';
  if (entry.source) {
    sourceStr = `<a href="${entry.source.url || ''}" target="_blank">${entry.source.title || ''}</a>`;
  }
  */
  let rowspan = withDef ? ' rowspan="2"' : '';
  row.innerHTML = `
      <td class="cell" ${rowspan}><button data-key="${entry.key}">OK</button></td>
      <td class="cell" ${rowspan}>${entry.date ? new Date(entry.date).toLocaleDateString() : ''}</td>
      <td class="cell" >${item && item.freq || 0}</td>
      <td class="cell" >${entry.key}</td>
      <td class="cell"></td>
    `;
  let context = entry.context;
  if (context) {
    let contextRow = row.children[4];
    let beforeStr = context.text.slice(0, context.begin);
    let afterStr = context.text.slice(context.end);
    const MAX_LENGTH = 100;
    if (beforeStr.length >= MAX_LENGTH) {
      beforeStr = '... ' + beforeStr.slice(beforeStr.length - MAX_LENGTH);
    }
    if (afterStr.length >= MAX_LENGTH) {
      afterStr = afterStr.slice(0, MAX_LENGTH) + ' ...';
    }
    let before = splitIntoTags(beforeStr, false, lang);
    let highlight = splitIntoTags(context.text.slice(context.begin, context.end), true, lang);
    let after = splitIntoTags(afterStr, false, lang);
    let tags = [];
    tags.push(...before);
    tags.push(...highlight);
    tags.push(...after);
    for (let tag of tags) {
      contextRow.appendChild(tag);
    }
  }
  row.getElementsByTagName('button')[0].addEventListener('click', () => {
    entry.state = State.Known;
    delete entry.source;
    delete entry.context;
    sendCommand({ type: 'update-entry', entry });
    row.style.backgroundColor = 'lightgray';
  });

  let results = [row];
  if (withDef) {
    let defStr = '';
    if (item && item.lemmas && item.defs) {
      defStr = '<table>';
      for (let i = 0; i < item.lemmas.length; i++) {
        let l = item.lemmas[i];
        let d = item.defs[i];
        defStr += `<tr class="def"><td><b>${l}</b></td><td>${d}</td></tr>`;
      }
      defStr += '</table>';
    }
    let defRow = document.createElement('tr');
    defRow.innerHTML = `<td class="cell" colspan="3">${defStr}</td>`;
    results.push(defRow);
  }
  return results;
}

function withDefinition() {
  let element = <HTMLInputElement>document.getElementById('showDefinitionBox')!;
  return element.checked;
}

async function getEntriesToShow(lang: Language, withDef: boolean) {
  let entries: Entry[] = await sendCommand({ type: 'list-entries', lang, state: State.Marked });
  let entryToItem = new Map<Entry, DictionaryItem>();
  if (withDef) {
    let items = await sendCommand({
      type: 'lookup-dictionary',
      lang,
      keys: entries.map(entry => entry.key),
    });
    for (let i = 0; i < items.length; i++) {
      entryToItem.set(entries[i], items[i]);
    }
  }
  return { entries, entryToItem };
}

async function resetTable(sortByFreq: boolean) {
  let table = document.getElementById('wordTable')!;
  table.innerHTML = '<p>Loading...</p>';

  let withDef = withDefinition();
  let lang = getLanguage();
  let { entries, entryToItem } = await getEntriesToShow(lang, withDef);

  // sort
  function getFreq(entry: Entry) {
    let item = entryToItem.get(entry);
    return (item && item.freq) || 0;
  }
  if (sortByFreq) {
    entries.sort((a, b) => getFreq(b) - getFreq(a));
  } else {
    // sort by date
    entries.sort((a, b) => (b.date || 0) - (a.date || 0));
  }
  table.innerHTML = `
    <thead>
      <tr>
      <th></th>
      <th>Date</th>
      <th>Freq</th>
      <th>Key</th>
      <th>Context</th>
      </tr>
      </thead>
  `;

  for (let entry of entries) {
    let item = entryToItem.get(entry);
    let rows = createRows(entry, item, withDef, lang);
    for (let row of rows) {
      table.appendChild(row);
    }
  }
}

function sortByDateCommand() {
  resetTable(false);
}

function sortByFreqCommand() {
  resetTable(true);
}

function setUpDictionarySelector(lang: Language) {
  let selector = document.getElementById('dictionarySelector')!;
  selector.innerHTML = '';
  let dictionaries = DICTIONARIES.get(lang)!;
  dictionaries.forEach((url, name) => {
    let element = document.createElement('option');
    element.setAttribute('value', url);
    element.innerHTML = name;
    selector.appendChild(element);
  });
}

function initLanguageSelector() {
  let selector = document.getElementById('languageSelector')!;
  for (let lang of SUPPORTED_LANGUAGES) {
    let element = document.createElement('option');
    element.setAttribute('value', lang);
    element.innerHTML = lang;
    selector.appendChild(element);
  }
  selector.addEventListener('change', () => {
    setUpDictionarySelector(getLanguage());
    sortByFreqCommand();
  });
}

function getLanguage() {
  let selector = <HTMLSelectElement>document.getElementById('languageSelector')!;
  return selector.value!;
}

async function init() {
  initLanguageSelector();
  setUpDictionarySelector(getLanguage());
  document.getElementById('fileElem')!.addEventListener('change', handleFiles);
  document.getElementById('exportButton')!.addEventListener('click', exportCommand);
  document.getElementById('importButton')!.addEventListener('click', importCommand);
  document.getElementById('clearButton')!.addEventListener('click', clearCommand);
  document.getElementById('sortByDateButton')!.addEventListener('click', sortByDateCommand);
  document.getElementById('sortByFreqButton')!.addEventListener('click', sortByFreqCommand);
  document.getElementById('showDefinitionBox')!.addEventListener('click', sortByFreqCommand);
  sortByFreqCommand();
}

init();
