import { Lemmatizer, lemmatizeTokens } from '../background/lemmatizer';
import { tokenize } from '../common/tokenizer';

export function lemmatizeKeyStr(keyStr: string, lemmatizer: Lemmatizer): string[] {
    const tokens = tokenize(keyStr, true).map(tok => tok.form);
    return lemmatizeTokens(tokens, lemmatizer);
}