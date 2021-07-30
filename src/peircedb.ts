import * as vscode from 'vscode';
import * as fs from 'fs';
import fetch from 'node-fetch';

import { getAnnotationFilePath, getConfiguration } from './configuration';
import { setDecorations } from './decoration/decoration';
import { CustomInspectFunction } from 'util';
import models = require("./models")
import peirce = require("./peirce_api_calls");

let currentInterpretationNumber = 0;

export const getCurrentInterpretationNumber = () : number => {
    return currentInterpretationNumber;
}

export const setCurrentInterpretationNumber = (val : number) : void => {
    currentInterpretationNumber = val;
}

export interface PeirceDb {
    terms: models.Term[];
    constructors: models.Constructor[]
    time_coordinate_spaces: models.TimeCoordinateSpace[];
    geom1d_coordinate_spaces: models.Geom1DCoordinateSpace[];
    geom3d_coordinate_spaces: models.Geom3DCoordinateSpace[];
    all_terms: models.Term[];
    all_time_series: models.TimeSeries[];
    all_time_series_values: models.TimeStamped[];
    nextId: number;
}

let dbMap : Map<string, PeirceDb> = new Map();

export const getPeirceDb = (): PeirceDb => {
    const activePeirceFile = peirce.getActivePeirceFile();
    const annotationFile = getAnnotationFilePath();
    const rawdata = fs.readFileSync(annotationFile, 'utf8');
    let annotations : PeirceDb = JSON.parse('{"notes":[], "nextId":1, "time_coordinate_spaces":[], "geom1d_coordinate_spaces":[]}');
    if (activePeirceFile){
        annotations = JSON.parse(rawdata)[activePeirceFile];
        if (annotations == undefined){
            // if undefined, return an empty Peirce DB
            return {
                terms: [],
                constructors: [],
                time_coordinate_spaces: [],
                geom1d_coordinate_spaces: [],
                geom3d_coordinate_spaces: [],
                all_terms: [],
                all_time_series: [],
                all_time_series_values: [],
                nextId: 1
            };
        }
        annotations.terms = annotations.terms || [];
        annotations.constructors = annotations.constructors || [];
        annotations.time_coordinate_spaces = annotations.time_coordinate_spaces || [];
        annotations.geom1d_coordinate_spaces = annotations.geom1d_coordinate_spaces || [];
        annotations.geom3d_coordinate_spaces = annotations.geom3d_coordinate_spaces || [];
        annotations.all_terms = annotations.all_terms || [];
        annotations.all_time_series = annotations.all_time_series || [];
        annotations.all_time_series_values = annotations.all_time_series_values || [];
        //console.log('terms db: ')
        //console.log(annotations)
    }
    return annotations;
};

export const getAllTerms = (): models.Term[] => {
    return getPeirceDb().all_terms || [];
};


export const getTerms = (): models.Term[] => {
    return getPeirceDb().terms || [];
};

export const getConstructors = (): models.Constructor[] => {
    return getPeirceDb().constructors || [];
}

export const getTermFromId = (termId : string) : models.Term | null => {
    let terms = getTerms();
    let term_ret : models.Term | null = null
    terms.forEach(term_ => {
        if (term_.id.toString() == termId)
            term_ret = term_;
        else
            console.log(term_.id.toString() + " IS NOT " + termId)
    });

    return term_ret;
};

export const getConstructorFromId = (termId : string) : models.Constructor | null => {
    let cons = getConstructors();
    let cons_ret : models.Constructor | null = null
    cons.forEach(cons_ => {
        if (cons_.id.toString() == termId){
            cons_ret = cons_
        }
        else {
            console.log(cons_.id.toString() + " IS NOT " + termId)
        }
    });
    return cons_ret;
};


export const getFileTerms = (): models.Term[] => {
    let db = getPeirceDb();
    let new_terms : models.Term[] = [];
    const fileName = peirce.getActivePeirceFile();
    db.terms.forEach(term => {
        // Might be able to clean this up
        // Set the vscode.editor.selection position,
        // and let the prebuilt addTerm functions do the rest.
        if (term.fileName == fileName)
            new_terms.push(term);
    });
    return new_terms;
};

export const getTimeSeries = (): models.TimeSeries[] => {
    let db = getPeirceDb();
    return db.all_time_series;
};

export const deleteFilesTerms = (fileName : string | undefined): void => {
    let db = getPeirceDb();
    let new_terms : models.Term[] = [];
    db.terms.forEach(term => {
        console.log(term)
        // Might be able to clean this up
        // Set the vscode.editor.selection position,
        // and let the prebuilt addTerm functions do the rest.
        if (term.fileName != fileName)
            new_terms.push(term);
    });
    db.terms = new_terms;
    // delete all constructors and spaces in a very hacky way
    db.constructors = [];
    db.geom1d_coordinate_spaces = [];
    db.geom3d_coordinate_spaces = [];
    db.time_coordinate_spaces = [];
    saveDb(db);
    return;
};

export const resetAllTerms = (fileName : string | undefined): void => {
    let db = getPeirceDb();
    let new_terms : models.Term[] = [];
    /*db.all_terms.forEach(term => {
        console.log(term)
        if (term.fileName != fileName)
            new_terms.push(term);
    });*/
    db.all_terms = new_terms;
    saveDb(db);
    return;
};

export const getTimeSpaces = (): models.TimeCoordinateSpace[] => {
    return getPeirceDb().time_coordinate_spaces;
};

export const getGeom1DSpaces = () : models.Geom1DCoordinateSpace[] => {
    return getPeirceDb().geom1d_coordinate_spaces;
};

export const getGeom3DSpaces = () : models.Geom3DCoordinateSpace[] => {
    return getPeirceDb().geom3d_coordinate_spaces;
};

export const getNextId = (): number => {
    return getPeirceDb().nextId;
};

export const getTermIndex = (term : models.Term) :number => {
    let terms = getPeirceDb().terms;
    for(let i = 0;i<terms.length;i++)
        if(terms[i].id == term.id)
            return i
    return -1
};

export const getConstructorIndex = (cons : models.Constructor) :number => {
    let constructors = getPeirceDb().constructors;
    for(let i = 0;i<constructors.length;i++)
        if(constructors[i].id == cons.id)
            return i
    return -1
};


export const saveDb = (db: PeirceDb) => {
    console.log('save this db...')
    console.log(db)
    // const data = JSON.stringify(db);
    const activeFile = peirce.getActivePeirceFile();
    if (activeFile){
        let rawdata = fs.readFileSync(getAnnotationFilePath(), 'utf-8');
        let data = JSON.parse(rawdata);
        data[activeFile] = db;
        console.log("NEW DATA");
        console.log(data);
        fs.writeFileSync(getAnnotationFilePath(), JSON.stringify(data));
    }else {
        console.log("No active Peirce file, something's wrong...");
    }
    console.log('refreshing...')
    vscode.commands.executeCommand('code-annotation.refreshEntry');
};

export const saveTerms = (terms: models.Term[]) => {
    let db = getPeirceDb();

    // Replace terms by the one passed
    db.terms = terms;

    // Save Db in JSON file
    saveDb(db);
};

export const saveAllTerms = (terms: models.Term[]) => {
    let db = getPeirceDb();

    // Replace terms by the one passed
    db.all_terms = terms;

    // Save Db in JSON file
    saveDb(db);
};

export const saveConstructors = (cons : models.Constructor[]) => {
    let db = getPeirceDb();
    db.constructors = cons;
    saveDb(db);
};

export const saveTerm = (term : models.Term) => {
    let db = getPeirceDb();
    let index = getTermIndex(term)
    db.terms[index] = term
    saveTerms(db.terms)
}

export const saveConstructor = (cons : models.Constructor) => {
    let db = getPeirceDb();
    let index = getConstructorIndex(cons)
    db.constructors[index] = cons
    saveConstructors(db.constructors)
}

const createTerm = (annotationText: string, fromSelection: boolean) => {
    const nextId = getNextId();

    let codeSnippet = '';
    let fileName = '';
    let selection;
    let positionStart: models.Position = {line: 0, character: 0};
    let positionEnd: models.Position = {line: 0, character: 0};

    const editor = vscode.window.activeTextEditor;
    if (fromSelection && editor) {
        fileName = editor.document.uri.fsPath;
        selection = editor.selection;
        if (selection) {
            codeSnippet = editor.document.getText(selection);
            positionStart = { line: selection.start.line, character: selection.start.character };
            positionEnd = { line: selection.end.line, character: selection.end.character };
        }
    }
    const term: models.Term = {
        fileName: fileName,
        fileLine: selection ? selection.start.line : 0,
        positionStart: positionStart,
        positionEnd: positionEnd,
        text: annotationText,
        codeSnippet: codeSnippet,
        status: 'pending',
        id: nextId,
        interpretation: null,
        name: "",
        error: "Not checked",
        node_type: "Unknown"
    };
    return term;
};

const createPeirceTerm = (annotationText: string, node_type: string, error: string, editor : vscode.TextEditor, range : vscode.Range, name: string) => {
    const nextId = getNextId();

    let codeSnippet = '';
    let fileName = '';
    let positionStart: models.Position = {line: 0, character: 0};
    let positionEnd: models.Position = {line: 0, character: 0};
    fileName = editor.document.uri.fsPath;
    console.log(range);
    console.log("Code snippet:")
    codeSnippet = editor.document.getText(range);
    console.log(codeSnippet);
    positionStart = { line: range.start.line, character: range.start.character };
    positionEnd = { line: range.end.line, character: range.end.character };
    const term: models.Term = {
        fileName: fileName,
        fileLine: range.start.line,
        positionStart: positionStart,
        positionEnd: positionEnd,
        text: annotationText,
        codeSnippet: codeSnippet,
        name: name,
        status: 'pending',
        id: nextId,
        interpretation: null,
        error: error,
        node_type: node_type,
    };
    return term;
};

const createPeirceConstructor = (annotationText: string, node_type: string, name: string, editor : vscode.TextEditor) => {
    
    const nextId = getNextId();

    let fileName = peirce.getActivePeirceFile();
    if (!fileName){
        fileName = '';
    }
    // fileName = editor.document.uri.fsPath;
    const cons: models.Constructor = {
        name : name,
        fileName: fileName,
        //text: annotationText,
        status: 'pending',
        id: nextId,
        interpretation: null,
        //error: "Not checked",
        node_type: node_type,
    };
    return cons;
};

const createTermFromSelection = (annotationText: string) => {
    return createTerm(annotationText, true);
};

const createPlainTerm = (annotationText: string) => {
    return createTerm(annotationText, false);
};

const addTermToDb = (term: models.Term) => {
    let db = getPeirceDb();

    db.terms.push(term);
    db.nextId++;

    saveDb(db);
    vscode.window.showInformationMessage('Annotation saved!');
};

const addAllTermToDb = (term: models.Term) => {
    let db = getPeirceDb();

    db.all_terms.push(term);

    saveDb(db);
};

const getTODOFromSelectedText = (): string | undefined => {
    const editor = vscode.window.activeTextEditor;
    const selectedText = editor?.selection ? editor.document.getText(editor.selection) : '';
    const todoSelector = /\/\/\s*(TODO|FIX):\s*(.*)/;
    let matchArray = selectedText.match(todoSelector);
    if (matchArray && matchArray.length) {
        return matchArray[2];
    }
    for (const custom of getConfiguration().customTODO) {
        try {
            const customMatch = selectedText.match(custom);
            if (customMatch && customMatch.length) {
                // Use the second group to be consistent with the standard regex above
                if (!customMatch[2]) {
                    vscode.window.showWarningMessage(`Custom TODO RegEx (${custom}) doesn't have atleast two capture groups`);
                } else {
                    return customMatch[2];
                }
            }
        } catch (e) {
            vscode.window.showErrorMessage(`Error checking custom regex '${custom}': ${e.toString()}`);
            continue;
        }
    }
    return undefined;
};

/*
don't need this!
export const addTerm = async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const todoText = getTODOFromSelectedText();
        let annotationText = await vscode.window.showInputBox({ placeHolder: 'Give the annotation some text...', value: todoText === undefined? "" : todoText });
        if (annotationText) {
            addTermToDb(createTermFromSelection(annotationText));
        }
    }
    setDecorations();
};
*/

const addConstructorToDb = (cons : models.Constructor) => {
    let db = getPeirceDb();
    db.constructors = db.constructors || [];
    db.constructors.push(cons);
    db.nextId++;
    saveDb(db)
    vscode.window.showInformationMessage('Annotation saved!');
}

const addTimeSeriesToDb = (ts: models.TimeSeries) => {
    let db = getPeirceDb();
    db.all_time_series = db.all_time_series || [];
    db.all_time_series.push(ts);
    db.nextId++;
    saveDb(db)
    vscode.window.showInformationMessage('Annotation saved!');
}


export const addPeirceTerm = async (annotationText : string, type : string, error : string, editor : vscode.TextEditor, range : vscode.Range, name: string) => {
    if (editor) {
        addTermToDb(createPeirceTerm(annotationText, type, error, editor, range, name))
    }
    setDecorations();
};

export const addPeirceAllTerm = async (annotationText : string, type : string, error : string, editor : vscode.TextEditor, range : vscode.Range) => {
    if (editor) {
        addAllTermToDb(createPeirceTerm(annotationText, type, error, editor, range,""))
    }
    setDecorations();
};

export const addPeirceConstructor = async (annotationText : string, type : string, name: string, editor : vscode.TextEditor) => {
    if(editor) {
        console.log('adding peirce constructor..')
        console.log(annotationText)
        console.log(type)
        console.log(name)
        addConstructorToDb(createPeirceConstructor(annotationText, type, name, editor));
    }
    setDecorations();
};

/*
don't need this!
export const addPlainTerm = async () => {
    const annotationText = await vscode.window.showInputBox({ placeHolder: 'Give the annotation some text...' });
    if (annotationText) {
        addTermToDb(createPlainTerm(annotationText));
    }
};*/