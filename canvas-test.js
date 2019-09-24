var mouse={
    x: undefined,
    y: undefined
};

var cell={
    y: undefined,
    x: undefined
};



//Using currently string method instead of nested arrays

//var canvas = document.querySelector("canvas");
//canvas.width = window.innerWidth;
//canvas.height = window.innerHeight;



var canvas = document.getElementById("piirtoAlue");
var cellsize = 16;
var cols = 72;
var rows = 42;
var itemRatio = 16;
var itemCount = Math.floor( cols*rows*itemRatio /100);


//Trows= document.getElementById("formRows");
//Trows = document.getElementsByName("rows");
 
// if( document.getElementById("Trows") ) {
//     rows = document.getElementById("Trows").value;
// }
// if( document.getElementById("Trows") ) {
//     cols = document.getElementById("Tcols").value;
// }


//console.log(cols + "   " + rows );
//var options = document.getElementById("gameOptions");
//console.log(options);



// canvas.height = 400;
// canvas.width = 800;

// canvas.height = cellsize * rows;
// canvas.width = cellsize * cols;


var sisalto = canvas.getContext("2d");

//Images
var imgO = document.getElementById("orange"); //Not used
var imgB = document.getElementById("blue");     //Not used
var imgBfull = document.getElementById("fullblue"); //RENAME

var minetrackerId = document.getElementById("mineCount");
var timetrackerId = document.getElementById("timeElapsed");




var fullPicTilesX = 4;
var fullPicTilesY = 4;

const fieldNums = "0123456789ABCDEF";
const fieldChars = ".12345678#+*OX?P"; //+ hold down cell, O found mine that end game, X false flag ,- exploded earlier mine???


var field = []; //used for placing mines
var adjacency = []; //used for drawing canvas (current state)

var state = 0;

var timeStart = 0;
var flagCount = 0;
var explodedCount = 0;

var historyCelly = -1;
var historyCellx = -1;

//sisalto.fillRect( 100, 100, 100, 100);
// initField();
// drawCanvasField();

newGame();

sisalto.save();

//var _interval;

canvas.addEventListener("mousedown", mouseDown );
canvas.addEventListener("mouseup", mouseUp );
canvas.addEventListener("mousemove", mouseMove );
canvas.addEventListener("contextmenu", blockRMBMenu );
canvas.addEventListener("mouseleave", mouseLeave );
//paivitysdemo
//setInterval( refTest, 100 );



var checkThings = setInterval( updateUI, 250);

function refTest() {
    newGame();
}

function updateUI(){ //TODO Rename!
    if( flagCount == itemCount ) {
        //additional check that are those right
    }
    let mines = itemCount -(flagCount +explodedCount);
    let timeElapsed = 0;    //TODO needs to be global, for history tracking!
    if( timeStart != 0) timeElapsed = Math.floor( (Date.now() -timeStart)/1000);
    minetrackerId.innerHTML = mines;
    timetrackerId.innerHTML = timeElapsed;
    
}


function newGame() {

    if( document.getElementById("Trows") ) {
        rows = document.getElementById("Trows").value;
    }
    if( document.getElementById("Trows") ) {
        cols = document.getElementById("Tcols").value;
    }
    canvas.height = cellsize * rows;
    canvas.width = cellsize * cols;
    
    itemCount = Math.floor( cols*rows*itemRatio /100);
    
    initField();

    //STUFF BELOW SHOULD BE DONE AFTER INITIAL CLICK (SAFE START & TIMER RESET)
    placeMines();
    //adjacencyFull();

    ///DEBUG LOG
    for( y = 0; y < rows; y++ ) {
        console.log(field[y]);
    }

    clearInterval( checkThings );
    checkThings = setInterval( updateUI, 250);


    setTimeout( drawCanvasField, 10);   // fix for firefox refresh & blank canvas start


//    drawCanvasField();

    //game related variables
    flagCount = 0;
    explodedCount = 0;
    timeStart = Date.now();
    historyCelly = -1;
    historyCellx = -1;
}

function Cheat() {
    adjacencyFull();
    drawCanvasField();
}

function initField() {
    field = [];
    adjacency = [];
    for( y = 0; y < rows; y++ ){
        let _row = "";
        for( x = 0; x < cols; x++ ) {
            _row += "0";
            //_row += Math.floor( Math.random() * 2 ).toString();//FIXME set back to 2!
            //_row += Math.floor( Math.random() * 9 ).toString();//FIXME set back to 2!
        }
        field[y] = _row;
        //adjacency[y] = _row;
        adjacency[y] = "9".repeat( _row.length);
    }
}

function placeMines() {
    var minesLeft = itemCount;
    while( minesLeft > 0 ) {
        _xTry = Math.floor( Math.random() * cols );
        _yTry = Math.floor( Math.random() * rows );
        if( field[_yTry].charAt( _xTry ) == "0" ) {
            field[_yTry] = replaceAt( field[_yTry], _xTry, "B");
            minesLeft--;
        }
    }
}

function adjacencyFull() {
    for(let y = 0; y < rows; y++ ) {
        for(let x = 0; x < cols; x++ ) {
            //if( field[y].charAt( x ) == "0" ) {
            //}
            //console.log( adjacencyCell(y, x ));
            let _adj = adjacencyCell( y, x);
            if( _adj < 9 ) {
                adjacency[y] = replaceAt( adjacency[y], x, _adj.toString());
                //console.log( _adj );
            }
        }
    }
}

function adjacencyCell( y, x) {
    let _adjCount = 0;

    for( let cy = -1; cy < 2; cy++) {
        for( let cx = -1; cx < 2; cx++) {
            if( field[y].charAt( x ) == "B") {  //KABOOM
                _adjCount = "C";                
            } else if( y+cy >=0 && y+cy < rows) { //toimiva mutta, ehkä vähän vaikea lukuinen
                if( x+cx >=0 && x+cx < cols ) {
                    //if( grid[ y+cy, x+cx] ) _adjCount++;
                    if( field[ y+cy].charAt( x+cx) == "B") _adjCount++;
                }
            } 
        }
    }
    return _adjCount;
}


function clickCell( y, x ) {
    let _value = adjacency[y].charAt(x);
    if( _value=="9" || _value=="A" ) {
        var _adj = adjacencyCell( y, x);
        //console.log( "ADJ:"+_adj );
        adjacency[y] = replaceAt( adjacency[y], x, _adj.toString());
        drawCanvasCell( y, x);
        if( _adj == 0 ) { //when finding empty continue opening path until finding cell that touches mine (has number)
            for( let cy = -1; cy < 2; cy++) {
                for( let cx = -1; cx < 2; cx++) {
                    if( y+cy >=0 && y+cy < rows) { //toimiva mutta, ehkä vähän vaikea lukuinen
                        if( x+cx >=0 && x+cx < cols ) {
                            clickCell( y+cy, x+cx );
                        }
                    }
                }
            }
        } else if( _adj == "C") {  //Actual bomb action
            explodedCount++;
            console.log(explodedCount);
        }
    }
}

function revealAround( y, x) {
    //Different from C# version, own flag function available, and test is made out of this function!
    for( let cy = -1; cy < 2; cy++) {
        for( let cx = -1; cx < 2; cx++) {
            if( y+cy >=0 && y+cy < rows) { //toimiva mutta, ehkä vähän vaikea lukuinen
                if( x+cx >=0 && x+cx < cols ) {
                    let cellValue = adjacency[y+cy].charAt(x+cx);
                    //console.log( "ADJ:"+_adj );
                    if( cellValue == "9") {
                        //console.log("FOUND SOMETHING");
                        clickCell( y+cy, x+cx);
                        // let _adj = adjacencyCell( y+cy, x+cx );
                        // adjacency[y+cy] = replaceAt( adjacency[y+cy], x+cx, _adj.toString());
                        // drawCanvasCell( y+cy, x+cx);
                    } console.log( cellValue );
                }
            }
        }
    }
}

function flagCell( y , x ) {
    let cellValue = adjacency[y].charAt(x);
    if( cellValue == "9" ) {
        //console.log("9->F");
        adjacency[y] = replaceAt( adjacency[y], x, "F"); //FIXME Hardcoded value
        flagCount++;
    } else if( cellValue == "F") {
        //console.log("F->9");
        adjacency[y] = replaceAt( adjacency[y], x, "9"); //FIXME Hardcoded value
        flagCount--;
    }
    drawCanvasCell( y, x);
}

function countFlags( y, x) {
    let _flagCount = 0;
    console.log( "y:" + y + " x:" +x);
    for( let cy = -1; cy < 2; cy++) {
        for( let cx = -1; cx < 2; cx++) {
            if( y+cy >=0 && y+cy < rows) { //toimiva mutta, ehkä vähän vaikea lukuinen
                if( x+cx >=0 && x+cx < cols ) {
                    //if( grid[ y+cy, x+cx] ) _adjCount++;
                    if( adjacency[ y+cy].charAt( x+cx) == "F") _flagCount++;
                }                
            } 
        }
    }
    return _flagCount;
}

function holdCell( y, x ) {
    let cellValue = adjacency[y].charAt(x);
    if( cellValue == "9" ) {
        adjacency[y] = replaceAt( adjacency[y], x, "A"); //FIXME Hardcoded value
    }
}

function releaseCell( y, x) {
    console.log( "RELEASE @ " + y + " x " + x );
    let cellValue = adjacency[y].charAt(x);
    if( cellValue == "A" ) {
        adjacency[y] = replaceAt( adjacency[y], x, "9"); //FIXME Hardcoded value
    }
}

function drawCanvasCell( y, x ) {
    let _row = adjacency[y]; 
    let _char = _row.charAt( x );
    let _num = Number(_char);

    if( _num <= 9) { 
        //empty, numbered and unrevealed tile find from file and draw
        let _tx = _num % fullPicTilesX;
        let _ty = Math.floor(_num/fullPicTilesX);
        sisalto.drawImage( imgBfull, _tx*cellsize, _ty*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize);
    } else {
        switch( _char ) {
            //other tiles (bomb, flag...)
            //TODO Structure this properly
            case "A":
                sisalto.drawImage( imgBfull, 2*cellsize, 2*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
            case "B":
                sisalto.drawImage( imgBfull, 3*cellsize, 2*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
            case "C":
                sisalto.drawImage( imgBfull, 0*cellsize, 3*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
            case "F":
            default:
                sisalto.drawImage( imgBfull, 3*cellsize, 3*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
        }
    }
}

function drawCanvasField() {
    for( y = 0; y < rows; y++ ){
        //let _row = field[y];
        //let _row = adjacency[y];  //OFF NOW

        for( x = 0; x < cols; x++ ) {
            drawCanvasCell( y, x);
            console.log(y + " " + x + " draw");
        }
    }
}

function blockRMBMenu() {
    if( event.button == 2) {
        event.preventDefault();
        event.stopPropagation();    //https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation
    }
}
function replaceAt( _string, location, character ) {
    let len = _string.length;
    location++; //using this that index 0 is first and start wont flip whole string
   
    _string = _string.slice( 0, location-1  ) + character + _string.slice( location);
    return _string;
}

function mouseLeave() { //TODO add some time based thing how long mouse need to be out of element before it resets state, makes playing much nicer when user errors are allowed!
    if( state != 0 ) {
        state = 0;
        releaseCell( historyCelly, historyCellx);
        drawCanvasCell( historyCelly, historyCellx);
        historyCelly = -1;
        historyCellx = -1;
        console.log("STATE RESET!");
    }
}

function mouseDown(event) {

    if( (  state & 1 ) == 0 && event.button == 0 ) {
        //DUPLICATE CODE WITH mouseMove()
        var cell = getCellPos( canvas, event );

        if( !(cell.y == historyCelly && cell.x == historyCellx) ) {
            if( historyCelly>=0 && historyCellx >= 0 ) {
                releaseCell( historyCelly, historyCellx);
                drawCanvasCell( historyCelly, historyCellx);
            }
            holdCell( cell.y, cell.x );
            drawCanvasCell( cell.y, cell.x);
            historyCelly = cell.y;
            historyCellx = cell.x;
        }
        //DUPLICATE END
        console.log("SET ON!");
        state |= 1;
    }

    if( (  state & 2 ) == 0 && event.button == 2 ) {
        //DUPLICATE CODE WITH mouseMove()
        var cell = getCellPos( canvas, event );

        // if( !(cell.y == historyCelly && cell.x == historyCellx) ) {
        //     if( historyCelly>=0 && historyCellx >= 0 ) {
        //         releaseCell( historyCelly, historyCellx);
        //         drawCanvasCell( historyCelly, historyCellx);
        //     }
        //     holdCell( cell.y, cell.x );
        //     drawCanvasCell( cell.y, cell.x);
        //     historyCelly = cell.y;
        //     historyCellx = cell.x;
        // }
        //DUPLICATE END
        console.log("SET ON!");
        state |= 2;
    }
    console.log( state );
}

function mouseMove( event ) {
    if( state == 1 ) {
        //DUPLICATE CODE WITH mouseMove()
        var cell = getCellPos( canvas, event );

        if( !(cell.y == historyCelly && cell.x == historyCellx) ) {
            if( historyCelly>=0 && historyCellx >= 0 ) {
                releaseCell( historyCelly, historyCellx);
                drawCanvasCell( historyCelly, historyCellx);
            }
            holdCell( cell.y, cell.x );
            drawCanvasCell( cell.y, cell.x);
            historyCelly = cell.y;
            historyCellx = cell.x;
        }
        //DUPLICATE END
    } else if(state==3) {
        //AREA HOLD HERE, (ONLY VISUAL)
    }
}

function mouseUp(event) {

    var cell = getCellPos( canvas, event );

    if( event.button == 0 && state == 3) {
        let _value = adjacencyCell( cell.y, cell.x);
        state &= ~1;
        if( _value > 0 && _value < 9 ) {

            //STRUCTURE
            //value == flags around (and revealed bombs) & there is unrevealed cells, then do this
            console.log("SWEEPS "+_value +" " + countFlags(cell.y, cell.x));
            if( _value == countFlags(cell.y, cell.x) ) {
                console.log("SWEEPL "+_value +" " + countFlags(cell.y, cell.x));
                revealAround( cell.y, cell.x);
                console.log("SWEEPA "+_value +" " + countFlags(cell.y, cell.x));
            }
            console.log("SWEEPE "+_value +" " + countFlags(cell.y, cell.x));
        }

    } else if(state == 1 &&  event.button == 0 && event.button != 2) {

        clickCell( cell.y, cell.x);
        console.log("LMB");
        state &= ~1;

    }
    
    if( event.button == 2) {
        state &= ~2;
        flagCell( cell.y, cell.x );
        console.log("RESET RMB STATE + TRY FLAG " + state);
    }
}

function getCellPos( canvas, event) {
    var pos = getMousePos(canvas, event)
    mouse.x = pos.x,
    mouse.y = pos.y;


    celly = Math.floor( mouse.y / cellsize);
    cellx = Math.floor( mouse.x / cellsize);

    if( celly >= rows) celly = rows-1;
    if( cellx >= cols) cellx = cols-1;
    return{
        y: celly,
        x: cellx
    };
}

function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
}

