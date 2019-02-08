import { markBrackets } from './eijiro.worker';

test('markBrackets', () => {
    expect(markBrackets('［abc］de【ghij】kl《mnop》')).toEqual(
        [
            ['［abc］'],
            'de',
            ['【ghij】'],
            'kl',
            ['《mnop》'],
        ],
    );
    expect(markBrackets('abcde【ghij】《XXX》klmnop')).toEqual(
        [
            'abcde',
            ['【ghij】'],
            ['《XXX》'],
            'klmnop',
        ],
    );
    expect(markBrackets('abcde【ghij】klm◆nop')).toEqual(
        [
            'abcde',
            ['【ghij】'],
            'klm',
            ['◆nop'],
        ],
    );
});
