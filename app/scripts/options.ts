import { sendCommand } from './command';
import { PackageID } from './packages';
import { importPackage, loadFile } from './importer';
import { Entry, State, MarkedEntry, KnownEntry } from './entry';
import { DictionaryItem } from './dictionary';
import { Settings } from './settings';

async function exportCommand() {
    const json = await sendCommand({ type: 'export-user-data' });
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

async function handleFiles(evt: Event) {
    let target = <HTMLInputElement>evt.target;
    let files = target.files!;
    if (files.length !== 0) {
        let file = files[0];
        let data = await loadFile(file);
        await sendCommand({ type: 'import-user-data', data });
        alert('Import completed.');
        sortByFreqCommand();
    }
}

function importPackageCommand(event: Event) {
    let files = (<HTMLInputElement>event.target).files;
    if (files) {
        importPackage(files);
    }
}
function mouseClickListener(evt: MouseEvent) {
    let word = (<HTMLElement>evt.target).textContent!;
    let selector = <HTMLSelectElement>document.getElementById('dictionarySelector');
    if (selector) {
        let url = selector.value!.replace('{}', word);
        window.open(url);
    }
}

function splitIntoTags(sentence: string, marked: boolean, settings: Settings) {
    let tags = [];
    for (let word of sentence.split(' ')) {
        let tag = document.createElement('span');
        tag.classList.add('word');
        if (marked) {
            tag.classList.add('marked');
        }
        tag.appendChild(document.createTextNode(word));
        tag.addEventListener('click', mouseClickListener);
        if (settings.tokenizeByWhiteSpace) {
            tag.append(document.createTextNode(' ')); // trailing space
        }
        tags.push(tag);
    }
    return tags;
}

function createRows(entry: MarkedEntry, item: DictionaryItem | undefined, withDef: boolean, settings: Settings): HTMLTableRowElement[] {
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
      <td class="cell" ${rowspan}>${new Date(entry.date).toLocaleDateString()}</td>
      <td class="cell" >${item && item.freq || 0}</td>
      <td class="cell" >${entry.key}</td>
      <td class="cell"></td>
    `;
    let context = entry.context;
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
    let before = splitIntoTags(beforeStr, false, settings);
    let highlight = splitIntoTags(context.text.slice(context.begin, context.end), true, settings);
    let after = splitIntoTags(afterStr, false, settings);
    let tags = [];
    tags.push(...before);
    tags.push(...highlight);
    tags.push(...after);
    for (let tag of tags) {
        contextRow.appendChild(tag);
    }
    row.getElementsByTagName('button')[0].addEventListener('click', () => {
        let newEntry: KnownEntry = {
            key: entry.key,
            pkgId: entry.pkgId,
            state: State.Known,
        };
        sendCommand({ type: 'update-entry', entry: newEntry });
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

async function getEntriesToShow(pkgId: PackageID) {
    let entries: MarkedEntry[] = await sendCommand({ type: 'list-entries', pkgId, state: State.Marked });
    let entryToItem = new Map<Entry, DictionaryItem>();
    let items = await sendCommand({
        type: 'lookup-dictionary',
        pkgId,
        keys: entries.map(entry => entry.key),
    });
    for (let i = 0; i < items.length; i++) {
        entryToItem.set(entries[i], items[i]);
    }
    return { entries, entryToItem };
}

async function resetTable(sortByFreq: boolean, pkg: Settings) {
    let table = document.getElementById('wordTable')!;
    table.innerHTML = '<p>Loading...</p>';

    let withDef = withDefinition();
    let { entries, entryToItem } = await getEntriesToShow(pkg.id);

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
        let rows = createRows(entry, item, withDef, pkg);
        for (let row of rows) {
            table.appendChild(row);
        }
    }
}

async function sortByDateCommand() {
    let pkg = await getPackage();
    if (pkg) {
        resetTable(false, pkg);
    }
}

async function sortByFreqCommand() {
    let pkg = await getPackage();
    if (pkg) {
        resetTable(true, pkg);
    }
}

function setUpDictionarySelector(pkg: Settings) {
    let selector = document.getElementById('dictionarySelector')!;
    selector.innerHTML = '';
    for (let dict of pkg.dictionaries) {
        let element = document.createElement('option');
        element.setAttribute('value', dict.pattern);
        element.innerHTML = dict.name;
        selector.appendChild(element);
    }
}

async function initPackageSelector() {
    let selector = document.getElementById('packageSelector')!;
    let packages = await sendCommand({ type: 'get-packages' });
    for (let pkgId in packages) {
        let pkg: Settings = packages[pkgId];
        if (pkg) {
            let element = document.createElement('option');
            element.setAttribute('value', pkg.id);
            element.innerHTML = pkg.name;
            selector.appendChild(element);
        }
    }
    selector.addEventListener('change', async () => {
        let pkg = await getPackage();
        if (pkg) {
            setUpDictionarySelector(pkg);
            resetTable(true, pkg);
        }
    });
}

async function getPackage() {
    let selector = <HTMLSelectElement>document.getElementById('packageSelector')!;
    let pkgId = selector.value;
    let packages = await sendCommand({ type: 'get-packages' });
    if (packages) {
        return packages[pkgId];
    } else {
        return null;
    }
}

async function init() {
    await initPackageSelector();
    let pkg = await getPackage();
    if (pkg) {
        setUpDictionarySelector(pkg);
    }
    document.getElementById('fileElem')!.addEventListener('change', handleFiles);
    document.getElementById('exportButton')!.addEventListener('click', exportCommand);
    document.getElementById('importPackageButton')!.addEventListener('change', importPackageCommand);
    document.getElementById('importButton')!.addEventListener('click', importCommand);
    document.getElementById('sortByDateButton')!.addEventListener('click', sortByDateCommand);
    document.getElementById('sortByFreqButton')!.addEventListener('click', sortByFreqCommand);
    document.getElementById('showDefinitionBox')!.addEventListener('click', sortByFreqCommand);
    sortByFreqCommand();
}

init();
