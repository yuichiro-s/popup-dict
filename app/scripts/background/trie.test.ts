import { createEmptyNode, add, findAllOccurrences } from './trie';

test('findAllOccurrences', () => {
    const trie = createEmptyNode();
    add(trie, ['abc', 'def', 'ghi', 'jkl']);
    add(trie, ['abc', 'def']);
    add(trie, ['P', 'Q']);
    add(trie, ['p']);
    expect(findAllOccurrences(trie, ['xxx', 'abc', 'def', 'xxx'], false)).toEqual([{
        begin: 1,
        end: 3,
        key: ['abc', 'def'],
    }]);
    expect(findAllOccurrences(trie, ['xxx', 'abc', 'def', 'ghi', 'xxx'], false)).toEqual([{
        begin: 1,
        end: 3,
        key: ['abc', 'def'],
    }]);
    expect(findAllOccurrences(trie, ['xxx', 'abc', 'def', 'ghi', 'jkl'], false)).toEqual([{
        begin: 1,
        end: 5,
        key: ['abc', 'def', 'ghi', 'jkl'],
    }]);
    expect(findAllOccurrences(trie, ['xxx', 'Abc', 'def', 'ghi', 'jkl'], false)).toEqual([]);
    expect(findAllOccurrences(trie, ['xxx', 'Abc', 'def', 'ghi', 'jkl'], true)).toEqual([{
        begin: 1,
        end: 5,
        key: ['abc', 'def', 'ghi', 'jkl'],
    }]);
    expect(findAllOccurrences(trie, ['xxx', 'ABC', 'def', 'ghi', 'jkl'], true)).toEqual([]);
    expect(findAllOccurrences(trie, ['xxx', 'Abc', 'Def', 'ghi', 'jkl'], true)).toEqual([]);

    expect(findAllOccurrences(trie, ['P', 'Q'], false)).toEqual([{
        begin: 0,
        end: 2,
        key: ['P', 'Q'],
    }]);
    expect(findAllOccurrences(trie, ['P'], false)).toEqual([]);
    expect(findAllOccurrences(trie, ['P', 'q'], false)).toEqual([]);
    expect(findAllOccurrences(trie, ['P', 'q'], true)).toEqual([{
        begin: 0,
        end: 1,
        key: ['p'],
    }]);
});