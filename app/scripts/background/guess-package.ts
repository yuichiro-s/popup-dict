import { get, keys } from "../common/objectmap";
import { IPackage } from "../common/package";
import { getGlobalSettings } from "./global-settings";
import { getPackages } from "./packages";

export async function guessPackage(text: string) {
    const packages = await getPackages();
    const codeToPackage = new Map<string, IPackage>();
    for (const pkgId of keys(packages)) {
        const pkg = get(packages, pkgId)!;
        codeToPackage.set(pkg.languageCode, pkg);
    }
    const supportedLanguages = Array.from(codeToPackage.keys());

    const globalSettings = await getGlobalSettings();
    const blacklistedLanguages = globalSettings.blacklistedLanguages;

    const allLanguages = supportedLanguages.concat(blacklistedLanguages);

    if (allLanguages.length === 0) {
        return null;
    } else {
        const { default: detect } = await import("franc") as any;
        const lang = detect(text, { whitelist: allLanguages });

        if (lang === "und") {
            console.log(`Unable to determine language.`);
            return null;

        } else if (blacklistedLanguages.includes(lang)) {
            console.log(`Blacklisted language: ${lang}`);
            return null;

        } else {
            const pkg = codeToPackage.get(lang)!;
            const pkgName = pkg.name;
            console.log(`Guessed language: ${lang}`);
            console.log(`Using: ${pkgName}`);
            return pkg;
        }
    }
}
