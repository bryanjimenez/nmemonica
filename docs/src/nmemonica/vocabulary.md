# Vocabulary
URL: `/#/vocabulary`  

This page will display a list of pairs of vocabulary words (English + Japanese) as if seen on a deck of cards. The order and filtering of the list can be configured from the settings page (under Vocabulary). In touch screen devices swiping horizontally will move through out the deck and vertically will play the pronunciation of the word.

> **Note**  
>
> Vocabulary words can be tagged with basic categories or special indicators (indicated below by highlighted text under the Tags column).  
> Furigana can be added to Vocabulary words in Japanese by including the pronunciation followed by a new line then the kanji characters. To add a line break inside a cell type `\n`. 

||A|B|C||
| ------ | -------------- | ----------- | -------- | ------------- |
|        | **Japanese**   | **English** | **Tags** | *(Explanation)* |
| ...
| **A6** | にんげん`\n`<br/>人間   | Human    | {"tags":[`"inv:" & md5(A8)`"]} | *We tagged Human and Monster inverse words.*
| ...
| **A8** | ばけもの`\n`<br/>化け物 | Monster  | {"tags":[`"inv:" & md5(A6)`"]} |
| ...
| **A12** | こわい`\n`<br/>怖い   | Scary, Frightening | Appearance; Beginner-Words; | *Scary is tagged with some extra categories.*
| **A13** | きれい`\n`<br/>綺麗   | Beautiful, Clean | {"tags":["`na-adj`"]} | *We tagged Beautiful a na-adjective.*
| ...
| **A25** | おわる`\n`<br/>終わる | to be finished | {"tags":[`"intr:" & md5(A26)`"]} | *We tagged **終わる** intransitive with **終える** as it's transitive pair.*
| **A26** | おえる`\n`<br/>終える | to finish | |
| ...
| **A25** | おれる`\n`<br/>折れる | to snap, fracture | {"tags":["`intr`"]} | *We tagged **折れる** an intransitive verb.*
| ...
| **A30** | おまえ`\n`<br/>お前 | you | {"tags":["`slang`"]} | *We tagged **お前** as a slang term.*
| **A31** | わたくし`\n`<br/>私 | example | {"tags":["`keigo`"]} | *We tagged **私** as a keigo term.*

[app]: https://bryanjimenez.github.io/nmemonica