import { NoReliableTxtPreambleError, ReliableTxtEncoding } from '@stenway/reliabletxt'
import { ReliableTxtFile, WriterMode } from '@stenway/reliabletxt-io'
import { TblDocument } from '@stenway/tbl'
import * as fs from 'node:fs'
import { BinaryTblFile, BinaryTblStreamReader, BinaryTblStreamWriter, SyncBinaryTblStreamReader, SyncBinaryTblStreamWriter, SyncTblStreamReader, SyncTblStreamWriter, TblFile, TblStreamReader, TblStreamWriter } from '../src/tbl-io.js'
import { BinarySmlFile, BinarySmlStreamWriter, SmlStreamWriter, SyncBinarySmlStreamWriter, SyncSmlStreamWriter } from '@stenway/sml-io'
import { SmlDocument, SmlElement } from '@stenway/sml'

function getFilePath(name: string): string {
	return "test_files/"+name
}

const testFilePath: string = getFilePath("Test.tbl")

function writeBytesSync(bytes: Uint8Array, filePath: string) {
	fs.writeFileSync(filePath, bytes)
}

async function writeBytes(bytes: Uint8Array, filePath: string) {
	await fs.promises.writeFile(filePath, bytes)
}

function deleteFileSync(filePath: string): boolean {
	try {
		fs.unlinkSync(filePath)
	} catch {
		return false
	}
	return true
}

async function deleteFile(filePath: string): Promise<boolean> {
	try {
		await fs.promises.unlink(filePath)
	} catch {
		return false
	}
	return true
}

// ----------------------------------------------------------------------

describe("TblFile.saveSync + loadSync", () => {
	test.each([
		[ReliableTxtEncoding.Utf8],
		[ReliableTxtEncoding.Utf16],
		[ReliableTxtEncoding.Utf16Reverse],
		[ReliableTxtEncoding.Utf32],
	])(
		"Given %p",
		(encoding) => {
			const document = TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`)
			document.encoding = encoding
			TblFile.saveSync(document, testFilePath)
			const loadedDocument = TblFile.loadSync(testFilePath)
			expect(loadedDocument.toString()).toEqual(document.toString())
			expect(loadedDocument.encoding).toEqual(document.encoding)
		}
	)

	test("Throws", () => {
		writeBytesSync(new Uint8Array([]), testFilePath)
		expect(() => TblFile.loadSync(testFilePath)).toThrowError(NoReliableTxtPreambleError)
	})
})

describe("TblFile.save + load", () => {
	test.each([
		[ReliableTxtEncoding.Utf8],
		[ReliableTxtEncoding.Utf16],
		[ReliableTxtEncoding.Utf16Reverse],
		[ReliableTxtEncoding.Utf32],
	])(
		"Given %p",
		async (encoding) => {
			const document = TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`)
			document.encoding = encoding
			await TblFile.save(document, testFilePath)
			const loadedDocument = await TblFile.load(testFilePath)
			expect(loadedDocument.toString()).toEqual(document.toString())
			expect(loadedDocument.encoding).toEqual(document.encoding)
		}
	)

	test("Throws", async () => {
		await writeBytes(new Uint8Array([]), testFilePath)
		await expect(async () => await TblFile.load(testFilePath)).rejects.toThrowError(NoReliableTxtPreambleError)
	})
})

test("TblFile.saveMinifiedSync", () => {
	const document = TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`)
	TblFile.saveMinifiedSync(document, testFilePath)
	expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\nColumn1 Column2\nValue11 Value12\n-`)
})

test("TblFile.saveMinified", async () => {
	const document = TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`)
	await TblFile.saveMinified(document, testFilePath)
	expect(await ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\nColumn1 Column2\nValue11 Value12\n-`)
})

test("TblFile.appendRowsSync", () => {
	deleteFileSync(testFilePath)
	const template = new TblDocument(["Column1", "Column2"])
	TblFile.appendRowsSync([["Value11", "Value12"]], template, testFilePath)
	expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`)

	TblFile.appendRowsSync([], template, testFilePath)

	TblFile.appendRowsSync([["Value21", "Value22"]], template, testFilePath)
	expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`)
})

test("TblFile.appendRows", async () => {
	await deleteFile(testFilePath)
	const template = new TblDocument(["Column1", "Column2"])
	await TblFile.appendRows([["Value11", "Value12"]], template, testFilePath)
	expect(await ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`)

	await TblFile.appendRows([], template, testFilePath)

	await TblFile.appendRows([["Value21", "Value22"]], template, testFilePath)
	expect(await ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`)
})

// ----------------------------------------------------------------------

test("SyncTblStreamReader", () => {
	ReliableTxtFile.writeAllTextSync(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`, testFilePath)
	const reader = SyncTblStreamReader.create(testFilePath)
	expect(reader.encoding).toEqual(ReliableTxtEncoding.Utf8)
	expect(reader.header.columnNames).toEqual(["Column1", "Column2"])
	expect(reader.isClosed).toEqual(false)
	expect(reader.handle.existing).toEqual(true)

	expect(reader.readRow()).toEqual(["Value11", "Value12"])
	expect(reader.readRow()).toEqual(["Value21", "Value22"])
	expect(reader.readRow()).toEqual(null)
	expect(reader.readRow()).toEqual(null)

	reader.close()
	expect(reader.isClosed).toEqual(true)
})

describe("SyncTblStreamReader", () => {
	test.each([
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\nEnd`],
	])(
		"Given %p",
		(input) => {
			ReliableTxtFile.writeAllTextSync(input, testFilePath)
			const reader = SyncTblStreamReader.create(testFilePath)
			reader.close()
		}
	)

	test.each([
		[`Document\nEnd`],
		[`Table\nEnd`],
		[`Table\n\tElement\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tMeta\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tColumn1 -\nEnd`],
		[`Table\n\tColumn1 -\nEnd`],
	])(
		"Given %p throws",
		(input) => {
			ReliableTxtFile.writeAllTextSync(input, testFilePath)
			expect(() => SyncTblStreamReader.create(testFilePath)).toThrowError()
		}
	)

	test.each([
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tElement\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12 Value13\nEnd`],
	])(
		"Given %p throws",
		(input) => {
			ReliableTxtFile.writeAllTextSync(input, testFilePath)
			const reader = SyncTblStreamReader.create(testFilePath)
			expect(() => reader.readRow()).toThrowError()
			reader.close()
		}
	)

	test("Given %p throws", () => {
		deleteFileSync(testFilePath)
		const document = new SmlDocument(new SmlElement("Table"))
		const writer = SyncSmlStreamWriter.create(document, testFilePath)
		expect(() => SyncTblStreamReader.getAppendReader(writer)).toThrowError()
		writer.close()
	})
})

// ----------------------------------------------------------------------

test("TblStreamReader", async () => {
	await ReliableTxtFile.writeAllText(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`, testFilePath)
	const reader = await TblStreamReader.create(testFilePath)
	expect(reader.encoding).toEqual(ReliableTxtEncoding.Utf8)
	expect(reader.header.columnNames).toEqual(["Column1", "Column2"])
	expect(reader.isClosed).toEqual(false)
	expect(reader.handle.existing).toEqual(true)

	expect(await reader.readRow()).toEqual(["Value11", "Value12"])
	expect(await reader.readRow()).toEqual(["Value21", "Value22"])
	expect(await reader.readRow()).toEqual(null)
	expect(await reader.readRow()).toEqual(null)

	await reader.close()
	expect(reader.isClosed).toEqual(true)
})

describe("TblStreamReader", () => {
	test.each([
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\nEnd`],
	])(
		"Given %p",
		async (input) => {
			await ReliableTxtFile.writeAllText(input, testFilePath)
			const reader = await TblStreamReader.create(testFilePath)
			await reader.close()
		}
	)

	test.each([
		[`Document\nEnd`],
		[`Table\nEnd`],
		[`Table\n\tElement\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tMeta\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tColumn1 -\nEnd`],
		[`Table\n\tColumn1 -\nEnd`],
	])(
		"Given %p throws",
		async (input) => {
			await ReliableTxtFile.writeAllText(input, testFilePath)
			await expect(async () => await TblStreamReader.create(testFilePath)).rejects.toThrowError()
		}
	)

	test.each([
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tElement\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12 Value13\nEnd`],
	])(
		"Given %p throws",
		async (input) => {
			await ReliableTxtFile.writeAllText(input, testFilePath)
			const reader = await TblStreamReader.create(testFilePath)
			await expect(async () => await reader.readRow()).rejects.toThrowError()
			await reader.close()
		}
	)
	
	test("Given %p throws", async () => {
		await deleteFile(testFilePath)
		const document = new SmlDocument(new SmlElement("Table"))
		const writer = await SmlStreamWriter.create(document, testFilePath)
		await expect(async () => await TblStreamReader.getAppendReader(writer)).rejects.toThrowError()
		await writer.close()
	})
})

// ----------------------------------------------------------------------

test("SyncTblStreamWriter", () => {
	deleteFileSync(testFilePath)
	const templateDocument = new TblDocument(["Column1", "Column2"])
	templateDocument.meta.description = "Text"
	let writer = SyncTblStreamWriter.create(templateDocument, testFilePath)
	expect(writer.encoding).toEqual(ReliableTxtEncoding.Utf8)
	expect(writer.isClosed).toEqual(false)
	expect(writer.header.columnNames).toEqual(["Column1", "Column2"])
	expect(writer.existing).toEqual(false)
	expect(writer.handle.existing).toEqual(false)
	writer.writeRow(["Value11", "Value12"])
	writer.writeRows([["Value21", null], ["Value31", "Value32"]])
	expect(() => writer.writeRow([])).toThrowError()
	expect(() => writer.writeRow([null, null])).toThrowError()
	expect(() => writer.writeRow(["Value31", "Value32", "Value33"])).toThrowError()
	writer.close()
	expect(writer.isClosed).toEqual(true)
	expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 -\n\tValue31 Value32\nEnd`)

	writer = SyncTblStreamWriter.create(templateDocument, testFilePath)
	expect(writer.existing).toEqual(false)
	writer.close()
	expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`)

	writer = SyncTblStreamWriter.create(templateDocument, testFilePath, WriterMode.CreateOrAppend)
	expect(writer.existing).toEqual(true)
	writer.close()
	expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`)

	writer = SyncTblStreamWriter.create(templateDocument, testFilePath, WriterMode.CreateOrAppend)
	writer.writeRow(["Value41", "Value42"])
	writer.close()
	expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue41 Value42\nEnd`)

	const templateDocument2 = new TblDocument(["Column1", "Column2", "Column3"])
	expect(() => SyncTblStreamWriter.create(templateDocument2, testFilePath, WriterMode.CreateOrAppend)).toThrowError()
})

// ----------------------------------------------------------------------

test("TblStreamWriter", async () => {
	await deleteFile(testFilePath)
	const templateDocument = new TblDocument(["Column1", "Column2"])
	templateDocument.meta.description = "Text"
	let writer = await TblStreamWriter.create(templateDocument, testFilePath)
	expect(writer.encoding).toEqual(ReliableTxtEncoding.Utf8)
	expect(writer.isClosed).toEqual(false)
	expect(writer.header.columnNames).toEqual(["Column1", "Column2"])
	expect(writer.existing).toEqual(false)
	expect(writer.handle.existing).toEqual(false)
	await writer.writeRow(["Value11", "Value12"])
	await writer.writeRows([["Value21", null], ["Value31", "Value32"]])
	await expect(async () => await writer.writeRow([])).rejects.toThrowError()
	await expect(async () => await writer.writeRow([null, null])).rejects.toThrowError()
	await expect(async () => await writer.writeRow(["Value31", "Value32", "Value33"])).rejects.toThrowError()
	await writer.close()
	expect(writer.isClosed).toEqual(true)
	expect(await ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 -\n\tValue31 Value32\nEnd`)

	writer = await TblStreamWriter.create(templateDocument, testFilePath)
	expect(writer.existing).toEqual(false)
	await writer.close()
	expect(await ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`)

	writer = await TblStreamWriter.create(templateDocument, testFilePath, WriterMode.CreateOrAppend)
	expect(writer.existing).toEqual(true)
	await writer.close()
	expect(await ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`)

	writer = await TblStreamWriter.create(templateDocument, testFilePath, WriterMode.CreateOrAppend)
	await writer.writeRow(["Value41", "Value42"])
	await writer.close()
	expect(await ReliableTxtFile.readAllText(testFilePath)).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue41 Value42\nEnd`)

	const templateDocument2 = new TblDocument(["Column1", "Column2", "Column3"])
	await expect(async () => await TblStreamWriter.create(templateDocument2, testFilePath, WriterMode.CreateOrAppend)).rejects.toThrowError()
})

// ----------------------------------------------------------------------

test("SyncBinaryTblStreamReader", () => {
	const document = TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`)
	BinaryTblFile.saveSync(document, testFilePath)

	const reader = SyncBinaryTblStreamReader.create(testFilePath)
	expect(reader.header.columnNames).toEqual(["Column1", "Column2"])
	expect(reader.isClosed).toEqual(false)
	expect(reader.handle.existing).toEqual(true)

	expect(reader.readRow()).toEqual(["Value11", "Value12"])
	expect(reader.readRow()).toEqual(["Value21", "Value22"])
	expect(reader.readRow()).toEqual(null)
	expect(reader.readRow()).toEqual(null)

	reader.close()
	expect(reader.isClosed).toEqual(true)
})

describe("SyncBinaryTblStreamReader", () => {
	test.each([
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\nEnd`],
	])(
		"Given %p",
		(input) => {
			const document = TblDocument.parse(input)
			BinaryTblFile.saveSync(document, testFilePath)

			const reader = SyncBinaryTblStreamReader.create(testFilePath)
			reader.close()
		}
	)

	test.each([
		[`Document\nEnd`],
		[`Table\nEnd`],
		[`Table\n\tElement\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tMeta\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tColumn1 -\nEnd`],
		[`Table\n\tColumn1 -\nEnd`],
	])(
		"Given %p throws",
		(input) => {
			const document = SmlDocument.parse(input)
			BinarySmlFile.saveSync(document, testFilePath)

			expect(() => SyncBinaryTblStreamReader.create(testFilePath)).toThrowError()
		}
	)

	test.each([
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tElement\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12 Value13\nEnd`],
	])(
		"Given %p throws",
		(input) => {
			const document = SmlDocument.parse(input)
			BinarySmlFile.saveSync(document, testFilePath)

			const reader = SyncBinaryTblStreamReader.create(testFilePath)
			expect(() => reader.readRow()).toThrowError()
			reader.close()
		}
	)

	test("Given %p throws", () => {
		deleteFileSync(testFilePath)
		const writer = SyncBinarySmlStreamWriter.create("Table", testFilePath)
		expect(() => SyncBinaryTblStreamReader.getAppendReader(writer)).toThrowError()
		writer.close()
	})
})

// ----------------------------------------------------------------------

test("BinaryTblStreamReader", async () => {
	const document = TblDocument.parse(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`)
	await BinaryTblFile.save(document, testFilePath)

	const reader = await BinaryTblStreamReader.create(testFilePath)
	expect(reader.header.columnNames).toEqual(["Column1", "Column2"])
	expect(reader.isClosed).toEqual(false)
	expect(reader.handle.existing).toEqual(true)

	expect(await reader.readRow()).toEqual(["Value11", "Value12"])
	expect(await reader.readRow()).toEqual(["Value21", "Value22"])
	expect(await reader.readRow()).toEqual(null)
	expect(await reader.readRow()).toEqual(null)

	await reader.close()
	expect(reader.isClosed).toEqual(true)
})

describe("SyncBinaryTblStreamReader", () => {
	test.each([
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\nEnd`],
	])(
		"Given %p",
		async (input) => {
			const document = TblDocument.parse(input)
			await BinaryTblFile.save(document, testFilePath)

			const reader = await BinaryTblStreamReader.create(testFilePath)
			await reader.close()
		}
	)

	test.each([
		[`Document\nEnd`],
		[`Table\nEnd`],
		[`Table\n\tElement\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tMeta\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tColumn1 -\nEnd`],
		[`Table\n\tColumn1 -\nEnd`],
	])(
		"Given %p throws",
		async (input) => {
			const document = SmlDocument.parse(input)
			await BinarySmlFile.save(document, testFilePath)

			await expect(async () => await BinaryTblStreamReader.create(testFilePath)).rejects.toThrowError()
		}
	)

	test.each([
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tElement\n\tEnd\nEnd`],
		[`Table\n\tMeta\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12 Value13\nEnd`],
	])(
		"Given %p throws",
		async (input) => {
			const document = SmlDocument.parse(input)
			await BinarySmlFile.save(document, testFilePath)

			const reader = await BinaryTblStreamReader.create(testFilePath)
			await expect(async () => await reader.readRow()).rejects.toThrowError()
			await reader.close()
		}
	)

	test("Given %p throws", async () => {
		await deleteFile(testFilePath)
		const writer = await BinarySmlStreamWriter.create("Table", testFilePath)
		await expect(async () => await BinaryTblStreamReader.getAppendReader(writer)).rejects.toThrowError()
		await writer.close()
	})
})

// ----------------------------------------------------------------------

test("SyncBinaryTblStreamWriter", () => {
	deleteFileSync(testFilePath)
	const templateDocument = new TblDocument(["Column1", "Column2"])
	templateDocument.meta.description = "Text"
	let writer = SyncBinaryTblStreamWriter.create(templateDocument, testFilePath)
	expect(writer.isClosed).toEqual(false)
	expect(writer.header.columnNames).toEqual(["Column1", "Column2"])
	expect(writer.existing).toEqual(false)
	expect(writer.handle.existing).toEqual(false)
	writer.writeRow(["Value11", "Value12"])
	writer.writeRows([["Value21", null], ["Value31", "Value32"]])
	expect(() => writer.writeRow([])).toThrowError()
	expect(() => writer.writeRow([null, null])).toThrowError()
	expect(() => writer.writeRow(["Value31", "Value32", "Value33"])).toThrowError()
	writer.close()
	expect(writer.isClosed).toEqual(true)
	expect(BinaryTblFile.loadSync(testFilePath).toString()).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 -\n\tValue31 Value32\nEnd`)

	writer = SyncBinaryTblStreamWriter.create(templateDocument, testFilePath)
	expect(writer.existing).toEqual(false)
	writer.close()
	expect(BinaryTblFile.loadSync(testFilePath).toString()).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`)

	writer = SyncBinaryTblStreamWriter.create(templateDocument, testFilePath, WriterMode.CreateOrAppend)
	expect(writer.existing).toEqual(true)
	writer.close()
	expect(BinaryTblFile.loadSync(testFilePath).toString()).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`)

	writer = SyncBinaryTblStreamWriter.create(templateDocument, testFilePath, WriterMode.CreateOrAppend)
	writer.writeRow(["Value41", "Value42"])
	writer.close()
	expect(BinaryTblFile.loadSync(testFilePath).toString()).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue41 Value42\nEnd`)

	const templateDocument2 = new TblDocument(["Column1", "Column2", "Column3"])
	expect(() => SyncBinaryTblStreamWriter.create(templateDocument2, testFilePath, WriterMode.CreateOrAppend)).toThrowError()
})

// ----------------------------------------------------------------------

test("BinaryTblStreamWriter", async () => {
	await deleteFile(testFilePath)
	const templateDocument = new TblDocument(["Column1", "Column2"])
	templateDocument.meta.description = "Text"
	let writer = await BinaryTblStreamWriter.create(templateDocument, testFilePath)
	expect(writer.isClosed).toEqual(false)
	expect(writer.header.columnNames).toEqual(["Column1", "Column2"])
	expect(writer.existing).toEqual(false)
	expect(writer.handle.existing).toEqual(false)
	await writer.writeRow(["Value11", "Value12"])
	await writer.writeRows([["Value21", null], ["Value31", "Value32"]])
	await expect(async () => await writer.writeRow([])).rejects.toThrowError()
	await expect(async () => await writer.writeRow([null, null])).rejects.toThrowError()
	await expect(async () => await writer.writeRow(["Value31", "Value32", "Value33"])).rejects.toThrowError()
	await writer.close()
	expect(writer.isClosed).toEqual(true)
	expect((await BinaryTblFile.load(testFilePath)).toString()).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 -\n\tValue31 Value32\nEnd`)

	writer = await BinaryTblStreamWriter.create(templateDocument, testFilePath)
	expect(writer.existing).toEqual(false)
	await writer.close()
	expect((await BinaryTblFile.load(testFilePath)).toString()).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`)

	writer = await BinaryTblStreamWriter.create(templateDocument, testFilePath, WriterMode.CreateOrAppend)
	expect(writer.existing).toEqual(true)
	await writer.close()
	expect((await BinaryTblFile.load(testFilePath)).toString()).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\nEnd`)

	writer = await BinaryTblStreamWriter.create(templateDocument, testFilePath, WriterMode.CreateOrAppend)
	await writer.writeRow(["Value41", "Value42"])
	await writer.close()
	expect((await BinaryTblFile.load(testFilePath)).toString()).toEqual(`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue41 Value42\nEnd`)

	const templateDocument2 = new TblDocument(["Column1", "Column2", "Column3"])
	await expect(async () => await BinaryTblStreamWriter.create(templateDocument2, testFilePath, WriterMode.CreateOrAppend)).rejects.toThrowError()
})

// ----------------------------------------------------------------------

test("BinaryTblFile.appendRowsSync", () => {
	deleteFileSync(testFilePath)
	const template = new TblDocument(["Column1", "Column2"])
	BinaryTblFile.appendRowsSync([["Value11", "Value12"]], template, testFilePath)
	expect(BinaryTblFile.loadSync(testFilePath).toString()).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`)

	BinaryTblFile.appendRowsSync([], template, testFilePath)

	BinaryTblFile.appendRowsSync([["Value21", "Value22"]], template, testFilePath)
	expect(BinaryTblFile.loadSync(testFilePath).toString()).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`)
})

test("BinaryTblFile.appendRows", async () => {
	await deleteFile(testFilePath)
	const template = new TblDocument(["Column1", "Column2"])
	await BinaryTblFile.appendRows([["Value11", "Value12"]], template, testFilePath)
	expect((await BinaryTblFile.load(testFilePath)).toString()).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`)

	await BinaryTblFile.appendRows([], template, testFilePath)

	await BinaryTblFile.appendRows([["Value21", "Value22"]], template, testFilePath)
	expect((await BinaryTblFile.load(testFilePath)).toString()).toEqual(`Table\n\tColumn1 Column2\n\tValue11 Value12\n\tValue21 Value22\nEnd`)
})