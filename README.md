[![Build Status](https://travis-ci.com/yuichiro-s/popup-dict.svg?branch=master)](https://travis-ci.com/yuichiro-s/popup-dict)

# Highlighter

## Installation

1. Download the extension [here](https://github.com/yuichiro-s/popup-dict/releases/download/0.1.1/build.tar.gz)
and extract it
3. Go to `chrome://extensions` in the Chrome browser
4. Turn on "Developer mode" (top of the page)
5. Press "Load unpacked extension..." and choose the extracted directory (the one containing `manifest.json`)
6. Right-click the icon
![logo](https://raw.githubusercontent.com/yuichiro-s/popup-dict/master/app/images/icon16.png)
on the address bar and select "Options"
6. Select "SETTINGS" and proceed to import a package (next section)

## Importing a package

### Importing a precompiled package

1. Download and extract the package you need
   - English-Japanese: [ejdic-hand](https://drive.google.com/open?id=1zYrwpSTWYWmZIZIVtaXI4y8IQrUK-Q5R)
   - English-English: wik-enen
   - Chinese-English: cedict
   - Spanish-English: wik-esen
   - German-English: wik-deen
   - French-English: wik-fren
   - Russian-English: wik-ruen
2. Press "IMPORT PACKAGE" on the settings page
3. Upload the extracted package directory and press "IMPORT"

### Importing 英辞郎

1. Purchase and download 英辞郎 data [here](https://booth.pm/ja/items/777563)
2. Download and extract the auxiliary files [here](https://drive.google.com/open?id=1Vz8jncKpcZ0UNh0ycG_xqoRO-AjdVaYO)
3. Press the "IMPORT 英辞郎" button on the settings page
4. Upload the downloaded 英辞郎 file and press "NEXT"
4. Upload the extracted directory of auxiliary files and press "IMPORT"
6. (Optional) If you already have imported an English package (e.g., ejdic-hand), delete it by selecting the package (below "Configure Packages") and pressing the "DELETE PACKAGE" button.

## Basic Usage

- Initilally, every word on a web page is highlighted in yellow.
- If you move a mouse cursor over a highlighted word, a dictionary popup will show up.
  - You can configure when to show the popup dictionary. (next section)
- If you are already familiar with the word, unhighlight it by pressing Ctrl+Shift+A while the mouse cursor is on the word
  - If this doesn't work or you want to change the keyboard shortcuts, configure them by going to `chrome://extensions` and clicking the "Keyboard shortcuts" link. [More info](https://lifehacker.com/add-custom-keyboard-shortcuts-to-chrome-extensions-for-1595322121)
  - You can also unhighlight multiple words at once by selecting a range of text and pressing Ctrl+Shift+A. All words in yellow in the range will be unhighlighted.
- If the word is unfamiliar to you and you'd like to learn the word, mark the word in red by pressing Ctrl+Shift+S, so that the word will be always highlighted in red every time you encounter the word.
- You can review all the words marked in red by going to "WORD LIST" section of the option page.
  - You can bookmark this page for convenience.
  - The words can be sorted by frequency so that you can review the most important words first.

## Additional Features

- Toggle highlights by clicking the icon on the address bar
- Unhighlight frequent words
  - Go to "FREQUENCY FILTER" on the option page
- Configure when to show the dictionary popup
  - Select from "Always", "Unknown or Marked" and "Never" on the settings page
- Export and import your word list
  - "User Data" section of the settings page
- URL blacklist
  - Disable the extension on pages that match specified URL patterns
- Language blacklist
  - Disable the extension on pages in certian languages

## Disclaimer

- Some pages will look corrupted due to interaction between this extension and the Javascript and CSS code on the page. In that case, please turn off the extension by clicking the extension icon on the address bar or blacklisting the URL of the page.
