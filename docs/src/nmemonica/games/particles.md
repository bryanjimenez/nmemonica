# Particles Game
URL: `/#/particles`  

This game is another multiple choice game. The goal of the game is to choose the correct particle that makes the phrase grammatically correct.

To include phrases in the game, tag the phrase indicating the particles wanted to be tested.

|        | Japanese   | English  | Tags   | *(Explanation)* |
| ------ | ---------- | -------- | ------ | ------------- |
| **A6** | やさい**は**すき`\n`<br/>野菜**は**好き   | I like vegetables | {"tags":["`p:は`"]} | *We want the **は** particle to be included in the game.*
| **A7** | くだもの**は**すき`\n`果物**は**好き   | I like fruits | {"tags":["`P:は`"]} | *The CasE of the tag's identifier is not important.*
| ...
| **A10** | かんぺき**が**もの**は**いない`\n`,br/>完璧**が**もの**は**いない  | Nothing is perfect | {"tags":["`p:は,が`"]} | *We want **both** the **は** and **が** particles to be included in the game.*
| **A11** | にわ**には**にわにわとりがいる`\n`<br/>庭**には**二羽鶏がいる  | There are two chickens in the garden | {"tags":["`p:には`"]} | *We want the **には** particle to be included in the game.*
