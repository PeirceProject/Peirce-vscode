import fetch from 'node-fetch';
import * as vscode from 'vscode';

import peircedb = require('./peircedb')

import models = require('./models');

import { setDecorations } from
 './decoration/decoration'
import { time } from 'console';
import { resourceUsage } from 'process';
import { TermItem } from './peirce-tree';
import { getAnnotationFilePath } from './configuration';

interface APIPosition {
    line: number;
    character: number;
}
// attempting to manage global state lol
let activePeirceFile : string | undefined = '';

export const getActivePeirceFile = () : string | undefined => {
    return activePeirceFile;
}

export const setActivePeircefile = ( newFile : string | undefined) : void => {
    activePeirceFile = newFile;
}
interface APICoordinates {
    begin: APIPosition;
    end: APIPosition;
}
export interface PopulateAPIData{
    coords : APICoordinates;
    interp: string;
    node_type: string;
    error: string;
    name: string;
}

export interface PopulateAPIConstructorData{
    interp: string;
    type: string;
    name: string;
}
export interface PopulateAPIReponse {
    data:PopulateAPIData[];
    cdata:PopulateAPIConstructorData[];
    adata:PopulateAPIData[];
}

// merges all terms and spaces from a file into a singular list of type (Term : Space)[]
// technically this could be done in linear time if we notice that this is too slow, but I don't think that there
// are any issues with non-extreme use cases
const mergeSpaces = (): models.Space[] =>{
    let geom3d = peircedb.getGeom3DSpaces();
    let geom1d = peircedb.getGeom1DSpaces();
    let time = peircedb.getTimeSpaces();
    let res : models.Space[] = [];

    console.log(geom3d);
    console.log(geom1d);
    console.log(time);
    geom1d.forEach(element =>{
        res.push(element);   
    });
    geom3d.forEach(element => {
        res.push(element);   
    });
    time.forEach(element => {
        res.push(element);   
    });

    // sort each space by the order created
    res.sort((a, b) => {
        if (a.order_created > b.order_created){
            return 1;
        }else{
            return -1;
        }
    });

    return res;
}
// returns a list of all Constructors and Terms associated with the current file sorted by order created
// those items w/ no interp are relegated to end of list
const mergeConstructorsAndTerms = () : (models.Constructor | models.Term)[] => {
    let preDb = peircedb.getPeirceDb();
    peircedb.saveDb(preDb);
    let constructors = peircedb.getConstructors();
    let terms = peircedb.getTerms();
    let res : (models.Constructor | models.Term)[] = [];
    // add everything to the empty res array
    constructors.forEach(element => {
        res.push(element);   
    });
    terms.forEach(element => {
        res.push(element);   
    });
    // sort interps by the order_created, sorting terms w/ null @ end of arr
    res.sort((a, b) => {
        // if a has no interp sort b first
        if (!a.interpretation){
            return 1;
        // if b has no interp and a does, sort a first
        }else if (!b.interpretation){
            return -1;
        // otherwise, compare the two and see which was created first
        }else{
            if (a.interpretation.order_created > b.interpretation.order_created){
                return 1;
            }else{
                return -1;
            }
        }
    })
    return res;
}

const addSpaceRequest = async (space_:models.Space) : Promise<boolean> => {
    console.log('sending space')
    let request = {
        space:space_
    }
    console.log('SENDING CREATE SPACE REQUEST')
    console.log(request)
    console.log(JSON.stringify(request));
    let login = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        credentials: "include",
    };
    const apiUrl = "http://0.0.0.0:8080/api/createSpace";
    const response = await fetch(apiUrl, login);
    console.log('response??')
    console.log(response)
    const data : models.SuccessResponse = await response.json();
    console.log('returning...')
    console.log(data.success);
    return data.success;
    
}

const addConstructorInterpretationRequest = async (cons: models.Constructor) : Promise <boolean> => {
    console.log('sending cons')
    let request = {
        constructor:cons
    }
    console.log('SENDING CONS INTERP REQUEST')
    console.log(request)
    console.log(JSON.stringify(request));
    let login = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        credentials: "include",
    };
    const apiUrl = "http://0.0.0.0:8080/api/createConstructorInterpretation";
    const response = await fetch(apiUrl, login);
    console.log(response)
    const data : models.SuccessResponse = await response.json();
    return data.success

};

const addTermInterpretationRequest = async (term: models.Term) : Promise <boolean> => {
    console.log('sending term')
    let request = {
        term:term
    }
    console.log('SENDING TERM INTERP REQUEST')
    console.log(request)
    console.log(JSON.stringify(request));
    let login = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        credentials: "include",
    };
    const apiUrl = "http://0.0.0.0:8080/api/createTermInterpretation";
    const response = await fetch(apiUrl, login);
    console.log("This is the response from the addInterpRequestCall");
    console.log(response)
    const data : models.SuccessResponse = await response.json();
    console.log(data);
    return data.success

};
// user-defined typeguard to determine whether or not an object is a term
function isTerm(obj: models.Constructor | models.Term): obj is models.Term{
    return (obj as models.Term).fileLine !== undefined;
}

export const restore = async (): Promise<void> => {
    console.log("RESTORE CALLED");
    console.log(getAnnotationFilePath());
    let origFile = getActivePeirceFile();
    let newFile = vscode.window.activeTextEditor?.document.fileName;
    setActivePeircefile(newFile);
    console.log(peircedb.getPeirceDb());
    if (vscode.window.activeTextEditor) {
        console.log("The open text file:")
        console.log(vscode.window.activeTextEditor.document)
        //console.log(vscode.window.activeTextEditor.document.getText())
    }
    let editor = vscode.window.activeTextEditor;
    if (editor === undefined)
        return;
    const fileText = vscode.window.activeTextEditor?.document.getText();
    const fileName = vscode.window.activeTextEditor?.document.fileName;
    for(let i = 0;i<10;i++)
        console.log('PRINT FILE NAME')
        console.log(fileName);
    let terms = peircedb.getTerms();
    //console.log(terms);
    //console.log(JSON.stringify(terms));
    //console.log(fileText);
    //console.log(JSON.stringify(fileText));
    let request = {
        fileName: fileName,
        file: fileText,
        terms: terms,
    }
    //console.log(JSON.stringify(request));
    let login = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        credentials: "include",
    };
    const apiUrl = "http://0.0.0.0:8080/api/getState";
    const response = await fetch(apiUrl, login);
    const respdata : PopulateAPIReponse = await response.json();
    console.log('RESP DATA')
    console.log(response)
    let data = respdata.data;
    let cdata = respdata.cdata;
    let adata = respdata.adata;
    console.log('ptingint data')
    console.log(data);
    console.log('printing cdata')
    console.log(cdata)
    let termsSummary = JSON.stringify(data); 
    let mergedSpaces = mergeSpaces();
    let mergedConsTerms = mergeConstructorsAndTerms();
    console.log("MERGEDSPACES");
    console.log(mergedSpaces);
    console.log(mergedSpaces.length);
    console.log("MERGEDCONSTERMS");
    console.log(mergedConsTerms.length);
    console.log(mergedConsTerms);
    // peircedb.deleteFilesTerms(fileName);
    peircedb.resetAllTerms(fileName);
    // to fix this, we need to have a well-defined JSON response object
    // and change data : any -> data : well-defined-object[]
    
    // now that that's done, all we need to do is go until there are no new things to make API calls for XD
    // sorry for all of the nesting conditionals, there's probably cleaner ways to do this, but it gets the job done
    let resp : any = null;
    if (origFile !== newFile){
        // yes i realize that some of this logic may be repetitive but it's working (hopefully) and can be made less bad in the future
        while (mergedSpaces.length > 0 || mergedConsTerms.length > 0){
            // if the length of the mergedSpaces list is 0 and there is an interp saved in the first ele in mergedConsTerms, make Cons/Term call
            if (mergedSpaces.length == 0){
                // make the necessary calls for mergedConsTerms
                if (mergedConsTerms[0].interpretation){
                    console.log("An interpretation exists here, making an API call");
                    console.log("Making request for the following term/constructor");
                    console.log(mergedConsTerms[0]);
                    console.log(`Is this an instance of Term? ${isTerm(mergedConsTerms[0])}`);
                    // make the appropriate constructor or term request
                    if (isTerm(mergedConsTerms[0])){
                        resp = await addTermInterpretationRequest(mergedConsTerms[0]);
                    }else{
                        resp = await addConstructorInterpretationRequest(mergedConsTerms[0]);
                    }
                    mergedConsTerms.shift();
                }else{
                    console.log("No interp found, removing all from mergedConsTerms");
                    while (mergedConsTerms.length > 0){
                        mergedConsTerms.shift();
                    }
                }
            }else if (mergedConsTerms.length == 0){
                // make the necessary calls for mergedSpaces
                console.log("Making request for the following space: ");
                console.log(mergedSpaces[0]);
                resp = await addSpaceRequest(mergedSpaces[0]);
                mergedSpaces.shift();
            }else{
                if (!mergedConsTerms[0].interpretation){
                    // make necessary calls for mergedSpaces b/c there are no more order dependent things in mergedConsTerms
                    console.log("Making request for the follwing space: ");
                    console.log(mergedSpaces[0]);
                    resp = await addSpaceRequest(mergedSpaces[0]);
                    mergedSpaces.shift();
                    // delete the remaining terms in mergedConsTerms since there are none with interps left
                    while (mergedConsTerms.length > 0){

                        mergedConsTerms.shift();
                    }
                }else{
                    if (mergedSpaces[0].order_created < mergedConsTerms[0].interpretation.order_created){
                        // make necessary calls for mergedSpaces
                        console.log("Making request for the follwing space: ");
                        console.log(mergedSpaces[0]);
                        resp = await addSpaceRequest(mergedSpaces[0]);
                        mergedSpaces.shift();
                    }else{
                        // make necessary calls for mergedConsTerms
                        console.log("Making request for the following term/constructor");
                        console.log(mergedConsTerms[0]);
                        if (isTerm(mergedConsTerms[0])){
                            resp = await addTermInterpretationRequest(mergedConsTerms[0]);
                        }else{
                            resp = await addConstructorInterpretationRequest(mergedConsTerms[0]);
                        }
                        mergedConsTerms.shift();
                    }
                }
            }
            console.log("resp for this iteration:");
            console.log(resp);
        }
    }
    // determine whether or not we need to create anything new and if we do add it lol
    // do init. pop. of term and constructor maps
    let currTerms = peircedb.getFileTerms();
    let currCons = peircedb.getConstructors();
    let termMap : Map<string, number>= new Map();
    let consMap : Map<string, number> = new Map();
    currTerms.forEach(element => {
        let key : string = '';
        key += element.positionStart.character.toString() + " ";
        key += element.positionStart.line.toString() + " ";
        key += element.positionEnd.character.toString() + " ";
        key += element.positionEnd.line.toString();
        termMap.set(key, 0);
    });
    /*
    This piece probably needs to be done in a better way s.t.
    we are more uniquely identifying it by something other than
    its name, but the state doesn't currently exist and I don't have
    time so as such it will remain.
    */
    currCons.forEach(element => {
        let key = element.name;
        consMap.set(key, 0);
    });

    // currCons.forEach(element => )
    // make the appropriate new terms and constructors
    console.log('entering data loop')
    data.forEach(element => {
        let s : string = element.coords.begin.character.toString()+ " ";
        s += element.coords.begin.line.toString() + " ";
        s += element.coords.end.character.toString() + " ";
        s += element.coords.end.line.toString();
        if (!(termMap.get(s) == 0)){;
            console.log(element.coords.begin.line+','+element.coords.end.line)
            let range = new vscode.Range(
                new vscode.Position(element.coords.begin.line, element.coords.begin.character), 
                new vscode.Position(element.coords.end.line, element.coords.end.character), 
            );
            // Might be able to clean this up
            // Set the vscode.editor.selection position,
            const defaultInterp = "No interpretation provided";
            if (editor)
                // peircedb.addPeirceTerm(element.interp, element.node_type, element.error, editor, range);

                // this might not be the best way to clear checked interps on repop, but it's the best I could figure out
                // the previous way we were adding is left in in case we find bugs/it's better to have it the other way for
                // future functionality
                peircedb.addPeirceTerm(defaultInterp, element.node_type, element.error, editor, range, element.name);
        }
    });
    cdata.forEach(element => {
        let s = element.name;
        if (!(consMap.get(s) == 0)){

            if (editor)
                peircedb.addPeirceConstructor(element.interp, element.type, element.name, editor);
        }
    });

    console.log('ADATA!!!')
    console.log(adata)
    console.log('ok well?')
    
    adata.forEach(element => {
        console.log('adata??')
        console.log(element)
        console.log(element.coords.begin.line+','+element.coords.end.line)
        if(element.coords.begin.line > 0 && element.coords.begin.character > 0 
            && element.coords.end.line > 0 && element.coords.end.character > 0){
            let range = new vscode.Range(
                new vscode.Position(element.coords.begin.line, element.coords.begin.character), 
                new vscode.Position(element.coords.end.line, element.coords.end.character), 
            );
            // Might be able to clean this up
            // Set the vscode.editor.selection position,
            const defaultInterp = "No interpretation provided";
            if (editor){
                // peircedb.addPeirceTerm(element.interp, element.node_type, element.error, editor, range);

                // this might not be the best way to clear checked interps on repop, but it's the best I could figure out
                // the previous way we were adding is left in in case we find bugs/it's better to have it the other way for
                // future functionality
                console.log('adding peirce all term')
                peircedb.addPeirceAllTerm(defaultInterp, element.node_type, element.error, editor, range);
            }
        }
    });

    setDecorations();
    return;
};
export const populate = async (): Promise<void> => {
    console.log("POPULATE CALLED"); 
    console.log(getAnnotationFilePath());
    if (vscode.window.activeTextEditor) {
        console.log("The open text file:")
        console.log(vscode.window.activeTextEditor.document)
        //console.log(vscode.window.activeTextEditor.document.getText())
    }
    let editor = vscode.window.activeTextEditor;
    if (editor === undefined)
        return;
    const fileText = vscode.window.activeTextEditor?.document.getText();
    const fileName = vscode.window.activeTextEditor?.document.fileName;
    for(let i = 0;i<10;i++)
        console.log('PRINT FILE NAME')
        console.log(fileName);
    let terms = peircedb.getTerms();
    //console.log(terms);
    //console.log(JSON.stringify(terms));
    //console.log(fileText);
    //console.log(JSON.stringify(fileText));
    let request = {
        fileName: fileName,
        file: fileText,
        terms: terms,
    }
    //console.log(JSON.stringify(request));
    let login = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        credentials: "include",
    };
    const apiUrl = "http://0.0.0.0:8080/api/getState";
    const response = await fetch(apiUrl, login);
    const respdata : PopulateAPIReponse = await response.json();
    console.log('RESP DATA')
    console.log(response)
    let data = respdata.data;
    let cdata = respdata.cdata;
    let adata = respdata.adata;
    console.log('ptingint data')
    console.log(data);
    console.log('printing cdata')
    console.log(cdata)
    let termsSummary = JSON.stringify(data); 
    peircedb.deleteFilesTerms(fileName);
    peircedb.resetAllTerms(fileName);
    // to fix this, we need to have a well-defined JSON response object
    // and change data : any -> data : well-defined-object[]
    console.log('entering data loop')
    data.forEach(element => {
        console.log(element.coords.begin.line+','+element.coords.end.line)
        let range = new vscode.Range(
            new vscode.Position(element.coords.begin.line, element.coords.begin.character), 
            new vscode.Position(element.coords.end.line, element.coords.end.character), 
        );
        // Might be able to clean this up
        // Set the vscode.editor.selection position,
        const defaultInterp = "No interpretation provided";
        if (editor)
            // peircedb.addPeirceTerm(element.interp, element.node_type, element.error, editor, range);

            // this might not be the best way to clear checked interps on repop, but it's the best I could figure out
            // the previous way we were adding is left in in case we find bugs/it's better to have it the other way for
            // future functionality
            peircedb.addPeirceTerm(defaultInterp, element.node_type, element.error, editor, range, element.name);
    });

    console.log('ADATA!!!')
    console.log(adata)
    console.log('ok well?')
    
    adata.forEach(element => {
        console.log('adata??')
        console.log(element)
        console.log(element.coords.begin.line+','+element.coords.end.line)
        if(element.coords.begin.line > 0 && element.coords.begin.character > 0 
            && element.coords.end.line > 0 && element.coords.end.character > 0){
            let range = new vscode.Range(
                new vscode.Position(element.coords.begin.line, element.coords.begin.character), 
                new vscode.Position(element.coords.end.line, element.coords.end.character), 
            );
            // Might be able to clean this up
            // Set the vscode.editor.selection position,
            const defaultInterp = "No interpretation provided";
            if (editor){
                // peircedb.addPeirceTerm(element.interp, element.node_type, element.error, editor, range);

                // this might not be the best way to clear checked interps on repop, but it's the best I could figure out
                // the previous way we were adding is left in in case we find bugs/it's better to have it the other way for
                // future functionality
                console.log('adding peirce all term')
                peircedb.addPeirceAllTerm(defaultInterp, element.node_type, element.error, editor, range);
            }
        }
    });


    cdata.forEach(element => {
        if (editor)
            peircedb.addPeirceConstructor(element.interp, element.type, element.name, editor);
    });
    setDecorations();
    return;
};