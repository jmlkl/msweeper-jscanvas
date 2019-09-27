var mouse={
    x: undefined,
    y: undefined
};

function cell() {
    this.y = undefined;
    this.x = undefined;
    this.tell = function() {
        return "x:"+this.x +" y:" + this.y;
    };
    this.release = function() {
        releaseCell( this.y, this.x );
        //console.log("Trying method way!");
    }
};


var canvas = document.getElementById("piirtoAlue");
var cellsize = 16;
var cols = 72;
var rows = 42;
var itemRatio = 16;
var itemCount = Math.floor( cols*rows*itemRatio /100);


var sisalto = canvas.getContext("2d");

//Images
// var imgO = document.getElementById("orange"); //Not used
// var imgB = document.getElementById("blue");     //Not used
var imgFull = document.getElementById("fullimage"); //RENAME

var minetrackerId = document.getElementById("mineCount");
var timetrackerId = document.getElementById("timeElapsed");
var logsId = document.getElementById("history");



var fullPicTilesX = 4;
var fullPicTilesY = 4;

const fieldNums = "0123456789ABCDEF";
const fieldChars = ".12345678#+*OX?P"; //+ hold down cell, O found mine that end game, X false flag ,- exploded earlier mine???

//0123456789ABCDEF
//GHIJKLMNOPQRSTUV
//XYZ

var field = []; //used for placing mines
var adjacency = []; //used for drawing canvas (current state)

var state = 0;
var holdDown = [];

var timeStart = 0;
var flagCount = 0;
var explodedCount = 0;

newGame();

sisalto.save();



canvas.addEventListener("mousedown", mouseDown );
canvas.addEventListener("mouseup", mouseUp );
canvas.addEventListener("mousemove", mouseMove );
canvas.addEventListener("contextmenu", blockRMBMenu );
canvas.addEventListener("mouseleave", mouseLeave );
//canvas.addEventListener("mouseleave", blur );   //addd for testing


var checkThings = setInterval( updateUI, 250);

function updateUI(){
    if( flagCount == itemCount ) {
        //additional check that are those right
    }
    let mines = "Mines left:" + (itemCount -(flagCount +explodedCount)) + " Exploded:" + explodedCount;
    let timeElapsed = 0;    //TODO needs to be global, for history tracking!

    let _teksti = "State:" +state+ "<br>";
    
    for( i = 0; i<holdDown.length ;i++ ) {
        _teksti += holdDown[i].tell()  + "<br>";
    }

    if( timeStart != 0) timeElapsed = Math.floor( (Date.now() -timeStart)/1000);
    minetrackerId.innerHTML = mines;
    timetrackerId.innerHTML = " Time: " + timeElapsed;
    logsId.innerHTML = _teksti;
    
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

    ///DEBUG (SHOW MINE LOCATIONS)
    // for( y = 0; y < rows; y++ ) {
    //     console.log(field[y]);
    // }

    clearInterval( checkThings );
    checkThings = setInterval( updateUI, 250);


    setTimeout( drawCanvasField, 10);   // fix for firefox refresh & blank canvas start


    //game related variables
    flagCount = 0;
    explodedCount = 0;
    timeStart = Date.now();

    holdDown= [];
}

function Cheat() {
    adjacencyFull();
    drawCanvasField();
}

function ShareField() {
    let _string = ""
    for( let y = 0; y < field.length; y++ ) {
        _string +=field[y];
    }
    //_string = _string.replace(/B/g, "1");
    console.log( "MAP: " + _string );
    console.log( "MAP: " + btoa(_string) );
}

function initField() {
    field = [];
    adjacency = [];
    for( y = 0; y < rows; y++ ){
        field[y] = "0".repeat(cols); //FIXME Hardcoded value
        adjacency[y] = "9".repeat(cols); //FIXME Hardcoded value
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
            let _adj = adjacencyCell( y, x);
            if( _adj < 9 ) {
                adjacency[y] = replaceAt( adjacency[y], x, _adj.toString());
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
                    if( cellValue == "9" || cellValue == "A" )  { //allow hold state!
                        console.log("FOUND SOMETHING");
                        clickCell( y+cy, x+cx);
                    }
                }
            }
        }
    }
}

function flagCell( y , x ) {
    let cellValue = adjacency[y].charAt(x);
    if( cellValue == "9" ) {
        adjacency[y] = replaceAt( adjacency[y], x, "F"); //FIXME Hardcoded value
        flagCount++;
    } else if( cellValue == "F") {
        adjacency[y] = replaceAt( adjacency[y], x, "9"); //FIXME Hardcoded value
        flagCount--;
    }
    drawCanvasCell( y, x);
}

function countFlagsAround( y, x) {
    let _flagCount = 0;
    console.log( "y:" + y + " x:" +x);
    for( let cy = -1; cy < 2; cy++) {
        for( let cx = -1; cx < 2; cx++) {
            if( y+cy >=0 && y+cy < rows) { //toimiva mutta, ehkä vähän vaikea lukuinen
                if( x+cx >=0 && x+cx < cols ) {
                    if( adjacency[ y+cy].charAt( x+cx) == "F") _flagCount++;
                }                
            } 
        }
    }
    return _flagCount;
}

function countBombsAround( y, x) {
    let _bombCount = 0;
    console.log( "y:" + y + " x:" +x);
    for( let cy = -1; cy < 2; cy++) {
        for( let cx = -1; cx < 2; cx++) {
            if( y+cy >=0 && y+cy < rows) { //toimiva mutta, ehkä vähän vaikea lukuinen
                if( x+cx >=0 && x+cx < cols ) {
                    _value = adjacency[ y+cy].charAt( x+cx);
                    if( adjacency[ y+cy].charAt( x+cx) == "C") _bombCount++;    //REVEALED BOMB IS C!
                    console.log("BOMBCOUNTED " + _value );
                }
            }
        }
    }
    return _bombCount;
}

function holdCell( y, x ) {
    let cellValue = adjacency[y].charAt(x);
    let _ok = false;
    if( cellValue == "9" ) {
        adjacency[y] = replaceAt( adjacency[y], x, "A"); //FIXME Hardcoded value
        _ok = true;
    }
    return _ok;
}

function holdCellArea( _cellH ) {
    let _holdCount = 0;
    holdDown[_holdCount]= _cellH;
    holdCell( _cellH.y, _cellH.x );
    drawCanvasCell( _cellH.y, _cellH.x );
    for( dy=-1; dy<2; dy++) {
        for( dx=-1; dx<2; dx++) {
            
            if( holdCell( _cellH.y+dy, _cellH.x+dx )) {
                _holdCount++;
                let _cellN = new cell();
                _cellN.y = _cellH.y+dy;
                _cellN.x = _cellH.x+dx;
                holdDown[_holdCount] = _cellN;
            }
            drawCanvasCell( _cellH.y+dy, _cellH.x+dx );
        }
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
        sisalto.drawImage( imgFull, _tx*cellsize, _ty*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize);
    } else {
        switch( _char ) {
            //other tiles (bomb, flag...)
            //TODO Structure this properly
            case "A":
                sisalto.drawImage( imgFull, 2*cellsize, 2*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
            case "B":
                sisalto.drawImage( imgFull, 3*cellsize, 2*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
            case "C":
                sisalto.drawImage( imgFull, 0*cellsize, 3*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
            case "F":
            default:
                sisalto.drawImage( imgFull, 3*cellsize, 3*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
        }
    }
}

function drawCanvasField() {
    for( y = 0; y < rows; y++ ){
        for( x = 0; x < cols; x++ ) {
            drawCanvasCell( y, x);
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

function mouseLeave() { 
    //FIXME Improve this logic
    if( state != 0 ) {

        for( let i = 0; i < holdDown.length; i++ ) {
            holdDown[i].release();
            drawCanvasCell( holdDown[i].y, holdDown[i].x);
        }
        holdDown = [];
        console.log("HOLD RESET!");
        state = 0;
    }
}

function mouseDown(event) {

    if( !(state & 1 ) && event.button == 0 ) {
        //DUPLICATE CODE WITH mouseMove()
        var _cell = getCellPos( canvas, event );
        
        console.log( _cell );

        //FIXME not needed after hold array change?? 
        if( !(state & 2) && holdDown.length > 0  ) {//(cell.y == holdDown[0].y && cell.x == holdDown[0].x) ) {
                holdCell( _cell.y, _cell.x );
                drawCanvasCell( _cell.y, _cell.x);
                holdDown[0]=_cell;
        } else{ //only happens on start and after reset (array is flushed)
            
            holdCell( _cell.y, _cell.x );
            drawCanvasCell( _cell.y, _cell.x);
            holdDown[0] = _cell;
            console.log("ASDF");
        }
        //DUPLICATE END
        console.log("SET ON!");
        state |= 1;
    }

    if( !(state & 2) && event.button == 2 ) {    //SETTING RMB ACTIVE
        //DUPLICATE CODE WITH mouseMove()
        var _cell = getCellPos( canvas, event );
        state |= 2;
    }

    if( ( ( state & 1)  && event.button == 2) || ( (state & 2) && event.button == 0 )){
        //console.log("AREA HD");
        var _cell = getCellPos( canvas, event );

        if( holdDown[0].y>=0 && holdDown[0].x >= 0 ) {
            holdCellArea( _cell );

        }

        state |= 1;
        state |= 2;
    
    }

    console.log( state );
}

function mouseMove( event ) {
    if(state==3) {
        //AREA HOLD HERE, (ONLY VISUAL)
        //TODO This is higher priority than 1 state, so I made this first
        //TODO This code needs to be also added to mouseDown
        
        var _cell = getCellPos( canvas, event );
        if( _cell.y != holdDown[0].y || _cell.x != holdDown[0].x ) {
            if( holdDown[0].y>=0 && holdDown[0].x >= 0 ) {
                for( i = 0; i < holdDown.length; i ++ ) {
                    holdDown[i].release();
                    drawCanvasCell( holdDown[i].y, holdDown[i].x);
                }
            }
            
            holdCellArea( _cell );
            drawCanvasCell( _cell.y, _cell.x);
        }
        // //DUPLICATE END
        
    } else if( state & 1 ) {
        //DUPLICATE CODE WITH mouseMove()
        //console.log("LMB DOWN MOVE")
        var _cell = getCellPos( canvas, event );
        if( _cell.y != holdDown[0].y || _cell.x != holdDown[0].x ) {
            console.log("CHANGING CELL!")
            if( holdDown[0].y>=0 && holdDown[0].x >= 0 ) {
                for( i = 0; i < holdDown.length; i ++ ) {
                    holdDown[i].release();
                    drawCanvasCell( holdDown[i].y, holdDown[i].x);
                }
            }
            holdCell( _cell.y, _cell.x );
            drawCanvasCell( _cell.y, _cell.x);
            holdDown[0] = _cell;
        }
        //DUPLICATE END
    }
}

function mouseUp(event) {

    var _cell = getCellPos( canvas, event );

    if( event.button == 0 && state == 3) {  //AREA OPEN
        let _value = adjacency[ _cell.y ].charAt( _cell.x )
        state &= ~1;
        console.log( "VALUE OF BLOCK " + _value );
        if( _value > 0 && _value < 9 ) {
            //STRUCTURE
            //value == flags around (and revealed bombs) & there is unrevealed cells, then do this
            let _f = countFlagsAround(_cell.y, _cell.x);
            let _b = countBombsAround(_cell.y, _cell.x)
            let _fb = countFlagsAround(_cell.y, _cell.x)+countBombsAround(_cell.y, _cell.x);    //TODO Make user setting for this (allow bomb adjacency (makes game easier))
            
            if( _value == _fb ) {
                revealAround( _cell.y, _cell.x);
            }
            for( i = 0; i < holdDown.length; i ++ ) {
                holdDown[i].release();
                drawCanvasCell( holdDown[i].y, holdDown[i].x);
            }
        } else {
            //
            for( i = 0; i < holdDown.length; i ++ ) {
                holdDown[i].release();
                drawCanvasCell( holdDown[i].y, holdDown[i].x);
            }
            //drawCanvasCell( _cell.y, _cell.x);
        }

    } else if(state == 1 &&  event.button == 0 && event.button != 2) {
        
        clickCell( _cell.y, _cell.x);
        console.log("LMB");
        state &= ~1;

    } else if( state == 3 && event.button == 2 ) {
        for( i = 0; i < holdDown.length; i ++ ) {
            holdDown[i].release();
            drawCanvasCell( holdDown[i].y, holdDown[i].x);
        }    
    }
    
    if( event.button == 2 ) {
        state &= ~2;
        flagCell( _cell.y, _cell.x );
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

    let _cell = new cell();
    _cell.y = celly;
    _cell.x = cellx;

    return _cell;
}

function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
}

