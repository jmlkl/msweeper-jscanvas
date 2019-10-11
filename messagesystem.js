function messageSystem() {
    this.messageMasterElement = undefined;
    this.messageDefaultClass = undefined;
    this.messageIdPrefix = undefined;
    this.messages = [];

    this.AddMessage = function( _msg=undefined, _dtime=undefined, style=this.messageDefaultClass ) {

        if( _msg == undefined ) _msg = "Hello!" + Date.now();

        let _time = Date.now();
        //let _content = document.createTextNode( _msg );
        let _div = document.createElement("div");

        //_div.appendChild( _content );
        _div.className = style;
        _div.id = this.messageIdPrefix + _time;
        //let _element = this.messageMasterElement.appendChild( _div );
        let _element = this.messageMasterElement.insertBefore(_div , this.messageMasterElement.childNodes[0] )    //insert to first (recent & old delete are then reversed!)
        _element.innerHTML = _msg;

        this.messages.push( new messageContainer() );
        this.messages[this.messages.length-1].id = _div.id;
        if( _dtime != undefined ) { //time based elements are now listed also on array
            setTimeout( function() { _element.remove();} , _dtime );   
        }
        
        return _div.id;
    };

    this.DeleteOld = function() {
        if( this.messages.length > 0 ) {
            let _data = this.messages.shift();
            let _element = document.getElementById( _data.id );
            while( _element == null && this.messages.length > 0 ) {
                _data = this.messages.shift();
                _element = document.getElementById( _data.id );
            }
            if( _element != null) {
                _element.remove();
            }
        }
    };

    this.DeleteRecent = function () {   //duplicate code with delete old except pop -part, // TODO
        if( this.messages.length > 0 ) {
            let _data = this.messages.pop();
            let _element = document.getElementById( _data.id );
            while( _element == null && this.messages.length > 0 ) {
                _data = this.messages.pop();
                _element = document.getElementById( _data.id );
            }
            if( _element != null) {
                _element.remove();
            }
        }
    };

    this.FlushAll = function () {
        while( this.messages.length > 0 ) {
            this.DeleteRecent();
        }
    }
};

function messageContainer() {
    this.id = undefined;
    this.creationTime = Date.now();
};