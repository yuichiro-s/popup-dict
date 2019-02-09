import { IDictionary } from "../common/dictionary";
import { ILemmatizer } from "../common/lemmatizer";
import { has } from "../common/objectmap";

interface Inflection { [form: string]: string; }

const MAX_DEPTH = 10;

export function buildLemmatizer(dict: IDictionary, inflection: Inflection): ILemmatizer {
    const lemmatizer: ILemmatizer = {};

    for (const originalForm of Object.keys(inflection)) {
        // phrases are ignored
        if (originalForm.split(" ").length === 1) {
            let form = originalForm;
            // recursively lemmatize
            for (let i = 0; i < MAX_DEPTH; i++) {
                if (has(dict, form)) {
                    // stop lemmatizing when the current form is in the dictionary
                    if (form !== originalForm) {
                        // register only when the original form differs from the current form
                        lemmatizer[originalForm] = form;
                    }
                    break;
                } else {
                    if (has(inflection, form)) {
                        // lemmatize further
                        form = inflection[form];
                    } else {
                        break;
                    }
                }
            }
        }
    }

    return lemmatizer;
}
