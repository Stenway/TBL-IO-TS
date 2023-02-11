"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const reliabletxt_1 = require("@stenway/reliabletxt");
const reliabletxt_io_1 = require("@stenway/reliabletxt-io");
const tbl_1 = require("@stenway/tbl");
const fs = __importStar(require("fs"));
const src_1 = require("../src");
function getFilePath(name) {
    return "test_files/" + name;
}
const testFilePath = getFilePath("Test.tbl");
function writeBytesSync(bytes, filePath) {
    fs.writeFileSync(filePath, bytes);
}
function writeBytes(bytes, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs.promises.writeFile(filePath, bytes);
    });
}
function deleteFileSync(filePath) {
    try {
        fs.unlinkSync(filePath);
    }
    catch (_a) {
        return false;
    }
    return true;
}
function deleteFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.promises.unlink(filePath);
        }
        catch (_a) {
            return false;
        }
        return true;
    });
}
// ----------------------------------------------------------------------
describe("TblFile.saveSync + loadSync", () => {
    test.each([
        [reliabletxt_1.ReliableTxtEncoding.Utf8],
        [reliabletxt_1.ReliableTxtEncoding.Utf16],
        [reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        [reliabletxt_1.ReliableTxtEncoding.Utf32],
    ])("Given %p", (encoding) => {
        const document = tbl_1.TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`);
        document.encoding = encoding;
        src_1.TblFile.saveSync(document, testFilePath);
        const loadedDocument = src_1.TblFile.loadSync(testFilePath);
        expect(loadedDocument.toString()).toEqual(document.toString());
        expect(loadedDocument.encoding).toEqual(document.encoding);
    });
    test("Throws", () => {
        writeBytesSync(new Uint8Array([]), testFilePath);
        expect(() => src_1.TblFile.loadSync(testFilePath)).toThrowError(reliabletxt_1.NoReliableTxtPreambleError);
    });
});
describe("TblFile.save + load", () => {
    test.each([
        [reliabletxt_1.ReliableTxtEncoding.Utf8],
        [reliabletxt_1.ReliableTxtEncoding.Utf16],
        [reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        [reliabletxt_1.ReliableTxtEncoding.Utf32],
    ])("Given %p", (encoding) => __awaiter(void 0, void 0, void 0, function* () {
        const document = tbl_1.TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`);
        document.encoding = encoding;
        yield src_1.TblFile.save(document, testFilePath);
        const loadedDocument = yield src_1.TblFile.load(testFilePath);
        expect(loadedDocument.toString()).toEqual(document.toString());
        expect(loadedDocument.encoding).toEqual(document.encoding);
    }));
    test("Throws", () => __awaiter(void 0, void 0, void 0, function* () {
        yield writeBytes(new Uint8Array([]), testFilePath);
        yield expect(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.TblFile.load(testFilePath); })).rejects.toThrowError(reliabletxt_1.NoReliableTxtPreambleError);
    }));
});
test("TblFile.saveMinifiedSync", () => {
    const document = tbl_1.TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`);
    src_1.TblFile.saveMinifiedSync(document, testFilePath);
    expect(reliabletxt_io_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\nColumn1 Column2\nValue11 Value12\n-`);
});
test("TblFile.saveMinified", () => __awaiter(void 0, void 0, void 0, function* () {
    const document = tbl_1.TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`);
    yield src_1.TblFile.saveMinified(document, testFilePath);
    expect(yield reliabletxt_io_1.ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\nColumn1 Column2\nValue11 Value12\n-`);
}));
test("TblFile.appendRowsSync", () => {
    deleteFileSync(testFilePath);
    const template = new tbl_1.TblDocument(["Column1", "Column2"]);
    src_1.TblFile.appendRowsSync([["Value11", "Value12"]], template, testFilePath);
    expect(reliabletxt_io_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`);
    src_1.TblFile.appendRowsSync([], template, testFilePath);
    src_1.TblFile.appendRowsSync([["Value21", "Value22"]], template, testFilePath);
    expect(reliabletxt_io_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`);
});
test("TblFile.appendRows", () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteFile(testFilePath);
    const template = new tbl_1.TblDocument(["Column1", "Column2"]);
    yield src_1.TblFile.appendRows([["Value11", "Value12"]], template, testFilePath);
    expect(yield reliabletxt_io_1.ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`);
    yield src_1.TblFile.appendRows([], template, testFilePath);
    yield src_1.TblFile.appendRows([["Value21", "Value22"]], template, testFilePath);
    expect(yield reliabletxt_io_1.ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`);
}));
// ----------------------------------------------------------------------
test("SyncTblStreamReader", () => {
    reliabletxt_io_1.ReliableTxtFile.writeAllTextSync(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`, testFilePath);
    const reader = src_1.SyncTblStreamReader.create(testFilePath);
    expect(reader.encoding).toEqual(reliabletxt_1.ReliableTxtEncoding.Utf8);
    expect(reader.header.columnNames).toEqual(["Column1", "Column2"]);
    expect(reader.isClosed).toEqual(false);
    expect(reader.handle.existing).toEqual(true);
    expect(reader.readRow()).toEqual(["Value11", "Value12"]);
    expect(reader.readRow()).toEqual(["Value21", "Value22"]);
    expect(reader.readRow()).toEqual(null);
    expect(reader.readRow()).toEqual(null);
    reader.close();
    expect(reader.isClosed).toEqual(true);
});
describe("SyncTblStreamReader", () => {
    test.each([
        [`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\nEnd`],
    ])("Given %p", (input) => {
        reliabletxt_io_1.ReliableTxtFile.writeAllTextSync(input, testFilePath);
        const reader = src_1.SyncTblStreamReader.create(testFilePath);
        reader.close();
    });
    test.each([
        [`Document\nEnd`],
        [`Table\nEnd`],
        [`Table\n\tElement\n\tEnd\nEnd`],
        [`Table\n\tMeta\n\tEnd\nEnd`],
        [`Table\n\tMeta\n\tEnd\n\tMeta\n\tEnd\nEnd`],
        [`Table\n\tMeta\n\tEnd\n\tColumn1 -\nEnd`],
        [`Table\n\tColumn1 -\nEnd`],
    ])("Given %p throws", (input) => {
        reliabletxt_io_1.ReliableTxtFile.writeAllTextSync(input, testFilePath);
        expect(() => src_1.SyncTblStreamReader.create(testFilePath)).toThrowError();
    });
    test.each([
        [`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tElement\n\tEnd\nEnd`],
        [`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12 Value13\nEnd`],
    ])("Given %p throws", (input) => {
        reliabletxt_io_1.ReliableTxtFile.writeAllTextSync(input, testFilePath);
        const reader = src_1.SyncTblStreamReader.create(testFilePath);
        expect(() => reader.readRow()).toThrowError();
        reader.close();
    });
});
// ----------------------------------------------------------------------
test("TblStreamReader", () => __awaiter(void 0, void 0, void 0, function* () {
    yield reliabletxt_io_1.ReliableTxtFile.writeAllText(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`, testFilePath);
    const reader = yield src_1.TblStreamReader.create(testFilePath);
    expect(reader.encoding).toEqual(reliabletxt_1.ReliableTxtEncoding.Utf8);
    expect(reader.header.columnNames).toEqual(["Column1", "Column2"]);
    expect(reader.isClosed).toEqual(false);
    expect(reader.handle.existing).toEqual(true);
    expect(yield reader.readRow()).toEqual(["Value11", "Value12"]);
    expect(yield reader.readRow()).toEqual(["Value21", "Value22"]);
    expect(yield reader.readRow()).toEqual(null);
    expect(yield reader.readRow()).toEqual(null);
    yield reader.close();
    expect(reader.isClosed).toEqual(true);
}));
describe("TblStreamReader", () => {
    test.each([
        [`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\nEnd`],
    ])("Given %p", (input) => __awaiter(void 0, void 0, void 0, function* () {
        yield reliabletxt_io_1.ReliableTxtFile.writeAllText(input, testFilePath);
        const reader = yield src_1.TblStreamReader.create(testFilePath);
        yield reader.close();
    }));
    test.each([
        [`Document\nEnd`],
        [`Table\nEnd`],
        [`Table\n\tElement\n\tEnd\nEnd`],
        [`Table\n\tMeta\n\tEnd\nEnd`],
        [`Table\n\tMeta\n\tEnd\n\tMeta\n\tEnd\nEnd`],
        [`Table\n\tMeta\n\tEnd\n\tColumn1 -\nEnd`],
        [`Table\n\tColumn1 -\nEnd`],
    ])("Given %p throws", (input) => __awaiter(void 0, void 0, void 0, function* () {
        yield reliabletxt_io_1.ReliableTxtFile.writeAllText(input, testFilePath);
        yield expect(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.TblStreamReader.create(testFilePath); })).rejects.toThrowError();
    }));
    test.each([
        [`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tElement\n\tEnd\nEnd`],
        [`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12 Value13\nEnd`],
    ])("Given %p throws", (input) => __awaiter(void 0, void 0, void 0, function* () {
        yield reliabletxt_io_1.ReliableTxtFile.writeAllText(input, testFilePath);
        const reader = yield src_1.TblStreamReader.create(testFilePath);
        yield expect(() => __awaiter(void 0, void 0, void 0, function* () { return yield reader.readRow(); })).rejects.toThrowError();
        yield reader.close();
    }));
});
// ----------------------------------------------------------------------
test("SyncTblStreamWriter", () => {
    deleteFileSync(testFilePath);
    const templateDocument = new tbl_1.TblDocument(["Column1", "Column2"]);
    templateDocument.meta.description = "Text";
    let writer = src_1.SyncTblStreamWriter.create(templateDocument, testFilePath);
    expect(writer.encoding).toEqual(reliabletxt_1.ReliableTxtEncoding.Utf8);
    expect(writer.isClosed).toEqual(false);
    expect(writer.header.columnNames).toEqual(["Column1", "Column2"]);
    expect(writer.existing).toEqual(false);
    expect(writer.handle.existing).toEqual(false);
    writer.writeRow(["Value11", "Value12"]);
    writer.writeRows([["Value21", null], ["Value31", "Value32"]]);
    expect(() => writer.writeRow([])).toThrowError();
    expect(() => writer.writeRow([null, null])).toThrowError();
    expect(() => writer.writeRow(["Value31", "Value32", "Value33"])).toThrowError();
    writer.close();
    expect(writer.isClosed).toEqual(true);
    expect(reliabletxt_io_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 -\n\tValue31 Value32\nEnd`);
    writer = src_1.SyncTblStreamWriter.create(templateDocument, testFilePath);
    expect(writer.existing).toEqual(false);
    writer.close();
    expect(reliabletxt_io_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`);
    writer = src_1.SyncTblStreamWriter.create(templateDocument, testFilePath, reliabletxt_io_1.WriterMode.CreateOrAppend);
    expect(writer.existing).toEqual(true);
    writer.close();
    expect(reliabletxt_io_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`);
    writer = src_1.SyncTblStreamWriter.create(templateDocument, testFilePath, reliabletxt_io_1.WriterMode.CreateOrAppend);
    writer.writeRow(["Value41", "Value42"]);
    writer.close();
    expect(reliabletxt_io_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue41 Value42\nEnd`);
    const templateDocument2 = new tbl_1.TblDocument(["Column1", "Column2", "Column3"]);
    expect(() => src_1.SyncTblStreamWriter.create(templateDocument2, testFilePath, reliabletxt_io_1.WriterMode.CreateOrAppend)).toThrowError();
});
// ----------------------------------------------------------------------
test("TblStreamWriter", () => __awaiter(void 0, void 0, void 0, function* () {
    yield deleteFile(testFilePath);
    const templateDocument = new tbl_1.TblDocument(["Column1", "Column2"]);
    templateDocument.meta.description = "Text";
    let writer = yield src_1.TblStreamWriter.create(templateDocument, testFilePath);
    expect(writer.encoding).toEqual(reliabletxt_1.ReliableTxtEncoding.Utf8);
    expect(writer.isClosed).toEqual(false);
    expect(writer.header.columnNames).toEqual(["Column1", "Column2"]);
    expect(writer.existing).toEqual(false);
    expect(writer.handle.existing).toEqual(false);
    yield writer.writeRow(["Value11", "Value12"]);
    yield writer.writeRows([["Value21", null], ["Value31", "Value32"]]);
    yield expect(() => __awaiter(void 0, void 0, void 0, function* () { return yield writer.writeRow([]); })).rejects.toThrowError();
    yield expect(() => __awaiter(void 0, void 0, void 0, function* () { return yield writer.writeRow([null, null]); })).rejects.toThrowError();
    yield expect(() => __awaiter(void 0, void 0, void 0, function* () { return yield writer.writeRow(["Value31", "Value32", "Value33"]); })).rejects.toThrowError();
    yield writer.close();
    expect(writer.isClosed).toEqual(true);
    expect(yield reliabletxt_io_1.ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 -\n\tValue31 Value32\nEnd`);
    writer = yield src_1.TblStreamWriter.create(templateDocument, testFilePath);
    expect(writer.existing).toEqual(false);
    yield writer.close();
    expect(yield reliabletxt_io_1.ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`);
    writer = yield src_1.TblStreamWriter.create(templateDocument, testFilePath, reliabletxt_io_1.WriterMode.CreateOrAppend);
    expect(writer.existing).toEqual(true);
    yield writer.close();
    expect(yield reliabletxt_io_1.ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`);
    writer = yield src_1.TblStreamWriter.create(templateDocument, testFilePath, reliabletxt_io_1.WriterMode.CreateOrAppend);
    yield writer.writeRow(["Value41", "Value42"]);
    yield writer.close();
    expect(yield reliabletxt_io_1.ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue41 Value42\nEnd`);
    const templateDocument2 = new tbl_1.TblDocument(["Column1", "Column2", "Column3"]);
    yield expect(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.TblStreamWriter.create(templateDocument2, testFilePath, reliabletxt_io_1.WriterMode.CreateOrAppend); })).rejects.toThrowError();
}));
//# sourceMappingURL=tbl-io.test.js.map