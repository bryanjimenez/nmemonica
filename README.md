# [Nmemonica](https://bryanjimenez.github.io/nmemonica)
> English - Japanese language learning app  

> [!Note]  
> Nmemonica is a PWA and uses the Service Worker API [(MDN docs)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) which is only enabled over HTTPS.  
> Nmemonica uses local storage and indexedDB (cookie technologies) to store user app data.

This repo contains the UI's source code for [Nmemonica](https://bryanjimenez.github.io/nmemonica).


## Installation (for development)
### *Prerequisites*
1. [Git](https://git-scm.com/)
1. [Node](https://nodejs.org)

### App (website/PWA)
1. `git clone https://github.com/bryanjimenez/nmemonica.git` 
1. `cd ./nmemonica`
1. `npm install`

### Running locally
1. `npm run start`
1. Open a browser to https://localhost:8080

## Getting Started
<details><summary>Basic Usage Guide</summary>

After loading the application for the first time you will likely want to add study material (Phrases, Vocabulary and Kanji). Most parts of the app depend on user created study material with the exception of the Kana/Hiragana/Katakana game. Study material (UGC User Generated Content) can be imported or entered directly. For more details see the [Edit](#Edit) section.

### Navigation
The Navigation Menu is accessed by clicking the hamburger icon ![Image](https://raw.githubusercontent.com/primer/octicons/main/icons/three-bars-24.svg "Menu Button") located at the top right of the app. The Navigation Menu displays the different areas of the app that can be reached by clicking their corresponding icon. Some areas are grouped together under one icon. The items under a group can be accessed by clicking on the caption under the group's icon. For example under the Kanji icon the caption will either display "Kanji" or "Kanji Game".

| Group | Sections | Description |
| ----- | -------- | ----------- |
| A | [Kana Game](#kana-game)<br/> Hiragana Game<br/> Katakana Game  | Kana games. Match the sound (romaji) to the character. |
| B | [Opposites Game](#opposites-game)   | Multiple choice game. Find the opposites. |
| C | [Vocabulary](#vocabulary)<br/> [Phrases](#phrases) | Study list of Vocabulary / Phrases. |
| D | [Particle Game](#particles-game) | Multiple choice game. Choose the particle that makes the phrase grammatically correct.|
| E | [Kanji](#kanji)<br/> [Kanji Game](#kanji-game) | Study list of Kanji and multiple choice Kanji game. |
| F | [Settings](#settings-page) | Contains user settings, Regulatory and additional App information.|
| G | [Edit](#edit) | Dataset entry/edit/import/export page (spreadsheet). |


### Kana Game
URL: [/#/kana](https://bryanjimenez.github.io/nmemonica/#/kana)  
This game will display a character (kana) or the corresponding pronunciation and the goal is to correctly match the pronunciation and the character. There are varying levels of difficulty (more choices) options to play depending on the configuration in the settings page (under Kana Game).

### Opposites Game
URL: [/#/opposites](https://bryanjimenez.github.io/nmemonica/#/opposites)  
This is a multiple choice game. A term is displayed and several options given. The goal is to choose the term that is opposite from the options.

Data for this game comes from the Vocabulary dataset. To add additional game entries in the Vocabulary dataset under the Opposites column add the uid of the term that is opposite word to the currently selected term.

> [!Note]  
> The term's uid is generated using the `md5` formula.

For example:

|        | Japanese       | English  | Opposites  | *(Explanation)* |
| ------ | -------------- | -------- | ---------- | ------------- |
| ...
| **A6** | にんげん`\n`<br/>人間   | Human    | `=md5(A8)` | We marked Human and Monster as a pair to be added to the game.
| ...
| **A8** | ばけもの`\n`<br/>化け物 | Monster  | `=md5(A6)` |


### Vocabulary
URL: [/#/vocabulary](https://bryanjimenez.github.io/nmemonica/#/vocabulary)  
This page will display a list of pairs of vocabulary words (English + Japanese) as if seen on a deck of cards. The order and filtering of the list can be configured from the settings page (under Vocabulary). In touch screen devices swiping horizontally will move through out the deck and vertically will play the pronunciation of the word.

> [!Note]  
> Vocabulary words can be tagged with basic categories or special indicators (indicated below by highlighted text under the Tags column).  
> Furigana can be added to Vocabulary words in Japanese by including the pronunciation followed by a new line then the kanji characters. To add a line break inside a cell type `\n`. 

||A|B|C||
| ------ | -------------- | ----------- | -------- | ------------- |
|        | **Japanese**   | **English** | **Tags** | *(Explanation)* |
| ...
| **A6** | にんげん`\n`<br/>人間   | Human    | {"tags":[`"inv:" & md5(A8)`"]} | We tagged Human and Monster inverse words.
| ...
| **A8** | ばけもの`\n`<br/>化け物 | Monster  | {"tags":[`"inv:" & md5(A6)`"]} |
| ...
| **A12** | こわい`\n`<br/>怖い   | Scary, Frightening | Appearance; Beginner-Words; | Scary is tagged with some extra categories.
| **A13** | きれい`\n`<br/>綺麗   | Beautiful, Clean | {"tags":["`na-adj`"]} | We tagged Beautiful a na-adjective.
| ...
| **A25** | おわる`\n`<br/>終わる | to be finished | {"tags":[`"intr:" & md5(A26)`"]} | We tagged **終わる** intransitive with **終える** as it's transitive pair.
| **A26** | おえる`\n`<br/>終える | to finish | |
| ...
| **A25** | おれる`\n`<br/>折れる | to snap, fracture | {"tags":["`intr`"]} | We tagged **折れる** an intransitive verb.
| ...
| **A30** | おまえ`\n`<br/>お前 | you | {"tags":["`slang`"]} | We tagged **お前** as a slang term.
| **A31** | わたくし`\n`<br/>私 | example | {"tags":["`keigo`"]} | We tagged **私** as a keigo term.


### Phrases
URL: [/#/phrases](https://bryanjimenez.github.io/nmemonica/#/phrases)  
This page is nearly identical to the vocabulary page with the exception that it will display phrases. Additionally Phrases can be tagged with the following special indicators:


||A|B|C||
| ------ | -------------- | ----------- | -------- | ------------- |
|        | **Japanese**   | **English** | **Tags** | *(Explanation)* |
| ... 
| **A25** | ... | ... | {"tags":["`keigo`"]} | We tagged ... as Keigo.
| **A30** | ... | ... | {"tags":["`formal`"]} | We tagged ... as Formal.
| **A31** | ... | ... | {"tags":["`polite`"]} | We tagged ... as Polite.
| **A32** | ... | ... | {"tags":["`passive`"]} | We tagged ... as Passive.
| **A33** | ... | ... | {"tags":["`colloquial`"]} | We tagged ... as Colloquial.
| **A34** | ... | ... | {"tags":["`derrogative`"]} | We tagged ... as Derrogative.


> [!Note]  
> Phrases can be tagged with basic categories or special indicators. 

### Particles Game
URL: [/#/particles](https://bryanjimenez.github.io/nmemonica/#/particles)  
This game is another multiple choice game. The goal of the game is to choose the correct particle that makes the phrase grammatically correct.

To include phrases in the game, tag the phrase indicating the particles wanted to be tested.

|        | Japanese   | English  | Tags   | *(Explanation)* |
| ------ | ---------- | -------- | ------ | ------------- |
| **A6** | やさい**は**すき`\n`<br/>野菜**は**好き   | I like vegetables | {"tags":["`p:は`"]} | We want the**は**particle to be included in the game.
| **A7** | くだもの**は**すき`\n`果物**は**好き   | I like fruits | {"tags":["`P:は`"]} | The CasE of the tag's identifier is not important.
| ...
| **A10** | かんぺき**が**もの**は**いない`\n`,br/>完璧**が**もの**は**いない  | Nothing is perfect | {"tags":["`p:は,が`"]} | We want **both** the **は** and **が** particles to be included in the game.
| **A11** | にわ**には**にわにわとりがいる`\n`<br/>庭**には**二羽鶏がいる  | There are two chickens in the garden | {"tags":["`p:には`"]} | We want the **には** particle to be included in the game.

### Kanji
URL: [/#/kanji](https://bryanjimenez.github.io/nmemonica/#/kanji)  
This page is similar to the vocabulary and phrases. The list of Kanji each has (if available) a kunyomi and onyomi reading, the symbol's meaning and example usage.

Kanji can be tagged with the basic categories or special indicators (indicated here by highlighted text under the Tags column):

|        | Kanji       | English | Tags | *(Explanation)* |
| ------ | ----------- | ------- | ---- | ------------- |
| **P**honetic Kanji<br/>`P:kanji+sounds`<br/>`p:kanji+sounds` | 訪   | visit    | {"tags":["`p:方+ほう、ぼう`"]} | We indicate that **訪** contains the phonetic radical **方** which may sound like **ほう** or **ぼう**.
| **E**xample Kanji<br/>`E:kanji,kanji`<br/>`e:kanji,kanji`| 艹   | flowers    | {"tags":["`e:花,茶`"]} | We indicate that radical **艹** can be found in **花** and **茶**.
| **S**imilar Kanji<br/>`S:kanji,kanji`<br/>`s:kanji,kanji`| 斤   | axe    | {"tags":["`s:反,友`"]} | We indicate that kanji **斤** is similar to **反** and **友**.
| **Stroke** Number | 六  | six | {"tags":[], "`stroke`":`4`}| We indicate that **六** is a four stroke kanji

### Settings Page
URL: [/#/settings](https://bryanjimenez.github.io/nmemonica/#/settings)  
Application and user settings will be found here.  

- Application basic settings  
- Game difficulty settings  
- Study list filtering and sorting  
- Usage Terms and Policies

### Edit
URL: [/#/sheet](https://bryanjimenez.github.io/nmemonica/#/sheet)  
Your study material in spreadsheet format. Data entry/edit page and [Dataset Action Menu](#dataset-action-menu).  

> [!Important]  
> Datasets **won't** be saved **until** the save button is pressed.  
> Inside a cell multiple tags need to be separated using a `;` or `\n` (line break)  

> [!Note]  
> To add a line break inside a cell use `\n` or multiple consecutive spaces.  
> To generate a term's uid use the `md5` formula providing the cell ref to the Japanese pronunciation. For example: `=md5(A6)`  


This page contains the phrases, vocabulary and kanji datasets. The user can edit these to include the desired items to study. Datasets can be saved and shared as CSV files and searched ![Image](https://raw.githubusercontent.com/primer/octicons/main/icons/search-24.svg "Search Button")  using the corresponding buttons. 

The Dataset structure can be downloaded and data can be entered using a spread sheet software.
> [!Important]  
> Spread sheet must be saved as CSV file in order to be imported once again.

Minimal **spreadsheet formula knowledge** is required to tag terms.  
For example:  
- How to start a formula statement in a cell (use the `=` symbol followed by your formula).
- How to call a formula with a cell's reference (`=CoolFormula(B3)`).
- How to concatenate a string inside a cell (`="first part" & "second part"`).

#### Dataset Action Menu
> Dataset save and share actions can be found here.  

> [!Important]  
> Sync Service under development. Sharing currently possible only among geographically local peers (dependent on Wasmer Edge hosting service).

The Sync Service is a [WebRTC](webrtc.org) connection-information relay (Data is not exchanged over the service) between two users. Any user can share their UGC (User Generated Content) by providing a one-time share id and an encryption key to the receiving user.

| Action | Description | Icon |
| ----- | -------- | ----------- |
| Save Changes | Saves your changes | ![Image](https://raw.githubusercontent.com/primer/octicons/main/icons/database-24.svg "Save Button") |
| Import from File | Import Datasets or settings from file system| ![Image](https://raw.githubusercontent.com/primer/octicons/main/icons/file-binary-24.svg "File Button") |
| Import from Sync | Import shared Datasets from Peer (need: share ID and Key)| ![Image](https://raw.githubusercontent.com/primer/octicons/main/icons/cloud-24.svg "Import Button") |
| Export to File | Backup your Datasets and settings to the file system | ![Image](https://raw.githubusercontent.com/primer/octicons/main/icons/file-zip-24.svg "Export Button")|
| Export to Sync | Export and share Datasets with Peer (provide the recipiant the share ID and Key) |![Image](https://raw.githubusercontent.com/primer/octicons/main/icons/cloud-24.svg "Export Button") |

</details>

## Credits
Thanks to:
 - The [Japanese Verb Conjugator](https://www.japaneseverbconjugator.com/) website for conjugation examples and reference.
 - The following projects for powering Nmemonica's audio/pronunciation:  
    + Software
      - [hts_engine](https://hts-engine.sourceforge.net/)
      - [openjtalk](https://open-jtalk.sourceforge.net/)
      - [jbonsai](https://github.com/jpreprocess/jbonsai)
      - [jpreprocess](https://github.com/jpreprocess/jpreprocess)
      - [flite](https://github.com/festvox/flite)
    + Voices
      - [hts_voice_nitech_jp_atr503_m001-1.05](https://open-jtalk.sourceforge.net)
      - [tohoku-f01](https://github.com/icn-lab/htsvoice-tohoku-f01)

 - The [x-data-spreadsheet](https://github.com/myliang/x-spreadsheet) project created by [@myliang](https://github.com/myliang) and forked by Nmemonica for it's web spreadsheet component.
 - Several online sources for providing reference to spaced repetition algorithms, including:  
    - [A Better Spaced Repetition Learning Algorithm: SM2+](https://www.blueraja.com/blog/477/a-better-spaced-repetition-learning-algorithm-sm2) by blueraja
    - [Spaced Repetition From The Ground Up](https://controlaltbackspace.org/spacing-algorithm/) by [@sobjornstad](https://github.com/sobjornstad)
    - [Effective learning: Twenty rules of formulating knowledge](https://super-memory.com/articles/20rules.htm) by Dr Piotr Wozniak.
 - The [jisho.org](https://jisho.org) online dictionary for vocabulary reference.
 - The [tatoeba.org](https://tatoeba.org) website for grammar and vocabulary references.
