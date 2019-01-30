import handlebars, { Template, TemplateDelegate } from 'handlebars';

import { DictionaryItem } from './dictionary';
import { PackageID, getPackage } from './packages';
import { CachedMap } from './cachedmap';

handlebars.registerHelper('ifString', function (text, options) {
    if (typeof text === 'string') {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

export const CLASS_POPUP_DICTIONARY = 'popup-dictionary';

let templates = new CachedMap<PackageID, TemplateDelegate>(loader);

function loader(pkgId: PackageID): Promise<Template> {
    return new Promise((resolve, reject) => {
        getPackage(pkgId).then(pkg => {
            try {
                const template = handlebars.compile(pkg.template);
                resolve(template);
            } catch (e) {
                reject(e);
            }
        });
    });

}

export async function createToolTip(pkgId: PackageID, item: DictionaryItem) {
    let template = await templates.get(pkgId);
    let e = document.createElement('div');
    e.classList.add(CLASS_POPUP_DICTIONARY);
    e.innerHTML = template(item);
    return e;
}