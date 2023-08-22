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

## BinaryTBL

BinaryTBL is the binary representation of TBL documents. It's based on BinarySML.

Usage:
```ts
let filePath = "Test.btbl"
BinaryTblFile.saveSync(TblDocument.parse("Table\nColumn1 Column2\nValue1 Value2\nEnd"), filePath)
const loadedDocument = BinaryTblFile.loadSync(filePath)
```