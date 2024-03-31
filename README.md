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
### Navigation
Navigating through the games and pages in the application is done from the hamburger menu {% octicon "three-bars" %} located at the top right of the app. Once the menu is open different areas of the app can be reached by clicking the corresponding icon. Some areas are grouped together under one icon. The items under a group can be accessed by clicking on the caption under the group's icon. For example under the Kanji icon the caption will either display "Kanji" or "Kanji Game".

### Settings Page
> Application and user settings will be found here.  
URL: [/#/settings](https://bryanjimenez.github.io/nmemonica/#/settings)  

### Kana Game
URL: [/#/kana](https://bryanjimenez.github.io/nmemonica/#/kana)  
This game will display a character (kana) or the corresponding pronunciation and the goal is to correctly choose. There are varying levels of difficulty (more choices) options to play depending on the configuration in the settings page (under Kana Game).

### Opposites Game
URL: [/#/opposites](https://bryanjimenez.github.io/nmemonica/#/opposites)  
This is a multiple choice game. A term is displayed and several options given. The goal is to choose the opposite term from the options.

Data for this game comes from the Vocabulary dataset. To add additional game entries in the Vocabulary dataset under the Opposites column add the uid of the term that is opposite word to the currently selected term.

> NOTE: The term's uid is generated using the `md5` formula.

For example:

|        | Japanese       | English  | Opposite   |
| ------ | -------------- | -------- | -----------|
| ...
| **A6** | にんげん\n人間   | Human    | `=md5(A8)` |
| ...
| **A8** | ばけもの\n化け物 | Monster  | `=md5(A6)` |


### Vocabulary
URL: [/#/vocabulary](https://bryanjimenez.github.io/nmemonica/#/vocabulary)  
This page will display a list of pairs of vocabulary words (English + Japanese) as if seen on a deck of cards. The order and filtering of the list can be configured from the settings page (under Vocabulary). In touch screen devices swiping horizontally will move through out the deck and vertically will play the pronunciation of the word.

### Phrases
URL: [/#/phrases](https://bryanjimenez.github.io/nmemonica/#/phrases)  
This page is nearly identical to the vocabulary page with the exception that it will display phrases.

### Particles Game
URL: [/#/particles](https://bryanjimenez.github.io/nmemonica/#/particles)  
This game is another multiple choice game. The goal of the game is to choose the correct particle that makes the phrase grammatically correct.

### Kanji
URL: [/#/kanji](https://bryanjimenez.github.io/nmemonica/#/kanji)  
This page is similar to the vocabulary and phrases. The list of Kanji each has (if available) a kunyomi and onyomi reading, the symbol's meaning and example usage.

### Edit
URL: [/#/sheet](https://bryanjimenez.github.io/nmemonica/#/sheet)  
> Note: To add a line break inside a cell use `\n` or multiple consecutive spaces.

> Note: Datasets **won't** be saved **until** the save button {% octicon "share" %} is pressed.

This page contains the phrases, vocabulary and kanji datasets. The user can edit these to include the desired items to study. Datasets can be saved {% octicon "share" %}, downloaded {% octicon "desktop-download" %} as CSV files and searched {% octicon "search" %} using the corresponding buttons. 

For details on the dataset structure see the [datasets](https://github.com/bryanjimenez/nmemonica-snservice?tab=readme-ov-file#datasets) section of snservice.

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
