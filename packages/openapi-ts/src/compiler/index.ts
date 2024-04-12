import { writeFileSync } from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

import * as module from './module';
import * as typedef from './typedef';
import * as types from './types';
import { addLeadingComment, tsNodeToString } from './utils';

export type { Property } from './typedef';
export type { Comments } from './utils';
export type { Node, TypeNode } from 'typescript';

export const generatedFileName = (fileName: string, insertGen = true) => {
    const match = fileName.match(/\.[0-9a-z]+$/i);
    const extension = match ? match[0].slice(1) : '';
    const filePath = fileName.slice(0, fileName.length - (extension ? extension.length + 1 : 0));
    return [filePath, insertGen && 'gen', extension].filter(Boolean).join('.');
};

export const filePath = (folderPath: string, fileName: string, insertGen = true) => {
    const name = generatedFileName(fileName, insertGen);
    return path.resolve(folderPath, name);
};

export class TypeScriptFile {
    private _headers: Array<string> = [];
    private _imports: Array<ts.Node> = [];
    private _items: Array<ts.Node | string> = [];
    private _path: string;

    public constructor({ path, header = true }: { path: string; header?: boolean }) {
        this._path = path;
        if (header) {
            const text = 'This file is auto-generated by @hey-api/openapi-ts';
            const comment = addLeadingComment(undefined, [text], true, false);
            this._headers = [...this._headers, comment];
        }
    }

    public add(...nodes: Array<ts.Node | string>): void {
        this._items = [...this._items, ...nodes];
    }

    public addNamedImport(...params: Parameters<typeof module.createNamedImportDeclarations>): void {
        this._imports = [...this._imports, compiler.import.named(...params)];
    }

    public toString(seperator: string = '\n') {
        let output: string[] = [];
        if (this._headers.length) {
            output = [...output, this._headers.join('\n')];
        }
        if (this._imports.length) {
            output = [...output, this._imports.map(v => tsNodeToString(v)).join('\n')];
        }
        output = [...output, ...this._items.map(v => (typeof v === 'string' ? v : tsNodeToString(v)))];
        return output.join(seperator);
    }

    public write(seperator = '\n') {
        // TODO: throw if path is not set. do not throw if items are empty
        if (!this._items.length || !this._path) {
            return;
        }
        writeFileSync(this._path, this.toString(seperator));
    }
}

export const compiler = {
    export: {
        all: module.createExportAllDeclaration,
        asConst: module.createExportVariableAsConst,
        named: module.createNamedExportDeclarations,
    },
    import: {
        named: module.createNamedImportDeclarations,
    },
    typedef: {
        alias: typedef.createTypeAliasDeclaration,
        array: typedef.createTypeArrayNode,
        basic: typedef.createTypeNode,
        interface: typedef.createTypeInterfaceNode,
        intersect: typedef.createTypeIntersectNode,
        record: typedef.createTypeRecordNode,
        tuple: typedef.createTypeTupleNode,
        union: typedef.createTypeUnionNode,
    },
    types: {
        array: types.createArrayType,
        enum: types.createEnumDeclaration,
        object: types.createObjectType,
    },
    utils: {
        toString: tsNodeToString,
    },
};
