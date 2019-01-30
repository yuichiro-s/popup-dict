import handlebars from 'handlebars';

import { DictionaryItem } from './dictionary';

let wiktionaryTemplate = `
<span class="dictionary-entry-word">{{word}}</span>

{{#each entries}}
    {{#unless @first}}
        <hr class="dictionary-entry-separator"></hr>
    {{/unless}}

    <div class="dictionary-entry">
        <span class="dictionary-entry-pos">{{this.pos}}</span>

        {{#each this.gender}}
            <span class="dictionary-entry-gender">{{this}}</span>
        {{/each}}

        {{#if this.info}}
            <span class="dictionary-entry-info">
            (
                {{#each this.info}}
                    {{#unless @first}},{{/unless}}
                    <span class="dictionary-entry-info-key">{{this.[0]}}</span>
                    <span class="dictionary-entry-info-value">{{this.[1]}}</span>
                {{/each}}
            )
            </span>
        {{/if}}

        <ol class="dictionary-entry-defs">
            {{#each this.defs}}
                <li>
                    {{#ifString this}}
                        <span class="dictionary-entry-def">{{this}}</span>
                    {{else}}
                        <span class="dictionary-entry-def">{{this.[0]}}</span>
                        <dl>
                            {{#each this.[1]}}
                                <dd class="dictionary-entry-example-original">
                                    {{#ifString this.[0]}}
                                        {{this.[0]}}
                                    {{else}}
                                        {{#each this.[0]}}
                                            {{#ifString this}}
                                                {{this}}
                                            {{else}}
                                                <b>{{this.[1]}}</b>
                                            {{/ifString}}
                                        {{/each}}
                                    {{/ifString}}
                                </dd>
                                <dd class="dictionary-entry-example-translation">
                                    {{#ifString this.[1]}}
                                        {{this.[1]}}
                                    {{else}}
                                        {{#each this.[1]}}
                                            {{#ifString this}}
                                                {{this}}
                                            {{else}}
                                                <b>{{this.[1]}}</b>
                                            {{/ifString}}
                                        {{/each}}
                                    {{/ifString}}
                                </dd>
                            {{/each}}
                        </dl>
                    {{/ifString}}
                </li>
            {{/each}}
        </ol>
    </div>
{{/each}}
`;
handlebars.registerHelper('ifString', function (text, options) {
    if (typeof text === 'string') {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
let temp = handlebars.compile(wiktionaryTemplate);

export const CLASS_POPUP_DICTIONARY = 'popup-dictionary';

export function createToolTip(item: DictionaryItem) {
    let e = document.createElement('div');
    e.classList.add(CLASS_POPUP_DICTIONARY);
    e.innerHTML = temp(item);
    return e;
}