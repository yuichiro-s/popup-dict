import { buildTrie } from './trie';
import { exists, getKeys } from '../background/trie';


test('buildTrie', () => {
    const dict = {
        'abc def': true,
        'abc def ghi': true,
        'abc deF ghi jkl': true,
        'abc Def ghi jkl': true,
        'abc def xxx': true,
        'abc def xxx yyy': true,
        'abc def zzz': true,

        'makes': true,
        'make': true,
        'making': true,
        'makings XXX': true,
    };

    const lemmatizer = {
        'deF': 'def',
        'made': 'make',
        'makes': 'make',
        'makings': 'making',
    };

    const trie = buildTrie(dict, lemmatizer);
    const e = (keyStr: string) => exists(trie, keyStr.split(' '));
    expect(e('abc')).toBeFalsy();
    expect(e('abc def')).toBeTruthy();
    expect(e('abc def ghi')).toBeTruthy();
    expect(e('abc def ghi jkl')).toBeTruthy();
    expect(e('abc deF ghi jkl')).toBeFalsy();
    expect(e('abc def ghi jkl')).toBeTruthy();
    expect(e('abc Def ghi jkl')).toBeTruthy();
    expect(e('abc def xxx')).toBeTruthy();
    expect(e('abc def xxx yyy')).toBeTruthy();
    expect(e('abc def zzz')).toBeTruthy();
    expect(e('makes')).toBeFalsy();
    expect(e('make')).toBeTruthy();
    expect(e('making')).toBeTruthy();
    expect(e('makings XXX')).toBeFalsy();
    expect(e('making XXX')).toBeTruthy();

    const keys = getKeys(trie);
    expect(keys.sort()).toEqual([
        ['abc', 'def'],
        ['abc', 'def', 'ghi'],
        ['abc', 'def', 'ghi', 'jkl'],
        ['abc', 'Def', 'ghi', 'jkl'],
        ['abc', 'def', 'xxx'],
        ['abc', 'def', 'xxx', 'yyy'],
        ['abc', 'def', 'zzz'],
        ['make'],
        ['making'],
        ['making', 'XXX'],
    ].sort());
});