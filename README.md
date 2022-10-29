# TBL-IO

## About

TBL is a data table format based on SML ([SML Documentation/Specification](https://www.simpleml.com)).

## Installation

Using NPM:
```
npm install @stenway/tbl-io
```

## Getting started

```ts
import { TblDocument } from "@stenway/tbl"
import { TblFile } from "@stenway/tbl-io"

let filePath = "Test.tbl"
TblFile.saveSync(TblDocument.parse("Table\nColumn1 Column2\nValue1 Value2\nEnd"), filePath)
console.log(TblFile.loadSync(filePath))
```