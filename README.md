# [Nmemonica](https://bryanjimenez.github.io/nmemonica)
>English - Japanese language learning app  

>Note:
Nmemonica is a PWA and uses the Service Worker API [(MDN docs)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) which is only enabled over HTTPS.  
Nmemonica uses local storage and indexedDB (cookie technologies) to store user app data.

This repo contains the UI's source code for [Nmemonica](https://bryanjimenez.github.io/nmemonica). The service documentation can be found here ([snservice](https://github.com/bryanjimenez/snservice/blob/main/README.md)).


## Installation (for development)
### *Prerequisites*
1. [Git](https://git-scm.com/)
1. [Node](https://nodejs.org)
1. *[OpenSSL](https://openssl.org) (if using @nmemonica/snservice)*

### App (website/PWA)
1. `git clone https://github.com/bryanjimenez/nmemonica.git` 
1. `cd ./nmemonica`
1. `npm install`

>Note: [@nmemonica/snservice](https://github.com/bryanjimenez/snservice) (local development service) is installed as a dependency which enables:  
Testing and backing up your data locally.  
Editing your datasets on a desktop and viewing the app on a mobile device. See [snservice README.md](https://github.com/bryanjimenez/snservice/blob/main/README.md)

### Running locally
1. `npm run service`
1. `npm run start`
1. Open a browser to https://localhost:8080

## Getting Started
After loading the application for the first time you will likely want to add study material (Phrases, Vocabulary and Kanji). Most parts of the app depend on user created study material with the exception of the Kana/Hiragana/Katakana game. To add study material see the [Edit](#Edit) section.

### Navigation
The Navigation Menu is accessed by clicking the hamburger icon {% octicon "three-bars" %} located at the top right of the app. The Navigation Menu displays the different areas of the app that can be reached by clicking their corresponding icon. Some areas are grouped together under one icon. The items under a group can be accessed by clicking on the caption under the group's icon. For example under the Kanji icon the caption will either display "Kanji" or "Kanji Game".

| Group | Sections | Description |
| ----- | -------- | ----------- |
| A | [Kana Game](#kana-game)<br/> Hiragana Game<br/> Katakana Game  | Kana games. Match the sound (romaji) to the character. |
| B | [Opposites Game](#opposites-game)   | Multiple choice game. Find the opposites. |
| C | [Vocabulary](#vocabulary)<br/> [Phrases](#phrases) | Study list of Vocabulary / Phrases. |
| D | [Particle Game](#particles-game) | Multiple choice game. Choose the particle that makes the phrase grammatically correct.|
| E | [Kanji](#kanji)<br/> [Kanji Game](#kanji-game) | Study list of Kanji and multiple choice Kanji game. |
| F | [Settings](#settings-page) | Contains user settings, Regulatory and additional App information.|
| G | [Edit](#edit) | Data entry/edit page (spreadsheet). |


### Kana Game
URL: [/#/kana](https://bryanjimenez.github.io/nmemonica/#/kana)  
This game will display a character (kana) or the corresponding pronunciation and the goal is to correctly match the pronunciation and the character. There are varying levels of difficulty (more choices) options to play depending on the configuration in the settings page (under Kana Game).

### Opposites Game
URL: [/#/opposites](https://bryanjimenez.github.io/nmemonica/#/opposites)  
This is a multiple choice game. A term is displayed and several options given. The goal is to choose the term that is opposite from the options.

Data for this game comes from the Vocabulary dataset. To add additional game entries in the Vocabulary dataset under the Opposites column add the uid of the term that is opposite word to the currently selected term.

> **Note**: The term's uid is generated using the `md5` formula.

For example:

|        | Japanese       | English  | Opposites   | (Explanation) |
| ------ | -------------- | -------- | ---------- | ------------- |
| ...
| **A6** | にんげん\n人間   | Human    | `=md5(A8)` | We marked Human and Monster as a pair to be added to the game.
| ...
| **A8** | ばけもの\n化け物 | Monster  | `=md5(A6)` |


### Vocabulary
URL: [/#/vocabulary](https://bryanjimenez.github.io/nmemonica/#/vocabulary)  
This page will display a list of pairs of vocabulary words (English + Japanese) as if seen on a deck of cards. The order and filtering of the list can be configured from the settings page (under Vocabulary). In touch screen devices swiping horizontally will move through out the deck and vertically will play the pronunciation of the word.

> **Note**: Vocabulary words can be tagged with basic categories or special indicators (indicated below by highlighted text under the Tags column).

> **Note**: Vocabulary words in Japanese can be added with furigana by including the pronunciation followed by a new line then the kanji characters. To add a line break inside a cell type `\n`. 

||A|B|C||
| ------ | -------------- | ----------- | -------- | ------------- |
|        | **Japanese**   | **English** | **Tags** | (Explanation) |
| ...
| **A6** | にんげん`\n`人間   | Human    | `="inv:" & md5(A8)` | We tagged Human and Monster inverse words.
| ...
| **A8** | ばけもの`\n`化け物 | Monster  | `="inv:" & md5(A6)` |
| ...
| **A12** | こわい`\n`怖い   | Scary, Frightening | Appearance; Beginner-Words; | Scary is tagged with some extra categories.
| **A13** | きれい`\n`綺麗   | Beautiful, Clean | `na-adj` | We tagged Beautiful a na-adjective.
| ...
| **A25** | おわる`\n`終わる | to be finished | `="intr:" & md5(A26)` | We tagged **終わる** intransitive with **終える** as it's transitive pair.
| **A26** | おえる`\n`終える | to finish | |
| ...
| **A25** | おれる`\n`折れる | to snap, fracture | `intr` | We tagged **折れる** an intransitive verb.
| ...
| **A30** | vocabulary | example | `slang` | We tagged `example` as a slang term.
| **A31** | vocabulary | example | `keigo` | We tagged `example` as a keigo term.


### Phrases
URL: [/#/phrases](https://bryanjimenez.github.io/nmemonica/#/phrases)  
This page is nearly identical to the vocabulary page with the exception that it will display phrases.

> **Note**: Phrases can be tagged with basic categories or special indicators. The special indicator for polite phrase is to include a `。` at the end of a phrase.

### Particles Game
URL: [/#/particles](https://bryanjimenez.github.io/nmemonica/#/particles)  
This game is another multiple choice game. The goal of the game is to choose the correct particle that makes the phrase grammatically correct.

To include phrases in the game, tag the phrase indicating the particles wanted to be tested.

|        | Japanese   | English  | Tags   | (Explanation) |
| ------ | ---------- | -------- | ------ | ------------- |
| **A6** | phrase   | phrase | `p:は` | We want the **は** particle to be included in the game.
| **A7** | phrase   | phrase | `P:は` | The CasE of the tag's identifier is not important.
| ...
| **A10** | phrase  | phrase | `p:は,が` | We want **both** the **は** and **が** particles to be included in the game.
| **A11** | phrase  | phrase | `p:には` | We want the **には** particle to be included in the game.

### Kanji
URL: [/#/kanji](https://bryanjimenez.github.io/nmemonica/#/kanji)  
This page is similar to the vocabulary and phrases. The list of Kanji each has (if available) a kunyomi and onyomi reading, the symbol's meaning and example usage.

Kanji can be tagged with the basic categories or special indicators (indicated here by highlighted text under the Tags column):

|        | Kanji       | English | Tags | (Explanation) |
| ------ | ----------- | ------- | ---- | ------------- |
| `P:kanji+sounds`<br/>`p:kanji+sounds` | 訪   | visit    | `p:方+ほう、ぼう` | We indicate that **訪** contains the phonetic radical **方** which may sound like **ほう** or **ぼう**.
| `E:kanji,kanji`<br/>`e:kanji,kanji`| 艹   | flowers    | `e:花,茶` | We indicate that radical **艹** can be found in **花** and **茶**.

### Settings Page
> Application and user settings will be found here.  
URL: [/#/settings](https://bryanjimenez.github.io/nmemonica/#/settings)  

- Application basic settings  
- Game difficulty settings  
- Study list filtering and sorting  
- Usage Terms and Policies

### Edit
> Your study material in spreadsheet format. Data entry/edit page.  
URL: [/#/sheet](https://bryanjimenez.github.io/nmemonica/#/sheet)  

> **Note**: Datasets **won't** be saved **until** the save button {% octicon "share" %} is pressed.

> **Note**: To add a line break inside a cell use `\n` or multiple consecutive spaces.

> **Note**: To generate a term's uid use the `md5` formula providing the cell ref to the Japanese pronunciation. For example: `=md5(A6)`

> **Note**: Inside a cell multiple tags need to be separated using a `;` or `\n` (line break)

This page contains the phrases, vocabulary and kanji datasets. The user can edit these to include the desired items to study. Datasets can be saved {% octicon "share" %}, downloaded {% octicon "desktop-download" %} as CSV files and searched {% octicon "search" %} using the corresponding buttons. 

For details on the dataset structure see the [datasets](https://github.com/bryanjimenez/nmemonica-snservice?tab=readme-ov-file#datasets) section of snservice.

Minimal **spreadsheet formula knowledge** is required to tag terms.  
For example:  
- How to start a formula statement in a cell (use the `=` symbol followed by your formula).
- How to call a formula with a cell's reference (`=CoolFormula(B3)`).
- How to concatenate a string inside a cell (`="first part" & "second part"`).


## Credits
Thanks to:
 - The [Japanese Verb Conjugator](http://www.japaneseverbconjugator.com/) website for conjugation examples and reference.
 - [Google Translate](https://translate.google.com/) for powering Nmemonica's audio/pronunciation.
 - The [x-data-spreadsheet](https://github.com/myliang/x-spreadsheet) project created by [@myliang](https://github.com/myliang) and forked by Nmemonica for it's web spreadsheet component.
 - Several online sources for providing reference to spaced repetition algorithms, including:  
    - [A Better Spaced Repetition Learning Algorithm: SM2+](https://www.blueraja.com/blog/477/a-better-spaced-repetition-learning-algorithm-sm2) by blueraja
    - [Spaced Repetition From The Ground Up](https://controlaltbackspace.org/spacing-algorithm/) by [@sobjornstad](https://github.com/sobjornstad)
    - [Effective learning: Twenty rules of formulating knowledge](https://super-memory.com/articles/20rules.htm) by Dr Piotr Wozniak.
 - The [jisho.org](https://jisho.org) online dictionary for vocabulary reference.
 - The [tatoeba.org](https://tatoeba.org) website for grammar and vocabulary references.
