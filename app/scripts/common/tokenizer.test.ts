import { tokenize } from "./tokenizer";

test("tokenize", () => {
    expect(tokenize("-aaa-bbb--c  d - ", true)).toEqual([
        { begin: 0, end: 1, form: "-" },
        { begin: 1, end: 4, form: "aaa" },
        { begin: 4, end: 5, form: "-" },
        { begin: 5, end: 8, form: "bbb" },
        { begin: 8, end: 9, form: "-" },
        { begin: 9, end: 10, form: "-" },
        { begin: 10, end: 11, form: "c" },
        { begin: 13, end: 14, form: "d" },
        { begin: 15, end: 16, form: "-" },
    ]);
    expect(tokenize("  aa bb ", false)).toEqual([
        { begin: 0, end: 1, form: " " },
        { begin: 1, end: 2, form: " " },
        { begin: 2, end: 3, form: "a" },
        { begin: 3, end: 4, form: "a" },
        { begin: 4, end: 5, form: " " },
        { begin: 5, end: 6, form: "b" },
        { begin: 6, end: 7, form: "b" },
        { begin: 7, end: 8, form: " " },
    ]);
});
