import { buildDictionaryAndFrequency } from "./dictionary";

test("buildDictionaryAndFrequency", () => {
    const dict = {
        "abc def": true,
        "abc def ghi": true,
        "abc deF ghi jkl": true,
        "abc Def ghi jkl": true,
        "abc def xxx": true,
        "abc def xxx yyy": true,
        "abc def zzz": true,

        "constructor": true,

        "makes": true,
        "make": true,
        "making": true,
        "makings XXX": true,
    };

    const lemmatizer = {
        deF: "def",
        made: "make",
        makes: "make",
        makings: "making",
        constructors: "constructor",
    };

    const rawFrequencyTable = {
        // -> make = 2000
        "makes": 1000,
        "made": 1000,

        // -> making = 200
        "makings": 100,
        "making": 100,

        "abc def": 70,
        "abc def ghi": 60,
        "abc def ghi jkl": 50,
        "abc def xxx": 30,
        "abc def xxx yyy": 20,
        "abc def zzz": 10,
    };

    const { index, dictionaryChunks, freqs } = buildDictionaryAndFrequency(dict, lemmatizer, rawFrequencyTable, 3);

    expect(freqs).toEqual({
        "make": 2000,
        "making": 200,
        "abc def": 70,
        "abc def ghi": 60,
        "abc def ghi jkl": 50,
        "abc Def ghi jkl": 50,
        "abc def xxx": 30,
        "abc def xxx yyy": 20,
        "abc def zzz": 10,
        "making XXX": 0,
        "constructor": 0,
    });

    expect(index).toEqual({
        "make": 0,
        "making": 0,
        "abc def": 0,
        "abc def ghi": 1,
        "abc def ghi jkl": 1,
        "abc Def ghi jkl": 1,
        "abc def xxx": 2,
        "abc def xxx yyy": 2,
        "abc def zzz": 2,
        "making XXX": 3,
        "constructor": 3,
    });

    expect(dictionaryChunks.get(0)).toEqual({
        "make": true,
        "making": true,
        "abc def": true,
    });
    expect(dictionaryChunks.get(1)).toEqual({
        "abc def ghi": true,
        "abc def ghi jkl": true,
        "abc Def ghi jkl": true,
    });
    expect(dictionaryChunks.get(2)).toEqual({
        "abc def xxx": true,
        "abc def xxx yyy": true,
        "abc def zzz": true,
    });
    expect(dictionaryChunks.get(3)).toEqual({
        "making XXX": true,
        "constructor": true,
    });
});
