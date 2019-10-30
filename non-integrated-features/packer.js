"use strict";

var example ="0000000BBB000B0B\n00B00000B0000000\nB00B000000000000\n00B0000000B00000\n0B000BB0000B0000\n00B00000000B000B\n000000000B000000\n00000000B000B000\n000000B000000000\n000000B0B0000000\n0000B0B000000000\n0000000B0000B00B\n00B000000B0000B0\n0B0000000000B000\n0000B00000000000\n0000B0B00000BBB0";

function packAreaDemo( idInput, idOutput) {
    let _inputE = document.getElementById( idInput );
    let _outputE = document.getElementById( idOutput );
    let _rawText = "";


    

    _rawText = packArea( _inputE.value.split('\n') ).join('\n');
    console.log( "Input length:" + _inputE.value.length + " Output length:" + _rawText.length );
    _outputE.value = _rawText;
}

function packArea( packedData ) {
    //let data = _inputE.value;
    //let packedData = data.split('\n');

    for( let i = 0; i < packedData.length; i++ ) {
        let _packedLine ="";
        let _count = 0;
        let _char = undefined;
        _char = packedData[i].charAt(0);

        for( let j = 0; j < packedData[i].length; j++ ) {
            if( packedData[i].charAt(j) != _char || j == packedData[i].length-1 ) {
                if( _count > 1 ) {
                    if( j == packedData[i].length-1 ) { //count last char
                        _count++;
                    }
                    _packedLine += _count.toString() + _char;
                } else {
                    _packedLine += _char;
                }
                _char = packedData[i].charAt(j);
                _count = 1;
            } else{
                _count++;
            }
            // if( _count == 9) {
            //     _packedLine += _count.toString() + _char;
            //     _char = packedData[i].charAt(j);
            //     _count = 1;
            // }

        }
        packedData[i] = _packedLine;
    }
    return packedData;
    
}

function generateContentTextbox( id ) {
    let _element = document.getElementById( id );
    _element.value = example;
}

function staticContentTextbox( id ) {
    let _element = document.getElementById( id );
    _element.value = example;
}