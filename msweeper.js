"use strict";

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

var fieldCanvas = document.getElementById("piirtoAlue");
var gamearea = document.getElementById("game-area");
const cellsizeOriginal = 16;
var cellsize = 16;
var cols = 16;
var rows = 32;
var itemRatio = 16;
var itemCount = Math.floor( cols*rows*itemRatio /100);


var sisalto = fieldCanvas.getContext("2d");


//Images
var imgFull = document.getElementById("fullimage"); //RENAME

var minetrackerId = document.getElementById("mineCount");
var timetrackerId = document.getElementById("timeElapsed");
var debuglogId = document.getElementById("debuglog");
var historyId = document.getElementById("history");


var fullPicCellSize = 16; //TODO take this to use (tile size in image) UPDATE: works, but needs testing
var fullPicTilesX = 4;
var fullPicTilesY = 4;

const fieldNums = "0123456789ABCDEF";
const fieldChars = ".12345678#+*OX?P"; //+ hold down cell, O found mine that end game, X false flag ,- exploded earlier mine???

//0 open tile
//1-8 adjacency numbers
//9 unrevealed/closed tile
//A hold down tile
//B mine/bomb
//C revealed bomb
//E Question mark (not implemented)
//F flag


//0123456789ABCDEF
//GHIJKLMNOPQRSTUV
//XYZ

var field = []; //used for placing mines and hold bomb locations 
var adjacency = []; //used for drawing canvas (current state)

var mouseState = 0;
var holdDown = [];

var timeStart = 0;
var timeElapsed = 0;
var flagCount = 0;
var explodedCount = 0;

var gameRunning = false;
var firstClick = true;

//Settings
var settingsSafeStart = true;
var settingsStrictMode = false;
var settingsDifficulty = "Beginner";


//Settings for custom sized area
//when it changes bomb amount
//this are made to fix certain issues
//with recursion that did start to happen
//after area was over 5000 cells and bomb count was
//low
var settingsCustomCellProtection = true;
var settingsCustomCellLimit = 5000;
var settingsCustomCellItemRatio = 10;

//Styles (bgcolors) for win/lose/active 
var settingsStyleWin = "gameWin";
var settingsStyleFail = "gameFail";
var settingsStyleActive = "gameActive";

sisalto.save();



fieldCanvas.addEventListener("mousedown", mouseDown );
gamearea.addEventListener("mouseup", mouseUp );
fieldCanvas.addEventListener("mousemove", mouseMove );
gamearea.addEventListener("contextmenu", blockRMBMenu );
gamearea.addEventListener("mouseleave", mouseLeave );
document.addEventListener("keydown", keyDown );
//canvas.addEventListener("mouseleave", blur );   //addd for testing

var msgSystem = new messageSystem();
msgSystem.messageMasterElement = document.getElementById("messages");
msgSystem.messageDefaultClass = "message";
msgSystem.messageIdPrefix = "message";

newGameBtn();

var checkThings;// = setInterval( updateUI, 250);
updateUI();

function setCustom() {
    document.getElementById("dCustom").checked = true;
}

function updateUI(){
    if( settingsStrictMode && explodedCount > 0 && gameRunning ) {  //LOSE CONDITION FOR STRICT MODE
        // TODO MOVE THIS TO ACTUAL BOMB REVEAL someday
        //console.log("BOOM BOOM KABOOM! GAME OVER");
        revealBombs();
        let _falseFlags = revealFalseFlags();
        drawCanvasField();
        let _msg = "GAME OVER<br /> Time:" + timeElapsed + "s Mines left:" + (itemCount -(flagCount +explodedCount)+_falseFlags) + "/" + itemCount + "<br />";
        //AddMessage( msgSystem, _msg, 5000 );
        msgSystem.AddMessage( _msg );
        //TODO Mark false flags!
        gameRunning = false;
        //gamearea.style.backgroundColor = settingsColorFail;
        gamearea.className = settingsStyleFail;


    }
    if( itemCount ==(flagCount +explodedCount) && gameRunning ) {
        //additional check that are those right
        let _flagsR = rightFlags();
        let _unrevealedC = countUnrevealed();
        //console.log("Flagged right " + _flagsR + "/" + flagCount + " unrevealed tiles:" + _unrevealedC );
        

        //WIN MESSAGE(S)    //TODO Move win message to own function, after it is clear what is needed for it
        if( settingsStrictMode && explodedCount == 0 && _unrevealedC == 0) {    //exploded check unecessary right now because set and check earlier
            timeElapsed =  (Date.now() -timeStart)/1000;
            let _msg = "V I C T O R Y :" + timeElapsed;
            //console.log( _msg );
            msgSystem.AddMessage( _msg, undefined, "messagePositive")
            gameRunning = false;
            gamearea.className = settingsStyleWin;
        }
        //duplicate with above (except for check parameters)
        if( !settingsStrictMode && _flagsR + explodedCount == itemCount ) {
            //TODO ADD SCORING FOR CASUAL MODE (for example 15s extra time per revealed BOMB)
            let _timePerBomb = 15;
            let _timePlay = (Date.now() -timeStart)/1000;;
            let _timeExploded = explodedCount * _timePerBomb;  //FIXME Hardcoded base scoring value
            timeElapsed =  _timePlay+_timeExploded;
            let _msg = "V I C T O R Y : " +timeElapsed+ "s <br />Playtime:" + _timePlay + "<br />+ Extra time from bombs: " + _timeExploded +"s (" + explodedCount +" &times; "+ _timePerBomb +"s)";
            //console.log( _msg );
            msgSystem.AddMessage( _msg, undefined, "messagePositive")
            gameRunning = false;
            gamearea.className = settingsStyleWin;

        }
    }   
    let mines = "Mines left:" + (itemCount -(flagCount +explodedCount)) + " Exploded:" + explodedCount;
   
    let _teksti = "Mouse state:" +mouseState;
    
    //DEBUG text
    // for( i = 0; i<holdDown.length ;i++ ) {
    //     _teksti += holdDown[i].tell()  + "<br>";
    // }
    
    if( timeStart != 0 && gameRunning ) timeElapsed = Math.floor( (Date.now() -timeStart)/1000);
    minetrackerId.innerText = mines;
    timetrackerId.innerText = " Time: " + timeElapsed;
    debuglogId.innerText = _teksti;
    
}

function newGameBtn() {
    msgSystem.FlushAll();
    initGame();
    setTimeout( drawCanvasField, 10);   // fix for firefox refresh & blank canvas on start
    firstClick = true; //TODO this to initGame??
    //gamearea.style.backgroundColor = settingsColorActive;

    gamearea.className = settingsStyleActive;


    //game related variables
    flagCount = 0;
    explodedCount = 0;
    holdDown=[];
    gameRunning = false;
    //newGame();
}

function initGame() {

    if( document.getElementsByName("difficulty") ){
        let _elements = document.getElementsByName("difficulty");
        for( let i = 0; i < _elements.length; i++ ) {
            if( _elements[i].checked ) {
                settingsDifficulty = _elements[i].value;
            }
        }
        //console.log(settingsDifficulty);
    }
    
    switch( settingsDifficulty ) {
        case "Custom":
            if( document.getElementById("Trows") ) {
                rows = document.getElementById("Trows").value;
            }
            if( document.getElementById("Tcols") ) {
                cols = document.getElementById("Tcols").value;
            }
            if( document.getElementById("Titems")) {
                let _items = document.getElementById("Titems").value;
                itemCount = _items;
                //console.log("ITEMS:"+_items);
                if ( _items < 1 ) {
                    itemCount = 1;
                    //console.log("Mine value not accepted so it was set to " + itemCount )
                } else if( _items > cols*rows-9) {
                    //Math.floor( cols*rows*itemRatio /100);
                    itemCount = cols*rows-9;
                }

                // Big area fix
                // TODO make visible message for player, when this happens!
                if(settingsCustomCellProtection && cols*rows > settingsCustomCellLimit) {
                    let _minimumCount = Math.floor( cols * rows * settingsCustomCellItemRatio / 100 );
                    if( itemCount < _minimumCount ) {
                        let _msg = "Set mine amount "+itemCount+"  was too low for this big game area, setting mine count to " + _minimumCount;
                        msgSystem.AddMessage( _msg, undefined, "messageWarning" );
                        itemCount = _minimumCount;
                    }
                    
                }
            } else {
                itemCount = Math.floor( cols*rows*itemRatio /100);
                //console.log("ID NOT FOUND " + itemCount )
            }
            break;

        case "Beginner":    //Earlier beginner was 8x8
        default:
            rows = 9;
            cols = 9;
            itemCount = 10;
            break;

        case "Intermediate":

            rows = 16;
            cols = 16;
            itemCount = 40;
            break;

        case "Expert": //Earlier expert was 24x24

            rows = 16;  
            cols = 30;
            itemCount = 99; 
            break;
                    
        }

        if( document.getElementById("drawSize")) {
            cellsize = cellsizeOriginal * document.getElementById("drawSize").value/100;
        }

        

        fieldCanvas.height = cellsize * rows;
        fieldCanvas.width = cellsize * cols;

        //Setting field values to match current settings
        if( document.getElementById("Trows") ) {
            document.getElementById("Trows").value = rows;
        }
        if( document.getElementById("Tcols") ) {

            document.getElementById("Tcols").value = cols;
        }
        if( document.getElementById("Titems")) {
            document.getElementById("Titems").value = itemCount;
        }
    
    initField();
}

function newGame(y, x) {

    if( document.getElementById("cbSafeStart")) {
        settingsSafeStart = document.getElementById("cbSafeStart").checked;
    } else {
        settingsSafeStart = true;
    }
    
    if( document.getElementById("cbStrict")) {
        settingsStrictMode = document.getElementById("cbStrict").checked;
    } else settingsStrictMode = false;

    if( settingsSafeStart ) {
        placeMines(y, x);
    } else placeMines( -10, -10 );

    if( settingsStrictMode )

    //DEBUG (SHOW MINE LOCATIONS)
     for( y = 0; y < rows; y++ ) {
         console.log(field[y]);
    }

    clearInterval( checkThings );
    checkThings = setInterval( updateUI, 250);  //TODO make this hardcoded interval as setting / variable based


    // setTimeout( drawCanvasField, 10);   // fix for firefox refresh & blank canvas on start


    //
    timeStart = Date.now();
    gameRunning = true;


}
function CheatBtn() {
    Cheat();
}

function Cheat() {
    if( gameRunning ) {
        adjacencyFull();
        revealBombs();
        drawCanvasField();
        gameRunning = false;
    }
}

function ShareField() {
    // let _string = ""

    // for( let y = 0; y < field.length; y++ ) {
    //     _string +=field[y];
    // }
    // //_string = _string.replace(/B/g, "1");
    // console.log( "MAP: " + _string );
    // console.log( "MAP: " + btoa(_string) );
}

function initField() {
    field = [];
    adjacency = [];
    for( let y = 0; y < rows; y++ ){
        field[y] = "0".repeat(cols); //FIXME Hardcoded value
        adjacency[y] = "9".repeat(cols); //FIXME Hardcoded value
    }
}

function placeMines( y, x ) {
    var minesLeft = itemCount;
    while( minesLeft > 0 ) {
        let _xTry = Math.floor( Math.random() * cols );
        let _yTry = Math.floor( Math.random() * rows );
        var calcNewCoords = true;
        while( calcNewCoords ) {
            calcNewCoords = false;
            _xTry = Math.floor( Math.random() * cols );
            _yTry = Math.floor( Math.random() * rows );
            for( let cy = -1; cy < 2; cy++) {
                for( let cx = -1; cx < 2; cx++) {
                    if( y+cy ==  _yTry && x+cx == _xTry ) {
                        calcNewCoords = true;
                    }
                }
            }
        }
        //if( y !=  _yTry && x != _xTry ) {   //safeclicks check.. //TODO implement area based safe zone?
            if( field[_yTry].charAt( _xTry ) == "0" ) {
                field[_yTry] = replaceAt( field[_yTry], _xTry, "B");
                minesLeft--;
            }
        //}
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

function revealBombs() {
    for(let y = 0; y < rows; y++ ) {
        for(let x = 0; x < cols; x++ ) {
            if( adjacency[y].charAt(x)=="9" && field[y].charAt( x ) == "B") {
                adjacency[y] = replaceAt( adjacency[y], x,"B");
            }
        }
    }
}

function revealFalseFlags() {
    let _falseCount = 0;
    for(let y = 0; y < rows; y++ ) {
        for(let x = 0; x < cols; x++ ) {
            if( adjacency[y].charAt(x)=="F" && field[y].charAt( x ) != "B") {
                adjacency[y] = replaceAt( adjacency[y], x,"D");
                _falseCount++;
            }
        }
    }
    
    return _falseCount;
}

function rightFlags() {
    let _rightCount = 0;
    for(let y = 0; y < rows; y++ ) {
        for(let x = 0; x < cols; x++ ) {
            if( adjacency[y].charAt(x)=="F" && field[y].charAt( x ) == "B") {
                _rightCount++;
            }
        }
    }
    return _rightCount;
}

function countUnrevealed() {
    let _unrevealedCount = 0;
    for(let y = 0; y < rows; y++ ) {
        for(let x = 0; x < cols; x++ ) {
            if( adjacency[y].charAt(x)=="9" ) {
                _unrevealedCount++;
            }
        }
    }
    return _unrevealedCount;
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
            //console.log(explodedCount);
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
                        //console.log("FOUND SOMETHING");
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
    for( let cy = -1; cy < 2; cy++) {
        for( let cx = -1; cx < 2; cx++) {
            if( y+cy >=0 && y+cy < rows) { //toimiva mutta, ehkä vähän vaikea lukuinen
                if( x+cx >=0 && x+cx < cols ) {
                    let _value = adjacency[ y+cy].charAt( x+cx);
                    if( adjacency[ y+cy].charAt( x+cx) == "C") _bombCount++;    //REVEALED BOMB IS C!
                    //console.log("BOMBCOUNTED " + _value );
                }
            }
        }
    }
    return _bombCount;
}



function holdCell( y, x ) {
    let _ok = false;
    //if( y >= 0 && y < rows && x >=0 && x < cols ) {
        let cellValue = adjacency[y].charAt(x);

        if( cellValue == "9" ) {
            adjacency[y] = replaceAt( adjacency[y], x, "A"); //FIXME Hardcoded value
            _ok = true;
        }
    //}
    return _ok;
}

function holdCellArea( _cellH ) {
    let _holdCount = 0;
    holdDown[_holdCount]= _cellH;
    holdCell( _cellH.y, _cellH.x );
    drawCanvasCell( _cellH.y, _cellH.x );
    for( let dy=-1; dy<2; dy++) {
        for( let dx=-1; dx<2; dx++) {
            if( _cellH.y+dy >= 0 && _cellH.y+dy < rows &&  _cellH.x+dx >=0 && _cellH.x+dx < cols ) {
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
}


function releaseCell( y, x) {
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
        sisalto.imageSmoothingEnabled = false;  //REMOVE IMAGE SMOOTHING
        // sisalto.drawImage( imgFull, _tx*cellsize, _ty*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize);
        sisalto.drawImage( imgFull, _tx*fullPicCellSize, _ty*fullPicCellSize, fullPicCellSize, fullPicCellSize, x*cellsize, y*cellsize, cellsize , cellsize);
    } else {
        switch( _char ) {
            //other tiles (bomb, flag...)
            //TODO Structure this properly
            case "A":
                sisalto.drawImage( imgFull, 2*fullPicCellSize, 2*fullPicCellSize, fullPicCellSize, fullPicCellSize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
            case "B":
                sisalto.drawImage( imgFull, 3*fullPicCellSize, 2*fullPicCellSize, fullPicCellSize, fullPicCellSize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
            case "C":
                sisalto.drawImage( imgFull, 0*fullPicCellSize, 3*fullPicCellSize, fullPicCellSize, fullPicCellSize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
            case "D":
                    sisalto.drawImage( imgFull, 1*fullPicCellSize, 3*fullPicCellSize, fullPicCellSize, fullPicCellSize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
                    break;
            case "F":
            default:
                sisalto.drawImage( imgFull, 3*fullPicCellSize, 3*fullPicCellSize, fullPicCellSize, fullPicCellSize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
        }
    }
}

function drawCanvasField() {
    for( let y = 0; y < rows; y++ ){
        for( let x = 0; x < cols; x++ ) {
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
    if( mouseState != 0 ) {

        releaseAllCells();
        holdDown = [];
        //console.log("HOLD RESET!");
        mouseState = 0;
    }
}

function mouseDown(event) {

    if( !(mouseState & 1 ) && event.button == 0 ) {
        //DUPLICATE CODE WITH mouseMove()
        var _cell = getCellPos( fieldCanvas, event );
        
        //console.log( _cell );

        //FIXME not needed after hold array change?? 
        if( !(mouseState & 2) && holdDown.length > 0  ) {//(cell.y == holdDown[0].y && cell.x == holdDown[0].x) ) {
                holdCell( _cell.y, _cell.x );
                drawCanvasCell( _cell.y, _cell.x);
                holdDown[0]=_cell;
        } else{ //only happens on start and after reset (array is flushed)
            holdCell( _cell.y, _cell.x );
            drawCanvasCell( _cell.y, _cell.x);
            holdDown[0] = _cell;
        }
        //DUPLICATE END
        mouseState |= 1;
    }

    if( !(mouseState & 2) && event.button == 2 ) {    //SETTING RMB ACTIVE
        //DUPLICATE CODE WITH mouseMove()
        var _cell = getCellPos( fieldCanvas, event );
        mouseState |= 2;
    }

    if( ( ( mouseState & 1)  && event.button == 2) || ( (mouseState & 2) && event.button == 0 )){
        //console.log("AREA HD");
        var _cell = getCellPos( fieldCanvas, event );

        if( holdDown[0].y>=0 && holdDown[0].x >= 0 ) {
            holdCellArea( _cell );

        }

        mouseState |= 1;
        mouseState |= 2;
    
    }

    if( !gameRunning && !firstClick ) {
        releaseAllCells();
        mouseState = 0;
    }
}

function mouseMove( event ) {
    if(mouseState==3) {
        //AREA HOLD HERE, (ONLY VISUAL)
        //TODO This is higher priority than 1 state, so I made this first
        //TODO This code needs to be also added to mouseDown
        
        var _cell = getCellPos( fieldCanvas, event );
        if( _cell.y != holdDown[0].y || _cell.x != holdDown[0].x ) {
            if( holdDown[0].y>=0 && holdDown[0].x >= 0 ) {  //TODO is check this needed anymore?
                releaseAllCells();
            }
            
            holdCellArea( _cell );
           // drawCanvasCell( _cell.y, _cell.x);
        }
        // //DUPLICATE END
        
    } else if( mouseState & 1 ) {
        //DUPLICATE CODE WITH mouseMove()
        //console.log("LMB DOWN MOVE")
        var _cell = getCellPos( fieldCanvas, event );
        if( _cell.y != holdDown[0].y || _cell.x != holdDown[0].x ) {
            //console.log("CHANGING CELL!")
            if( holdDown[0].y>=0 && holdDown[0].x >= 0 ) {
                releaseAllCells();
            }
            holdCell( _cell.y, _cell.x );
            drawCanvasCell( _cell.y, _cell.x);
            holdDown[0] = _cell;
        }
        //DUPLICATE END
    }
}

function mouseUp(event) {


    var _cell = getCellPos( fieldCanvas, event );
    var _insideC = insideCanvas( fieldCanvas, event );
    
    if( !gameRunning && !firstClick ) {
        releaseAllCells();
        mouseState = 0;
    }

    // if( !_inC ) {
    //     console.log("release outside canvas");
    // }

    if( event.button == 0 && mouseState == 3) {  //AREA OPEN
        let _value = adjacency[ _cell.y ].charAt( _cell.x )
        mouseState &= ~1;
        //console.log( "VALUE OF BLOCK " + _value );
        if( _value > 0 && _value < 9 ) {
            //STRUCTURE
            //value == flags around (and revealed bombs) & there is unrevealed cells, then do this
            let _f = countFlagsAround(_cell.y, _cell.x);
            let _b = countBombsAround(_cell.y, _cell.x);    
            let _fb = _f+_b;//countFlagsAround(_cell.y, _cell.x)+countBombsAround(_cell.y, _cell.x);    //TODO Make user setting for this (allow bomb adjacency (makes game easier))
            
            if( _value == _fb && _insideC) {
                revealAround( _cell.y, _cell.x);
            }
            releaseAllCells();
        } else {
            //
            releaseAllCells();
            //drawCanvasCell( _cell.y, _cell.x);
        }

    } else if(mouseState == 1 &&  event.button == 0 && event.button != 2) {
        
        
        //console.log("LMB");
        if( _insideC ) {
            if( firstClick ) {
                newGame( _cell.y, _cell.x );
                firstClick = false;
            }
            clickCell( _cell.y, _cell.x);
        }
        releaseAllCells();
        mouseState &= ~1;

    } else if( mouseState == 3 && event.button == 2 ) {
        releaseAllCells();
        mouseState &= ~2;
    }
    
    if( event.button == 2 && (mouseState & 2) ) {
        mouseState &= ~2;
        if( _insideC ) {
            flagCell( _cell.y, _cell.x );
        }
        //console.log("RESET RMB STATE + TRY FLAG " + state);
    }
}

function keyDown( event ) {
    //let _keycode = event.keyCode;
    //let _key = event.key;
    if(event.key == "F2") {
        event.preventDefault();
        newGameBtn();
    }
    //console.log( event.key );
}

function releaseAllCells() {
    for(let i = 0; i < holdDown.length; i++) {
        holdDown[i].release();
        drawCanvasCell(holdDown[i].y, holdDown[i].x);
    }
}

function getCellPos( canvas, event) {
    var pos = getMousePos(canvas, event)
    mouse.x = pos.x,
    mouse.y = pos.y;


    let celly = Math.floor( mouse.y / cellsize);
    let cellx = Math.floor( mouse.x / cellsize);

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

function insideCanvas( canvas, event ) {
    let inside = false;
    var pos = getMousePos(canvas, event)
    if( pos.x >= 0 && pos.y >= 0 && pos.y <= canvas.height && pos.x <= canvas.width) {
        inside = true;
        //console.log("INSIDE");
    }
    return inside;
}
