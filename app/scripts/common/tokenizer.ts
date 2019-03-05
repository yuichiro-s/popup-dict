const DELIMITERS = [
    // white spaces
    " ",
    "\t",
    "\n",
    // punctuations
    ".",
    ",",
    "!",
    "?",
    ":",
    ";",

    "(",
    ")",
    "[",
    "]",

    '"',
    "“",
    "„",
    "'",
    "‘",
    "’",

    "—",
    "-",
];

export interface IToken {
    form: string;
    begin: number;
    end: number;
}

function split(word: string) {
    const tokens = [];
    let cursor = 0;
    for (let i = 0; i < word.length; i++) {
        const c = word.charAt(i);
        if (DELIMITERS.includes(c)) {
            if (cursor < i) {
                tokens.push(word.substring(cursor, i));
            }
            tokens.push(c);
            cursor = i + 1;
        }
    }
    if (cursor < word.length) {
        tokens.push(word.substring(cursor, word.length));
    }
    return tokens;
}

export function tokenize(text: string, tokenizeByWhiteSpace: boolean): IToken[] {
    const tokens: IToken[] = [];
    let cursor = 0;
    function add(word: string) {
        if (word.length > 0) {
            tokens.push({
                form: word,
                begin: cursor,
                end: cursor + word.length,
            });
        }
    }
    let toks;
    if (tokenizeByWhiteSpace) {
        toks = split(text);
    } else {
        toks = text.split("");
    }
    for (const token of toks) {
        if (!tokenizeByWhiteSpace || token !== " ") {
            add(token);
        }
        cursor += token.length;
    }
    return tokens;
}
