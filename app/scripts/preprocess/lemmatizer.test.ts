import { buildLemmatizer } from './lemmatizer';

test('lemmatizer', () => {
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
    expect(lemmatizer['AAAAA']).toBe(undefined);
    expect(lemmatizer['AAAA']).toBe('AA');
    expect(lemmatizer['AAA']).toBe('AA');
    expect(lemmatizer['AA']).toBe(undefined);
    expect(lemmatizer['A']).toBe(undefined);
    expect(lemmatizer['BBB']).toBe(undefined);
    expect(lemmatizer['BB']).toBe('CC');

    expect(lemmatizer['make']).toBe(undefined);
    expect(lemmatizer['made']).toBe('make');
    expect(lemmatizer['making']).toBe(undefined);
    expect(lemmatizer['makings']).toBe('making');
});