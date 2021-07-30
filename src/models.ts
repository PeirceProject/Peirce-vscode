import * as vscode from 'vscode';

export interface Position {
    line: number;
    character: number;
}

export interface SuccessResponse {
    success: boolean
}

export interface Term {
    fileName: string;
    fileLine: number;
    positionStart: Position;
    positionEnd: Position;
    text: string;
    codeSnippet: string;
    name: string; //this a temporary hack. also, populateapidata should not be a different object than term. this is a headache and then some
    status: 'pending' | 'done';
    id: number;
    interpretation: Interpretation | null;
    error : string | null;
    node_type: string;
}

export interface Constructor {
    fileName: string;
    id: number;
    name: string;
    interpretation: Interpretation | null;
    node_type: string;
    status: 'pending' | 'done';
}

export interface MeasurementSystem extends vscode.QuickPickItem{
    label: string;
}

export interface Space extends vscode.QuickPickItem {
    order_created: number;
    fileName: string;
}

export interface TimeCoordinateSpace extends Space {
    label: string; // interpX
    space: string; // Always "Classical Time Coordinate Space"
    parent: TimeCoordinateSpace | null;
    origin: number[] | null;
    basis: number[] | null;
}

export interface Geom1DCoordinateSpace extends Space {
    label: string; // interpX
    space: string; // Always "Classical Time Coordinate Space"
    parent: Geom1DCoordinateSpace | null;
    origin: number[] | null;
    basis: number[] | null;
}

export interface Geom3DCoordinateSpace extends Space {
    label: string; // interpX
    space: string; // Always "Classical Time Coordinate Space"
    parent: Geom3DCoordinateSpace | null;
    origin: number[] | null;
    basis: number[] | null;
}


export interface Interpretation extends vscode.QuickPickItem {
    label: string;
    name: string;
    interp_type: string;
    node_type: string;
    /*
    This represents the position in which the interpretation in question was created.
    E.g. A value of 6 means that this interpretation was created 6th. 
    */
    order_created : number;
}

export interface Duration extends Interpretation {
    value: number[];
    space: TimeCoordinateSpace;
}
export interface Time extends Interpretation {
    value: number[];
    space: TimeCoordinateSpace;
}
export interface Scalar extends Interpretation {
    value: number[];
}
export interface TimeTransform extends Interpretation {
    domain: TimeCoordinateSpace;
    codomain: TimeCoordinateSpace;
}
export interface Displacement1D extends Interpretation {
    value: number[];
    space: Geom1DCoordinateSpace;
}
export interface Position1D extends Interpretation {
    value: number[];
    space: Geom1DCoordinateSpace;
}
export interface Geom1DTransform extends Interpretation {
    domain: Geom1DCoordinateSpace;
    codomain: Geom1DCoordinateSpace;
}

export interface Displacement3D extends Interpretation {
    value: number[];
    space: Geom3DCoordinateSpace;
}
export interface Position3D extends Interpretation {
    value: number[];
    space: Geom3DCoordinateSpace;
}

export interface Orientation3D extends Interpretation {
    value: number[];
    space: Geom3DCoordinateSpace;
}

export interface Rotation3D extends Interpretation {
    value: number[];
    space: Geom3DCoordinateSpace;
}


export interface Pose3D extends Interpretation {
    value: number[];
    space: Geom3DCoordinateSpace;
}



export interface Geom3DTransform extends Interpretation {
    domain: Geom3DCoordinateSpace;
    codomain: Geom3DCoordinateSpace;
}

export interface TimeSeries extends Interpretation {
    time_space:TimeCoordinateSpace;
    values: Interpretation[];
}

export interface SeriesIndex extends Interpretation {
    time_series : TimeSeries;
    time_value : number | null;
}

export interface Pose3DTimeSeries extends TimeSeries {
    space:Geom3DCoordinateSpace;
}

export interface Geom3DTransformTimeSeries extends TimeSeries {
    domain:Geom3DCoordinateSpace;
    codomain:Geom3DCoordinateSpace;
}


export interface TimeStamped extends Interpretation {
    timestamp: Time
    value: Interpretation
    series_name: string | null
}

export interface TimeStampedPose3D extends TimeStamped {
    
}

export interface TimeStampedGeom3DTransform extends TimeStamped {

}
