(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.vtg || (g.vtg = {})).tracking = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
function ModuleParam(value) {
    return function (target, propertyKey) {
        if (!target.keys) {
            target.keys = {};
        }
        target.keys[propertyKey] = function (data) {
            if (data.hasOwnProperty(propertyKey) && data[propertyKey]) {
                return data[propertyKey];
            }
            else {
                if (typeof value !== 'boolean') {
                    return value ? value : '';
                }
                else {
                    return value;
                }
            }
        };
    };
}
exports.ModuleParam = ModuleParam;
var DataAccess = /** @class */ (function () {
    function DataAccess(data) {
        this.data = data;
        this.format();
    }
    DataAccess.prototype.format = function () {
        var _this = this;
        var self = this;
        Object.keys(this.keys).forEach(function (key) {
            self[key] = _this.keys[key](_this.data);
        });
        return self;
    };
    DataAccess.prototype.dataToString = function (data) {
        var dictionary = {};
        for (var i in data) {
            if (data.hasOwnProperty(i) && data[i]) {
                dictionary[i] = data[i].toString();
            }
        }
        return dictionary;
    };
    return DataAccess;
}());
exports.DataAccess = DataAccess;
function Destroyable() {
    return function (constructor) {
        constructor.prototype.destroy = function () {
            var _this = this;
            typeof this.onBeforeDestroy === 'function' && this.onBeforeDestroy();
            Object.keys(this).forEach(function (key) {
                if (typeof _this[key] !== 'function') {
                    _this[key] = null;
                }
            });
        };
    };
}
exports.Destroyable = Destroyable;
function Injectable(injectable) {
    return function (constructor) {
        constructor.prototype.injectable = injectable;
    };
}
exports.Injectable = Injectable;
var Log = /** @class */ (function () {
    function Log() {
        this.debug = false;
        if (console) {
            this.setLogger(console);
        }
    }
    Log.getDefault = function () {
        return this.instance || (this.instance = new this());
    };
    Log.prototype.setLogger = function (logger) {
        if (this.hasLog(logger)) {
            this.logger = logger;
        }
    };
    Log.prototype.hasLog = function (logger) {
        return typeof logger === 'object' && typeof logger.log === 'function';
    };
    return Log;
}());
exports.Log = Log;
var Observable = /** @class */ (function () {
    function Observable() {
        this.observers = [];
    }
    Observable.prototype.register = function (observer) {
        if (typeof observer === 'object') {
            this.observers.unshift(observer);
            observer.onRegister();
        }
    };
    Observable.prototype.remove = function (observer) {
        this.observers = this.observers.filter(function (item) { return item !== observer; });
    };
    Observable.prototype.notify = function (notification) {
        for (var i = this.observers.length; i--;) {
            var observer = this.observers[i];
            observer.onNotify.call(observer, notification);
        }
    };
    return Observable;
}());
exports.Observable = Observable;
var Queue = /** @class */ (function () {
    function Queue() {
        this.items = [];
        this.isRunning = false;
    }
    Queue.prototype.add = function (item) {
        this.items.unshift(item);
    };
    Queue.prototype.forEach = function (handler) {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        var i = this.items.length;
        while (i--) {
            var item = this.items.pop();
            if (item) {
                handler(item);
            }
        }
        this.isRunning = false;
    };
    Queue.prototype.isEmpty = function () {
        return this.items.length === 0;
    };
    return Queue;
}());
exports.Queue = Queue;
var RestClient = /** @class */ (function () {
    function RestClient(baseUrl) {
        this.baseUrl = baseUrl;
        this.baseUrl = baseUrl.replace(/^\w*:/, '')
            .replace(/^\/\//, '')
            .replace(/\/*$/, '');
    }
    RestClient.prototype.request = function (options) {
        this.options = options;
        return this;
    };
    RestClient.prototype.then = function (handler) {
        switch (this.options.method) {
            case 'POST':
                this.post(handler);
                break;
            case 'GET':
                this.get(handler);
                break;
        }
    };
    RestClient.prototype.post = function (handler) {
        if (!XMLHttpRequest) {
            this.xhrNotFound(handler);
            return;
        }
        var xhr = new XMLHttpRequest();
        var url = [this.baseUrl, this.options.path].join('/');
        xhr.open('POST', '//' + url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                handler({
                    xmlHttpRequest: xhr,
                    statusCode: xhr.status,
                    message: xhr.status >= 200 && xhr.status < 300 || xhr.status === 304
                        ? 'ok'
                        : xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            handler({
                xmlHttpRequest: xhr,
                statusCode: xhr.status,
                message: 'error'
            });
        };
        xhr.send(JSON.stringify(this.options.data));
    };
    RestClient.prototype.get = function (handler) {
        if (!XMLHttpRequest) {
            this.xhrNotFound(handler);
            return;
        }
        var xhr = new XMLHttpRequest();
        var url = [this.baseUrl, this.options.path].join('/');
        var callback = function (xhr, type) {
            handler({
                xmlHttpRequest: xhr,
                statusCode: xhr.status,
                message: type
            });
        };
        xhr.open('GET', '//' + url, true);
        xhr.onload = function () { return callback(xhr, 'load'); };
        xhr.onerror = function () { return callback(xhr, 'error'); };
        xhr.onabort = function () { return callback(xhr, 'abort'); };
        xhr.send(url + JSON.stringify(this.options.data));
    };
    RestClient.prototype.xhrNotFound = function (handler) {
        handler({
            xmlHttpRequest: null,
            statusCode: -1,
            message: 'XHR not supported'
        });
    };
    return RestClient;
}());
exports.RestClient = RestClient;
var Timer = /** @class */ (function () {
    function Timer(milliseconds) {
        this.milliseconds = milliseconds;
        this.isRunning = false;
    }
    Timer.prototype.start = function (handler) {
        if (!setInterval) {
            return;
        }
        if (!this.isRunning) {
            this.intervalId = setInterval(handler, this.milliseconds);
            this.isRunning = true;
        }
    };
    Timer.prototype.stop = function () {
        if (!clearInterval) {
            return;
        }
        clearInterval(this.intervalId);
        this.isRunning = false;
    };
    return Timer;
}());
exports.Timer = Timer;
var View;
(function (View) {
    function isWindow() {
        return typeof window === 'object';
    }
    View.isWindow = isWindow;
    function isTop() {
        return typeof top === 'object';
    }
    View.isTop = isTop;
    function isVar(name, type) {
        var hier = name.split('.');
        // Check two levels deep. Ex: typeof window['ns_']['comScore']
        if (hier.length === 2) {
            return isWindow() && typeof window[hier[0]] === type
                && typeof window[hier[0]][hier[1]] === type;
        }
        return isWindow() && typeof window[name] === type;
    }
    View.isVar = isVar;
    function getVar(name) {
        return isWindow() && window[name];
    }
    View.getVar = getVar;
    function getScreenSize() {
        var win = window;
        return isWindow() && win.screen && win.screen.width && win.screen.height
            ? win.screen.width + 'x' + win.screen.height
            : 'N/A';
    }
    View.getScreenSize = getScreenSize;
    function isHttps() {
        return isTop() && top.location.href.search(/^https/) > -1;
    }
    View.isHttps = isHttps;
    function getProtocol() {
        if (!isTop()) {
            return '';
        }
        return isHttps() ? 'https://' : 'http://';
    }
    View.getProtocol = getProtocol;
})(View = exports.View || (exports.View = {}));
var DataVoProxy = /** @class */ (function () {
    function DataVoProxy() {
        this.vo = new DataVo();
    }
    DataVoProxy.prototype.update = function (data) {
        this.vo = this.mergeData(data);
        this.vo.timestamp = (new Date()).getTime();
    };
    DataVoProxy.prototype.getData = function () {
        return this.vo;
    };
    DataVoProxy.prototype.mergeData = function (data) {
        var vo = this.vo;
        for (var i in data) {
            if (data.hasOwnProperty(i) && data[i].toString()) {
                vo[i] = data[i];
            }
        }
        return vo;
    };
    return DataVoProxy;
}());
exports.DataVoProxy = DataVoProxy;
var DataVo = /** @class */ (function () {
    function DataVo() {
        /* Player Info */
        this.playerName = '';
        this.playerVersion = '';
        this.playerInitTime = -1;
        this.playerManager = {};
        this.dashJsPlayer = {};
        this.hlsJsPlayer = {};
        this.videoElement = {};
        this.isMobile = false;
        this.hasSessionResumed = false;
        this.sessionId = '';
        /* Ad Break Info */
        this.adBreakType = '';
        this.adBreakPosition = -1;
        this.adBreakDuration = -1;
        /* Ad Item Info */
        this.adTitle = '';
        this.adId = '';
        this.adUrl = '';
        this.adDuration = -1;
        this.adPosition = -1;
        /* Content Info */
        this.mediaUrl = '';
        this.category = '';
        this.mediaId = '';
        this.episodeTitle = '';
        this.seriesTitle = '';
        this.videoTitle = '';
        this.airDate = '';
        this.duration = -1;
        this.episodeFlag = false;
        this.isLive = false;
        this.timestamp = -1;
        this.playhead = 0;
        this.season = NaN;
        this.episode = NaN;
        this.liveSegmentData = {};
        /* Playback Info */
        this.cdn = '';
        this.currentBitrate = -1;
        this.playbackFramerate = -1;
        this.drmEnabled = false;
        this.drmType = '';
        /* Page Info */
        this.userId = '';
        this.userStatus = 'anon';
        this.partner = '';
        this.userCountry = '';
        this.userConnectionType = '';
        this.contextData = {};
        /* OzTam Info */
        this.ozTamMediaId = '';
        this.ozTamOptOut = false;
        /* Nielsen Info */
        this.nielsenOptOut = false;
        /* Error Info */
        this.errorType = -1;
        this.errorMessage = '';
        this.errorFatal = false;
    }
    return DataVo;
}());
exports.DataVo = DataVo;
var Agent = /** @class */ (function () {
    function Agent(config, observable) {
        this.config = config;
        this.observable = observable;
        this.notifications = new Queue();
        this.isAdPlaying = false;
        this.isSdkLoaded = false;
        this.debugId = '[Tracker] ' + config.name;
    }
    Agent.prototype.onRegister = function () {
        this.isDebug() && this.logger.log(this.debugId, 'start up');
    };
    Agent.prototype.onNotify = function (notification) {
        var _this = this;
        this.notifications.add(notification);
        // Process notification queue if the SDK was loaded
        if (this.hasSdkLoaded()) {
            this.notifications.forEach(function (notification) {
                _this.onNotificationReceived(notification);
            });
        }
    };
    Agent.prototype.hasSdkLoaded = function () {
        var self = this;
        if (typeof self.injectable !== 'object') {
            return this.isSdkLoaded;
        }
        var injectable = self.injectable;
        var sdkObject = View.getVar(injectable.name);
        if (sdkObject) {
            self[injectable.name] = sdkObject;
            this.isSdkLoaded = true;
        }
        return this.isSdkLoaded;
    };
    Agent.prototype.onNotificationReceived = function (notification) {
        this.isDebug() && this.logger.log(this.debugId, notification.name, this.getDataVo().playhead);
        this.notification = notification;
        switch (notification.name) {
            case AppEvent.AdBreakStart:
            case AppEvent.AdStart:
                this.isAdPlaying = true;
                break;
            case AppEvent.AdEnd:
            case AppEvent.AdBreakEnd:
            case AppEvent.ContentStart:
                this.isAdPlaying = false;
                break;
        }
    };
    Agent.prototype.isDebug = function () {
        return Log.getDefault().debug;
    };
    Object.defineProperty(Agent.prototype, "logger", {
        get: function () {
            return Log.getDefault().logger;
        },
        enumerable: true,
        configurable: true
    });
    Agent.prototype.getDataVo = function () {
        return this.observable.dataProxy.getData();
    };
    Agent.prototype.hasContentCompleted = function () {
        var metadata = this.getDataVo();
        // Don't compute for live content
        if (metadata && metadata.isLive) {
            return false;
        }
        return metadata.playhead >= metadata.duration * 0.95;
    };
    return Agent;
}());
exports.Agent = Agent;
var AppEvent;
(function (AppEvent) {
    /* App Lifecycle */
    AppEvent["AppClose"] = "appClose";
    AppEvent["EnterForeground"] = "EnterForeground";
    AppEvent["ExitForeground"] = "ExitForeground";
    /* Ad Events */
    AppEvent["AdBreakEnd"] = "adBreakEnd";
    AppEvent["AdBreakStart"] = "adBreakStart";
    AppEvent["AdClick"] = "adClick";
    AppEvent["AdEnd"] = "adEnd";
    AppEvent["AdError"] = "adError";
    //AdFirstQuartile = 'adFirstQuartile',
    AppEvent["AdLoaded"] = "adLoaded";
    //AdMidPoint = 'adMidPoint',
    AppEvent["AdPause"] = "adPause";
    //AdRequest = 'adRequest',
    //AdResponse = 'adResponse',
    AppEvent["AdResume"] = "adResume";
    AppEvent["AdSkip"] = "adSkip";
    AppEvent["AdStart"] = "adStart";
    //AdThirdQuartile = 'adThirdQuartile',
    /* Player Lifecycle */
    AppEvent["BitrateChange"] = "bitrateChange";
    AppEvent["BufferEnd"] = "bufferEnd";
    AppEvent["BufferStart"] = "bufferStart";
    //ChapterEnd = 'chapterEnd',
    //ChapterStart = 'chapterStart',
    //ChapterSkip = 'chapterSkip',
    AppEvent["ContentEnd"] = "contentEnd";
    //ContentLoaded = 'contentLoaded',
    AppEvent["ContentPause"] = "contentPause";
    AppEvent["ContentResume"] = "contentResume";
    AppEvent["ContentStart"] = "contentStart";
    //ContextData = 'contextData',
    AppEvent["DashJsLoaded"] = "dashJsLoaded";
    //FirstQuartile = 'firstQuartile',
    AppEvent["HlsJsLoaded"] = "hlsJsLoaded";
    AppEvent["LiveSegmentStart"] = "LiveSegmentStart";
    AppEvent["LiveSegmentEnd"] = "LiveSegmentEnd";
    //MidQuartile = 'midQuartile',
    AppEvent["PlayerError"] = "playerError";
    AppEvent["PlayerLoaded"] = "playerLoaded";
    //QosEvent = 'qosEvent',
    AppEvent["SeekEnd"] = "seekEnd";
    AppEvent["SeekStart"] = "seekStart";
    //ThirdQuartile = 'thirdQuartile',
    AppEvent["PlayheadUpdate"] = "playheadUpdate";
    /* Session Events */
    AppEvent["SessionEnd"] = "sessionEnd";
    AppEvent["SessionStart"] = "sessionStart";
})(AppEvent = exports.AppEvent || (exports.AppEvent = {}));
var BuildInfo = /** @class */ (function () {
    function BuildInfo() {
    }
    Object.defineProperty(BuildInfo, "version", {
        // Version is populated at build time
        get: function () {
            return 'tracking v0.1.5 Thu, 20 Jun 2019 11:42:16 GMT';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BuildInfo, "modules", {
        // Agent modules are populated at build time from bundle.config
        get: function () {
            return [AdobeAgent];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BuildInfo, "applicationPlatform", {
        // Application Platform is populated at build time from bundle.config
        get: function () {
            return 'Vizio';
        },
        enumerable: true,
        configurable: true
    });
    BuildInfo.isChromecast = function () {
        return BuildInfo.applicationPlatform === 'Chromecast';
    };
    BuildInfo.isVizio = function () {
        return BuildInfo.applicationPlatform === 'Vizio';
    };
    BuildInfo.isPs4 = function () {
        return BuildInfo.applicationPlatform === 'Ps4';
    };
    return BuildInfo;
}());
exports.BuildInfo = BuildInfo;
var Registrar = /** @class */ (function () {
    function Registrar() {
    }
    Registrar.prototype.registerAgents = function (tracker) {
        var _this = this;
        this.tracker = tracker;
        this.tracker.modules.forEach(function (Module) {
            var AgentModule = Module;
            if (_this.isAgentEnabled(AgentModule.NAME)) {
                var agentConfig = _this.getAgentConfig(AgentModule.NAME);
                _this.registerAgent(new AgentModule(agentConfig, tracker));
            }
        });
    };
    Registrar.prototype.isAgentEnabled = function (name) {
        return this.tracker.config.hasOwnProperty(name)
            && this.tracker.config[name].hasOwnProperty('enabled')
            && this.tracker.config[name].enabled;
    };
    Registrar.prototype.getAgentConfig = function (name) {
        var agentConfig = this.tracker.config[name];
        agentConfig.name = name;
        return agentConfig;
    };
    Registrar.prototype.registerAgent = function (agent) {
        this.tracker.register(agent);
        // // Not all agents have injectable sdks
        // if (typeof agent.injectable !== 'object') {
        //     return;
        // }
        //
        // const injectable: InjectableSource = agent.injectable;
        //
        // (new JsInjector()).inject(injectable).then(
        //     (response: string) => {
        //         if (response === JsInjector.LOADED) {
        //             (<Agent>agent).onSdkLoaded();
        //         }
        //     }
        // );
    };
    return Registrar;
}());
exports.Registrar = Registrar;
var Tracker = /** @class */ (function (_super) {
    __extends(Tracker, _super);
    function Tracker() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.dataProxy = new DataVoProxy();
        _this.registrar = new Registrar();
        _this.modules = BuildInfo.modules;
        return _this;
    }
    Tracker.prototype.track = function (name, data) {
        data = data || {};
        this.dataProxy.update(data);
        _super.prototype.notify.call(this, { name: name });
    };
    Tracker.prototype.setConfig = function (config) {
        this.config = config;
        this.registrar.registerAgents(this);
    };
    Tracker.prototype.setContextData = function (data) {
        this.dataProxy.update({ contextData: data });
    };
    Tracker.prototype.setLiveSegmentData = function (data) {
        this.dataProxy.update({ liveSegmentData: data });
    };
    Tracker.prototype.setDebug = function (debug) {
        Log.getDefault().debug = debug;
    };
    Tracker.prototype.setLogger = function (logger) {
        Log.getDefault().setLogger(logger);
    };
    return Tracker;
}(Observable));
exports.Tracker = Tracker;
var AdobeAgent = /** @class */ (function (_super) {
    __extends(AdobeAgent, _super);
    function AdobeAgent() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.hasAdobeSession = false;
        _this.isStopped = false;
        _this.isSdkLoaded = true;
        return _this;
    }
    AdobeAgent.prototype.onRegister = function () {
        _super.prototype.onRegister.call(this);
        this.vo = new AdobeVo(this);
        this.restClient = new RestClient(this.isDebug() ? this.vo.devApiServer : this.vo.prodApiServer);
        this.eventQueue = new Queue();
        this.timer = new Timer(this.vo.hbInterval);
    };
    AdobeAgent.prototype.onNotificationReceived = function (notification) {
        _super.prototype.onNotificationReceived.call(this, notification);
        switch (notification.name) {
            case AppEvent.AdBreakStart:
                this.pauseHbTracking();
                this.trackEvent('adBreakStart');
                break;
            case AppEvent.AdStart:
                this.trackEvent('adStart');
                break;
            case AppEvent.AdClick:
            case AppEvent.AdPause:
                this.trackEvent('pauseStart');
                break;
            case AppEvent.AdEnd:
                this.trackEvent('adComplete');
                break;
            case AppEvent.AdBreakEnd:
                this.trackEvent('adBreakComplete');
                break;
            case AppEvent.ContentStart:
                if (!this.hasAdobeSession) {
                    this.requestAdobeSession();
                }
                this.trackEvent('play');
                break;
            case AppEvent.ContentPause:
                this.isStopped = true;
                this.trackEvent('pauseStart');
                this.pauseHbTracking();
                break;
            case AppEvent.BufferStart:
                this.isStopped = true;
                this.trackEvent('bufferStart');
                this.pauseHbTracking();
                break;
            case AppEvent.SeekStart:
                this.isStopped = true;
                this.pauseHbTracking();
                break;
            case AppEvent.ContentResume:
            case AppEvent.PlayheadUpdate:
                if (this.isStopped) {
                    this.isStopped = false;
                    this.trackEvent('play');
                }
                break;
            case AppEvent.SessionEnd:
                this.trackSessionEnd();
                break;
        }
    };
    AdobeAgent.prototype.trackEvent = function (eventName) {
        this.eventQueue.add(eventName);
        this.processEventQueue();
    };
    AdobeAgent.prototype.processEventQueue = function () {
        var _this = this;
        if (!this.hasAdobeSession) {
            return;
        }
        this.eventQueue.forEach(function (item) {
            _this.sendTrackRequest(item);
        });
    };
    AdobeAgent.prototype.sendTrackRequest = function (eventName) {
        if (eventName === 'play' && this.isAdPlaying) {
            // Do not track play events during ad play
            return;
        }
        var options = {
            path: this.apiPath,
            data: this.vo.getPayload(eventName),
            method: 'POST'
        };
        this.isDebug() && this.logger.log(this.debugId, eventName, options);
        this.restClient.request(options).then(function (_response) {
            //this.isDebug() && this.logger.log(this.debugId, 'statusCode', response.statusCode);
        });
        if (eventName === 'play' && !this.isAdPlaying) {
            this.startHbTracking();
        }
    };
    AdobeAgent.prototype.requestAdobeSession = function () {
        var _this = this;
        var options = {
            path: AdobeVo.SESSION_PATH,
            data: this.vo.getSessionStartData(),
            method: 'POST'
        };
        this.isDebug() && this.logger.log(this.debugId, options);
        this.restClient.request(options).then(function (response) {
            if (response.statusCode === 404) {
                throw ('Error: Server response 404');
            }
            // Ex: /api/v1/sessions/fb7a1c6f02ddf6513fb6b106f84f4ce854fc4d7440f8242c581cdd9a350fa1d4
            var location = response.xmlHttpRequest.getResponseHeader('location');
            if (!location) {
                throw ('Error: Location not found');
            }
            _this.hasAdobeSession = true;
            _this.apiPath = _this.vo.getApiPath(location);
            _this.isDebug() && _this.logger.log(_this.debugId, _this.apiPath);
            _this.processEventQueue();
        });
    };
    AdobeAgent.prototype.startHbTracking = function () {
        var _this = this;
        if (!this.hasAdobeSession) {
            return;
        }
        this.isDebug() && this.logger.log(this.debugId, 'hbInterval', this.vo.hbInterval);
        this.timer.start(function () {
            _this.trackEvent('ping');
        });
    };
    AdobeAgent.prototype.pauseHbTracking = function () {
        this.isDebug() && this.logger.log(this.debugId, 'hb paused');
        this.timer.stop();
    };
    AdobeAgent.prototype.trackSessionEnd = function () {
        this.pauseHbTracking();
        this.hasContentCompleted() && this.trackEvent('sessionComplete');
        this.trackEvent('sessionEnd');
        this.hasAdobeSession = false;
    };
    AdobeAgent.NAME = 'Adobe';
    AdobeAgent = __decorate([
        Destroyable()
    ], AdobeAgent);
    return AdobeAgent;
}(Agent));
exports.AdobeAgent = AdobeAgent;
var AdobeVo = /** @class */ (function (_super) {
    __extends(AdobeVo, _super);
    function AdobeVo(agent) {
        var _this = _super.call(this, agent.config.params) || this;
        _this.agent = agent;
        return _this;
    }
    AdobeVo.prototype.getSessionStartData = function () {
        var data = this.agent.getDataVo();
        var eventData = this.getPayload('sessionStart');
        var visitorData = this.getVisitorData();
        eventData.params = {
            'analytics.trackingServer': this.trackingServer,
            'analytics.reportSuite': this.reportSuite,
            'analytics.visitorId': visitorData.visitorId,
            'analytics.enableSSL': this.enableSSL,
            'visitor.marketingCloudOrgId': this.marketingCloudOrgId,
            'visitor.marketingCloudUserId': visitorData.marketingCloudUserId,
            'media.playerName': data.playerName,
            'media.contentType': data.isLive ? 'Live' : 'VOD',
            'media.length': data.duration,
            'media.id': data.mediaId,
            'media.name': data.videoTitle,
            'media.channel': this.channel,
            'media.sdkVersion': data.playerVersion.toString(),
            'media.network': this.channel,
            // Set to 0 for Full Episode, 2 for Clip
            'media.showType': data.episodeFlag ? '0' : '2',
            // Set to true if the session was closed and then resumed at a later time, e.g.,
            // the user left the video but eventually came back, and the player resumed the
            // video from the playhead where it was stopped
            'media.resume': !!data.hasSessionResumed
        };
        // Additional data points required by the spec when available
        if (data.seriesTitle) {
            eventData.params['media.show'] = data.seriesTitle;
        }
        if (data.category) {
            eventData.params['media.genre'] = data.category;
        }
        if (data.season) {
            eventData.params['media.season'] = data.season.toString();
        }
        if (data.episode) {
            eventData.params['media.episode'] = data.episode.toString();
        }
        data.contextData.mediaResume = data.hasSessionResumed ? 'true' : 'false';
        eventData.customMetadata = this.dataToString(data.contextData);
        return eventData;
    };
    AdobeVo.prototype.getVisitorData = function () {
        var visitorData = {
            visitorId: '',
            marketingCloudUserId: this.marketingCloudUserId || ''
        };
        var Visitor = View.getVar('Visitor');
        if (!Visitor) {
            return visitorData;
        }
        var visitorInstance = Visitor.getInstance(this.marketingCloudOrgId, this.visitorOptions || {});
        visitorData.visitorId = visitorInstance.getAnalyticsVisitorID();
        visitorData.marketingCloudUserId = visitorInstance.getMarketingCloudVisitorID();
        return visitorData;
    };
    AdobeVo.prototype.getAdBreakStartData = function () {
        var data = this.agent.getDataVo();
        return {
            'media.ad.podFriendlyName': data.adBreakType,
            'media.ad.podIndex': data.adBreakPosition,
            'media.ad.podSecond': data.playhead
        };
    };
    // https://marketing.adobe.com/resources/help/en_US/sc/appmeasurement/hbvideo/mc-api-req-params.html
    AdobeVo.prototype.getAdItemData = function () {
        var data = this.agent.getDataVo();
        return {
            'media.ad.name': data.adTitle,
            'media.ad.id': data.videoTitle + ' - ' + data.adTitle,
            'media.ad.length': data.adDuration,
            'media.ad.creativeId': data.adId,
            'media.ad.creativeURL': data.adUrl,
            'media.ad.playerName': data.playerName,
            'media.ad.podPosition': data.adPosition
        };
    };
    AdobeVo.prototype.getApiPath = function (location) {
        location = location.replace(/^\/|\/$/g, '');
        // Ex: {uri}/api/v1/sessions/{sid}/events
        return [location, 'events'].join('/');
    };
    AdobeVo.prototype.getPayload = function (eventName) {
        var data = this.agent.getDataVo();
        var params = {};
        switch (eventName) {
            case 'adBreakStart':
                params = this.getAdBreakStartData();
                break;
            case 'adStart':
                params = this.getAdItemData();
                break;
        }
        return {
            eventType: eventName,
            playerTime: {
                playhead: data.playhead,
                ts: (new Date()).getTime()
            },
            params: params
        };
    };
    AdobeVo.SESSION_PATH = 'api/v1/sessions';
    __decorate([
        ModuleParam(false)
    ], AdobeVo.prototype, "enableSSL", void 0);
    __decorate([
        ModuleParam()
    ], AdobeVo.prototype, "channel", void 0);
    __decorate([
        ModuleParam()
    ], AdobeVo.prototype, "reportSuite", void 0);
    __decorate([
        ModuleParam()
    ], AdobeVo.prototype, "trackingServer", void 0);
    __decorate([
        ModuleParam()
    ], AdobeVo.prototype, "marketingCloudOrgId", void 0);
    __decorate([
        ModuleParam()
    ], AdobeVo.prototype, "marketingCloudUserId", void 0);
    __decorate([
        ModuleParam()
    ], AdobeVo.prototype, "devApiServer", void 0);
    __decorate([
        ModuleParam()
    ], AdobeVo.prototype, "prodApiServer", void 0);
    __decorate([
        ModuleParam(10000)
    ], AdobeVo.prototype, "hbInterval", void 0);
    __decorate([
        ModuleParam()
    ], AdobeVo.prototype, "visitorOptions", void 0);
    AdobeVo = __decorate([
        Destroyable()
    ], AdobeVo);
    return AdobeVo;
}(DataAccess));
exports.AdobeVo = AdobeVo;

},{}]},{},[1])(1)
});
