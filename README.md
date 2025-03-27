# [Nmemonica](https://bryanjimenez.github.io/nmemonica)
> English - Japanese language learning app  

> [!Note]  
> Nmemonica is a PWA and uses the Service Worker API [(MDN docs)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) which is only enabled over HTTPS.  
> Nmemonica uses local storage and indexedDB (cookie technologies) to store user app data.

This repo contains the UI's source code for [Nmemonica](https://bryanjimenez.github.io/nmemonica).


## User Documentation
If you want documentation on how to use the application check out the [User Guide](https://bryanjimenez.github.io/docs/)

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
