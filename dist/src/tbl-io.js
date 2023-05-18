/* (C) Stefan John / Stenway / SimpleML.com / 2023 */
import { ReliableTxtFile, WriterMode } from "@stenway/reliabletxt-io";
import { SmlAttribute, SmlDocument } from "@stenway/sml";
import { SmlStreamReader, SmlStreamWriter, SyncSmlStreamReader, SyncSmlStreamWriter } from "@stenway/sml-io";
import { TblDocument } from "@stenway/tbl";
// ----------------------------------------------------------------------
export class TblFile {
    static saveSync(document, filePath, aligned = false, whitespaceBetween = null, rightAligned = null) {
        const content = document.toString(aligned, whitespaceBetween, rightAligned);
        ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding);
    }
    static async save(document, filePath, aligned = false, whitespaceBetween = null, rightAligned = null) {
        const content = document.toString(aligned, whitespaceBetween, rightAligned);
        await ReliableTxtFile.writeAllText(content, filePath, document.encoding);
    }
    static saveMinifiedSync(document, filePath) {
        const content = document.toMinifiedString();
        ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding);
    }
    static async saveMinified(document, filePath) {
        const content = document.toMinifiedString();
        await ReliableTxtFile.writeAllText(content, filePath, document.encoding);
    }
    static loadSync(filePath) {
        const reliableTxtDocument = ReliableTxtFile.loadSync(filePath);
        return TblDocument.parse(reliableTxtDocument.text, reliableTxtDocument.encoding);
    }
    static async load(filePath) {
        const reliableTxtDocument = await ReliableTxtFile.load(filePath);
        return TblDocument.parse(reliableTxtDocument.text, reliableTxtDocument.encoding);
    }
    static appendRowsSync(rows, templateDocument, filePath) {
        if (rows.length === 0) {
            return;
        }
        const writer = SyncTblStreamWriter.create(templateDocument, filePath, WriterMode.CreateOrAppend);
        try {
            writer.writeRows(rows);
        }
        finally {
            writer.close();
        }
    }
    static async appendRows(rows, templateDocument, filePath) {
        if (rows.length === 0) {
            return;
        }
        const writer = await TblStreamWriter.create(templateDocument, filePath, WriterMode.CreateOrAppend);
        try {
            await writer.writeRows(rows);
        }
        finally {
            await writer.close();
        }
    }
}
// ----------------------------------------------------------------------
export class SyncTblStreamReader {
    get encoding() {
        return this.reader.encoding;
    }
    get isClosed() {
        return this.reader.isClosed;
    }
    get handle() {
        return this.reader.handle;
    }
    constructor(reader, header) {
        this.reader = reader;
        this.header = header;
    }
    static create(filePath, chunkSize = 4096) {
        const reader = SyncSmlStreamReader.create(filePath, false, chunkSize);
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
        const reader = SyncSmlStreamReader.getAppendReader(writer);
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
        const header = new TblDocument(columnNames, reader.encoding);
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
// ----------------------------------------------------------------------
export class TblStreamReader {
    get encoding() {
        return this.reader.encoding;
    }
    get isClosed() {
        return this.reader.isClosed;
    }
    get handle() {
        return this.reader.handle;
    }
    constructor(reader, header) {
        this.reader = reader;
        this.header = header;
    }
    static async create(filePath, chunkSize = 4096) {
        const reader = await SmlStreamReader.create(filePath, false, chunkSize);
        try {
            return await this.internalCreate(reader);
        }
        catch (error) {
            await reader.close();
            throw error;
        }
    }
    static async getAppendReader(writer) {
        if (!writer.existing) {
            throw new Error(`Writer is not in append mode`);
        }
        const reader = await SmlStreamReader.getAppendReader(writer);
        return await this.internalCreate(reader);
    }
    static async internalCreate(reader) {
        if (!reader.root.hasName("Table")) {
            throw new Error("Not a valid table document");
        }
        let columnNamesAttribute;
        let metaElement = null;
        const node = await reader.readNode();
        if (node === null) {
            throw new Error(`Column names attribute expected`);
        }
        if (node.isElement()) {
            const element = node;
            element.assureName("Meta");
            metaElement = element;
            const nextNode = await reader.readNode();
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
        const header = new TblDocument(columnNames, reader.encoding);
        if (metaElement !== null) {
            header.meta.parse(metaElement);
        }
        return new TblStreamReader(reader, header);
    }
    async readRow() {
        const node = await this.reader.readNode();
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
    async close() {
        await this.reader.close();
    }
}
// ----------------------------------------------------------------------
export class SyncTblStreamWriter {
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
    constructor(writer, header) {
        this.writer = writer;
        this.header = header;
    }
    static create(templateDocument, filePath, mode = WriterMode.CreateOrOverwrite) {
        const smlDocument = new SmlDocument(templateDocument.toElement());
        const writer = SyncSmlStreamWriter.create(smlDocument, filePath, mode, false);
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
                writer.writeNode(new SmlAttribute(columnNames[0], columnNames.slice(1)));
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
        this.writer.writeNode(new SmlAttribute(values[0], values.slice(1)));
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
// ----------------------------------------------------------------------
export class TblStreamWriter {
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
    constructor(writer, header) {
        this.writer = writer;
        this.header = header;
    }
    static async create(templateDocument, filePath, mode = WriterMode.CreateOrOverwrite) {
        const smlDocument = new SmlDocument(templateDocument.toElement());
        const writer = await SmlStreamWriter.create(smlDocument, filePath, mode, false);
        try {
            let header;
            if (writer.existing) {
                const reader = await TblStreamReader.getAppendReader(writer);
                if (reader.header.columnCount !== templateDocument.columnCount) {
                    throw new Error(`Column count mismatch`);
                }
                header = reader.header;
            }
            else {
                if (templateDocument.meta.hasAny) {
                    await writer.writeNode(templateDocument.meta.toElement());
                }
                const columnNames = templateDocument.columnNames;
                await writer.writeNode(new SmlAttribute(columnNames[0], columnNames.slice(1)));
                header = templateDocument;
            }
            return new TblStreamWriter(writer, header);
        }
        catch (error) {
            await writer.close();
            throw error;
        }
    }
    async writeRow(values) {
        if (values.length < 2) {
            throw new Error("Row must have at least two values");
        }
        if (values[0] === null) {
            throw new Error("First row value cannot be null");
        }
        if (values.length > this.header.columnNames.length) {
            throw new Error("Row has more values than there are columns");
        }
        await this.writer.writeNode(new SmlAttribute(values[0], values.slice(1)));
    }
    async writeRows(rows) {
        for (const row of rows) {
            await this.writeRow(row);
        }
    }
    async close() {
        await this.writer.close();
    }
}
//# sourceMappingURL=tbl-io.js.map