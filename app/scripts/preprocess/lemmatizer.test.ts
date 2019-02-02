import { buildLemmatizer } from './lemmatizer';

test('buildLemmatizer', () => {
    const dict = {
        'AAAAA': true,
        'AA': true,
        'CC': true,

        'make': true,
        'making': true,
    };

    const inflection = {
        'AAAAAAA': 'AAAAAA',
        'AAAAAA': 'AAAAA',
        'AAAA': 'AAA',
        'AAA': 'AA',
        'AA': 'A',
        'BBB': 'CCC',
        'BB': 'CC',

        'made': 'make',
        'making': 'make',
        'makings': 'making',
    };

    const lemmatizer = buildLemmatizer(dict, inflection);
    expect(lemmatizer['AAAAAAA']).toBe('AAAAA');
    expect(lemmatizer['AAAAAA']).toBe('AAAAA');
    expect(lemmatizer['AAAAA']).toBeUndefined();
    expect(lemmatizer['AAAA']).toBe('AA');
    expect(lemmatizer['AAA']).toBe('AA');
    expect(lemmatizer['AA']).toBeUndefined();
    expect(lemmatizer['A']).toBeUndefined();
    expect(lemmatizer['BBB']).toBeUndefined();
    expect(lemmatizer['BB']).toBe('CC');
    expect(lemmatizer['XYZ']).toBeUndefined();

    expect(lemmatizer['make']).toBeUndefined();
    expect(lemmatizer['made']).toBe('make');
    expect(lemmatizer['making']).toBeUndefined();
    expect(lemmatizer['makings']).toBe('making');
});