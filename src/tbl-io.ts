/* (C) Stefan John / Stenway / SimpleML.com / 2023 */

import { ReliableTxtDocument, ReliableTxtEncoding } from "@stenway/reliabletxt"
import { ReliableTxtFile, ReliableTxtFileHandle, SyncReliableTxtFileHandle, WriterMode } from "@stenway/reliabletxt-io"
import { SmlAttribute, SmlDocument, SmlElement } from "@stenway/sml"
import { SmlStreamReader, SmlStreamWriter, SyncSmlStreamReader, SyncSmlStreamWriter } from "@stenway/sml-io"
import { TblDocument } from "@stenway/tbl"

// ----------------------------------------------------------------------

export abstract class TblFile {
	static saveSync(document: TblDocument, filePath: string, aligned: boolean = false, whitespaceBetween: string | null = null, rightAligned: boolean[] | null = null) {
		const content: string = document.toString(aligned, whitespaceBetween, rightAligned)
		ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding)
	}

	static async save(document: TblDocument, filePath: string, aligned: boolean = false, whitespaceBetween: string | null = null, rightAligned: boolean[] | null = null) {
		const content: string = document.toString(aligned, whitespaceBetween, rightAligned)
		await ReliableTxtFile.writeAllText(content, filePath, document.encoding)
	}

	static saveMinifiedSync(document: TblDocument, filePath: string) {
		const content: string = document.toMinifiedString()
		ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding)
	}

	static async saveMinified(document: TblDocument, filePath: string) {
		const content: string = document.toMinifiedString()
		await ReliableTxtFile.writeAllText(content, filePath, document.encoding)
	}

	static loadSync(filePath: string): TblDocument {
		const reliableTxtDocument: ReliableTxtDocument = ReliableTxtFile.loadSync(filePath)
		return TblDocument.parse(reliableTxtDocument.text, reliableTxtDocument.encoding)
	}

	static async load(filePath: string): Promise<TblDocument> {
		const reliableTxtDocument: ReliableTxtDocument = await ReliableTxtFile.load(filePath)
		return TblDocument.parse(reliableTxtDocument.text, reliableTxtDocument.encoding)
	}

	static appendRowsSync(rows: (string | null)[][], templateDocument: TblDocument, filePath: string) {
		if (rows.length === 0) { return }
		const writer = SyncTblStreamWriter.create(templateDocument, filePath, WriterMode.CreateOrAppend)
		try {
			writer.writeRows(rows)
		} finally {
			writer.close()
		}
	}

	static async appendRows(rows: (string | null)[][], templateDocument: TblDocument, filePath: string) {
		if (rows.length === 0) { return }
		const writer = await TblStreamWriter.create(templateDocument, filePath, WriterMode.CreateOrAppend)
		try {
			await writer.writeRows(rows)
		} finally {
			await writer.close()
		}
	}
}

// ----------------------------------------------------------------------

export class SyncTblStreamReader {
	private reader: SyncSmlStreamReader
	readonly header: TblDocument

	get encoding(): ReliableTxtEncoding {
		return this.reader.encoding
	}

	get isClosed(): boolean {
		return this.reader.isClosed
	}

	get handle(): SyncReliableTxtFileHandle {
		return this.reader.handle
	}

	private constructor(reader: SyncSmlStreamReader, header: TblDocument) {
		this.reader = reader
		this.header = header
	}

	static create(filePath: string, chunkSize: number = 4096): SyncTblStreamReader {
		const reader = SyncSmlStreamReader.create(filePath, false, chunkSize)
		try {
			return this.internalCreate(reader)
		} catch (error) {
			reader.close()
			throw error
		}
	}

	static getAppendReader(writer: SyncSmlStreamWriter): SyncTblStreamReader {
		if (!writer.existing) { throw new Error(`Writer is not in append mode`) }
		const reader = SyncSmlStreamReader.getAppendReader(writer)
		return this.internalCreate(reader)
	}

	private static internalCreate(reader: SyncSmlStreamReader): SyncTblStreamReader {
		if (!reader.root.hasName("Table")) { throw new Error("Not a valid table document") }
	
		let columnNamesAttribute: SmlAttribute
		let metaElement: SmlElement | null = null
		const node = reader.readNode()
		if (node === null) { throw new Error(`Column names attribute expected`) }
		if (node.isElement()) {
			const element = node as SmlElement
			element.assureName("Meta")
			metaElement = element
			const nextNode = reader.readNode()
			if (nextNode === null || !nextNode.isAttribute()) { throw new Error(`Column names attribute expected`) }
			columnNamesAttribute = nextNode as SmlAttribute
		} else if (node.isAttribute()) {
			columnNamesAttribute = node as SmlAttribute
		} else { throw new Error(`Column names attribute expected`) }

		for (const value of columnNamesAttribute.values) {
			if (value === null) { throw new Error("Column name cannot be null") }
		}
		const columnNames: string[] = [columnNamesAttribute.name, ...(columnNamesAttribute.values as string[])]
		const header = new TblDocument(columnNames, reader.encoding)
		if (metaElement !== null) { header.meta.parse(metaElement) }
		return new SyncTblStreamReader(reader, header)
	}

	readRow(): (string | null)[] | null {
		const node = this.reader.readNode()
		if (node === null) { return null }
		if (!node.isAttribute()) { throw new Error(`Attribute expected`) }
		const attribute = node as SmlAttribute
		const rowValues = [attribute.name, ...attribute.values]
		if (rowValues.length > this.header.columnCount) { throw new Error("Row has more values than there are columns") }
		return rowValues
	}

	close() {
		this.reader.close()
	}
}

// ----------------------------------------------------------------------

export class TblStreamReader {
	private reader: SmlStreamReader
	readonly header: TblDocument

	get encoding(): ReliableTxtEncoding {
		return this.reader.encoding
	}

	get isClosed(): boolean {
		return this.reader.isClosed
	}

	get handle(): ReliableTxtFileHandle {
		return this.reader.handle
	}

	private constructor(reader: SmlStreamReader, header: TblDocument) {
		this.reader = reader
		this.header = header
	}

	static async create(filePath: string, chunkSize: number = 4096): Promise<TblStreamReader> {
		const reader = await SmlStreamReader.create(filePath, false, chunkSize)
		try {
			return await this.internalCreate(reader)
		} catch (error) {
			await reader.close()
			throw error
		}
	}

	static async getAppendReader(writer: SmlStreamWriter): Promise<TblStreamReader> {
		if (!writer.existing) { throw new Error(`Writer is not in append mode`) }
		const reader = await SmlStreamReader.getAppendReader(writer)
		return await this.internalCreate(reader)
	}

	private static async internalCreate(reader: SmlStreamReader): Promise<TblStreamReader> {
		if (!reader.root.hasName("Table")) { throw new Error("Not a valid table document") }
	
		let columnNamesAttribute: SmlAttribute
		let metaElement: SmlElement | null = null
		const node = await reader.readNode()
		if (node === null) { throw new Error(`Column names attribute expected`) }
		if (node.isElement()) {
			const element = node as SmlElement
			element.assureName("Meta")
			metaElement = element
			const nextNode = await reader.readNode()
			if (nextNode === null || !nextNode.isAttribute()) { throw new Error(`Column names attribute expected`) }
			columnNamesAttribute = nextNode as SmlAttribute
		} else if (node.isAttribute()) {
			columnNamesAttribute = node as SmlAttribute
		} else { throw new Error(`Column names attribute expected`) }

		for (const value of columnNamesAttribute.values) {
			if (value === null) { throw new Error("Column name cannot be null") }
		}
		const columnNames: string[] = [columnNamesAttribute.name, ...(columnNamesAttribute.values as string[])]
		const header = new TblDocument(columnNames, reader.encoding)
		if (metaElement !== null) { header.meta.parse(metaElement) }
		return new TblStreamReader(reader, header)
	}

	async readRow(): Promise<(string | null)[] | null> {
		const node = await this.reader.readNode()
		if (node === null) { return null }
		if (!node.isAttribute()) { throw new Error(`Attribute expected`) }
		const attribute = node as SmlAttribute
		const rowValues = [attribute.name, ...attribute.values]
		if (rowValues.length > this.header.columnCount) { throw new Error("Row has more values than there are columns") }
		return rowValues
	}

	async close() {
		await this.reader.close()
	}
}

// ----------------------------------------------------------------------

export class SyncTblStreamWriter {
	private writer: SyncSmlStreamWriter
	readonly header: TblDocument

	get encoding(): ReliableTxtEncoding {
		return this.writer.encoding
	}

	get isClosed(): boolean {
		return this.writer.isClosed
	}

	get handle(): SyncReliableTxtFileHandle {
		return this.writer.handle
	}

	get existing(): boolean {
		return this.writer.existing
	}

	private constructor(writer: SyncSmlStreamWriter, header: TblDocument) {
		this.writer = writer
		this.header = header
	}

	static create(templateDocument: TblDocument, filePath: string, mode: WriterMode = WriterMode.CreateOrOverwrite): SyncTblStreamWriter {
		const smlDocument = new SmlDocument(templateDocument.toElement())
		const writer = SyncSmlStreamWriter.create(smlDocument, filePath, mode, false)
		try {
			let header: TblDocument
			if (writer.existing) {
				const reader = SyncTblStreamReader.getAppendReader(writer)
				if (reader.header.columnCount !== templateDocument.columnCount) { throw new Error(`Column count mismatch`) }
				header = reader.header
			} else {
				if (templateDocument.meta.hasAny) {
					writer.writeNode(templateDocument.meta.toElement())
				}
				const columnNames = templateDocument.columnNames
				writer.writeNode(new SmlAttribute(columnNames[0], columnNames.slice(1)))
				header = templateDocument
			}
			return new SyncTblStreamWriter(writer, header)
		} catch (error) {
			writer.close()
			throw error
		}
	}

	writeRow(values: (string | null)[]) {
		if (values.length < 2) { throw new Error("Row must have at least two values") }
		if (values[0] === null) { throw new Error("First row value cannot be null") }
		if (values.length > this.header.columnNames.length) { throw new Error("Row has more values than there are columns") }
		this.writer.writeNode(new SmlAttribute(values[0], values.slice(1)))
	}

	writeRows(rows: (string | null)[][]) {
		for (const row of rows) {
			this.writeRow(row)
		}
	}

	close() {
		this.writer.close()
	}
}

// ----------------------------------------------------------------------

export class TblStreamWriter {
	private writer: SmlStreamWriter
	readonly header: TblDocument

	get encoding(): ReliableTxtEncoding {
		return this.writer.encoding
	}

	get isClosed(): boolean {
		return this.writer.isClosed
	}

	get handle(): ReliableTxtFileHandle {
		return this.writer.handle
	}

	get existing(): boolean {
		return this.writer.existing
	}

	private constructor(writer: SmlStreamWriter, header: TblDocument) {
		this.writer = writer
		this.header = header
	}

	static async create(templateDocument: TblDocument, filePath: string, mode: WriterMode = WriterMode.CreateOrOverwrite): Promise<TblStreamWriter> {
		const smlDocument = new SmlDocument(templateDocument.toElement())
		const writer = await SmlStreamWriter.create(smlDocument, filePath, mode, false)
		try {
			let header: TblDocument
			if (writer.existing) {
				const reader = await TblStreamReader.getAppendReader(writer)
				if (reader.header.columnCount !== templateDocument.columnCount) { throw new Error(`Column count mismatch`) }
				header = reader.header
			} else {
				if (templateDocument.meta.hasAny) {
					await writer.writeNode(templateDocument.meta.toElement())
				}
				const columnNames = templateDocument.columnNames
				await writer.writeNode(new SmlAttribute(columnNames[0], columnNames.slice(1)))
				header = templateDocument
			}
			return new TblStreamWriter(writer, header)
		} catch (error) {
			await writer.close()
			throw error
		}
	}

	async writeRow(values: (string | null)[]) {
		if (values.length < 2) { throw new Error("Row must have at least two values") }
		if (values[0] === null) { throw new Error("First row value cannot be null") }
		if (values.length > this.header.columnNames.length) { throw new Error("Row has more values than there are columns") }
		await this.writer.writeNode(new SmlAttribute(values[0], values.slice(1)))
	}

	async writeRows(rows: (string | null)[][]) {
		for (const row of rows) {
			await this.writeRow(row)
		}
	}

	async close() {
		await this.writer.close()
	}
}