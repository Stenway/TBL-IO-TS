import { TblDocument } from "@stenway/tbl";
export declare abstract class TblFile {
    static saveSync(document: TblDocument, filePath: string): void;
    static saveMinifiedSync(document: TblDocument, filePath: string): void;
    static saveAlignedSync(document: TblDocument, filePath: string): void;
    static loadSync(filePath: string): TblDocument;
}
