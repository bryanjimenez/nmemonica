# Datasets

This page contains the Phrases, Vocabulary and Kanji datasets. The user can edit these to include the desired items to study. Datasets can be saved and shared as CSV[^CSV] files and searched ![Image](https://raw.githubusercontent.com/primer/octicons/main/icons/search-16.svg "Search Button")  using the corresponding buttons. 

The Dataset structure can be downloaded and data can be entered using a spread sheet software.

Minimal **spreadsheet formula knowledge** is required to tag terms.  
For example:  
- How to start a formula statement in a cell (use the `=` symbol followed by your formula).
- How to call a formula with a cell's reference (`=CoolFormula(B3)`).
- How to concatenate a string inside a cell (`="first part" & "second part"`).

> **Note**  
>
> - To add a line break inside a cell use `\n` or multiple consecutive spaces.  
> - Inside a cell multiple tags need to be separated using a `;` or `\n` (line break)  
> - To generate a term's uid use the `md5` formula providing the cell ref to the Japanese pronunciation. For example: `=md5(A6)`  


[^CSV]: Comma separated values