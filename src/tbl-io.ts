/* (C) Stefan John / Stenway / SimpleML.com / 2022 */

import { ReliableTxtDocument } from "@stenway/reliabletxt";
import { ReliableTxtFile } from "@stenway/reliabletxt-io";
import { TblDocument } from "@stenway/tbl";

// ----------------------------------------------------------------------

export abstract class TblFile {
	static saveSync(document: TblDocument, filePath: string) {
		let content: string = document.toString()
		ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding)
	}

	static saveMinifiedSync(document: TblDocument, filePath: string) {
		let content: string = document.toMinifiedString()
		ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding)
	}

	static saveAlignedSync(document: TblDocument, filePath: string) {
		let content: string = document.toAlignedString()
		ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding)
	}

	static loadSync(filePath: string): TblDocument {
		let reliableTxtDocument: ReliableTxtDocument = ReliableTxtFile.loadSync(filePath)
		let tblDocument: TblDocument = TblDocument.parse(reliableTxtDocument.text)
		tblDocument.encoding = reliableTxtDocument.encoding
		return tblDocument
	}
}