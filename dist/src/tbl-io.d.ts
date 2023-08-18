import { ReliableTxtEncoding } from "@stenway/reliabletxt";
import { ReliableTxtFileHandle, SyncReliableTxtFileHandle, WriterMode } from "@stenway/reliabletxt-io";
import { BinarySmlFileHandle, BinarySmlStreamWriter, SmlStreamWriter, SyncBinarySmlFileHandle, SyncBinarySmlStreamWriter, SyncSmlStreamWriter } from "@stenway/sml-io";
import { TblDocument } from "@stenway/tbl";
export declare abstract class TblFile {
    static saveSync(document: TblDocument, filePath: string, aligned?: boolean, whitespaceBetween?: string | null, rightAligned?: boolean[] | null, overwriteExisting?: boolean): void;
    static save(document: TblDocument, filePath: string, aligned?: boolean, whitespaceBetween?: string | null, rightAligned?: boolean[] | null, overwriteExisting?: boolean): Promise<void>;
    static saveMinifiedSync(document: TblDocument, filePath: string, overwriteExisting?: boolean): void;
    static saveMinified(document: TblDocument, filePath: string, overwriteExisting?: boolean): Promise<void>;
    static loadSync(filePath: string): TblDocument;
    static load(filePath: string): Promise<TblDocument>;
    static appendRowsSync(rows: (string | null)[][], templateDocument: TblDocument, filePath: string): void;
    static appendRows(rows: (string | null)[][], templateDocument: TblDocument, filePath: string): Promise<void>;
}
export declare class SyncTblStreamReader {
    private reader;
    readonly header: TblDocument;
    get encoding(): ReliableTxtEncoding;
    get isClosed(): boolean;
    get handle(): SyncReliableTxtFileHandle;
    private constructor();
    static create(filePath: string, chunkSize?: number): SyncTblStreamReader;
    static getAppendReader(writer: SyncSmlStreamWriter): SyncTblStreamReader;
    private static internalCreate;
    readRow(): (string | null)[] | null;
    close(): void;
}
export declare class TblStreamReader {
    private reader;
    readonly header: TblDocument;
    get encoding(): ReliableTxtEncoding;
    get isClosed(): boolean;
    get handle(): ReliableTxtFileHandle;
    private constructor();
    static create(filePath: string, chunkSize?: number): Promise<TblStreamReader>;
    static getAppendReader(writer: SmlStreamWriter): Promise<TblStreamReader>;
    private static internalCreate;
    readRow(): Promise<(string | null)[] | null>;
    close(): Promise<void>;
}
export declare class SyncTblStreamWriter {
    private writer;
    readonly header: TblDocument;
    get encoding(): ReliableTxtEncoding;
    get isClosed(): boolean;
    get handle(): SyncReliableTxtFileHandle;
    get existing(): boolean;
    private constructor();
    static create(templateDocument: TblDocument, filePath: string, mode?: WriterMode): SyncTblStreamWriter;
    writeRow(values: (string | null)[]): void;
    writeRows(rows: (string | null)[][]): void;
    close(): void;
}
export declare class TblStreamWriter {
    private writer;
    readonly header: TblDocument;
    get encoding(): ReliableTxtEncoding;
    get isClosed(): boolean;
    get handle(): ReliableTxtFileHandle;
    get existing(): boolean;
    private constructor();
    static create(templateDocument: TblDocument, filePath: string, mode?: WriterMode): Promise<TblStreamWriter>;
    writeRow(values: (string | null)[]): Promise<void>;
    writeRows(rows: (string | null)[][]): Promise<void>;
    close(): Promise<void>;
}
export declare abstract class BinaryTblFile {
    static saveSync(document: TblDocument, filePath: string, overwriteExisting?: boolean): void;
    static save(document: TblDocument, filePath: string, overwriteExisting?: boolean): Promise<void>;
    static loadSync(filePath: string): TblDocument;
    static load(filePath: string): Promise<TblDocument>;
    static appendRowsSync(rows: (string | null)[][], templateDocument: TblDocument, filePath: string): void;
    static appendRows(rows: (string | null)[][], templateDocument: TblDocument, filePath: string): Promise<void>;
}
export declare class SyncBinaryTblStreamReader {
    private reader;
    readonly header: TblDocument;
    get isClosed(): boolean;
    get handle(): SyncBinarySmlFileHandle;
    private constructor();
    static create(filePath: string, chunkSize?: number): SyncBinaryTblStreamReader;
    static getAppendReader(writer: SyncBinarySmlStreamWriter): SyncBinaryTblStreamReader;
    private static internalCreate;
    readRow(): (string | null)[] | null;
    close(): void;
}
export declare class BinaryTblStreamReader {
    private reader;
    readonly header: TblDocument;
    get isClosed(): boolean;
    get handle(): BinarySmlFileHandle;
    private constructor();
    static create(filePath: string, chunkSize?: number): Promise<BinaryTblStreamReader>;
    static getAppendReader(writer: BinarySmlStreamWriter): Promise<BinaryTblStreamReader>;
    private static internalCreate;
    readRow(): Promise<(string | null)[] | null>;
    close(): Promise<void>;
}
export declare class SyncBinaryTblStreamWriter {
    private writer;
    readonly header: TblDocument;
    get isClosed(): boolean;
    get handle(): SyncBinarySmlFileHandle;
    get existing(): boolean;
    private constructor();
    static create(templateDocument: TblDocument, filePath: string, mode?: WriterMode): SyncBinaryTblStreamWriter;
    writeRow(values: (string | null)[]): void;
    writeRows(rows: (string | null)[][]): void;
    close(): void;
}
export declare class BinaryTblStreamWriter {
    private writer;
    readonly header: TblDocument;
    get isClosed(): boolean;
    get handle(): BinarySmlFileHandle;
    get existing(): boolean;
    private constructor();
    static create(templateDocument: TblDocument, filePath: string, mode?: WriterMode): Promise<BinaryTblStreamWriter>;
    writeRow(values: (string | null)[]): Promise<void>;
    writeRows(rows: (string | null)[][]): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=tbl-io.d.ts.map