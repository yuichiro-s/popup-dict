import * as handlebars from "handlebars";

import { CachedMap } from "../common/cachedmap";
import { IDictionaryItem } from "../common/dictionary";
import { PackageID } from "../common/package";
import { sendCommand } from "./command";

handlebars.registerHelper("ifString", function(text: any, options: handlebars.HelperOptions) {
    if (typeof text === "string") {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

export const CLASS_POPUP_DICTIONARY = "popup-dictionary";

const templates = new CachedMap<PackageID, handlebars.TemplateDelegate>(loader);

function loader(pkgId: PackageID): Promise<handlebars.TemplateDelegate> {
    return new Promise((resolve, reject) => {
        sendCommand({ type: "get-package", pkgId }).then((pkg) => {
            try {
                const template = handlebars.compile(pkg.template);
                resolve(template);
            } catch (e) {
                reject(e);
            }
        });
    });
}

export async function createToolTip(pkgId: PackageID, item: IDictionaryItem) {
    const template = await templates.get(pkgId);
    const e = document.createElement("div");
    e.classList.add(CLASS_POPUP_DICTIONARY);
    e.innerHTML = template(item);
    return e;
}
