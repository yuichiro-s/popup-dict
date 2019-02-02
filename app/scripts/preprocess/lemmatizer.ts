import { Dictionary, Inflection, Lemmatizer } from './types';

const MAX_DEPTH = 10;

export function buildLemmatizer(dict: Dictionary, inflection: Inflection): Lemmatizer {
    const lemmatizer: Lemmatizer = {};

    for (const originalForm of Object.keys(inflection)) {
        // phrases are ignored
        if (originalForm.split(' ').length === 1) {
            let form = originalForm;
            // recursively lemmatize
            for (let i = 0; i < MAX_DEPTH; i++) {
                if (form in dict) {
                    // stop lemmatizing when the current form is in the dictionary
                    if (form !== originalForm) {
                        // register only when the original form differs from the current form
                        lemmatizer[originalForm] = form;
                    }
                    break;
                } else {
                    if (form in inflection) {
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