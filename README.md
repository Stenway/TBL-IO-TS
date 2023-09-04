# TBL-IO

## About this package

This package is the **Node.js-specific part** mentioned in the environment-independent **[TBL](https://www.npmjs.com/package/@stenway/tbl)** package (You will find more information there about TBL in general). This package uses Node.js's **file system module** and offers simple classes to load and save TBL files. It offers stream reader and writer classes to read and write TBL files row-by-row.

## Getting started

First get the **TBL-IO package** installed with a package manager of your choice.
If you are using NPM just run the following command:
```
npm install @stenway/tbl-io
```

Import the static TblFile class and use the static method saveSync to save a TBL file
synchronously. Load the TBL file with the static method loadSync:

```ts
import { TblDocument } from "@stenway/tbl"
import { TblFile } from "@stenway/tbl-io"

let filePath = "Test.tbl"
TblFile.saveSync(TblDocument.parse("Table\nColumn1 Column2\nValue1 Value2\nEnd"), filePath)
console.log(TblFile.loadSync(filePath))
```

The synchronous versions of the method don't come with the Sync suffix. The scheme is analogous
to the concept in the **[SML-IO](https://www.npmjs.com/package/@stenway/sml-io)** package.

## BinaryTBL

BinaryTBL is the binary representation of TBL documents. It's based on BinarySML.
Use the static BinaryTblFile class to save and load TBL documents as BinaryTBL files:
```ts
let filePath = "Test.btbl"
BinaryTblFile.saveSync(TblDocument.parse("Table\nColumn1 Column2\nValue1 Value2\nEnd"), filePath)
const loadedDocument = BinaryTblFile.loadSync(filePath)
```