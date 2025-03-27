# Opposites Game
URL: `/#/opposites`  

This is a multiple choice game. A term is displayed and several options given. The goal is to choose the term that is opposite from the options.

Data for this game comes from the Vocabulary dataset. To add additional game entries in the Vocabulary dataset under the Opposites column add the uid of the term that is opposite word to the currently selected term.

> **Note**  
>
> The term's uid is generated using the `md5` formula.

For example:

|        | Japanese       | English  | Opposites  | *(Explanation)* |
| ------ | -------------- | -------- | ---------- | ------------- |
| ...
| **A6** | にんげん`\n`<br/>人間   | Human    | `=md5(A8)` | *We marked Human and Monster as a pair to be added to the game.*
| ...
| **A8** | ばけもの`\n`<br/>化け物 | Monster  | `=md5(A6)` |

