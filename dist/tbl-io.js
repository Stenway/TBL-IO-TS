"use strict";
/* (C) Stefan John / Stenway / SimpleML.com / 2022 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TblFile = void 0;
const reliabletxt_io_1 = require("@stenway/reliabletxt-io");
const tbl_1 = require("@stenway/tbl");
// ----------------------------------------------------------------------
class TblFile {
    static saveSync(document, filePath) {
        let content = document.toString();
        reliabletxt_io_1.ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding);
    }
    static saveMinifiedSync(document, filePath) {
        let content = document.toMinifiedString();
        reliabletxt_io_1.ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding);
    }
    static saveAlignedSync(document, filePath) {
        let content = document.toAlignedString();
        reliabletxt_io_1.ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding);
    }
    static loadSync(filePath) {
        let reliableTxtDocument = reliabletxt_io_1.ReliableTxtFile.loadSync(filePath);
        let tblDocument = tbl_1.TblDocument.parse(reliableTxtDocument.text);
        tblDocument.encoding = reliableTxtDocument.encoding;
        return tblDocument;
    }
}
exports.TblFile = TblFile;
