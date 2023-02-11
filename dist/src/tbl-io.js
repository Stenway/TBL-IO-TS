"use strict";
/* (C) Stefan John / Stenway / SimpleML.com / 2023 */
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
exports.TblStreamWriter = exports.SyncTblStreamWriter = exports.TblStreamReader = exports.SyncTblStreamReader = exports.TblFile = void 0;
const reliabletxt_io_1 = require("@stenway/reliabletxt-io");
const sml_1 = require("@stenway/sml");
const sml_io_1 = require("@stenway/sml-io");
const tbl_1 = require("@stenway/tbl");
// ----------------------------------------------------------------------
class TblFile {
    static saveSync(document, filePath, aligned = false, whitespaceBetween = null, rightAligned = null) {
        const content = document.toString(aligned, whitespaceBetween, rightAligned);
        reliabletxt_io_1.ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding);
    }
    static save(document, filePath, aligned = false, whitespaceBetween = null, rightAligned = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = document.toString(aligned, whitespaceBetween, rightAligned);
            yield reliabletxt_io_1.ReliableTxtFile.writeAllText(content, filePath, document.encoding);
        });
    }
    static saveMinifiedSync(document, filePath) {
        const content = document.toMinifiedString();
        reliabletxt_io_1.ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding);
    }
    static saveMinified(document, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = document.toMinifiedString();
            yield reliabletxt_io_1.ReliableTxtFile.writeAllText(content, filePath, document.encoding);
        });
    }
    static loadSync(filePath) {
        const reliableTxtDocument = reliabletxt_io_1.ReliableTxtFile.loadSync(filePath);
        return tbl_1.TblDocument.parse(reliableTxtDocument.text, reliableTxtDocument.encoding);
    }
    static load(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const reliableTxtDocument = yield reliabletxt_io_1.ReliableTxtFile.load(filePath);
            return tbl_1.TblDocument.parse(reliableTxtDocument.text, reliableTxtDocument.encoding);
        });
    }
    static appendRowsSync(rows, templateDocument, filePath) {
        if (rows.length === 0) {
            return;
        }
        const writer = SyncTblStreamWriter.create(templateDocument, filePath, reliabletxt_io_1.WriterMode.CreateOrAppend);
        try {
            writer.writeRows(rows);
        }
        finally {
            writer.close();
        }
    }
    static appendRows(rows, templateDocument, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (rows.length === 0) {
                return;
            }
            const writer = yield TblStreamWriter.create(templateDocument, filePath, reliabletxt_io_1.WriterMode.CreateOrAppend);
            try {
                yield writer.writeRows(rows);
            }
            finally {
                yield writer.close();
            }
        });
    }
}
exports.TblFile = TblFile;
// ----------------------------------------------------------------------
class SyncTblStreamReader {
    constructor(reader, header) {
        this.reader = reader;
        this.header = header;
    }
    get encoding() {
        return this.reader.encoding;
    }
    get isClosed() {
        return this.reader.isClosed;
    }
    get handle() {
        return this.reader.handle;
    }
    static create(filePath, chunkSize = 4096) {
        const reader = sml_io_1.SyncSmlStreamReader.create(filePath, false, chunkSize);
        try {
            return this.internalCreate(reader);
        }
        catch (error) {
            reader.close();
            throw error;
        }
    }
    static getAppendReader(writer) {
        if (!writer.existing) {
            throw new Error(`Writer is not in append mode`);
        }
        const reader = sml_io_1.SyncSmlStreamReader.getAppendReader(writer);
        return this.internalCreate(reader);
    }
    static internalCreate(reader) {
        if (!reader.root.hasName("Table")) {
            throw new Error("Not a valid table document");
        }
        let columnNamesAttribute;
        let metaElement = null;
        const node = reader.readNode();
        if (node === null) {
            throw new Error(`Column names attribute expected`);
        }
        if (node.isElement()) {
            const element = node;
            element.assureName("Meta");
            metaElement = element;
            const nextNode = reader.readNode();
            if (nextNode === null || !nextNode.isAttribute()) {
                throw new Error(`Column names attribute expected`);
            }
            columnNamesAttribute = nextNode;
        }
        else if (node.isAttribute()) {
            columnNamesAttribute = node;
        }
        else {
            throw new Error(`Column names attribute expected`);
        }
        for (const value of columnNamesAttribute.values) {
            if (value === null) {
                throw new Error("Column name cannot be null");
            }
        }
        const columnNames = [columnNamesAttribute.name, ...columnNamesAttribute.values];
        const header = new tbl_1.TblDocument(columnNames, reader.encoding);
        if (metaElement !== null) {
            header.meta.parse(metaElement);
        }
        return new SyncTblStreamReader(reader, header);
    }
    readRow() {
        const node = this.reader.readNode();
        if (node === null) {
            return null;
        }
        if (!node.isAttribute()) {
            throw new Error(`Attribute expected`);
        }
        const attribute = node;
        const rowValues = [attribute.name, ...attribute.values];
        if (rowValues.length > this.header.columnCount) {
            throw new Error("Row has more values than there are columns");
        }
        return rowValues;
    }
    close() {
        this.reader.close();
    }
}
exports.SyncTblStreamReader = SyncTblStreamReader;
// ----------------------------------------------------------------------
class TblStreamReader {
    constructor(reader, header) {
        this.reader = reader;
        this.header = header;
    }
    get encoding() {
        return this.reader.encoding;
    }
    get isClosed() {
        return this.reader.isClosed;
    }
    get handle() {
        return this.reader.handle;
    }
    static create(filePath, chunkSize = 4096) {
        return __awaiter(this, void 0, void 0, function* () {
            const reader = yield sml_io_1.SmlStreamReader.create(filePath, false, chunkSize);
            try {
                return yield this.internalCreate(reader);
            }
            catch (error) {
                yield reader.close();
                throw error;
            }
        });
    }
    static getAppendReader(writer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!writer.existing) {
                throw new Error(`Writer is not in append mode`);
            }
            const reader = yield sml_io_1.SmlStreamReader.getAppendReader(writer);
            return yield this.internalCreate(reader);
        });
    }
    static internalCreate(reader) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!reader.root.hasName("Table")) {
                throw new Error("Not a valid table document");
            }
            let columnNamesAttribute;
            let metaElement = null;
            const node = yield reader.readNode();
            if (node === null) {
                throw new Error(`Column names attribute expected`);
            }
            if (node.isElement()) {
                const element = node;
                element.assureName("Meta");
                metaElement = element;
                const nextNode = yield reader.readNode();
                if (nextNode === null || !nextNode.isAttribute()) {
                    throw new Error(`Column names attribute expected`);
                }
                columnNamesAttribute = nextNode;
            }
            else if (node.isAttribute()) {
                columnNamesAttribute = node;
            }
            else {
                throw new Error(`Column names attribute expected`);
            }
            for (const value of columnNamesAttribute.values) {
                if (value === null) {
                    throw new Error("Column name cannot be null");
                }
            }
            const columnNames = [columnNamesAttribute.name, ...columnNamesAttribute.values];
            const header = new tbl_1.TblDocument(columnNames, reader.encoding);
            if (metaElement !== null) {
                header.meta.parse(metaElement);
            }
            return new TblStreamReader(reader, header);
        });
    }
    readRow() {
        return __awaiter(this, void 0, void 0, function* () {
            const node = yield this.reader.readNode();
            if (node === null) {
                return null;
            }
            if (!node.isAttribute()) {
                throw new Error(`Attribute expected`);
            }
            const attribute = node;
            const rowValues = [attribute.name, ...attribute.values];
            if (rowValues.length > this.header.columnCount) {
                throw new Error("Row has more values than there are columns");
            }
            return rowValues;
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.reader.close();
        });
    }
}
exports.TblStreamReader = TblStreamReader;
// ----------------------------------------------------------------------
class SyncTblStreamWriter {
    constructor(writer, header) {
        this.writer = writer;
        this.header = header;
    }
    get encoding() {
        return this.writer.encoding;
    }
    get isClosed() {
        return this.writer.isClosed;
    }
    get handle() {
        return this.writer.handle;
    }
    get existing() {
        return this.writer.existing;
    }
    static create(templateDocument, filePath, mode = reliabletxt_io_1.WriterMode.CreateOrOverwrite) {
        const smlDocument = new sml_1.SmlDocument(templateDocument.toElement());
        const writer = sml_io_1.SyncSmlStreamWriter.create(smlDocument, filePath, mode, false);
        try {
            let header;
            if (writer.existing) {
                const reader = SyncTblStreamReader.getAppendReader(writer);
                if (reader.header.columnCount !== templateDocument.columnCount) {
                    throw new Error(`Column count mismatch`);
                }
                header = reader.header;
            }
            else {
                if (templateDocument.meta.hasAny) {
                    writer.writeNode(templateDocument.meta.toElement());
                }
                const columnNames = templateDocument.columnNames;
                writer.writeNode(new sml_1.SmlAttribute(columnNames[0], columnNames.slice(1)));
                header = templateDocument;
            }
            return new SyncTblStreamWriter(writer, header);
        }
        catch (error) {
            writer.close();
            throw error;
        }
    }
    writeRow(values) {
        if (values.length < 2) {
            throw new Error("Row must have at least two values");
        }
        if (values[0] === null) {
            throw new Error("First row value cannot be null");
        }
        if (values.length > this.header.columnNames.length) {
            throw new Error("Row has more values than there are columns");
        }
        this.writer.writeNode(new sml_1.SmlAttribute(values[0], values.slice(1)));
    }
    writeRows(rows) {
        for (const row of rows) {
            this.writeRow(row);
        }
    }
    close() {
        this.writer.close();
    }
}
exports.SyncTblStreamWriter = SyncTblStreamWriter;
// ----------------------------------------------------------------------
class TblStreamWriter {
    constructor(writer, header) {
        this.writer = writer;
        this.header = header;
    }
    get encoding() {
        return this.writer.encoding;
    }
    get isClosed() {
        return this.writer.isClosed;
    }
    get handle() {
        return this.writer.handle;
    }
    get existing() {
        return this.writer.existing;
    }
    static create(templateDocument, filePath, mode = reliabletxt_io_1.WriterMode.CreateOrOverwrite) {
        return __awaiter(this, void 0, void 0, function* () {
            const smlDocument = new sml_1.SmlDocument(templateDocument.toElement());
            const writer = yield sml_io_1.SmlStreamWriter.create(smlDocument, filePath, mode, false);
            try {
                let header;
                if (writer.existing) {
                    const reader = yield TblStreamReader.getAppendReader(writer);
                    if (reader.header.columnCount !== templateDocument.columnCount) {
                        throw new Error(`Column count mismatch`);
                    }
                    header = reader.header;
                }
                else {
                    if (templateDocument.meta.hasAny) {
                        yield writer.writeNode(templateDocument.meta.toElement());
                    }
                    const columnNames = templateDocument.columnNames;
                    yield writer.writeNode(new sml_1.SmlAttribute(columnNames[0], columnNames.slice(1)));
                    header = templateDocument;
                }
                return new TblStreamWriter(writer, header);
            }
            catch (error) {
                yield writer.close();
                throw error;
            }
        });
    }
    writeRow(values) {
        return __awaiter(this, void 0, void 0, function* () {
            if (values.length < 2) {
                throw new Error("Row must have at least two values");
            }
            if (values[0] === null) {
                throw new Error("First row value cannot be null");
            }
            if (values.length > this.header.columnNames.length) {
                throw new Error("Row has more values than there are columns");
            }
            yield this.writer.writeNode(new sml_1.SmlAttribute(values[0], values.slice(1)));
        });
    }
    writeRows(rows) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const row of rows) {
                yield this.writeRow(row);
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.writer.close();
        });
    }
}
exports.TblStreamWriter = TblStreamWriter;
//# sourceMappingURL=tbl-io.js.map