(function(global, factory){
    //amd support
    if ( typeof module === "object" && typeof module.exports === "object" ) {
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document )
					throw new Error( "Vimeo requires a window with a document" );
				return factory( w );
			};
	} else {
		factory( global );
	}
})(typeof window !== "undefined" ? window : this, function(window, noGlobal){

    var DEFAULT_EL='!';
    var eventCallbacks= {},
        slice= Array.prototype.slice,
        playerDomain= '',
        isReady={};

    //we define some alias methods for compatibility
    var methodAliasMap={stop: 'unload', seek: 'seekTo'};

    // Define a local copy of Vimeo
    function Vimeo(iframe) {
        // The Vimeo object is actually just the init constructor
        return new Vimeo.fn.init(iframe);
    }
    Vimeo.fn = Vimeo.prototype = {
        element: null,

        init: function(iframe) {
            if (typeof iframe === "string")
                iframe = document.getElementById(iframe);

            this.element = iframe;

            // Register message event listeners
            if(this.element)
                playerDomain = getDomainFromUrl(this.element.getAttribute('src'));
            return this;
        },

        /*
         * Calls a function to act upon the player.
         *
         * @param {String} method The name of the Javascript API method to call. Eg: 'play'.
         * @param {Array|Function} valueOrCallback params Array of parameters to pass when calling an API method
         *                                or callback function when the method returns a value.
         */
        api: function(method, valueOrCallback) {
            if (!this.element || !method)
                return false;

            var self = this,
                element = self.element,
                target_id = !element.id ? DEFAULT_EL : element.id,
                params = !isFunction(valueOrCallback) ? valueOrCallback : null,
                callback = isFunction(valueOrCallback) ? valueOrCallback : null;

            // Store the callback for get functions
            if (callback)
                storeCallback(method, callback, target_id);
            //we check if it's an alias method
            if(typeof methodAliasMap[method] !== 'undefined')
                method=methodAliasMap[method];

            postMessage(method, params, element);
            return self;
        },

        /*
         * Calls a function to act upon the player.
         *
         * @param {String} url: The new video url to load. Should be the whole src part including domain
         * @param {Function} callback: Function that should be called when the new video is ready.
         */
        load: function(url, callback){
            if (!this.element)
                return false;
            var target_id = !this.element.id ? DEFAULT_EL : this.element.id;
            isReady[target_id]=false;
            this.element.src=url;
            if(callback)
                this.addEvent('ready',callback);
        },
        /*
         * Registers an event listener and a callback function that gets called when the event fires.
         *
         * @param {String} eventName: Name of the event to listen for.
         * @param {Function} callback: Function that should be called when the event fires.
         */
        addEvent: function(eventName, callback) {
            if (!this.element)
                return false;

            var self = this,
                element = self.element,
                target_id = !element.id ? DEFAULT_EL : element.id;


            storeCallback(eventName, callback, target_id);

            // The ready event is not registered via postMessage. It fires regardless.
            if (eventName != 'ready') {
                postMessage('addEventListener', eventName, element);
            } else if (eventName == 'ready' && isReady[target_id]) {
                callback.call(null, target_id);
            }

            return self;
        },

        /*
         * Unregisters an event listener that gets called when the event fires.
         *
         * @param eventName (String): Name of the event to stop listening for.
         */
        removeEvent: function(eventName) {
            if (!this.element)
                return false;

            var self = this,
                element = self.element,
                target_id = !element.id ? DEFAULT_EL : element.id,
                removed = removeCallback(eventName, target_id);

            // The ready event is not registered
            if (eventName != 'ready' && removed) {
                postMessage('removeEventListener', eventName, element);
            }
        }
    };

    var events=['ready','play','pause','seek','finish','playProgress','loadProgress'];
    var methods=[
        'play','pause','unload','seekTo','paused',
        'setVolume','setLoop','setColor',
        'getVolume','getLoop','getColor',
        'getCurrentTime','getDuration','getVideoWidth',
        'getVideoHeight','getVideoUrl','getVideoEmbedCode',
        'seek','stop'
    ];

    methods.forEach(function(methodName, x, methods){
        Vimeo.fn[methodName]=function(valueOrCallback){
            return this.api(methodName,valueOrCallback);
        }
    });
    events.forEach(function(eventName, y, events){
        Vimeo.fn['on'+ucfirst(eventName)]=function(callback){
            return this.addEvent(eventName,callback);
        }
        Vimeo.fn['off'+ucfirst(eventName)]=function(callback){
            return this.removeEvent(eventName,callback);
        }
    });

    /**
     * Handles posting a message to the parent window.
     *
     * @param method (String): name of the method to call inside the player. For api calls
     * this is the name of the api method (api_play or api_pause) while for events this method
     * is api_addEventListener.
     * @param params (Object or Array): List of parameters to submit to the method. Can be either
     * a single param or an array list of parameters.
     * @param target (HTMLElement): Target iframe to post the message to.
     */
    function postMessage(method, params, target) {
        if (!target.contentWindow.postMessage)
            return false;

        var url = target.getAttribute('src').split('?')[0];
        var data = JSON.stringify({
            method: method,
            value: params
        });

        if (url.substr(0, 2) === '//')
            url = window.location.protocol + url;

        target.contentWindow.postMessage(data, url);
    }

    /**
     * Event that fires whenever the window receives a message from its parent
     * via window.postMessage.
     */
    function onMessageReceived(event) {
        var data, method;

        try {
            data = JSON.parse(event.data);
            method = data.event || data.method;
        } catch(e) {
            console.log(e);
        }

        // Handles messages from moogaloop only
        if (event.origin != playerDomain)
            return false;

        var value = data.value,
            eventData = data.data,
            target_id = !data.player_id ? DEFAULT_EL : data.player_id,

            callback = getCallback(method, target_id),
            params = [];

        if (method == 'ready'){
            if(!isReady[target_id]){
                isReady[target_id]=true;
                //we dont want these events anymore after reload
                removeCallback(method, target_id);
            }else
                return false;
        }

        if (!callback)
            return false;

        if (value !== undefined)
            params.push(value);

        if (eventData)
            params.push(eventData);

        if (target_id)
            params.push(target_id);

        return params.length > 0 ? callback.apply(null, params) : callback.call();
    }


    /**
     * Stores submitted callbacks for each iframe being tracked and each
     * event for that iframe.
     *
     * @param eventName (String): Name of the event. Eg. api_onPlay
     * @param callback (Function): Function that should get executed when the
     * event is fired.
     * @param target_id (String) [Optional]: If handling more than one iframe then
     * it stores the different callbacks for different iframes based on the iframe's
     * id.
     */
    function storeCallback(eventName, callback, target_id) {
        if (target_id && target_id!==DEFAULT_EL) {
            if (!eventCallbacks[target_id])
                eventCallbacks[target_id] = {};
            eventCallbacks[target_id][eventName] = callback;
        } else {
            eventCallbacks[eventName] = callback;
        }
    }

    /**
     * Retrieves stored callbacks.
     */
    function getCallback(eventName, target_id) {
        if (target_id && target_id!==DEFAULT_EL) {
            if(!eventCallbacks[target_id])
                return;
            return eventCallbacks[target_id][eventName];
        } else {
            return eventCallbacks[eventName];
        }
    }

    function removeCallback(eventName, target_id) {
        if (target_id && target_id!==DEFAULT_EL) {
            if (!eventCallbacks[target_id] || !eventCallbacks[target_id][eventName])
                return false;
            eventCallbacks[target_id][eventName] = null;
        } else {
            if (!eventCallbacks[eventName]) {
                return false;
            }
            eventCallbacks[eventName] = null;
        }

        return true;
    }

    /**
     * Returns a domain's root domain.
     * Eg. returns http://vimeo.com when http://vimeo.com/channels is sbumitted
     *
     * @param url (String): Url to test against.
     * @return url (String): Root domain of submitted url
     */
    function getDomainFromUrl(url) {
        if(!url)
            return;

        if (url.substr(0, 2) === '//')
            url = window.location.protocol + url;

        var url_pieces = url.split('/'),
            domain_str = '';

        for(var i = 0, length = url_pieces.length; i < length; i++) {
            if(i<3) {domain_str += url_pieces[i];}
            else {break;}
            if(i<2) {domain_str += '/';}
        }

        return domain_str;
    }

    function isFunction(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    }

    function isArray(obj) {
        return toString.call(obj) === '[object Array]';
    }
    function ucfirst(string){
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    // Give the init function the Vimeo prototype for later instantiation
    Vimeo.fn.init.prototype = Vimeo.fn;

    // crossbrowser event listeners
    if (window.addEventListener)
        window.addEventListener('message', onMessageReceived, false);
    else
        window.attachEvent('onmessage', onMessageReceived);

    // Expose Vimeo to the global object
    if ( typeof noGlobal === 'undefined' ) {
    	window.Vimeo = window.$f = Vimeo;
    }

    return Vimeo;

});
