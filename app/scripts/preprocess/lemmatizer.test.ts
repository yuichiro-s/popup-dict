import { buildLemmatizer } from './lemmatizer';
import { get } from '../common/objectmap';

test('buildLemmatizer', () => {
    const dict = {
        'AAAAA': true,
        'AA': true,
        'CC': true,
        'constructor': true,

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
        'constructors': 'constructor',

        'made': 'make',
        'making': 'make',
        'makings': 'making',
    };

    const lemmatizer = buildLemmatizer(dict, inflection);
    expect(get(lemmatizer, 'AAAAAAA')).toEqual('AAAAA');
    expect(get(lemmatizer, 'AAAAAA')).toEqual('AAAAA');
    expect(get(lemmatizer, 'AAAAA')).toBeUndefined();
    expect(get(lemmatizer, 'AAAA')).toEqual('AA');
    expect(get(lemmatizer, 'AAA')).toEqual('AA');
    expect(get(lemmatizer, 'AA')).toBeUndefined();
    expect(get(lemmatizer, 'A')).toBeUndefined();
    expect(get(lemmatizer, 'BBB')).toBeUndefined();
    expect(get(lemmatizer, 'BB')).toEqual('CC');
    expect(get(lemmatizer, 'XYZ')).toBeUndefined();

    expect(get(lemmatizer, 'constructors')).toEqual('constructor');
    expect(get(lemmatizer, 'XYZ')).toBeUndefined();

    expect(get(lemmatizer, 'make')).toBeUndefined();
    expect(get(lemmatizer, 'made')).toEqual('make');
    expect(get(lemmatizer, 'making')).toBeUndefined();
    expect(get(lemmatizer, 'makings')).toEqual('making');
});