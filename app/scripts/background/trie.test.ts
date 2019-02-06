import { createEmptyNode, add, findAllOccurrences } from './trie';

test('findAllOccurrences', () => {
    const trie = createEmptyNode();
    add(trie, ['abc', 'def', 'ghi', 'jkl']);
    add(trie, ['abc', 'def']);
    add(trie, ['p', 'Q']);
    add(trie, ['P']);

    expect(findAllOccurrences(trie, ['xxx', 'abc', 'def', 'xxx'])).toEqual([{
        begin: 1,
        end: 3,
        key: ['abc', 'def'],
    }]);
    expect(findAllOccurrences(trie, ['xxx', 'abc', 'def', 'ghi', 'xxx'])).toEqual([{
        begin: 1,
        end: 3,
        key: ['abc', 'def'],
    }]);
    expect(findAllOccurrences(trie, ['xxx', 'abc', 'def', 'ghi', 'jkl'])).toEqual([{
        begin: 1,
        end: 5,
        key: ['abc', 'def', 'ghi', 'jkl'],
    }]);
    expect(findAllOccurrences(trie, ['xxx', 'Abc', 'def', 'ghi', 'jkl'])).toEqual([]);
    expect(findAllOccurrences(trie, ['xxx', ['Abc', 'abc'], 'def', 'ghi', 'jkl'])).toEqual([{
        begin: 1,
        end: 5,
        key: ['abc', 'def', 'ghi', 'jkl'],
    }]);
    expect(findAllOccurrences(trie, ['xxx', ['ABC', 'xxx', 'aBC'], 'def', 'ghi', 'jkl'])).toEqual([]);
    expect(findAllOccurrences(trie, ['xxx', ['Abc', 'abc'], ['Def', 'def'], 'ghi', 'jkl'])).toEqual([]);

    expect(findAllOccurrences(trie, ['p', 'Q'])).toEqual([{
        begin: 0,
        end: 2,
        key: ['p', 'Q'],
    }]);
    expect(findAllOccurrences(trie, ['p'])).toEqual([]);
    expect(findAllOccurrences(trie, ['p', 'q'])).toEqual([]);
    expect(findAllOccurrences(trie, [['p', 'P'], 'q'])).toEqual([{
        begin: 0,
        end: 1,
        key: ['P'],
    }]);
    expect(findAllOccurrences(trie, ['p', ['q', 'Q']])).toEqual([]);
});