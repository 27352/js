(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ns_ = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var objectUtils = require(24),
	typeCastingUtils = require(26),
	PlatformAPI = require(36);

function CacheFlusher(core) {
	var self = this,
		isForeground = false,
		nextFlushTime = -1,
		timer = null;

	function setNextFlushTime(value) {
		nextFlushTime = value;
		core.getStorage().set('plannedFlushTime', value + '');
	}

	function readNextFlushTime() {
		if (core.getStorage().has('plannedFlushTime')) {
			nextFlushTime = typeCastingUtils.parseLong(core.getStorage().get('plannedFlushTime'), -1);
		}
	}

	function run() {
		core.flush();
		setNextFlushTime(-1);
		self.scheduleFlush();
	}

	function reset() {
		setNextFlushTime((core.getCacheFlushingInterval() > 0) ? +new Date() + core.getCacheFlushingInterval() * 1000 : -1);
		if (timer) {
			PlatformAPI.clearTimeout(timer);
			self.scheduleFlush();
		}
	}

	function destroyTimeout() {
		if (timer) {
			PlatformAPI.clearTimeout(timer);
			timer = null;
		}
	}

	objectUtils.extend(self, {
		start: function() {
			isForeground = true;

			if (!timer && core.getCacheFlushingInterval() > 0 && core.getCustomerC2() != null) {
				readNextFlushTime();
				self.scheduleFlush();
			}
		},

		stop: function() {
			isForeground = false;

			destroyTimeout();
		},

		update: function() {
			var interval = core.getCacheFlushingInterval();
			if (interval > 0 && core.getCustomerC2() != null) {
				if (!timer && isForeground) { // we start only if the app is in foreground
					setNextFlushTime(-1);
					self.start();
				} else if (timer != null) { // handler running, let's reset the next flush time
					reset();
				}
			} else {
				setNextFlushTime(-1);
				destroyTimeout();
			}
		},

		scheduleFlush: function() {
			if (nextFlushTime < 0) {
				setNextFlushTime(+new Date() + core.getCacheFlushingInterval() * 1000);
			}
			timer = PlatformAPI.setTimeout(run, nextFlushTime - +new Date());
		}
	});
}

module.exports = CacheFlusher;

},{"24":24,"26":26,"36":36}],2:[function(require,module,exports){
var Core = require(5),
	TransmissionMode = require(8).TransmissionMode,
	EventType = require(8).EventType;

var core = new Core();

/**
 * Sets the context. To avoid any memory leaks please provide ApplicationContext instance.
 *
 * @param appContext Application context
 */
var comScore = {
	TransmissionMode: TransmissionMode,

    /**
     * Returns the instance of the application tag core.
     * @returns {Core}
     */
	getCore: function () {
		return core;
	},

	setAppContext: function (appContext) {
		core.setAppContext(appContext);
	},

    /**
     * Enables or disables the application tag core.
     * @param value Boolean value indicating whether or not the core is to be enabled / disabled
     */
	setEnabled: function (value) {
		core.setEnabled(value);
	},

    /**
     * Returns true if the application tag core is enabled and false otherwise
     */
	getEnabled: function () {
		return core.getEnabled();
	},

    /**
     * Informs that the application is providing some content to the user (playing music in the background, playing a movie etc.)
     */
	onUxActive: function () {
		core.onUxActive();
	},

    /**
     * Informs that the application is no longer providing content to the user.
     */
	onUxInactive: function () {
		core.onUxInactive();
	},

    /**
     * Informs that the application entered foreground.
     */
	onEnterForeground: function () {
		core.onEnterForeground();
	},

    /**
     * Informs that the application left the foreground.
     */
	onExitForeground: function () {
		core.onExitForeground();
	},

    /**
     * Informs that user performed an interaction with application.
     */
	onUserInteraction: function () {
		core.onUserInteraction();
	},

    /**
     * Accumulates the current timer registers, so the data won't be lost on crash.
     * Triggers IO operations in a separate thread so please use it wisely.
     */
	update: function () {
		core.update();
	},

    /**
     * Enables automatic invocation of update() method.
     * @param intervalInSeconds The interval in seconds in which update() should be called. It cannot be less than 60 s, in such case 60 s will be used.
     * @param foregroundOnly If true automatic invocation will work in foreground only. if false it will work also when the application is in background AND active (see onAppActivated() and onAppDeactivate().
     */
	enableAutoUpdate: function (intervalInSeconds, foregroundOnly) {
		core.enableAutoUpdate(intervalInSeconds, (foregroundOnly === undefined) ? true : foregroundOnly);
	},

    /**
     * Disables automatic invocation of update() method.
     */
	disableAutoUpdate: function () {
		core.disableAutoUpdate();
	},

    /**
     * Informs if auto update is enabled.
     * @return True, if auto update is enabled.
     */
	isAutoUpdateEnabled: function () {
		return core.isAutoUpdateEnabled();
	},

    /**
     * Sends the start measurement with the provided labels.
     * @param labels Labels that should be added to the measurement.
     */
	start: function (labels) {
		core.notify(EventType.START, labels || {});
	},

    /**
     * Sends the view measurement with the provided labels.
     * @param labels Labels that should be added to the measurement.
     */
	view: function (labels) {
		core.notify(EventType.VIEW, labels || {});
	},

    /**
     * Sends the hidden measurement with the provided labels.
     * @param labels Labels that should be added to the measurement.
     */
	hidden: function (labels) {
		core.notify(EventType.HIDDEN, labels || {});
	},

    /**
     * Sends the close measurement with the provided labels.
     * @param labels Labels that should be added to the measurement.
     */
	close: function (labels) {
		core.notify(EventType.CLOSE, labels);
	},

    /**
     * Aggregates the provided labels for the next measurement.
     * @param labels Labels to be aggregated.
     */
	aggregate: function (labels) {
		core.notify(EventType.AGGREGATE, labels);
	},

    /**
     * Returns the pixelURL.
     * @return Current pixelURL
     */
	getPixelURL: function () {
		return core.getPixelURL();
	},

    /**
     * Sets the pixelURL. If GET request parameters are provided, they will be parsed and stored in the SDK (same effect as calling setLabel method), afterwards they will be removed from the final pixelURL.
     *
     * @param pixelURL New pixelURL value.
     */
	setPixelURL: function (pixelURL) {
		core.setPixelURL(pixelURL);
	},

    /**
     * Returns the customer C2 value.
     * @return Customer C2 value.
     */
	getCustomerC2: function () {
		return core.getCustomerC2();
	},

    /**
     * Sets the customer C2 value.
     * @param customerC2 New customer C2 value.
     */
	setCustomerC2: function (customerC2) {
		core.setCustomerC2(customerC2);
	},

    /**
     * Returns the currently set application name.
     * @return Application name.
     */
	getAppName: function () {
		return core.getAppName();
	},

    /**
     * Sets the application name.
     * @param appName New application name.
     */
	setAppName: function (appName) {
		core.setAppName(appName);
	},

    /**
     * Returns the currently set application version.
     * @return Application name.
     */
	getAppVersion: function () {
		return core.getAppVersion();
	},

    /**
     * Sets the application version.
     * @param appVersion New application version.
     */
	setAppVersion: function (appVersion) {
		core.setAppVersion(appVersion);
	},

    /**
     * Returns the application genesis value.
     * @return Application genesis value.
     */
	getGenesis: function () {
		return core.getGenesis();
	},

    /**
     * Returns the visitor ID value.
     * @return Visitor ID value.
     */
	getVisitorID: function () {
		return core.getVisitorId();
	},

    /**
     * Sets the visitor id
     * @param value This will be present in the measurements (no processing will be done)
     * @param suffix It will set the visitor id as '{value}-cs{suffix}'. This parameter is optional.
     */
	setVisitorId: function (value, suffix) {
		core.setVisitorId(value, suffix);
	},

    /**
     * Returns the cross publisher id
     * @returns {*}
     */
	getCrossPublisherId: function () {
		return core.getCrossPublisherId();
	},

    /**
     * Returns current offline transmission mode setting.
     *
     * @return Offline transmission mode setting.
     */
	getOfflineTransmissionMode: function () {
		return core.getOfflineTransmissionMode();
	},

    /**
     * Sets the offline transmission mode setting.
     *
     * @param mode New offline transmission mode value.
     */
	allowOfflineTransmission: function (mode) {
		core.allowOfflineTransmission(mode);
	},

    /**
     * Returns current live transmission mode setting.
     * @return Live transmission mode value.
     */
	getLiveTransmissionMode: function () {
		return core.getLiveTransmissionMode();
	},

    /**
     * Set live transmission mode.
     * @param mode New live transmission mode value.
     */
	allowLiveTransmission: function (mode) {
		core.allowLiveTransmission(mode);
	},

    /**
     * Returns the publisher secret.
     * @return Publisher secret value.
     */
	getPublisherSecret: function () {
		return core.getSalt();
	},

    /**
     * Sets the publisher secret.
     * @param publisherSecret Publisher secret value.
     */
	setPublisherSecret: function (publisherSecret) {
		core.setSalt(publisherSecret);
	},

    /**
     * Flushes cached measurements.
     */
	flushCache: function () {
		core.flush();
	},
    
    /**
     * Clears cached measurements
     */
	clearOfflineCache: function () {
		core.getOfflineCache().clear();
	},

    /**
     * Add new custom label.
     * @param name Label key.
     * @param value Label value.
     */
	setLabel: function (name, value) {
		core.setLabel(name, value);
	},
    
    /**
     * Returns the label value.
     * @param name Name of the label.
     * @return Value of the label
     */
	getLabel: function (name) {
		return core.getLabel(name);
	},

    /**
     * Adds new custom labels.
     *
     * @param labels Labels to be added.
     */
	setLabels: function (labels) {
		core.setLabels(labels);
	},

    /**
     * Returns all labels.
     *
     * @return Persistent labels.
     */
	getLabels: function () {
		return core.getLabels();
	},

    /**
     * Adds all the labels passed in the dictionary to be sent on auto starts.
     * @param labels
     */
	setAutoStartLabels: function (labels) {
		core.setAutoStartLabels(labels);
	},

    /**
     * Returns the label value that it's sent on auto starts.
     * @param name
     * @returns {*}
     */
	getAutoStartLabel: function (name) {
		return core.getAutoStartLabel(name);
	},

    /**
     * Returns all labels sent on auto starts.
     * @returns {*}
     */
	getAutoStartLabels: function () {
		return core.getAutoStartLabels();
	},

    /**
     * Adds the name and value passed as parameter as a label to sent on auto starts.
     * @param name
     * @param value
     */
	setAutoStartLabel: function (name, value) {
		core.setAutoStartLabel(name, value);
	},

    /**
     * Returns keep alive status.
     * @return True if enabled, false otherwise.
     */
	isKeepAliveEnabled: function () {
		return core.getKeepAlive().isEnabled();
	},

    /**
     * Sets the keep alive setting.
     * @param enabled True to enable, false otherwise.
     */
	setKeepAliveEnabled: function (enabled) {
		core.setKeepAliveEnabled(!!enabled);
	},

    /**
     * Sets the maximum amount of measurements that can be cached.
     * @param max Amount of measurements.
     */
	setCacheMaxMeasurements: function (max) {
		core.setCacheMaxMeasurements(max);
	},

    /**
     * Returns the maximum amount of measurements that can be cached.
     * @return maximum Amount of measurements.
     */
	getCacheMaxMeasurements: function () {
		return core.getCacheMaxMeasurements();
	},

    /**
     * Sets the maximum amount of measurements can be cached in a single file.
     * @param max Amount of measurements.
     */
	setCacheMaxBatchFiles: function (max) {
		core.setCacheMaxBatchFiles(max);
	},

    /**
     * Returns the maximum amount of measurements can be cached in a single file.
     * @return Maximum amount of measurements.
     */
	getCacheMaxBatchFiles: function () {
		return core.getCacheMaxBatchFiles();
	},

    /**
     * Sets the maximum amount flushes of cached measurements can be send in a row.
     * @param max Maximum amount of flushed to be send.
     */
	setCacheMaxFlushesInARow: function (max) {
		core.setCacheMaxFlushesInARow(max);
	},

    /**
     * Returns the maximum amount flushes of cached measurements can be send in a row.
     * @return Maximum amount of flushes to be send.
     */
	getCacheMaxFlushesInARow: function () {
		return core.getCacheMaxFlushesInARow();
	},

    /**
     * Sets the minimal time between cache flush retries, in case of failure.
     * @param minutes Minutes to wait.
     */
	setCacheMinutesToRetry: function (minutes) {
		core.setCacheMinutesToRetry(minutes);
	},

    /**
     * Returns the time between cache flush retries, in case of failure.
     * @return Minutes to wait.
     */
	getCacheMinutesToRetry: function () {
		return core.getCacheMinutesToRetry();
	},

    /**
     * Sets the time after which the measurements in the cache should expire.
     * @param days Days to keep cached measurements.
     */
	setCacheMeasurementExpiry: function (days) {
		core.setCacheMeasurementExpiry(days);
	},

    /**
     * Returns the time after which the measurements in the cache should expire.
     * @return Days to keep cached measurements.
     */
	getCacheMeasurementExpiry: function () {
		return core.getCacheMeasurementExpiry();
	},

    /**
     * Returns the interval between automated cache flushes.
     * @return Time between successive flushes of cached measurements (in seconds), 0 if disabled.
     */
	getCacheFlushingInterval: function () {
		return core.getCacheFlushingInterval();
	},

    /**
     * Sets the interval between automated cache flushes.
     * @param seconds Time between successive flushes of cached measurements (in seconds), 0 if disabled.
     */
	setCacheFlushingInterval: function (seconds) {
		core.setCacheFlushingInterval(seconds);
	},

    /**
     * Sets the secure mode. In the secure mode measurements will be transmitted via HTTPS protocol.
     * @param secure True if secure, false otherwise.
     */
	setSecure: function (secure) {
		core.setSecure(secure);
	},

    /**
     * Returns the secure mode value.
     * @return True if secure, false otherwise.
     */
	isSecure: function () {
		return core.isSecure();
	},

    /**
     * Returns labels order which will be used for measurements.
     * @return Labels order.
     */
	getMeasurementLabelOrder: function () {
		return core.getMeasurementLabelOrder();
	},

    /**
     * Allows to specify the order in which labels will be present in the dispatched measurement.
     * @param ordering String array with the labels order.
     */
	setMeasurementLabelOrder: function (ordering) {
		core.setMeasurementLabelOrder(ordering);
	},

    /**
     * If enabled dispatches the start measurement when moving out of inactive state, however only if no start measurement has been dispatched yet.
     * @param value AutoStartEnabled value.
     */
	setAutoStartEnabled: function (value) {
		core.setAutoStartEnabled(value);
	},

    /**
     * If enabled dispatches the start measurement when moving out of inactive state, however only if no start measurement has been dispatched yet.
     * @return AutoStartEnabled value
     */
	isAutoStartEnabled: function () {
		return core.isAutoStartEnabled();
	},

    /**
     * Returns comScore version.
     * @return comScore version.
     */
	getVersion: function () {
		return core.getVersion();
	},

    /**
     * Returns a PlatformAPI object with information and resources about the platform
     * @returns {*}
     */
	getPlatformAPI: function () {
		return core.getPlatformAPI();
	},

    /**
     * Sets the PlatformAPI object to be used for dealing with platform specific resources and characteristics
     * @param platformName The PlatformAPI name to be used
     */
	setPlatformAPI: function (platformName) {
		core.setPlatformAPI(platformName);
	},

    /* Sets the url used to flush the offline cache.
     * @param value
     */
	setOfflineURL: function (value) {
		core.setOfflineURL(value);
	},

    /*
     * Cleans the storage data. Be aware that offline measurements might also be deleted in certain platforms.
     * Currently, executing this method without disabling the library is allowed
     * so if that is the case an inconsistent will be reached.
     * */
	clearInternalData: function () {
		core.clearInternalData();
	},

	cacheHttpRedirects: function () {
		core.cacheHttpRedirects();
	}
};

module.exports = comScore;

},{"5":5,"8":8}],3:[function(require,module,exports){
var objectUtils = require(24),
	PlatformAPI = require(36),
	TransmissionMode = require(8).TransmissionMode,

	CACHE_MIN_SECS_ONLINE = 30;

function ConnectivityChangeReceiver (core) {
	var self = this,
		MONITOR_TIMEOUT = 1000,
		isForeground = false,
		connectivityTimer = null,
		monitorTimer = null,
		nextFlushTime = -1,
		connected;

	function onDisconnected() {
		cancelTimer();
		nextFlushTime = -1;
	}

	function onConnected() {
		// if automatic POSTs are enabled
		if (core.getOfflineTransmissionMode() != TransmissionMode.NEVER && core.getOfflineTransmissionMode() != TransmissionMode.DISABLED) {
			resumeTimer(false);
		}
	}

	function flush() {
		core.flush();
		nextFlushTime = -1;
		connectivityTimer = null;
	}

	function cancelTimer() {
		if (connectivityTimer) {
			PlatformAPI.clearTimeout(connectivityTimer);
			connectivityTimer = null;
		}
	}

	function resumeTimer(cont) {
		var now = +new Date();
		if (isForeground) {
			cancelTimer();
			if (nextFlushTime < now || nextFlushTime < 0 || !cont) {
				nextFlushTime = now + CACHE_MIN_SECS_ONLINE * 1000;
			}
			connectivityTimer = PlatformAPI.setTimeout(flush, nextFlushTime - now);
		} else if (nextFlushTime < 0) {
			nextFlushTime = now + CACHE_MIN_SECS_ONLINE * 1000;
		}
	}

	function monitorConnection() {
		var state = PlatformAPI.isConnectionAvailable();
		if (state != connected) {
			connected = state;
			if (connected) {
				onConnected();
			} else {
				onDisconnected();
			}
		}

		if (isForeground) {
			monitorTimer = PlatformAPI.setTimeout(monitorConnection, MONITOR_TIMEOUT);
		}
	}

	objectUtils.extend(self, {
		start: function() {
			isForeground = true;

			if (connected && nextFlushTime > 0) {
				resumeTimer(true);
			}

			monitorTimer = PlatformAPI.setTimeout(monitorConnection, MONITOR_TIMEOUT);
		},

		stop: function() {
			PlatformAPI.clearTimeout(monitorTimer);
			monitorTimer = null;

			isForeground = false;

			cancelTimer();
		}
	});
}

module.exports = ConnectivityChangeReceiver;

},{"24":24,"36":36,"8":8}],4:[function(require,module,exports){
var Constants = {
	PAGE_NAME_LABEL: 'name',
	RESTRICTED_URL_LENGTH_LIMIT: 2048,
	URL_LENGTH_LIMIT: 4096,

    // CONSTANTS
	PREVIOUS_VERSION_KEY: 'previousVersion',

	LABELS_ORDER: [
		/* DATA_STORAGE_DISTRIBUTION_LABELS */
		'c1', 'c2', 'ca2', 'cb2', 'cc2', 'cd2', 'ns_site', 'ca_ns_site', 'cb_ns_site', 'cc_ns_site', 'cd_ns_site', 'ns_vsite', 'ca_ns_vsite', 'cb_ns_vsite', 'cc_ns_vsite', 'cd_ns_vsite', 'ns_alias', 'ca_ns_alias', 'cb_ns_alias', 'cc_ns_alias', 'cd_ns_alias',
		/* APPLICATION_TAG_CORE_LABELS */
		'ns_ap_an', 'ca_ns_ap_an', 'cb_ns_ap_an', 'cc_ns_ap_an', 'cd_ns_ap_an', 'ns_ap_pn', 'ns_ap_pv', 'c12', 'ca12', 'cb12', 'cc12', 'cd12', 'ns_ak', 'ns_ap_hw', 'name', 'ns_ap_ni', 'ns_ap_ec', 'ns_ap_ev', 'ns_ap_device', 'ns_ap_id', 'ns_ap_csf', 'ns_ap_bi', 'ns_ap_pfm', 'ns_ap_pfv', 'ns_ap_ver', 'ca_ns_ap_ver', 'cb_ns_ap_ver', 'cc_ns_ap_ver', 'cd_ns_ap_ver', 'ns_ap_sv', 'ns_ap_bv', 'ns_ap_cv', 'ns_ap_smv', 'ns_type', 'ca_ns_type', 'cb_ns_type', 'cc_ns_type', 'cd_ns_type', 'ns_radio', 'ns_nc', 'cs_partner', 'cs_xcid', 'cs_impid', 'ns_ap_ui', 'ca_ns_ap_ui', 'cb_ns_ap_ui', 'cc_ns_ap_ui', 'cd_ns_ap_ui', 'ns_ap_gs', 'ns_ap_ie',
		/* STREAMING_TAG_CORE_LABELS */
		'ns_st_sv', 'ns_st_pv', 'ns_st_smv', 'ns_st_it', 'ns_st_id', 'ns_st_ec', 'ns_st_sp', 'ns_st_sc', 'ns_st_psq', 'ns_st_asq', 'ns_st_sq', 'ns_st_ppc', 'ns_st_apc', 'ns_st_spc', 'ns_st_atpc', 'ns_st_cn', 'ns_st_ev', 'ns_st_po', 'ns_st_cl', 'ns_st_el', 'ns_st_sl', 'ns_st_pb', 'ns_st_hc', 'ns_st_mp', 'ca_ns_st_mp', 'cb_ns_st_mp', 'cc_ns_st_mp', 'cd_ns_st_mp', 'ns_st_mv', 'ca_ns_st_mv', 'cb_ns_st_mv', 'cc_ns_st_mv', 'cd_ns_st_mv', 'ns_st_pn', 'ns_st_tp', 'ns_st_ad', 'ns_st_li', 'ns_st_ci', 'ns_st_si', 'ns_st_pt', 'ns_st_dpt', 'ns_st_ipt', 'ns_st_ap', 'ns_st_dap', 'ns_st_et', 'ns_st_det', 'ns_st_upc', 'ns_st_dupc', 'ns_st_iupc', 'ns_st_upa', 'ns_st_dupa', 'ns_st_iupa', 'ns_st_lpc', 'ns_st_dlpc', 'ns_st_lpa', 'ns_st_dlpa', 'ns_st_pa', 'ns_st_ldw', 'ns_st_ldo', 'ns_st_ie',
		/* APPLICATION_TAG_OTHER_LABELS_EXCLUDING_C7_AND_C9 */
		'ns_ap_jb', 'ns_ap_et', 'ns_ap_res', 'ns_ap_sd', 'ns_ap_po', 'ns_ap_ot', 'ns_ap_c12m', 'cs_c12u', 'ca_cs_c12u', 'cb_cs_c12u', 'cc_cs_c12u', 'cd_cs_c12u', 'ns_ap_install', 'ns_ap_updated', 'ns_ap_lastrun', 'ns_ap_cs', 'ns_ap_runs', 'ns_ap_usage', 'ns_ap_fg', 'ns_ap_ft', 'ns_ap_dft', 'ns_ap_bt', 'ns_ap_dbt', 'ns_ap_dit', 'ns_ap_as', 'ns_ap_das', 'ns_ap_it', 'ns_ap_uc', 'ns_ap_aus', 'ns_ap_daus', 'ns_ap_us', 'ns_ap_dus', 'ns_ap_ut', 'ns_ap_oc', 'ns_ap_uxc', 'ns_ap_uxs', 'ns_ap_lang', 'ns_ap_ar', 'ns_ap_miss', 'ns_ts', 'ns_ap_cfg', 'ns_ap_env', 'ns_ap_ais',
		/* STREAMING_TAG_OTHER_LABELS */
		'ns_st_ca', 'ns_st_cp', 'ns_st_er', 'ca_ns_st_er', 'cb_ns_st_er', 'cc_ns_st_er', 'cd_ns_st_er', 'ns_st_pe', 'ns_st_ui', 'ca_ns_st_ui', 'cb_ns_st_ui', 'cc_ns_st_ui', 'cd_ns_st_ui', 'ns_st_bc', 'ns_st_dbc', 'ns_st_bt', 'ns_st_dbt', 'ns_st_bp', 'ns_st_lt', 'ns_st_skc', 'ns_st_dskc', 'ns_st_ska', 'ns_st_dska', 'ns_st_skd', 'ns_st_skt', 'ns_st_dskt', 'ns_st_pc', 'ns_st_dpc', 'ns_st_pp', 'ns_st_br', 'ns_st_pbr', 'ns_st_rt', 'ns_st_prt', 'ns_st_ub', 'ns_st_vo', 'ns_st_pvo', 'ns_st_ws', 'ns_st_pws', 'ns_st_ki', 'ns_st_rp', 'ns_st_bn', 'ns_st_tb', 'ns_st_an', 'ns_st_ta', 'ns_st_pl', 'ns_st_pr', 'ns_st_tpr', 'ns_st_sn', 'ns_st_en', 'ns_st_ep', 'ns_st_tep', 'ns_st_sr', 'ns_st_ty', 'ns_st_ct', 'ns_st_cs', 'ns_st_ge', 'ns_st_st', 'ns_st_stc', 'ns_st_ce', 'ns_st_ia', 'ns_st_dt', 'ns_st_ddt', 'ns_st_tdt', 'ns_st_tm', 'ns_st_dtm', 'ns_st_ttm', 'ns_st_de', 'ns_st_pu', 'ns_st_ti', 'ns_st_cu', 'ns_st_fee', 'ns_st_ft', 'ns_st_at', 'ns_st_pat', 'ns_st_vt', 'ns_st_pvt', 'ns_st_tt', 'ns_st_ptt', 'ns_st_cdn', 'ns_st_pcdn', 'ns_st_amg', 'ns_st_ami', 'ns_st_amp', 'ns_st_amt', 'ns_st_ams',
		/* ADDITIONAL_UID_LABELS */
		'ns_ap_i1', 'ns_ap_i2', 'ns_ap_i3', 'ns_ap_i4', 'ns_ap_i5', 'ns_ap_i6',
		/* CAMPAIGN_LABELS */
		'ns_ap_referrer', 'ns_clid', 'ns_campaign', 'ns_source', 'ns_mchannel', 'ns_linkname', 'ns_fee', 'gclid', 'utm_campaign', 'utm_source', 'utm_medium', 'utm_term', 'utm_content',
		/* E-COMMERCE_TAG_LABELS */
		'ns_ecommerce', 'ns_ec_sv', 'ns_client_id', 'ns_order_id', 'ns_ec_cur', 'ns_orderline_id', 'ns_orderlines', 'ns_prod_id', 'ns_qty', 'ns_prod_price', 'ns_prod_grp', 'ns_brand', 'ns_shop',
		/* OTHER_DAX_LABELS */
		'ns_category', 'category', 'ns_c', 'ns_search_term', 'ns_search_result', 'ns_m_exp', 'ns_m_chs',
		/* OTHER_REMAINING_LABELS */
		'c3', 'ca3', 'cb3', 'cc3', 'cd3', 'c4', 'ca4', 'cb4', 'cc4', 'cd4', 'c5', 'ca5', 'cb5', 'cc5', 'cd5', 'c6', 'ca6', 'cb6', 'cc6', 'cd6', 'c10', 'c11', 'c13', 'c14', 'c15', 'c16', 'c7', 'c8', 'c9', 'ns_ap_er', 'ns_st_amc'
	]
};

module.exports = Constants;

},{}],5:[function(require,module,exports){
var ApplicationState = require(8).ApplicationState,
	SessionState = require(8).SessionState,
	Constants = require(4),
	typeCastingUtils = require(26),
	CommonConstants = require(17),
	EventType = require(8).EventType,
	PlatformAPI = require(36),
	generalUtils = require(21),
	objectUtils = require(24),
	md5 = require(22),
	rsaEncrypt = require(25),
	DispatchProperties = require(6),
	MeasurementDispatcher = require(11),
	DispatchQueue = require(7),
	KeepAlive = require(9),
	OfflineMeasurementsCache = require(12).OfflineMeasurementsCache,
	CacheFlusher = require(1),
	ConnectivityChangeReceiver = require(3),

	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	CORE_VERSION = '6.3.4.190424',
	CENSUS_URL = 'http://b.scorecardresearch.com/p2?',
	CENSUS_URL_SECURE = 'https://sb.scorecardresearch.com/p2?',
	SESSION_INACTIVE_PERIOD = 30 * 60 * 1000,
	USER_SESSION_INACTIVE_PERIOD = 5 * 60 * 1000,
	AUTOUPDATE_INTERVAL_IN_SECONDS = 60,
	MINIMAL_AUTOUPDATE_INTERVAL = 60 * 1000,
	EXIT_CODE_KEY = 'exitCode',
	LAST_APPLICATION_ACCUMULATION_TIMESTAMP_KEY = 'lastApplicationAccumulationTimestamp',
	LAST_SESSION_ACCUMULATION_TIMESTAMP_KEY = 'lastSessionAccumulationTimestamp',
	LAST_APPLICATION_SESSION_TIMESTAMP_KEY = 'lastApplicationSessionTimestamp',
	LAST_USER_SESSION_TIMESTAMP_KEY = 'lastUserSessionTimestamp',
	LAST_ACTIVE_USER_SESSION_TIMESTAMP_KEY = 'lastActiveUserSessionTimestamp',
	FOREGROUND_TRANSITION_COUNT_KEY = 'foregroundTransitionsCount',
	ACCUMULATED_FOREGROUND_TIME_KEY = 'accumulatedForegroundTime',
	ACCUMULATED_BACKGROUND_TIME_KEY = 'accumulatedBackgroundTime',
	ACCUMULATED_INACTIVE_TIME_KEY = 'accumulatedInactiveTime',
	TOTAL_FOREGROUND_TIME_KEY = 'totalForegroundTime',
	TOTAL_BACKGROUND_TIME_KEY = 'totalBackgroundTime',
	TOTAL_INACTIVE_TIME_KEY = 'totalInactiveTime',
	ACCUMULATED_APPLICATION_SESSION_TIME_KEY = 'accumulatedApplicationSessionTime',
	ACCUMULATED_ACTIVE_USER_SESSION_TIME_KEY = 'accumulatedActiveUserSessionTime',
	ACCUMULATED_USER_SESSION_TIME_KEY = 'accumulatedUserSessionTime',
	ACTIVE_USER_SESSION_COUNT_KEY = 'activeUserSessionCount',
	USER_SESSION_COUNT_KEY = 'userSessionCount',
	LAST_USER_INTERACTION_TIMESTAMP_KEY = 'lastUserInteractionTimestamp',
	USER_INTERACTION_COUNT_KEY = 'userInteractionCount',
	APPLICATION_SESSION_COUNT_KEY = 'applicationSessionCountKey',
	GENESIS_KEY = 'genesis',
	PREVIOUS_GENESIS_KEY = 'previousGenesis',
	INSTALL_ID_KEY = 'installId',
	FIRST_INSTALL_ID_KEY = 'firstInstallId',
	CURRENT_VERSION_KEY = 'currentVersion',
	RUNS_COUNT_KEY = 'runs',
	COLD_START_COUNT_KEY = 'coldStartCount',
	VID_KEY = 'vid',
	CROSSPUBLISHER_ID_MD5 = 'crossPublisherIdHashed',
	CROSSPUBLISHER_ID_RSA = 'crossPublisherId';

function Core () {
    // OBJECTS
	var self = this,
		offlineCache,
		storage,
		keepAlive,
		cacheFlusher,
		dispatchQueue,
		connectivityStatusReceiver,
		dispatchProperties,
		autoUpdateTimer,
		measurementDispatcher,
    // COMMON STATE MACHINE FIELDS
		autoUpdateInterval,
		autoUpdateInForegroundOnly = true,
		coldStartDispatched = false,
		runsCount,
		coldStartId,
		coldStartCount,
		installId, firstInstallId,
		currentVersion, previousVersion,
		autoStartEnabled = true,
		currentActivityName,
    // APPLICATION STATE MACHINE
		currentApplicationState = ApplicationState.INACTIVE,
		foregroundComponentsCount, activeUxComponentsCount,
		foregroundTransitionsCount,
		totalForegroundTime, totalBackgroundTime, totalInactiveTime,
		accumulatedBackgroundTime, accumulatedForegroundTime, accumulatedInactiveTime,
		genesis, previousGenesis,
		lastApplicationAccumulationTimestamp,
    // SESSION STATE MACHINE
		currentSessionState = SessionState.INACTIVE,
		accumulatedApplicationSessionTime, accumulatedUserSessionTime, accumulatedActiveUserSessionTime,
		applicationSessionCount, userSessionCount, activeUserSessionCount,
		lastApplicationSessionTimestamp, lastUserSessionTimestamp, lastActiveUserSessionTimestamp, // Necessary for proper session validation
		userInteractionCount,
		lastUserInteractionTimestamp,
		lastSessionAccumulationTimestamp,
		userInteractionTimer,
    // SETTINGS
		isPixelURLConfigured = false,
		isSecureConfigured = false,
		pixelURL,
		visitorID,
		isCrossPublisherIdChanged = false,
		isFirstCrossPublisherIdRetrieval = true,
		cachedCipheredCrossPublisherId,
		cachedHashedCrossPublisherId,
		salt,
		appName,
		exitCode,
		appContextSuccessfullyInitialised = false,
		customLabels,
		autoStartLabels,
		cacheFlushingInterval = 0,
		enabled,
		isHttpRedirectCaching;

    // PRIVATE METHODS

	function initializeContextDependant() {
		self.initializeStorage();
		dispatchQueue = new DispatchQueue(self);
		keepAlive = new KeepAlive(self);
		self.initializeOfflineCache();
		self.initializeCacheFlusher();
		self.initializeConnectivityChangeReceiver();
		measurementDispatcher = new MeasurementDispatcher(self);
		dispatchProperties = new DispatchProperties();

		self.enableAutoUpdate();

		initializeStateMachines();
	}

	function initializeStateMachines() {
        // Loading previously stored values
		lastApplicationAccumulationTimestamp = typeCastingUtils.parseLong(storage.get(LAST_APPLICATION_ACCUMULATION_TIMESTAMP_KEY), -1);
		lastSessionAccumulationTimestamp = typeCastingUtils.parseLong(storage.get(LAST_SESSION_ACCUMULATION_TIMESTAMP_KEY), -1);
		lastApplicationSessionTimestamp = typeCastingUtils.parseLong(storage.get(LAST_APPLICATION_SESSION_TIMESTAMP_KEY), -1);
		lastUserSessionTimestamp = typeCastingUtils.parseLong(storage.get(LAST_USER_SESSION_TIMESTAMP_KEY), -1);
		lastActiveUserSessionTimestamp = typeCastingUtils.parseLong(storage.get(LAST_ACTIVE_USER_SESSION_TIMESTAMP_KEY), -1);

		foregroundTransitionsCount = typeCastingUtils.parseInteger(storage.get(FOREGROUND_TRANSITION_COUNT_KEY));
		accumulatedForegroundTime = typeCastingUtils.parseLong(storage.get(ACCUMULATED_FOREGROUND_TIME_KEY));
		accumulatedBackgroundTime = typeCastingUtils.parseLong(storage.get(ACCUMULATED_BACKGROUND_TIME_KEY));
		accumulatedInactiveTime = typeCastingUtils.parseLong(storage.get(ACCUMULATED_INACTIVE_TIME_KEY));

		totalForegroundTime = typeCastingUtils.parseLong(storage.get(TOTAL_FOREGROUND_TIME_KEY));
		totalBackgroundTime = typeCastingUtils.parseLong(storage.get(TOTAL_BACKGROUND_TIME_KEY));
		totalInactiveTime = typeCastingUtils.parseLong(storage.get(TOTAL_INACTIVE_TIME_KEY));

		accumulatedApplicationSessionTime = typeCastingUtils.parseLong(storage.get(ACCUMULATED_APPLICATION_SESSION_TIME_KEY));
		accumulatedActiveUserSessionTime = typeCastingUtils.parseLong(storage.get(ACCUMULATED_ACTIVE_USER_SESSION_TIME_KEY));
		accumulatedUserSessionTime = typeCastingUtils.parseLong(storage.get(ACCUMULATED_USER_SESSION_TIME_KEY));

		activeUserSessionCount = typeCastingUtils.parseInteger(storage.get(ACTIVE_USER_SESSION_COUNT_KEY), -1);
		userSessionCount = typeCastingUtils.parseInteger(storage.get(USER_SESSION_COUNT_KEY), -1);
		lastUserInteractionTimestamp = typeCastingUtils.parseLong(storage.get(LAST_USER_INTERACTION_TIMESTAMP_KEY), -1);
		userInteractionCount = typeCastingUtils.parseInteger(storage.get(USER_INTERACTION_COUNT_KEY), 0);
		applicationSessionCount = typeCastingUtils.parseInteger(storage.get(APPLICATION_SESSION_COUNT_KEY), 0);

		exitCode = storage.get(EXIT_CODE_KEY) ? parseInt(storage.get(EXIT_CODE_KEY)) : 0;

		currentVersion = PlatformAPI.getAppVersion();

		previousGenesis = typeCastingUtils.parseLong(storage.get(PREVIOUS_GENESIS_KEY), 0);
		genesis = typeCastingUtils.parseLong(storage.get(GENESIS_KEY), -1);

        // Restoring genesis
		if (genesis < 0) {
            // This is first run
			genesis = +new Date();
			previousGenesis = 0;
			lastApplicationSessionTimestamp = genesis;
			applicationSessionCount++;
		} else {
            // Let's validate the session
			if (!validateApplicationSession()) {
                // if not expired
				accumulatedApplicationSessionTime += (+new Date() - lastSessionAccumulationTimestamp);
				storage.set(ACCUMULATED_APPLICATION_SESSION_TIME_KEY, accumulatedApplicationSessionTime + '');
			}
			lastApplicationSessionTimestamp = genesis;
		}

		firstInstallId = typeCastingUtils.parseLong(storage.get(FIRST_INSTALL_ID_KEY), -1);
		if (firstInstallId < 0) {
            // first install
			firstInstallId = genesis;
			installId = genesis;

			if (currentVersion && currentVersion != UNKNOWN_VALUE) {
                // we don't store "unknown" app version as it may be reset manually
				storage.set(CURRENT_VERSION_KEY, currentVersion + '');
			}

			storage.set(FIRST_INSTALL_ID_KEY, firstInstallId + '');
			storage.set(INSTALL_ID_KEY, installId + '');
		} else {
            // storing application version
			self.setAppVersion(currentVersion);
		}

		storage.set(GENESIS_KEY, genesis + '');
		storage.set(PREVIOUS_GENESIS_KEY, previousGenesis + '');
        //set exit code to current genesis value
		self.setExitCode(genesis);


		var now = +new Date();
        // Accumulating inactive time
		if (lastApplicationAccumulationTimestamp >= 0) {
			var delta = (now - lastApplicationAccumulationTimestamp);
			accumulatedInactiveTime += delta;
			storage.set(ACCUMULATED_INACTIVE_TIME_KEY, accumulatedInactiveTime + '');
			totalInactiveTime += delta;
			storage.set(TOTAL_INACTIVE_TIME_KEY, totalInactiveTime + '');
		}

        // We just accumulated inactive time so we need to refresh the timestamp
		lastSessionAccumulationTimestamp = lastApplicationAccumulationTimestamp = now;
		storage.set(LAST_APPLICATION_ACCUMULATION_TIMESTAMP_KEY, lastApplicationAccumulationTimestamp + '');
		storage.set(LAST_SESSION_ACCUMULATION_TIMESTAMP_KEY, lastSessionAccumulationTimestamp + '');
		storage.set(LAST_APPLICATION_SESSION_TIMESTAMP_KEY, lastApplicationSessionTimestamp + '');

        // Incrementing run count
		if (!storage.has(RUNS_COUNT_KEY)) {
			storage.set(RUNS_COUNT_KEY, '0');
		}
		runsCount = typeCastingUtils.parseInteger(storage.get(RUNS_COUNT_KEY));
		coldStartCount = typeCastingUtils.parseInteger(storage.get(COLD_START_COUNT_KEY));
	}

    /**
     * Retrieve a property value from Storage
     *
     * @param property key for the value to retrieve
     * @return string value
     */
	function retrieveProperty(property) {
		var value;

		if (storage.has(property)) {
			value = storage.get(property);
			return value + '';
		}

		return null;
	}

    /**
     * Callback method that is invoked after all accumulations take place.
     * @param oldState
     * @param newState
     */
	function onApplicationStateChanged(oldState, newState) {
		if (!enabled) return;
		if (newState != ApplicationState.INACTIVE && self.isAutoStartEnabled() && !coldStartDispatched) {
			self.notify(EventType.START, autoStartLabels);
		}
	}

	function onExitApplicationState(state) {
		if (!enabled) return;

		switch (state) {
			case ApplicationState.INACTIVE:
                // Outside ApplicationState.INACTIVE, measurement can be sent again.
				dispatchQueue.dispatchToCache(false);
                // We consider all the time that we have been paused without sending a KeepAlive.
				keepAlive.checkDelayedKeepAlive();
                // start keep-alive timer
				keepAlive.restart();
				connectivityStatusReceiver.start();
				cacheFlusher.start();
				break;
			case ApplicationState.BACKGROUND_UX_ACTIVE:
				stopAutoUpdateTimer();
				break;
			case ApplicationState.FOREGROUND:
				self.setCurrentActivityName(null);
				stopAutoUpdateTimer();
				break;
		}
	}

	function onEnterApplicationState(state) {
		if (!enabled) return;

		switch (state) {
			case ApplicationState.INACTIVE:
				connectivityStatusReceiver.stop();
				keepAlive.pause();
				cacheFlusher.stop();
				stopAutoUpdateTimer();

                // During ApplicationState.INACTIVE, we do not want any measurement to be sent.
				dispatchQueue.dispatchToCache(true);
				break;
			case ApplicationState.BACKGROUND_UX_ACTIVE:
				if (!autoUpdateInForegroundOnly) {
					startAutoUpdateTimer();
				}

				break;
			case ApplicationState.FOREGROUND:
                // Report foreground counter increment
				startAutoUpdateTimer();
				foregroundTransitionsCount++;

				break;
		}
	}

    /**
     * Callback method that is invoked after all accumulations take place.
     * @param oldState
     * @param newState
     */
	function onSessionStateChanged(oldState, newState) {

	}

	function onExitSessionState(state) {
		if (!enabled) return;
		var now = +new Date();
		switch (state) {
			case SessionState.ACTIVE_USER:
				if (userInteractionTimer != null) {
					PlatformAPI.clearTimeout(userInteractionTimer);
					userInteractionTimer = null;
				}
				lastActiveUserSessionTimestamp = now;
				// falls through

			case SessionState.USER:
				lastUserSessionTimestamp = now;
				// falls through

			case SessionState.APPLICATION:
				lastApplicationSessionTimestamp = now;
				break;
			case SessionState.INACTIVE:
                // Let's validate the session
				if (!validateApplicationSession()) {
                    // if not expired
					accumulatedApplicationSessionTime += (now - lastSessionAccumulationTimestamp);
				}
				break;
		}
	}

	function onEnterSessionState(state) {
		if (!enabled) return;
		switch (state) {
			case SessionState.ACTIVE_USER:
				validateActiveUserSession();
				self.scheduleUserInteractionTask();
				// falls through

			case SessionState.USER:
				validateUserSession();
				// falls through

			case SessionState.APPLICATION:
				validateApplicationSession();
				break;
			case SessionState.INACTIVE:
				break;
		}
	}

    /**
     * Check if current session is expired, and if yes, renew its value.
     * Can be called only when entering the proper state.
     * @return True if session expired.
     */
	function validateApplicationSession() {
		var now = +new Date();
		var sessionExpired = false;
		if ((now - lastApplicationSessionTimestamp) > SESSION_INACTIVE_PERIOD) {
			previousGenesis = genesis;
			genesis = now;
			applicationSessionCount++;
			sessionExpired = true;
		}
		lastApplicationSessionTimestamp = now;
		return sessionExpired;
	}

    /**
     * Verifies if current active user session is still valid.
     * Can be called only when entering the proper state.
     */
	function validateActiveUserSession() {
		var now = +new Date();
		if ((now - lastActiveUserSessionTimestamp) >= USER_SESSION_INACTIVE_PERIOD) {
			activeUserSessionCount++; // renewing active user session id
		}
		lastActiveUserSessionTimestamp = now;
	}

    /**
     * Verifies if current user session is still valid.
     * Can be called only when entering the proper state
     */
	function validateUserSession() {
		var now = +new Date();
		if ((now - lastUserSessionTimestamp) >= USER_SESSION_INACTIVE_PERIOD) {
			userSessionCount++; // renewing active user session id
		}
		lastUserSessionTimestamp = now;
	}

	function accumulateApplicationData(store) {
		if (!enabled) return;

        // Set default value
		store = typeof store !== _undefined ? store : true;

        // Accumulating values
		var newApplicationAccumulationTimestamp = +new Date();
		var delta = newApplicationAccumulationTimestamp - lastApplicationAccumulationTimestamp;
		switch (currentApplicationState) {
			case ApplicationState.FOREGROUND:
				accumulatedForegroundTime += delta;
				totalForegroundTime += delta;
				break;
			case ApplicationState.BACKGROUND_UX_ACTIVE:
				accumulatedBackgroundTime += delta;
				totalBackgroundTime += delta;
				break;
			case ApplicationState.INACTIVE:
				accumulatedInactiveTime += delta;
				totalInactiveTime += delta;
				break;
		}

		lastApplicationAccumulationTimestamp = newApplicationAccumulationTimestamp;

		if (store) {

			storage.set(LAST_APPLICATION_ACCUMULATION_TIMESTAMP_KEY, lastApplicationAccumulationTimestamp + '');
			storage.set(FOREGROUND_TRANSITION_COUNT_KEY, foregroundTransitionsCount + '');
			storage.set(ACCUMULATED_FOREGROUND_TIME_KEY, accumulatedForegroundTime + '');
			storage.set(ACCUMULATED_BACKGROUND_TIME_KEY, accumulatedBackgroundTime + '');
			storage.set(ACCUMULATED_INACTIVE_TIME_KEY, accumulatedInactiveTime + '');
			storage.set(TOTAL_FOREGROUND_TIME_KEY, totalForegroundTime + '');
			storage.set(TOTAL_BACKGROUND_TIME_KEY, totalBackgroundTime + '');
			storage.set(TOTAL_INACTIVE_TIME_KEY, totalInactiveTime + '');
		}
	}

	function accumulateSessionData(store) {

		if (!enabled) return;

        // Set default value
		store = typeof store !== _undefined ? store : true;

        // Accumulating values
		var now = +new Date();
		var delta = now - lastSessionAccumulationTimestamp;
        // Session states are cascaded, being in higher priority state implicates that lower priority states are also active
        // Inactive state is an exception
		switch (currentSessionState) {
			case SessionState.ACTIVE_USER:
				accumulatedActiveUserSessionTime += delta;
				lastActiveUserSessionTimestamp = now;
				// falls through

			case SessionState.USER:
				accumulatedUserSessionTime += delta;
				lastUserSessionTimestamp = now;
				// falls through

			case SessionState.APPLICATION:
				accumulatedApplicationSessionTime += delta;
				lastApplicationSessionTimestamp = now;
				break;
			case SessionState.INACTIVE:
				break;
		}

		lastSessionAccumulationTimestamp = now;

		if (store) {

			storage.set(LAST_SESSION_ACCUMULATION_TIMESTAMP_KEY, lastSessionAccumulationTimestamp + '');
			storage.set(LAST_APPLICATION_SESSION_TIMESTAMP_KEY, lastApplicationSessionTimestamp + '');
			storage.set(LAST_USER_SESSION_TIMESTAMP_KEY, lastUserSessionTimestamp + '');
			storage.set(LAST_ACTIVE_USER_SESSION_TIMESTAMP_KEY, lastActiveUserSessionTimestamp + '');

			storage.set(ACCUMULATED_APPLICATION_SESSION_TIME_KEY, accumulatedApplicationSessionTime + '');
			storage.set(ACCUMULATED_ACTIVE_USER_SESSION_TIME_KEY, accumulatedActiveUserSessionTime + '');
			storage.set(ACCUMULATED_USER_SESSION_TIME_KEY, accumulatedUserSessionTime + '');
			storage.set(ACTIVE_USER_SESSION_COUNT_KEY, activeUserSessionCount + '');
			storage.set(USER_SESSION_COUNT_KEY, userSessionCount + '');
			storage.set(LAST_USER_INTERACTION_TIMESTAMP_KEY, lastUserInteractionTimestamp + '');
			storage.set(USER_INTERACTION_COUNT_KEY, userInteractionCount + '');
			storage.set(PREVIOUS_GENESIS_KEY, previousGenesis + '');
			storage.set(GENESIS_KEY, genesis + '');
			storage.set(APPLICATION_SESSION_COUNT_KEY, applicationSessionCount + '');
		}
	}

	function updateState() {
		if (!enabled) return;
		var now = +new Date();

		var newApplicationState;
		if (foregroundComponentsCount > 0) { // Foreground state has higher priority than background state
			newApplicationState = ApplicationState.FOREGROUND;
		} else if (activeUxComponentsCount > 0) {
			newApplicationState = ApplicationState.BACKGROUND_UX_ACTIVE;
		} else {
			newApplicationState = ApplicationState.INACTIVE;
		}

		var newSessionState;
		if (now - lastUserInteractionTimestamp < USER_SESSION_INACTIVE_PERIOD) {
			newSessionState = SessionState.ACTIVE_USER;
		} else if (activeUxComponentsCount > 0) {
			newSessionState = SessionState.USER;
		} else if (foregroundComponentsCount > 0) {
			newSessionState = SessionState.APPLICATION;
		} else {
			newSessionState = SessionState.INACTIVE;
		}

		var oldApplicationState = currentApplicationState;
		var oldSessionState = currentSessionState;
		if (newApplicationState != oldApplicationState || newSessionState != oldSessionState) {

			var applicationStateChanged = false;
			var sessionStateChanged = false;
			if (oldApplicationState != newApplicationState) {
				onExitApplicationState(currentApplicationState);
				onEnterApplicationState(newApplicationState);
				accumulateApplicationData(); // accumulating
				currentApplicationState = newApplicationState;
				applicationStateChanged = true;
			}
			if (oldSessionState != newSessionState) {
				onExitSessionState(currentSessionState);
				onEnterSessionState(newSessionState);
				accumulateSessionData(); // accumulating
				currentSessionState = newSessionState;
				sessionStateChanged = true;
			}

			if (applicationStateChanged) {
				onApplicationStateChanged(oldApplicationState, currentApplicationState);
			}

			if (sessionStateChanged) {
				onSessionStateChanged(oldSessionState, currentSessionState);
			}

		}
	}

	function setVisitorId(value, suffix) {
		if (!enabled) return;
		if (generalUtils.exists(value)) {
			suffix = generalUtils.exists(suffix) ? ('-cs' + suffix) : '';
			visitorID = value + suffix;
		} else if (visitorID == null && appContextSuccessfullyInitialised) { // just run once
			visitorID = md5(PlatformAPI.getVisitorId() + self.getSalt());

			if (typeof PlatformAPI.getVisitorIdSuffix == 'function' && PlatformAPI.getVisitorIdSuffix() != null) {
				visitorID = visitorID + '-cs' + PlatformAPI.getVisitorIdSuffix();
			}
		}
		storage.set(VID_KEY, visitorID + '');
	}

	function generateCrossPublisherId() {
        // For backward compatibility the empty string (actually any falsy value) is used as if it was null.
        // The method PlatformAPI.getCrossPublisherId is expected to return "rawCpi always_send".
        // The rawCpi might be the actual raw cpi value, "none" or "null"
        // always_send send is an string as "true" or "false" or nothing at all.
        // If only the rawCpi is pass, a false value is consider by default.
        // Null, empty string or a any falsy value are consider all as null in the decision tree.
		var cpiData = (PlatformAPI.getCrossPublisherId() || 'null').split(' ');

		var rawNs_ak = cpiData[0] && cpiData[0] != 'null' ? cpiData[0] : null;
		var always_send = cpiData[1] == 'true'; //The always_send parameter might not be there

        // Decision tree starts
		if (rawNs_ak == null) {
			cachedHashedCrossPublisherId = null;
			cachedCipheredCrossPublisherId = null;
			return;
		}

		if (!cachedCipheredCrossPublisherId) {
			cachedHashedCrossPublisherId = storage.get(CROSSPUBLISHER_ID_MD5); // When raw is "none" it will be null
			cachedCipheredCrossPublisherId = storage.get(CROSSPUBLISHER_ID_RSA); //It might be "none"
		}

		var newCpiHashedValue = null;

		if (!cachedCipheredCrossPublisherId) {
			if (rawNs_ak == 'none') {
				cachedHashedCrossPublisherId = null;
				cachedCipheredCrossPublisherId = 'none';
			} else {
				cachedHashedCrossPublisherId = md5(rawNs_ak);
				cachedCipheredCrossPublisherId = rsaEncrypt(rawNs_ak);
			}

			storage.set(CROSSPUBLISHER_ID_RSA, cachedCipheredCrossPublisherId);
			if(cachedHashedCrossPublisherId == null) {
				storage.remove(CROSSPUBLISHER_ID_MD5);
			} else {
				storage.set(CROSSPUBLISHER_ID_MD5, cachedHashedCrossPublisherId);
			}
		} else if (rawNs_ak == 'none' && cachedCipheredCrossPublisherId == 'none'
            || !isFirstCrossPublisherIdRetrieval && cachedCipheredCrossPublisherId == 'none'
            || rawNs_ak != 'none' && (newCpiHashedValue=md5(rawNs_ak)) == cachedHashedCrossPublisherId) {
            // Use the stored cpi
		} else if(always_send) {
			if (rawNs_ak == 'none') {
				cachedHashedCrossPublisherId = null;
				cachedCipheredCrossPublisherId = 'none';
			} else {
				cachedHashedCrossPublisherId = newCpiHashedValue;
				cachedCipheredCrossPublisherId = rsaEncrypt(rawNs_ak);
			}

			storage.set(CROSSPUBLISHER_ID_RSA, cachedCipheredCrossPublisherId);
			if(cachedHashedCrossPublisherId == null) {
				storage.remove(CROSSPUBLISHER_ID_MD5);
			}	else {
				storage.set(CROSSPUBLISHER_ID_MD5, cachedHashedCrossPublisherId);
			}
		} else {
			isCrossPublisherIdChanged = true;

			if (!isFirstCrossPublisherIdRetrieval || rawNs_ak == 'none') {
				cachedHashedCrossPublisherId = null;
				cachedCipheredCrossPublisherId = 'none';
			} else {
				cachedHashedCrossPublisherId = md5(rawNs_ak);
				cachedCipheredCrossPublisherId = rsaEncrypt(rawNs_ak);
			}

			storage.set(CROSSPUBLISHER_ID_RSA, cachedCipheredCrossPublisherId);
			if(cachedHashedCrossPublisherId == null) {
				storage.remove(CROSSPUBLISHER_ID_MD5);
			}	else {
				storage.set(CROSSPUBLISHER_ID_MD5, cachedHashedCrossPublisherId);
			}
		}

		isFirstCrossPublisherIdRetrieval = false;
	}

	function startAutoUpdateTimer() {
		if (!enabled) return;

		stopAutoUpdateTimer();

		if(autoUpdateInterval < MINIMAL_AUTOUPDATE_INTERVAL) return;

		var startAutoUpdateCallback = function () {
			self.update();
			if (autoUpdateTimer != null) {
				PlatformAPI.setTimeout(startAutoUpdateCallback, autoUpdateInterval);
			}
		};

		autoUpdateTimer = PlatformAPI.setTimeout(startAutoUpdateCallback, autoUpdateInterval);
	}

	function stopAutoUpdateTimer() {
		if (!enabled) return;
		if (autoUpdateTimer != null) {
			PlatformAPI.clearTimeout(autoUpdateTimer);
			autoUpdateTimer = null;
		}
	}

    /**
     * Check if Application context or C2 value or Publisher secret are
     * initialized
     *
     * @return true if initialized, false otherwise
     */
	function isNotProperlyInitialized() {
		return !appContextSuccessfullyInitialised || salt == null || salt.length === 0 || pixelURL == null || pixelURL.length === 0;
	}


    // PUBLIC METHODS
	objectUtils.extend(self, {
		isProperlyInitialized: function () {
			return !isNotProperlyInitialized();
		}, reset: function () {
			if (!enabled) return;
			dispatchProperties.reset();
			currentApplicationState = ApplicationState.INACTIVE;
			currentSessionState = SessionState.INACTIVE;
			coldStartDispatched = false;
			runsCount = 0;
			coldStartId = -1;
			coldStartCount = 0;
			firstInstallId = -1;
			installId = -1;
			currentVersion = null;
			previousVersion = null;
			foregroundComponentsCount = 0;
			activeUxComponentsCount = 0;
			totalForegroundTime = 0;
			totalBackgroundTime = 0;
			totalInactiveTime = 0;
			accumulatedBackgroundTime = 0;
			accumulatedForegroundTime = 0;
			accumulatedInactiveTime = 0;
			accumulatedApplicationSessionTime = 0;
			accumulatedActiveUserSessionTime = 0;
			accumulatedUserSessionTime = 0;
			genesis = -1;
			previousGenesis = 0;
			activeUserSessionCount = -1;
			userSessionCount = -1;
			userInteractionCount = 0;
			lastUserInteractionTimestamp = -1;
			lastApplicationAccumulationTimestamp = -1;
			lastSessionAccumulationTimestamp = -1;

			lastApplicationSessionTimestamp = -1;
			lastUserSessionTimestamp = -1;
			lastActiveUserSessionTimestamp = -1;

			installId = -1;
			firstInstallId = -1;
			exitCode = 0;

			isPixelURLConfigured = false;
			isSecureConfigured = false;

			self.disableAutoUpdate();

			if (userInteractionTimer != null) {
				PlatformAPI.clearTimeout(userInteractionTimer);
				userInteractionTimer = null;
			}

			if (keepAlive != null) {
				keepAlive.cancel();
			}

			if (cacheFlusher != null) {
				cacheFlusher.stop();
			}

			if(dispatchQueue != null) {
				dispatchQueue.clean();
				dispatchQueue = new DispatchQueue(self);
			}
		},

		initializeStorage: function (o) {
			storage = o || new PlatformAPI.Storage();
		},

		initializeOfflineCache: function (o) {
			offlineCache = o || new OfflineMeasurementsCache(self);
		},

		initializeCacheFlusher: function (o) {
			cacheFlusher = o || new CacheFlusher(self);
		},

		initializeConnectivityChangeReceiver: function (o) {
			connectivityStatusReceiver = new ConnectivityChangeReceiver(self);
		},

        /**
         * Load initial settings from storage
         */
		loadInitialSettings: function () {
			var appNameProperty = retrieveProperty('AppName');
			if (appNameProperty != null) {
				self.setAppName(appNameProperty);
			}

			var appVersionProperty = retrieveProperty('AppVersion');
			if (appVersionProperty != null) {
				self.setAppVersion(appVersionProperty);
			}
		},

		restoreVisitorId: function () {
			if (enabled) {
				if (storage.has(VID_KEY)) {
					visitorID = storage.get(VID_KEY);
				}
			}
		},

		incrementRunsCount: function () {
			if (!enabled) return;
			runsCount++;
			storage.set(RUNS_COUNT_KEY, runsCount + '');
		},

        /**
         * Method handles cold start related labels.
         * @return True, if self is the first call of self method
         */
		handleColdStart: function () {
			if (!coldStartDispatched) {
				coldStartDispatched = true;
				coldStartCount++;
				storage.set(COLD_START_COUNT_KEY, coldStartCount + '');
				coldStartId = +new Date();
				return true;
			}
			return false;
		},

		scheduleUserInteractionTask: function () {
			if (!enabled) return;
			if (userInteractionTimer != null) {
				PlatformAPI.clearTimeout(userInteractionTimer);
				userInteractionTimer = null;
			}
			userInteractionTimer = PlatformAPI.setTimeout(function () {
				if (userInteractionTimer != null) {
					PlatformAPI.clearTimeout(userInteractionTimer);
					userInteractionTimer = null;
				}
				updateState();
			}, USER_SESSION_INACTIVE_PERIOD);
		},

        // OBJECTS GETTERS

		getOfflineCache: function () {
			return offlineCache;
		},

		getConnectivityReceiver: function () {
			return connectivityStatusReceiver;
		},

		getStorage: function () {
			return storage;
		},

		getQueue: function () {
			return dispatchQueue;
		},

		getKeepAlive: function () {
			return keepAlive;
		},

		getCacheFlusher: function () {
			return cacheFlusher;
		},

		getDispatchProperties: function () {
			return dispatchProperties;
		},

        // DAX STATE MACHINE
		onUxActive: function () {
			if (!enabled) return;
			if (isNotProperlyInitialized()) {
				return;
			}
			if (userSessionCount < 0) {
				userSessionCount = 0;
			}
			activeUxComponentsCount++;
			updateState();
		},

		onUxInactive: function () {
			if (!enabled) return;
			if (isNotProperlyInitialized()) {
				return;
			}
            // TODO: Should we throw exception here?
			if (activeUxComponentsCount > 0) {
				activeUxComponentsCount--;
				updateState();
			}
		},

		onEnterForeground: function () {
			if (!enabled) return;
			if (isNotProperlyInitialized()) {
				return;
			}
			foregroundComponentsCount++;
			updateState();
		},

		onExitForeground: function () {
			if (!enabled) return;
			if (isNotProperlyInitialized()) {
				return;
			}
            // TODO: Should we throw exception here?
			if (foregroundComponentsCount > 0) {
				foregroundComponentsCount--;
				updateState();
			}
		},

		onUserInteraction: function () {
			if (!enabled) return;
			if (isNotProperlyInitialized()) {
				return;
			}
			if (userSessionCount < 0) {
				userSessionCount = 0;
			}
			if (activeUserSessionCount < 0) {
				activeUserSessionCount = 0;
			}
			lastUserInteractionTimestamp = +new Date();
			userInteractionCount++;
			if (currentSessionState != SessionState.ACTIVE_USER) {
				updateState();
			} else {
				self.scheduleUserInteractionTask();
			}
		},

		getApplicationState: function () {
			return currentApplicationState;
		},

		getSessionState: function () {
			return currentSessionState;
		},

        // TIME AND TRANSITIONS GETTERS

		getRunsCount: function () {
			return runsCount;
		},

		getInstallId: function () {
			return installId;
		},

		getFirstInstallId: function () {
			return firstInstallId;
		},

		getColdStartId: function () {
			return coldStartId;
		},

		getColdStartCount: function () {
			return coldStartCount;
		},

		getPreviousVersion: function () {
			return previousVersion;
		},

		setPreviousVersion: function (value) {
			previousVersion = value;
		},

		getForegroundTransitionsCountDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = foregroundTransitionsCount;
			if (reset) {
				foregroundTransitionsCount = 0;
				storage.set(FOREGROUND_TRANSITION_COUNT_KEY, foregroundTransitionsCount + '');
			}
			return ret;
		},

		getForegroundTotalTime: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = totalForegroundTime;
			if (reset) {
				totalForegroundTime = 0;
				storage.set(TOTAL_FOREGROUND_TIME_KEY, totalForegroundTime + '');
			}
			return ret;
		},

		getForegroundTimeDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = accumulatedForegroundTime;
			if (reset) {
				accumulatedForegroundTime = 0;
				storage.set(ACCUMULATED_FOREGROUND_TIME_KEY, accumulatedForegroundTime + '');
			}
			return ret;
		},

		getBackgroundTotalTime: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = totalBackgroundTime;
			if (reset) {
				totalBackgroundTime = 0;
				storage.set(TOTAL_BACKGROUND_TIME_KEY, totalBackgroundTime + '');
			}
			return ret;
		},

		getBackgroundTimeDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = accumulatedBackgroundTime;
			if (reset) {

				accumulatedBackgroundTime = 0;
				storage.set(ACCUMULATED_BACKGROUND_TIME_KEY, accumulatedBackgroundTime + '');
			}
			return ret;
		},

		getInactiveTotalTime: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = totalInactiveTime;
			if (reset) {
				totalInactiveTime = 0;
				storage.set(TOTAL_INACTIVE_TIME_KEY, totalInactiveTime + '');
			}
			return ret;
		},

		getInactiveTimeDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = accumulatedInactiveTime;
			if (reset) {
				accumulatedInactiveTime = 0;
				storage.set(ACCUMULATED_INACTIVE_TIME_KEY, accumulatedInactiveTime + '');
			}
			return ret;
		},

		getApplicationSessionTimeDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = accumulatedApplicationSessionTime;
			if (reset) {
				accumulatedApplicationSessionTime = 0;
				storage.set(ACCUMULATED_APPLICATION_SESSION_TIME_KEY, accumulatedApplicationSessionTime + '');
			}
			return ret;
		},

		getActiveUserSessionTimeDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = accumulatedActiveUserSessionTime;
			if (reset) {
				accumulatedActiveUserSessionTime = 0;
				storage.set(ACCUMULATED_ACTIVE_USER_SESSION_TIME_KEY, accumulatedActiveUserSessionTime + '');
			}
			return ret;
		},

		getUserSessionTimeDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = accumulatedUserSessionTime;
			if (reset) {
				accumulatedUserSessionTime = 0;
				storage.set(ACCUMULATED_USER_SESSION_TIME_KEY, accumulatedUserSessionTime + '');
			}
			return ret;
		},

		getAutoUpdateInterval: function () {
			return autoUpdateInterval;
		},

		getApplicationSessionCountDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = applicationSessionCount;
			if (reset) {
				applicationSessionCount = 0;
				storage.set(APPLICATION_SESSION_COUNT_KEY, applicationSessionCount + '');
			}
			return ret;
		},

		getActiveUserSessionCountDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = -1;
			if (activeUserSessionCount >= 0) {
				ret = activeUserSessionCount;
				if (reset) {

					activeUserSessionCount = 0;
					storage.set(ACTIVE_USER_SESSION_COUNT_KEY, activeUserSessionCount + '');
				}
			}
			return ret;
		},

		getUserSessionCountDelta: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = -1;
			if (userSessionCount >= 0) {
				ret = userSessionCount;
				if (reset) {
					userSessionCount = 0;
					storage.set(USER_SESSION_COUNT_KEY, userSessionCount + '');
				}
			}
			return ret;
		},

		getUserInteractionCount: function (reset) {

            // Default value
			reset = typeof reset !== _undefined ? reset : true;

			var ret = userInteractionCount;
			if (reset) {
				userInteractionCount = 0;
				storage.set(USER_INTERACTION_COUNT_KEY, userInteractionCount + '');
			}
			return ret;
		},

        // SETTINGS GETTERS AND SETTERS

        /**
         * Configure the APP appSettings. This method is mandatory execution.
         *
         * */
		setAppContext: function () {
			if (appContextSuccessfullyInitialised) {
				return;
			}

			PlatformAPI.autoDetect();
			initializeContextDependant();
			self.loadInitialSettings();
			self.restoreVisitorId();

			appContextSuccessfullyInitialised = true;
		},

		setEnabled: function (value) {
            // We can disable the library only once, and it cannot be enabled again.
			if (enabled && value != null && !value) {
                // Disabling application tag core
				enabled = false;
				cacheFlusher.stop();
				connectivityStatusReceiver.stop();
				keepAlive.pause();
			}
		},

		getEnabled: function () {
			return enabled;
		},

        // Deprecated. It case this app is integrated with old versions of STA.
		getAppContext: function () {
			return {};
		},

		getCurrentActivityName: function () {
			return currentActivityName;
		},

		setCurrentActivityName: function (activityName) {
			currentActivityName = activityName;
		},

		setPixelURL: function (value) {
			if (!enabled) return;
			if (value == null || value.length === 0) {
                // ignore value
				return null;
			}

			isPixelURLConfigured = true;

            // Handle labels, if any
			var questionMarkIdx = value.indexOf('?');
			if (questionMarkIdx >= 0) {
				if (questionMarkIdx < value.length - 1) {
					var labels = value.substring(questionMarkIdx + 1).split('&');
					for (var i = 0, len = labels.length; i < len; i++) {
						var pair = labels[i].split('=');
						if (pair.length == 2) {
							self.setLabel(pair[0], pair[1]);
						} else if (pair.length == 1) {
							self.setLabel(Constants.PAGE_NAME_LABEL, pair[0]);
						}
					}
					value = value.substring(0, questionMarkIdx + 1);
				}
			} else {
				value = value + '?';
			}
            // Ok, self a pixelUrl
			pixelURL = value;

			return pixelURL;
		},

		setKeepAliveEnabled: function (value) {
			if (!enabled) return;

			keepAlive.setEnable(value);
		},

		getPixelURL: function () {
			return pixelURL;
		},

		getCrossPublisherId: function () {
			return cachedCipheredCrossPublisherId;
		},

		isCrossPublisherIdChanged: function () {
			return PlatformAPI.isCrossPublisherIdChanged() || isCrossPublisherIdChanged;
		},

        /**
         * Retrieve unique visitor id
         *
         * @return visoitorId string
         */
		getVisitorId: function () {
			if (visitorID == null) {
				setVisitorId();
			}
			return visitorID;
		},


		setVisitorId: setVisitorId,

		generateCrossPublisherId: generateCrossPublisherId,

        /**
         * Set Publisher secret value
         *
         * @param value
         *            - publisher secret value
         * @return current DAx instance
         */
		setSalt: function (value) {
			if (value == null || value.length === 0) {
                // ignore value
				return self;
			}
			salt = value;
			return self;
		},

        /**
         * Get Publisher Secret value
         *
         * @return Publisher secret value
         */
		getSalt: function () {
			if (salt == null) {
				salt = '';
			}

			return salt;
		},

        /**
         * Set Application Name
         *
         * @param value
         */
		setAppName: function (value) {
			if (!enabled) return;
			appName = value;
		},

        /**
         * Retrieve Application's name
         *
         * @return Application string name
         */
		getAppName: function () {
			if (appName == null || appName.length === 0) {
				self.setAppName(PlatformAPI.getAppName());
			}
			return appName;
		},

		setAppVersion: function (value) {
            // if we have storage access
			if (storage) {
                // if the passed in value is different than undefined and different than UNKNOWN_VALUE
				if (value && value != UNKNOWN_VALUE) {
                    // Loading previous version from storage if it exists
					if (storage.has(Constants.PREVIOUS_VERSION_KEY)) {
						previousVersion = storage.get(Constants.PREVIOUS_VERSION_KEY) + '';
					}

                    // load the current version from storage if it exists
					var storedCurrentVersion;
					if (storage.has(CURRENT_VERSION_KEY)) {
						storedCurrentVersion = storage.get(CURRENT_VERSION_KEY) + '';
					}

                    // if we have a current version value in storage and the newly passed value
                    // is different from it, then we consider that the application has been updated
					if (storedCurrentVersion && storedCurrentVersion !== value) {
                        // application is considered to be updated

                        // set the previous version to be equal to the last current version retrieved from storage
						previousVersion = storedCurrentVersion;
						storage.set(Constants.PREVIOUS_VERSION_KEY, previousVersion + '');

                        // update the install id
						installId = genesis;
						storage.set(INSTALL_ID_KEY, installId + '');
					} else {
                        // The same old app!
						installId = typeCastingUtils.parseLong(storage.get(INSTALL_ID_KEY), -1);
					}

                    // store the newly passed value
					storage.set(CURRENT_VERSION_KEY, value + '');
				} else {
                    // We can't detect the version so we restore the install ID
					installId = typeCastingUtils.parseLong(storage.get(INSTALL_ID_KEY), -1);
				}
			}

            // set the variable that holds the current version to be equal to the passed in value
			currentVersion = value;
		},

		getAppVersion: function () {
			return currentVersion;
		},

        /**
         * Get comScore SDK current version
         *
         * @return SDK version
         */
		getVersion: function () {
			return CORE_VERSION;
		},

        /**
         * Get Application genesis
         *
         * @return genesis timestamp
         */
		getGenesis: function () {
			return genesis;
		},

        /**
         * Retrieve previously stored genesis value
         *
         * @return timestamp of previous genesis
         */
		getPreviousGenesis: function () {
			return previousGenesis;
		},

		setExitCode: function (exitCode) {
			storage.set(EXIT_CODE_KEY, exitCode.toString(10));
		},

		getExitCode: function () {
			return exitCode;
		},

		getLabels: function () {
			return customLabels;
		},

		setLabels: function (labels) {
			if (!enabled) return;
			for (var label_name in labels) {
				if (labels.hasOwnProperty(label_name)) {
					self.setLabel(label_name, labels[label_name]);
				}
			}
		},

		getLabel: function (name) {
			return customLabels[name];
		},

		setLabel: function (name, value) {
			if (!enabled) return;
			if (name && !value) {
				delete customLabels[name];
				return;
			}
			customLabels[name] = value;
		},

		setAutoStartLabels: function (labels) {
			if (!enabled) return;
			if (labels == null) {
                // ignore value
				return;
			}
			objectUtils.extend(autoStartLabels, labels);
		},

		getAutoStartLabel: function (name) {
			return autoStartLabels[name];
		},

		getAutoStartLabels: function () {
			return autoStartLabels;
		},

		setAutoStartLabel: function (name, value) {
			if (!enabled) return;
			autoStartLabels[name] = value;
		},

		getCustomerC2: function () {
			return customLabels['c2'];
		},

		setCustomerC2: function (customerC2) {
			if (!enabled) return;
			if (customerC2 == null || customerC2.length === 0) {
                // ignore value
				return;
			}

			var url = dispatchProperties.isSecure() ? CENSUS_URL_SECURE : CENSUS_URL;
			self.setPixelURL(url);
			isPixelURLConfigured = false;

			self.setLabel('c2', customerC2);
		},

		getLiveTransmissionMode: function () {
			return dispatchProperties.getLiveTransmissionMode();
		},

		allowLiveTransmission: function (mode) {
			if (!enabled) return;
			if (dispatchProperties.getLiveTransmissionMode() != mode) {
				dispatchProperties.allowLiveTransmission(mode);
			}
		},

		getOfflineTransmissionMode: function () {
			return dispatchProperties.getOfflineTransmissionMode();
		},

		allowOfflineTransmission: function (mode) {
			if (!enabled) return;
			if (dispatchProperties.getOfflineTransmissionMode() != mode) {
				dispatchProperties.allowOfflineTransmission(mode);
			}
		},

        /**
         * Specifies if we are running in secure mode (use https) or not (use http)
         * It can only be executed before setting the CustomerC2.
         * @param secure {boolean} True if request have to be send using https or http otherwise
         * */
		setSecure: function (secure) {
			if (!enabled) return;

			if (this.getCustomerC2()) return;

			isSecureConfigured = true;

			if (dispatchProperties.isSecure() != secure) {
				dispatchProperties.setSecure(secure);
			}
		},

        /**
         * This is a not public API that might disappear in the future.
         * It is only used by the Cordova platform.
         * */
		setSecureInternal: function (isSecure) {
			if (!isSecureConfigured) {
				dispatchProperties.setSecure(!!isSecure);
				if (dispatchQueue != null) {
					dispatchQueue.enqueueSettingChange(DispatchProperties.SECURE_MODE, !!isSecure);
				}

                // PixelURL is immediately configured after customerC2 is set.
				if (self.getCustomerC2() && !isPixelURLConfigured) {
					var url = dispatchProperties.isSecure() ? CENSUS_URL_SECURE : CENSUS_URL;
					self.setPixelURL(url);
					isPixelURLConfigured = false;
				}
			}
		},

		setAutoStartEnabled: function (value) {
			if (!enabled) return;
			autoStartEnabled = value;
		},

		isAutoStartEnabled: function () {
			return autoStartEnabled;
		},

		isSecure: function () {
			return dispatchProperties.isSecure();
		},

		setCacheMaxMeasurements: function (max) {
			if (offlineCache != null) {
				offlineCache.setCacheMaxMeasurements(max);
			}
		},

		getCacheMaxMeasurements: function () {
			return (offlineCache != null) ? offlineCache.getCacheMaxMeasurements() : OfflineMeasurementsCache.CACHE_MAX_SIZE;
		},

		setCacheMaxBatchFiles: function (max) {
			if (offlineCache != null) {
				offlineCache.setCacheMaxBatchFiles(max);
			}
		},

		getCacheMaxBatchFiles: function () {
			return (offlineCache != null) ? offlineCache.getCacheMaxBatchFiles() : OfflineMeasurementsCache.CACHE_MAX_BATCH_SIZE;
		},

		setCacheMaxFlushesInARow: function (max) {
			if (offlineCache != null) {
				offlineCache.setCacheMaxPosts(max);
			}
		},

		getCacheMaxFlushesInARow: function () {
			return (offlineCache != null) ? offlineCache.getCacheMaxPosts() : OfflineMeasurementsCache.CACHE_MAX_FLUSHES_INAROW;
		},

		setCacheMinutesToRetry: function (minutes) {
			if (offlineCache != null) {
				offlineCache.setCacheWaitMinutes(minutes);
			}
		},

		getCacheMinutesToRetry: function () {
			return (offlineCache != null) ? offlineCache.getCacheWaitMinutes() : OfflineMeasurementsCache.CACHE_WAIT_MINUTES;
		},

		setCacheMeasurementExpiry: function (days) {
			if (offlineCache != null) {
				offlineCache.setCacheMeasurementExpiry(days);
			}
		},

		getCacheMeasurementExpiry: function () {
			return (offlineCache != null) ? offlineCache.getCacheMeasurementExpiry() : OfflineMeasurementsCache.CACHE_EXPIRY_DAYS;
		},

		getCacheFlushingInterval: function () {
			return cacheFlushingInterval;
		},

		setCacheFlushingInterval: function (aCacheFlushingInterval) {
			if (!enabled) return;
			if (cacheFlushingInterval != aCacheFlushingInterval) {
				cacheFlushingInterval = aCacheFlushingInterval;
				if (cacheFlusher != null) {
					cacheFlusher.update();
				}
			}
		},

		getMeasurementLabelOrder: function () {
			return dispatchProperties.getMeasurementLabelOrder();
		},

		setMeasurementLabelOrder: function (labelOrder) {
			if (!enabled) return;
			if (labelOrder != dispatchProperties.getMeasurementLabelOrder()) {
				dispatchProperties.setMeasurementLabelOrder(labelOrder);
			}
		},

        // OPERATIONS

		flush: function () {
			offlineCache.flush(dispatchProperties, function() {});
		},

        /**
         * Accumulates the current timer registers, so the data won't be lost on crash.
         * Triggers IO operations in a separate thread so use it wisely.
         */
		update: function (store) {
			if (!enabled) return;
			store = typeof store !== _undefined ? store : true;

			accumulateApplicationData(store);
			accumulateSessionData(store);
		},

        /**
         * Enables automatic invocation of update() method.
         * @param intervalInSeconds The interval in seconds in which update() should be called. It cannot be less than 60 s, in such case 60 s will be used.
         * @param foregroundOnly If true automatic invocation will work in foreground only. if false it will work also when the application is in background AND active (see onAppActivated() and onAppDeactivate().
         */
		enableAutoUpdate: function (intervalInSeconds, foregroundOnly) {
			if (!enabled) return;

			intervalInSeconds = intervalInSeconds || AUTOUPDATE_INTERVAL_IN_SECONDS;

			stopAutoUpdateTimer();
			if (intervalInSeconds < AUTOUPDATE_INTERVAL_IN_SECONDS) {
				intervalInSeconds = AUTOUPDATE_INTERVAL_IN_SECONDS;
			}
			autoUpdateInForegroundOnly = foregroundOnly;
			autoUpdateInterval = intervalInSeconds * 1000;

			if (currentApplicationState == ApplicationState.FOREGROUND) {
				startAutoUpdateTimer();
			} else if (currentApplicationState == ApplicationState.BACKGROUND_UX_ACTIVE && !autoUpdateInForegroundOnly) {
				startAutoUpdateTimer();
			}
		},

        /**
         * Disables automatic invocation of update() method.
         */
		disableAutoUpdate: function () {
			if (!enabled) return;
			stopAutoUpdateTimer();
			autoUpdateInForegroundOnly = true;
			autoUpdateInterval = -1;
		},

        /**
         * Informs if auto update is enabled.
         * @return True, if auto update is enabled.
         */
		isAutoUpdateEnabled: function () {
			return autoUpdateInterval > 0;
		},

        /**
         * Add Application event to the queue dispatcher
         *
         * @param type
         *            - Application event type
         * @param labels
         *            - event specific labels
         */
		notify: function (type, labels) {
			if (!enabled) return;
			if (isNotProperlyInitialized()) {
				return;
			}
			if (!coldStartDispatched && type != EventType.START) {
                // Sending Start measurement
				measurementDispatcher.send(EventType.START, {}, isPixelURLConfigured ? pixelURL : null);
			}

			if (type == EventType.CLOSE) {
				self.setExitCode(0);
				self.update(true);
			} else {
				measurementDispatcher.send(type, labels, isPixelURLConfigured ? pixelURL : null);
			}
		},

		internalHidden: function (dispatchLabels, liveEndpointURL) {
			measurementDispatcher.send(EventType.HIDDEN, dispatchLabels, liveEndpointURL);
		},

        /**
         * Sets the url used to flush the offline cache.
         * @param value
         */
		setOfflineURL: function (value) {
			if (!enabled) return;
			offlineCache.setUrl(value);
		},

        /**
         * Returns a PlatformAPI object with information and resources about the platform
         * @returns {*}
         */
		getPlatformAPI: function() {
			return PlatformAPI;
		},

        /**
         * Sets the PlatformAPI object to be used for dealing with platform specific resources and characteristics
         * @param platformName The PlatformAPI name to be used
         */
		setPlatformAPI: function(platformName) {
			PlatformAPI.setPlatformAPI(platformName);
		},

        /**
         * Returns the MeasurementsDispatcher instance object.
         * @return {MeasurementsDispatcher} The appCore MeasurementsDispatcher instance object.
         */
		getMeasurementDispatcher: function () {
			return measurementDispatcher;
		},

        /*
        * Cleans the storage data. Be aware that offline measurements might also be deleted in certain platforms.
        * Currently, executing this method without disabling the library is allowed
        * so if that is the case an inconsistent will be reached.
        * */
		clearInternalData: function () {
			if (storage) {
				storage.clear();
			}
		},

		cacheHttpRedirects: function (flag) {
			isHttpRedirectCaching = flag;
		},

		isHttpRedirectCaching: function () {
			return isHttpRedirectCaching;
		}
	});

    // DAX INITIALIZATION
    // At that point, the library might not have loaded the ott library yet.
	dispatchProperties = new DispatchProperties();
	customLabels = {};
	autoStartLabels = {};

	enabled = true;

	isHttpRedirectCaching = true;

    // Resetting state machine
	self.reset();
}

module.exports = Core;

},{"1":1,"11":11,"12":12,"17":17,"21":21,"22":22,"24":24,"25":25,"26":26,"3":3,"36":36,"4":4,"6":6,"7":7,"8":8,"9":9}],6:[function(require,module,exports){
var objectUtils = require(24),
	TransmissionMode = require(8).TransmissionMode,
	PlatformAPI = require(36),
	Constants = require(4);

var LIVE_TRANSMISSION_MODE = 0,
	OFFLINE_TRANSMISSION_MODE = 1,
	SECURE_MODE = 2,
	MEASUREMENT_LABEL_ORDER = 3;

function DispatchProperties() {
	var liveTransmissionMode,
		offlineTransmissionMode,
		secure,
		measurementLabelOrder;

	objectUtils.extend(this, {
		reset: function() {
			liveTransmissionMode = TransmissionMode.DEFAULT;
			offlineTransmissionMode = TransmissionMode.DEFAULT;
			secure = PlatformAPI.isConnectionSecure();
			measurementLabelOrder = Constants.LABELS_ORDER;
		},

		copyFrom: function(props) {
			liveTransmissionMode = props.getLiveTransmissionMode();
			offlineTransmissionMode = props.getOfflineTransmissionMode();
			measurementLabelOrder = props.getMeasurementLabelOrder();
			secure = props.isSecure();
		},

		updateSetting: function(type, value) {
			switch (type) {
				case LIVE_TRANSMISSION_MODE:
					this.allowLiveTransmission(value);
					break;
				case OFFLINE_TRANSMISSION_MODE:
					this.allowOfflineTransmission(value);
					break;
				case SECURE_MODE:
					this.setSecure(value);
					break;
				case MEASUREMENT_LABEL_ORDER:
					this.setMeasurementLabelOrder(value);
					break;
			}
		},

		getLiveTransmissionMode: function() {
			return liveTransmissionMode;
		},

		allowLiveTransmission: function(mode) {
			if (mode == null) {
				// ignore value
				return;
			}
			liveTransmissionMode = mode;
		},

		getOfflineTransmissionMode: function() {
			return offlineTransmissionMode;
		},

		allowOfflineTransmission: function(mode) {
			if (mode == null) {
				// ignore value
				return;
			}
			offlineTransmissionMode = mode;
		},

		isSecure: function() {
			return secure;
		},

		setSecure: function(aSecure) {
			secure = aSecure;
		},

		getMeasurementLabelOrder: function() {
			return measurementLabelOrder;
		},

		setMeasurementLabelOrder: function(labelOrder) {
			if (labelOrder != null && labelOrder.length > 0) {
				measurementLabelOrder = labelOrder;
			}
		}
	});

	this.reset();
}

DispatchProperties.LIVE_TRANSMISSION_MODE = LIVE_TRANSMISSION_MODE;
DispatchProperties.OFFLINE_TRANSMISSION_MODE = OFFLINE_TRANSMISSION_MODE;
DispatchProperties.SECURE_MODE = SECURE_MODE;
DispatchProperties.MEASUREMENT_LABEL_ORDER = MEASUREMENT_LABEL_ORDER;

module.exports = DispatchProperties;

},{"24":24,"36":36,"4":4,"8":8}],7:[function(require,module,exports){
var objectUtils = require(24),
	Request = require(13);

var MILLIS_PER_SECOND = 1000,
	MILLIS_PER_DAY = 1000 * 60 * 60 * 24,
	DAY_CHECK_OFFSET = 'q_dcf',
	DAY_CHECK_COUNTER = 'q_dcc',
	EVENTS_LIMIT_PER_SECOND = 20,
	EVENTS_LIMIT_PER_DAY = 6000;

function DispatchQueue(core) {
	var self = this,
		measurementsQueue = [],

		lastSecondEventCounter,
		lastSecondTimestamp,
		lastDayEventCounter,
		lastDayTimestamp,

		scheduledDispatchingTimer,
		isForceDispatchToCacheEnabled = false;

	function init() {
		var s = core.getStorage();
		if (s.has(DAY_CHECK_COUNTER) && s.has(DAY_CHECK_OFFSET)) {
			lastDayEventCounter = parseInt(s.get(DAY_CHECK_COUNTER));
			lastDayTimestamp = parseInt(s.get(DAY_CHECK_OFFSET));
		} else {
			lastDayEventCounter = 0;
			lastDayTimestamp = +new Date();
		}

		lastSecondEventCounter = 0;
		lastSecondTimestamp = +new Date();
	}

	function sendMeasurementRequest(measurement) {
		var measurementRequest = new Request(core, core.getDispatchProperties(), measurement);
		measurementRequest.send();
	}

	function saveToOfflineCache(measurement) {
		var offlineCache = core.getOfflineCache();
		offlineCache.saveEvent(measurement);
	}

	function isQueueFlooded(sentTimestamp) {
		return isLastSecondQueueFlooded(sentTimestamp) || isLastDayQueueFlooded(sentTimestamp);
	}

	function isLastSecondQueueFlooded(sentTimestamp) {
		if (sentTimestamp - lastSecondTimestamp < MILLIS_PER_SECOND
            && lastSecondEventCounter >= EVENTS_LIMIT_PER_SECOND) {
			return true;
		}

		return false;
	}

	function isLastDayQueueFlooded(sentTimestamp) {
		if (sentTimestamp - lastDayTimestamp < MILLIS_PER_DAY
            && lastDayEventCounter >= EVENTS_LIMIT_PER_DAY) {
			return true;
		}

		return false;
	}

	function updateQueueCounters(sentTimestamp) {
		if (sentTimestamp - lastDayTimestamp > MILLIS_PER_DAY) {
			lastDayEventCounter = 0;
			lastDayTimestamp = sentTimestamp;
		}

		if (sentTimestamp - lastSecondTimestamp > MILLIS_PER_SECOND) {
			lastSecondEventCounter = 0;
			lastSecondTimestamp = sentTimestamp;
		}

		lastDayEventCounter++;
		lastSecondEventCounter++;

		var s = core.getStorage();
		s.set(DAY_CHECK_COUNTER, lastDayEventCounter + '');
		s.set(DAY_CHECK_OFFSET, lastDayTimestamp + '');
	}

	function dispatch() {
		var sendingTimestamp = +new Date();

		if(isForceDispatchToCacheEnabled) {
			while(measurementsQueue.length) {
				var measurement = measurementsQueue.shift();
				saveToOfflineCache(measurement);
			}

			return;
		}

		while(measurementsQueue.length && !isQueueFlooded(sendingTimestamp)) {
			updateQueueCounters(sendingTimestamp);

			measurement = measurementsQueue.shift();
			sendMeasurementRequest(measurement);
		}

		scheduleDispatching(sendingTimestamp);
	}

	/**
	 * When the queue is flooded, a dispatching will be schedule after it is no longer flooded.
	 * */
	function scheduleDispatching(sendingTimestamp) {
		if (!measurementsQueue.length) return;

		if(scheduledDispatchingTimer) return;

		if (isLastSecondQueueFlooded(sendingTimestamp)) {
			scheduledDispatchingTimer = core.getPlatformAPI().setTimeout(function () {
				scheduledDispatchingTimer = null;
				dispatch();
			}, lastSecondTimestamp + MILLIS_PER_SECOND - sendingTimestamp);
		} else if (isLastDayQueueFlooded(sendingTimestamp)) {
			scheduledDispatchingTimer = core.getPlatformAPI().setTimeout(function () {
				scheduledDispatchingTimer = null;
				dispatch();
			}, lastDayTimestamp + MILLIS_PER_DAY - sendingTimestamp);
		}
	}

	objectUtils.extend(self, {
		offer: function(measurement) {
			if (!core.getEnabled()) return;

			measurementsQueue.push(measurement);

			dispatch();
		},

		clean: function () {
			core.getPlatformAPI().clearTimeout(scheduledDispatchingTimer);

			measurementsQueue.length = 0;
		},

		dispatchToCache: function (_isForceDispatchToCacheEnabled) {
			isForceDispatchToCacheEnabled = _isForceDispatchToCacheEnabled;

			core.getPlatformAPI().clearTimeout(scheduledDispatchingTimer);

			dispatch();
		}
	});

	init();
}

module.exports = DispatchQueue;

},{"13":13,"24":24}],8:[function(require,module,exports){
var EventType = {
	START: 'start',
	VIEW: 'view',
	CLOSE: 'close',
	AGGREGATE: 'aggregate',
	HIDDEN: 'hidden',
	KEEPALIVE: 'keep-alive'
};

var ApplicationState = {
	INACTIVE: 0,
	BACKGROUND_UX_ACTIVE: 1,
	FOREGROUND: 2
};

var SessionState = {
	INACTIVE: 0,
	APPLICATION: 1,
	USER: 2,
	ACTIVE_USER: 3
};

var TransmissionMode = {
	DEFAULT: 0,
    /**
     * Transmission always disabled
     */
	NEVER: 1,
    /**
     * Transmission enabled only when on WIFI;
     */
	WIFIONLY: 2,
    /**
     * Transmission enabled only when transmitting cellular data or WIFI
     */
	PIGGYBACK: 3,
    /**
     * Transmission disabled and NO processing will take in place.
     */
	DISABLED: 4,
	
	valueOf: function(val) {
		if (val == null || val == 'DEFAULT') {
			return TransmissionMode.DEFAULT;
		} else if (val == 'NEVER') {
			return TransmissionMode.NEVER;
		} else if (val == 'WIFIONLY') {
			return TransmissionMode.WIFIONLY;
		} else if (val == 'PIGGYBACK') {
			return TransmissionMode.PIGGYBACK;
		} else if (val == 'DISABLED') {
			return TransmissionMode.DISABLED;
		}
	}
};

exports.TransmissionMode = TransmissionMode;
exports.SessionState = SessionState;
exports.ApplicationState = ApplicationState;
exports.EventType = EventType;
},{}],9:[function(require,module,exports){
var PlatformAPI = require(36),
	EventType = require(8).EventType,
	objectUtils = require(24);

function KeepAlive(core) {
	var self = this,
		keepAliveTimer = null,
		expectedNextKeepAliveTimestamp = NaN,
		isKeepAliveEnabled = true,
		KEEPALIVE_INTERVAL_MS = 1000 * 60 * 60 * 24;

	function onKeepAlive() {
		expectedNextKeepAliveTimestamp = +new Date() + KEEPALIVE_INTERVAL_MS;
		processKeepAlive();
	}

	function processKeepAlive() {
		core.getMeasurementDispatcher().send(EventType.KEEPALIVE);
	}

	objectUtils.extend(self, {
		setEnable: function(isEnabled) {
			isKeepAliveEnabled = isEnabled;

			if(isEnabled) {
				self.checkDelayedKeepAlive();
				self.restart();
			} else {
				self.cancel();
			}
		},
		
		isEnabled: function () {
			return isKeepAliveEnabled;
		},

		restart: function() {
			if(!isKeepAliveEnabled) return;

			self.cancel();

			expectedNextKeepAliveTimestamp = +new Date() + KEEPALIVE_INTERVAL_MS;
			keepAliveTimer = PlatformAPI.setInterval(onKeepAlive, KEEPALIVE_INTERVAL_MS);
		},
		
		checkDelayedKeepAlive: function () {
			if(!isKeepAliveEnabled) return;

			var now = +new Date();
			if(expectedNextKeepAliveTimestamp && now >= expectedNextKeepAliveTimestamp) {
				processKeepAlive();
			}
		},
		
		pause: function () {
			self.cancel();
		},

		cancel: function() {
			if (keepAliveTimer) {
				PlatformAPI.clearInterval(keepAliveTimer);
				keepAliveTimer = null;
			}
		}
	});
}

module.exports = KeepAlive;

},{"24":24,"36":36,"8":8}],10:[function(require,module,exports){
var objectUtils = require(24),
	generalUtils = require(21),
	EventType = require(8).EventType,
	CommonConstants = require(17),
	PlatformAPI = require(36),
	Constants = require(4),

	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE;

var esc = typeof (encodeURIComponent) != _undefined ? encodeURIComponent : escape;
var getValueOrUnknown = function (value) {
	return generalUtils.isNotEmpty(value) ? value : UNKNOWN_VALUE;
};
var applicationTypeToAnalyticsType = function (type) {
	if (type == EventType.START || type == EventType.CLOSE || type == EventType.VIEW) {
		return EventType.VIEW;
	} else {
		return EventType.HIDDEN;
	}
};

function Measurement (core) {
	var labelsMap = {},
		pixelURL;

	objectUtils.extend(this, {
		removeLabel: function (name) {
			delete labelsMap[name];
		},

		addLabels: function (labels) {
			if (labels != null) {
				for (var labelName in labels) {
					if (labels.hasOwnProperty(labelName)) {
						this.setLabel(labelName, labels[labelName]);
					}
				}
			}
		},

		setLabel: function (name, value) {
			labelsMap[name] = value;
		},

		getLabel: function (name) {
			return labelsMap[name];
		},

		getLabels: function () {
			return labelsMap;
		},

		hasLabel: function (name) {
			return labelsMap.hasOwnProperty(name);
		},

		retrieveLabelsAsString: function (orderedLabels) {
			var result = [];

            //create sorted map
			var tempLabelsMap = objectUtils.extend({}, labelsMap);

            //first adding label from the specified order
			for (var i = 0, len = orderedLabels.length; i < len; i++) {
				var orderedLabelName = orderedLabels[i];
				var orderedLabelValue = tempLabelsMap[orderedLabelName];
				if (orderedLabelValue != null && orderedLabelValue !== '' ) {
					result.push('&', esc(orderedLabelName), '=', esc(orderedLabelValue)); // TODO: use Label.pack
					delete tempLabelsMap[orderedLabelName];
				}
			}

            // adding rest labels
			for (var name in tempLabelsMap) {
				if (tempLabelsMap.hasOwnProperty(name)) {
					var value = tempLabelsMap[name];
					if (value != null && value !== '') {
						result.push('&', esc(name), '=', esc(tempLabelsMap[name])); // TODO: use Label.pack
					}
				}
			}
			var ret = '';
			result = result.join('');
			if (result.length > 0 && result.charAt(0) == '&') {
				ret = result.substring(1);
			} else {
				ret = result;
			}
			return ret;
		},

		setPixelURL: function (aPixelURL) {
			pixelURL = aPixelURL;
		},

		getPixelURL: function () {
			return pixelURL;
		}

	});

	if (core) {
		this.setPixelURL(core.getPixelURL());
	}
}

function ApplicationMeasurement (core, eventType, pixelURL, coldBoot) {
	Measurement.call(this, core);

	if (core) {
        // Analytics

		if (pixelURL != null) {
			this.setPixelURL(pixelURL);
		}

        // c1
		this.setLabel('c1', '19');

        // ns_ap_an AppName
		this.setLabel('ns_ap_an', getValueOrUnknown(core.getAppName()));

        // ns_ap_pn platform
		this.setLabel('ns_ap_pn', getValueOrUnknown(PlatformAPI.getPlatformName()));
		this.setLabel('ns_ap_pv', getValueOrUnknown(PlatformAPI.getRuntimeVersion()));

        // c12 visitor ID
		this.setLabel('c12', core.getVisitorId());

		core.generateCrossPublisherId();
		var ns_akValue = core.getCrossPublisherId();
		if (ns_akValue) {
			this.setLabel('ns_ak', ns_akValue);

			if (core.isCrossPublisherIdChanged()) {
				this.setLabel('ns_ap_ni', '1');
			}
		}

        // device
		this.setLabel('ns_ap_device', getValueOrUnknown(PlatformAPI.getDeviceModel()));
		this.setLabel('ns_ap_ar', getValueOrUnknown(PlatformAPI.getDeviceArchitecture()));
		this.setLabel('ns_radio', getValueOrUnknown(PlatformAPI.getConnectionType()));

        // TYPE
		this.setLabel('ns_type', applicationTypeToAnalyticsType(eventType));

        // ns_nc=1
		this.setLabel('ns_nc', '1');

		this.setLabel('ns_ap_pfv', getValueOrUnknown(PlatformAPI.getPlatformVersion()));

		this.setLabel('ns_ap_pfm', getValueOrUnknown(PlatformAPI.getRuntimeName()));

        // Application
		this.setLabel('ns_ap_ev', eventType);

		this.setLabel('ns_ap_ver', getValueOrUnknown(core.getAppVersion()));

		this.setLabel('ns_ap_sd', PlatformAPI.getDisplayResolution());
		this.setLabel('ns_ap_res', PlatformAPI.getApplicationResolution());

		this.setLabel('ns_ap_lang', PlatformAPI.getLanguage());

		this.setLabel('ns_ap_sv', core.getVersion());

		if (eventType == EventType.KEEPALIVE) {
			this.setLabel('ns_ap_oc', core.getOfflineCache().getEventCount() + '');
		}

		var coldStartId = core.getColdStartId();
		var coldStartCount = core.getColdStartCount();

		this.setLabel('ns_ap_id', coldStartId + '');
		this.setLabel('ns_ap_cs', coldStartCount + '');

		this.setLabel('ns_ap_bi', PlatformAPI.getPackageName());

		this.setLabel('ns_ap_jb', getValueOrUnknown(PlatformAPI.getDeviceJailBrokenFlag()));
	}
}

ApplicationMeasurement.processTimingLabels = function (core, measurementData) {
	var coldBoot = measurementData.coldBoot,
		resetTimings = measurementData.resetTimings,
		includeTimings = measurementData.includeTimings;

    // Set default value
	resetTimings = typeof resetTimings !== _undefined ? resetTimings : true;
	includeTimings = typeof includeTimings !== _undefined ? includeTimings : true;

	core.update(includeTimings);

	if (includeTimings) {
		var foregroundTransitionsCountDelta = core.getForegroundTransitionsCountDelta();
		var foregroundTotalTime = core.getForegroundTotalTime(coldBoot);
		var foregroundTimeDelta = core.getForegroundTimeDelta(resetTimings);
		var backgroundTotalTime = core.getBackgroundTotalTime(coldBoot);
		var backgroundTimeDelta = core.getBackgroundTimeDelta(resetTimings);
		var inactiveTotalTime = core.getInactiveTotalTime(coldBoot);
		var inactiveTimeDelta = core.getInactiveTimeDelta(resetTimings);
		var applicationSessionTimeDelta = core.getApplicationSessionTimeDelta(resetTimings);
		var activeUserSessionTimeDelta = core.getActiveUserSessionTimeDelta(resetTimings);
		var userSessionTimeDelta = core.getUserSessionTimeDelta(resetTimings);
		var autoUpdateInterval = core.getAutoUpdateInterval();
		var applicationSessionCount = core.getApplicationSessionCountDelta(resetTimings);
		var activeUserSessionCount = core.getActiveUserSessionCountDelta(resetTimings);
		var userSessionCount = core.getUserSessionCountDelta(resetTimings);
		var userInteractionCount = core.getUserInteractionCount(resetTimings);

		measurementData.labels['ns_ap_fg'] = foregroundTransitionsCountDelta + '';
		measurementData.labels['ns_ap_ft'] = foregroundTotalTime + '';
		measurementData.labels['ns_ap_dft'] = foregroundTimeDelta + '';
		measurementData.labels['ns_ap_bt'] = backgroundTotalTime + '';
		measurementData.labels['ns_ap_dbt'] = backgroundTimeDelta + '';
		measurementData.labels['ns_ap_it'] = inactiveTotalTime + '';
		measurementData.labels['ns_ap_dit'] = inactiveTimeDelta + '';

		measurementData.labels['ns_ap_ut'] = autoUpdateInterval + '';

		measurementData.labels['ns_ap_as'] = applicationSessionCount + '';
		measurementData.labels['ns_ap_das'] = applicationSessionTimeDelta + '';

		if (activeUserSessionCount >= 0) {
			measurementData.labels['ns_ap_aus'] = activeUserSessionCount + '';
			measurementData.labels['ns_ap_daus'] = activeUserSessionTimeDelta + '';
			measurementData.labels['ns_ap_uc'] = userInteractionCount + '';
		}

		if (userSessionCount >= 0) {
			measurementData.labels['ns_ap_us'] = userSessionCount + '';
			measurementData.labels['ns_ap_dus'] = userSessionTimeDelta + '';
		}

		measurementData.labels['ns_ap_usage'] = (measurementData.created - core.getGenesis()) + '';
	}

    // TIMESTAMP
	measurementData.labels['ns_ts'] = measurementData.created + '';
};
ApplicationMeasurement.prototype = new Measurement();

// TODO remove? Does not have support for the MeasurementDispatcher class
ApplicationMeasurement.newApplicationMeasurement = function (core, type, details, pixelURL) {
	var measurementDispatcher = core.getMeasurementDispatcher();

	var measurementData = measurementDispatcher.initMeasurementData(type, details, pixelURL);
	var measurement = measurementDispatcher.finishMeasurement(measurementData);

	return measurement;
};

function AppStartMeasurement (core, eventType, pixelURL, coldBoot) {
	ApplicationMeasurement.call(this, core, eventType, pixelURL, coldBoot);

	this.setLabel('ns_ap_gs', core.getFirstInstallId() + '');
	this.setLabel('ns_ap_install', core.getInstallId() + '');

	this.setLabel('ns_ap_runs', core.getRunsCount() + '');

	if (coldBoot) {
		this.setLabel('ns_ap_csf', '1');
	}

    // ns_ap_lastrun
	this.setLabel('ns_ap_lastrun', core.getPreviousGenesis() + '');

    // wrong exit
	var exitCode = core.getExitCode();
	if (exitCode > 0) {
		this.setLabel('ns_ap_miss', exitCode.toString());
	}

	var previousVersion = core.getPreviousVersion();
	if (previousVersion) {
		this.setLabel('ns_ap_updated', previousVersion + '');
		core.getStorage().remove(Constants.PREVIOUS_VERSION_KEY);
		core.setPreviousVersion(null);
	}

	this.setLabel('ns_ap_jb', getValueOrUnknown(PlatformAPI.getDeviceJailBrokenFlag()));
}
AppStartMeasurement.prototype = new ApplicationMeasurement();

module.exports.Measurement = Measurement;
module.exports.ApplicationMeasurement = ApplicationMeasurement;
module.exports.AppStartMeasurement = AppStartMeasurement;

},{"17":17,"21":21,"24":24,"36":36,"4":4,"8":8}],11:[function(require,module,exports){
var ApplicationMeasurement = require(10).ApplicationMeasurement,
	AppStartMeasurement = require(10).AppStartMeasurement,
	PlatformAPI = require(36),
	EventType = require(8).EventType,
	ApplicationState = require(8).ApplicationState,
	Constants = require(4),
	aggregateLabels = require(14).aggregateLabels,

	DEFAULT_START_PAGE_NAME = 'start',
	DEFAULT_FOREGROUND_PAGE_NAME = 'foreground',
	DEFAULT_BACKGROUND_PAGE_NAME = 'background';
	

function MeasurementDispatcher (core) {
	var self = this;

	var initializationInProgress = 0;
	var delayedMeasurements = [];
	var isDataPrefetching = false;

    //Used for ns_ap_ec
	var eventCounter = 0;

    // Saved aggregated labels
	var aggregatedLabels = {};

	function processEventCounter(measurementData) {
		eventCounter++;
		measurementData.labels['ns_ap_ec'] = eventCounter + '';
	}

	function processAggregateData(measurement) {
		measurement.addLabels(aggregatedLabels);
		aggregatedLabels = {};
	}

	self.createInitializationWindow = function () {
		initializationInProgress++;

		var processEnded = false;

		var onInitializationEnd = function (allowDispatching) {
            //To prevent to execute to close the windows several times.
			if (processEnded) return;
			processEnded = true;

			initializationInProgress--;

			if(allowDispatching) {
				self.checkDispatch();
			}
		};

		return onInitializationEnd;
	};

    /**
     * Tries to dispatch the queued measurements.
     * 1. Tries to fetch the platform data using the PlatformAPI.onDataFetch API method.
     * 2. If there are opened waiting windows, then we wait. When finish close, we come back to point 1.
     *  2.1 Opened windows can exists due to the data pre-fetching
     *      or because there are uses of the waiting windows API somewhere in the code.
     * 3. If there are not opened waiting windows, we finally dispatch the measurements.
     * */
	self.preDispatch = function () {
		if (isDataPrefetching) return;

        // Open an initializationWindow
		var onEnd = self.createInitializationWindow();

        //To know when the data fetching has already finished.
		var onDataFetchSuccess = function () {
			isDataPrefetching = false; //Then we close the data pre-fetching process.

			onEnd(true); //We send now the measurements!
		};

        // To finish the initialization window, then execute this code.
		var onDataFetchEnds = function () {
			isDataPrefetching = false;

			onEnd(false); //We will not send the measurements
		};

		isDataPrefetching = true;
		PlatformAPI.onDataFetch(onDataFetchSuccess, onDataFetchEnds);
	};

	self.checkDispatch = function () {
        //If there is a waiting window opened
        //Or, actually, if there is a data pre-fetching happening at this moment
		if (initializationInProgress > 0) return;

        //It is possible to dispatch
		for (var i = 0; i < delayedMeasurements.length; ++i) {
			var measurementData = delayedMeasurements[i];

			var newMeasurement = self.finishMeasurement(measurementData);
			self.dispatch(measurementData, newMeasurement);
		}

		delayedMeasurements.length = 0;
	};

	self.queue = function (delayedMeasurement) {
		delayedMeasurements.push(delayedMeasurement);

		self.preDispatch();
	};

	self.dispatch = function (measurementData, newMeasurement) {
		core.getQueue().offer(newMeasurement);
		core.getKeepAlive().restart();
	};

	self.send = function (type, details, pixelURL) {
		if (type == EventType.AGGREGATE) {
			self.addAggregateLabels(details);
			return;
		}

		var measurementData = self.initMeasurementData(type, details, pixelURL);
		self.queue(measurementData);
	};

	self.initMeasurementData = function (type, details, pixelURL) {
		var measurementData = {
			created: +new Date(),
			eventType: type,
			pixelURL: pixelURL,
			coldBoot: false,
			resetTimings: undefined,
			includeTimings: undefined,
			labels: {}
		};

		processEventCounter(measurementData);

		if (type == EventType.START) {
			core.incrementRunsCount();

			measurementData.coldBoot = core.handleColdStart();

            // Adding persistent labels
			measurementData.persistentLabels = core.getLabels();

            // Addition of all the event labels
			measurementData.eventLabels = details;
		} else {
			measurementData.resetTimings = !(details != null && details.hasOwnProperty('ns_st_ev') && details['ns_st_ev'] == 'hb');
			measurementData.includeTimings = !(details != null && details.hasOwnProperty('ns_st_ev'));

            // Adding persistent labels
			measurementData.persistentLabels = core.getLabels();

            // Addition of all the event labels
			measurementData.eventLabels = details;
		}

		if (core.getCurrentActivityName() != null) {
			measurementData.pageNameLabel = core.getCurrentActivityName();
		} else if (type == EventType.START) {
			measurementData.pageNameLabel = DEFAULT_START_PAGE_NAME;
		} else if (core.getApplicationState() == ApplicationState.FOREGROUND) {
			measurementData.pageNameLabel = DEFAULT_FOREGROUND_PAGE_NAME;
		} else {
			measurementData.pageNameLabel = DEFAULT_BACKGROUND_PAGE_NAME;
		}

		ApplicationMeasurement.processTimingLabels(core, measurementData);

		return measurementData;
	};

	self.finishMeasurement = function (measurementData) {
		var newMeasurement = null;

		var eventType = measurementData.eventType,
			pixelURL = measurementData.pixelURL,
			coldBoot = measurementData.coldBoot;

		if (eventType === EventType.START) {
			newMeasurement = new AppStartMeasurement(core, eventType, pixelURL, coldBoot);
		} else {
			newMeasurement = new ApplicationMeasurement(core, eventType, pixelURL, coldBoot);
		}

        // Time related labels
		newMeasurement.addLabels( measurementData.labels );

        // Adding persistent labels
		newMeasurement.addLabels( measurementData.persistentLabels );

        // Addition of all the event labels
		newMeasurement.addLabels( measurementData.eventLabels );

        // Setting default page name
		if (!newMeasurement.hasLabel(Constants.PAGE_NAME_LABEL)) {
			newMeasurement.setLabel(Constants.PAGE_NAME_LABEL, measurementData.pageNameLabel);
		}

		PlatformAPI.processMeasurementLabels(newMeasurement);

		processAggregateData(newMeasurement);

		return newMeasurement;
	};

	self.addAggregateLabels = function (labels) {
		aggregateLabels(aggregatedLabels, labels);
	};
}

module.exports = MeasurementDispatcher;
},{"10":10,"14":14,"36":36,"4":4,"8":8}],12:[function(require,module,exports){
var PlatformAPI = require(36),
	objectUtils = require(24),
	generalUtils = require(21),
	arrayUtils = require(19),
	md5 = require(22),
	TransmissionMode = require(8).TransmissionMode,
	XMLBuilder = require(15),
	FileUtils = require(14).FileUtils,

	CACHE_FILENAME = 'cs_cache_',
	CACHE_DROPPED_MEASUREMENTS = 'CACHE_DROPPED_MEASUREMENTS',
	CACHE_MAX_SIZE = 2000,
	CACHE_MAX_BATCH_SIZE = 100,
	CACHE_MAX_FLUSHES_INAROW = 10,
	CACHE_WAIT_MINUTES = 30,
	CACHE_EXPIRY_DAYS = 31,
	OFFLINE_RECEIVER_URL = 'http://udm.scorecardresearch.com/offline',
	OFFLINE_RECEIVER_URL_SECURE = 'https://udm.scorecardresearch.com/offline';

function OfflineMeasurementsCache (core, cacheFilename) {
	var self = this,
		maxSize,
		maxBatchSize,
		maxFlushesInARow,
		minutesToRetry,
		expiryInDays,
		filelist,
		xmlPOST,
		postsSentInARow,
		lastPOSTFailedTime = 0,
		lastFlushDate,
		baseUrl;


	cacheFilename = cacheFilename || CACHE_FILENAME;

    /**
     * Create URL string to be used for flushing cached measurements, by
     * appending Customer C2 value and Publisher secret value
     *
     * @return url string
     */
	function createFlushingURL(props) {

		var url;
		if (generalUtils.exists(baseUrl) && generalUtils.isNotEmpty(baseUrl)) {
			url = baseUrl;
		} else {
			url = props.isSecure() ? OFFLINE_RECEIVER_URL_SECURE : OFFLINE_RECEIVER_URL;
		}

		var addAmp = true;
		if (url.indexOf('?') == -1) {
			url += '?';
			addAmp = false;
		}

		var c2 = core.getCustomerC2();
		if (generalUtils.isNotEmpty(c2)) {
			if (addAmp) {
				url += '&';
			}
			url += 'c2=' + c2;
			addAmp = true;
		}

		var secret = 'JetportGotAMaskOfThe' + core.getSalt() + 'S.D_K-';
		secret = md5(secret);
		if (generalUtils.isNotEmpty(secret)) {
			if (addAmp) {
				url += '&';
			}
			url += 's=' + secret;
		}

		return url.toLowerCase();
	}

    /**
     * Check if last POST failed before CACHE_WAIT_MINUTES interval or sent more
     * than CACHE_MAX_POSTS in a row
     *
     * @return
     */
	function isFlushingAllowed() {
		if (isConnectionAvailable() && !self.isEmpty() && core.getCustomerC2() != null) {
			if (postsSentInARow >= maxFlushesInARow) {
				var timeToWait = minutesToRetry * 1000 * 60 - (+new Date() - lastFlushDate);
				if (timeToWait <= 0) {
					postsSentInARow = 0;
					lastFlushDate = 0;
					return true;
				}
			} else {
				return true;
			}
		}

		return false;
	}

    /**
     * Remove previous post failed time and reset xmlpost content
     */
	function destroyPreviousPost() {
		lastPOSTFailedTime = 0;
		if (xmlPOST != null) {
			xmlPOST = null;
		}
	}

    /**
     * Check if any connectivity available
     *
     * @return boolean if available, false - otherwise
     */
	function isConnectionAvailable() {
		if (!core.getEnabled()) return false;
		return PlatformAPI.isConnectionAvailable();
	}

    /**
     * Remove expired files with cached measurements
     *
     */
	function removeExpiredFiles() {

		var files = getListOfCacheFiles();

		var foundExpired = false;

		for (var i = files.length; i > 0; i--) {
			var fileTimestamp = getTimestampFromFilename(files[i - 1]);
			if (!foundExpired) {
				foundExpired = isExpired(fileTimestamp);
			} else {
				deleteCacheFile(files[i - 1], true);
			}
		}
	}

    /**
     * Update dropped measurements counter in the storage
     *
     * @param filename
     *            - name of the file whose measurements are being dropped
     */
	function updateDroppedCounterForFile(filename) {
		var storage = core.getStorage();
		var droppedCounter = 0;
		if (storage.has(filename)) {
			droppedCounter = Number(storage.get(filename));
			updateDroppedCounter(droppedCounter);
		}
	}

    /**
     * Update dropped measurements counter in the storage
     *
     * @param valueToAdd
     *            - value to add
     */
	function updateDroppedCounter(valueToAdd) {
		if (!core.getEnabled()) return;
		var storage = core.getStorage();
        // if already stored dropped counter, update it
		if (storage.has(CACHE_DROPPED_MEASUREMENTS)) {
			valueToAdd += Number(storage.get(CACHE_DROPPED_MEASUREMENTS));
		}

		storage.set(CACHE_DROPPED_MEASUREMENTS, valueToAdd + '');
	}

    /**
     * Retrieve list of cache files
     *
     * @return array list of file names of cache files
     */
	function getListOfCacheFiles() {
		if (filelist == null) {
			filelist = FileUtils.getFileList();
		}

		return filelist;
	}

    /**
     * Create new core_cache_TIMESTAMP file and write measurement event
     *
     * @param event
     *            - string event to write in the file
     */
	function createNewCacheFile(event) {
		var filename = cacheFilename + XMLBuilder.getLabelFromEvent(event, 'ns_ts');
		FileUtils.writeEvent(core, filename, event);
		if (filelist == null) {
			filelist = [];
		}

		filelist.push(filename);

		destroyPreviousPost();
	}

    /**
     * Delete file and if it was dropped, update dropped measurements counter
     *
     * @param filename
     *            - file name to delete
     * @param isDropped
     *            - if true, update dropped counter
     */
	function deleteCacheFile(filename, isDropped) {
		if (filename != null) {
			if (isDropped) {
                // update dropped counter
				updateDroppedCounterForFile(filename);
			}

            // delete file with oldest timestamp
			FileUtils.deleteFile(core, filename);
			var idx = arrayUtils.indexOf(filename, filelist);
			if (idx >= 0) {
				filelist.splice(idx, 1);
			}
		}
	}

    /**
     * Retrieve file name of the oldest cached measurements file
     *
     * @return string file name, otherwise null if cache is empty
     */
	function getOldestFile() {
		if (filelist != null && filelist.length > 0) {
			return filelist[0];
		}
		return null;
	}

    /**
     * Retrieve file name of the newest cached measurements file
     *
     * @return file name, otherwise null if cache is empty
     */
	function getNewestFile() {
		if (filelist != null && filelist.length > 0) {
			return filelist[filelist.length - 1];
		}
		return null;
	}

    /**
     * Retrieve counter from the storage related to the file name; if not found,
     * read lines from that files
     *
     * @param filename
     *            - file name to count events
     * @return integer count of events
     */
	function measurementCountIn(filename) {
		var storage = core.getStorage();
		var counter = 0;
		if (filename != null) {
			if (storage.has(filename)) {
				counter = Number(storage.get(filename));
			} else { // if no value found in the storage proceed to count lines
                // in the file
				counter = FileUtils.readCachedEvents(core, filename).length;
			}
		}
		return counter;
	}

    /**
     * Validate events that contain expired measurements and remove them
     *
     * @param filename
     *            - file name, whose events are being validated
     * @return array of validated events
     */
	function validateEvents(filename) {
		var droppedcounter = 0;
		var eventsToFlush = FileUtils.readCachedEvents(core, filename);

		var foundValid = false;
		for (; droppedcounter < eventsToFlush.length; droppedcounter++) {
			var fileTimestamp = Number(XMLBuilder.getLabelFromEvent(eventsToFlush[droppedcounter], 'ns_ts'));
			foundValid = !isExpired(fileTimestamp);
			if (foundValid) {
				break;
			}
		}

		if (!foundValid) {
            // all events are expired, file must be deleted
			deleteCacheFile(filename, true);
			eventsToFlush = null;
		} else {
			updateDroppedCounter(droppedcounter);
			eventsToFlush = eventsToFlush.slice(droppedcounter, eventsToFlush.length);
		}
		return eventsToFlush;

	}

    /**
     * Parse file's name and retrieve timestamp
     *
     * @param filename
     *            - file's name to parse
     * @return timestamp
     */
	function getTimestampFromFilename(filename) {
		return Number(filename.substring(cacheFilename.length));
	}

    /**
     * Check if timestamp if expired comparing with CACHE_MAX_EXPIRACY value
     *
     * @param timestamp
     *            - timestamp to compare
     * @return true if expired, false otherwise
     */
	function isExpired(timestamp) {
		var now = +new Date();
		var age = (now - timestamp);
		var millisToExpire = expiryInDays * 24 * 60 * 60 * 1000 - age;
		return millisToExpire <= 0;
	}

	function nextFlush(props, onFlushed) {
		var storage = core.getStorage();

		if (isFlushingAllowed()) {
			var eventsToFlush = null;
			var fileToProceed = null;

            // check if previously cache was flushed
			if (xmlPOST == null) {
				fileToProceed = getNewestFile();

                // proceeding through events in case it may contain not
                // valid measurements
				eventsToFlush = validateEvents(fileToProceed);

				if (eventsToFlush != null && eventsToFlush.length > 0) {
					var droppedCount = (storage.has(CACHE_DROPPED_MEASUREMENTS)) ? storage.get(CACHE_DROPPED_MEASUREMENTS) : '0';
					xmlPOST = XMLBuilder.generateXMLRequestString(eventsToFlush, droppedCount);
				}
			}

			if (xmlPOST != null && xmlPOST.length > 0) {
				PlatformAPI.httpPost(createFlushingURL(props), xmlPOST, function (status) {
					if (status == 200) {
                        // increment sent POSTs counter
						postsSentInARow++;
                        // measurements were flushed, so file is being
                        // deleted
						deleteCacheFile(fileToProceed, false);

						destroyPreviousPost();

						lastFlushDate = +new Date();
						storage.remove(CACHE_DROPPED_MEASUREMENTS);
						PlatformAPI.setTimeout(function () {
							nextFlush(props, onFlushed);
						}, 0);
						return;
					}
					onFlushed();
				});
				return;
			}
		}
		onFlushed();
	}


	objectUtils.extend(this, {
		flush: function (props, onFlushed) {
			if (!core.getEnabled()) return;
            // removing oldest files
			removeExpiredFiles();

			var millisToWait = minutesToRetry * 1000 * 60 - (+new Date() - lastPOSTFailedTime);
			if (millisToWait <= 0) {

				lastPOSTFailedTime = 0;

				nextFlush(props, onFlushed);
			} else {
				onFlushed();
			}
		},

		setCacheMaxMeasurements: function (max) {
			maxSize = max;
		},

		getCacheMaxMeasurements: function () {
			return maxSize;
		},

		setCacheMaxBatchFiles: function (max) {
			if (max <= 0) { // cannot be 0, we divide by it
                // ignore value
				return;
			}
			maxBatchSize = max;
		},

		getCacheMaxBatchFiles: function () {
			return maxBatchSize;
		},

		setCacheMaxPosts: function (max) {
			maxFlushesInARow = max;
		},

		getCacheMaxPosts: function () {
			return maxFlushesInARow;
		},

		setCacheWaitMinutes: function (minutes) {
			minutesToRetry = minutes;
		},

		getCacheWaitMinutes: function () {
			return minutesToRetry;
		},

		setCacheMeasurementExpiry: function (days) {
			expiryInDays = days;
		},

		getCacheMeasurementExpiry: function () {
			return expiryInDays;
		},

        /**
         * Append measurement string to the new line at the end of the file or
         * create new file
         *
         * @param event
         *            - to append
         */
		saveEvent: function (event) {
			if (!core.getEnabled()) return;

			var props = core.getDispatchProperties();

			if (typeof(event) !== 'string') {
				event = event.retrieveLabelsAsString(props.getMeasurementLabelOrder());
			}

			if (props.getOfflineTransmissionMode() != TransmissionMode.DISABLED && core.getCustomerC2() != null && generalUtils.isNotEmpty(XMLBuilder.getLabelFromEvent(event, 'ns_ts'))) {
                // get filename of newest file in the cache
				var newestFile = getNewestFile();
				if (newestFile != null) {// files with cached measurements are already
                    // exists

                    // retrieve counter related to this file
					var counter = measurementCountIn(newestFile);

                    // check if file not full
					if (counter < this.getCacheMaxBatchFiles()) {

                        // Append event as new line to the end of the existing file
						event = '\n' + event;

						FileUtils.writeEvent(core, newestFile, event);

						destroyPreviousPost();

					} else {
                        // check if cache is full
						if (getListOfCacheFiles().length >= this.getCacheMaxMeasurements() / this.getCacheMaxBatchFiles()) {
							deleteCacheFile(getOldestFile(), true);
						}
						createNewCacheFile(event);
					}

				} else {
					createNewCacheFile(event);
				}
			}
		},

        /**
         * Get amount of all cached events
         *
         * @return
         */
		getEventCount: function () {

			var counter = measurementCountIn(getNewestFile());

			if (getListOfCacheFiles().length > 0) {
				counter += (getListOfCacheFiles().length - 1) * this.getCacheMaxBatchFiles();
			}

			return counter;
		},

        /**
         * Checks if cache is empty
         *
         * @return true, if empty
         */
		isEmpty: function () {
			return this.getEventCount() == 0;
		},

        /**
         * Clear the offline cache
         */
		clear: function () {
			var files = getListOfCacheFiles();

			for (var i = files.length; i > 0; i--) {
				deleteCacheFile(files[i - 1], true);
			}

			core.getStorage().remove(CACHE_DROPPED_MEASUREMENTS);
		},

        /**
         * Sets the url used to flush the cache.
         * @param value
         */
		setUrl: function setUrl(value) {
			baseUrl = value;
		}
	});

	this.setCacheMaxMeasurements(CACHE_MAX_SIZE);
	this.setCacheMaxBatchFiles(CACHE_MAX_BATCH_SIZE);
	this.setCacheMaxPosts(CACHE_MAX_FLUSHES_INAROW);
	this.setCacheWaitMinutes(CACHE_WAIT_MINUTES);
	this.setCacheMeasurementExpiry(CACHE_EXPIRY_DAYS);

	removeExpiredFiles();
}

// Microoptimization. To be removed/refactor eventually.
OfflineMeasurementsCache.CACHE_MAX_SIZE = CACHE_MAX_SIZE;
OfflineMeasurementsCache.CACHE_MAX_BATCH_SIZE = CACHE_MAX_BATCH_SIZE;
OfflineMeasurementsCache.CACHE_MAX_FLUSHES_INAROW = CACHE_MAX_FLUSHES_INAROW;
OfflineMeasurementsCache.CACHE_WAIT_MINUTES = CACHE_WAIT_MINUTES;
OfflineMeasurementsCache.CACHE_EXPIRY_DAYS = CACHE_EXPIRY_DAYS;

exports.OfflineMeasurementsCache = OfflineMeasurementsCache;
},{"14":14,"15":15,"19":19,"21":21,"22":22,"24":24,"36":36,"8":8}],13:[function(require,module,exports){
var objectUtils = require(24),
	browserUtils = require(20),
	PlatformAPI = require(36),
	Constants = require(4),
	TransmissionMode = require(8).TransmissionMode;

function Request(core, props, m, onDispatched) {
	var self = this,
		dispatchProperties = props,
		measurement = m;

	function onResponse(status) {
		if(!(status == 200 || (status == 302 || status == 301) && !core.isHttpRedirectCaching())) {
			// Cache request
			core.getOfflineCache().saveEvent(measurement.retrieveLabelsAsString(dispatchProperties.getMeasurementLabelOrder()), dispatchProperties);
		}
		onDispatched && onDispatched();
	}

	function sendRequest() {
		var url = self.process(measurement.getPixelURL());
		PlatformAPI.httpGet(url, onResponse);
	}

	objectUtils.extend(self, {
		process: function(basePixelURL) {
			basePixelURL = basePixelURL + measurement.retrieveLabelsAsString(dispatchProperties.getMeasurementLabelOrder());
			var urlLengthLimit = browserUtils.browserAcceptsLargeURLs() ? Constants.URL_LENGTH_LIMIT : Constants.RESTRICTED_URL_LENGTH_LIMIT;

			// Truncating the url after 2048 because it will not be processed on server side
			if (basePixelURL.length > urlLengthLimit && basePixelURL.indexOf('&') > 0) {

				// Cutting after the last '&'
				// and adding ns_cut={encoded fraction of what was cut to fill the url length limit number of chars}
				var last = basePixelURL.substring(0, urlLengthLimit - 8).lastIndexOf('&');
				var nscutEncodedValue = encodeURIComponent(basePixelURL.substring(last + 1));
				basePixelURL = basePixelURL.substring(0, last) + '&ns_cut=' + nscutEncodedValue;
			}

			if (basePixelURL.length > urlLengthLimit) {
				basePixelURL = basePixelURL.substring(0, urlLengthLimit);
			}

			return basePixelURL;
		},

		send: function() {
			var mode = dispatchProperties.getLiveTransmissionMode();
			if (mode == TransmissionMode.NEVER || mode == TransmissionMode.DISABLED) {
				core.getOfflineCache().saveEvent(measurement.retrieveLabelsAsString(dispatchProperties.getMeasurementLabelOrder()), dispatchProperties);
				onDispatched && onDispatched();
			} else {
				if (dispatchProperties.getOfflineTransmissionMode() != TransmissionMode.NEVER && core.getOfflineCache().getEventCount() > 0) {
					var cache = core.getOfflineCache();
					cache.flush(dispatchProperties, sendRequest);
				} else {
					sendRequest();
				}
			}

			return true;
		}
	});
}

module.exports = Request;
},{"20":20,"24":24,"36":36,"4":4,"8":8}],14:[function(require,module,exports){
var PlatformAPI = require(36);

var DIR = 'cache_dir',
	io = null;

function initIO() {
	if(io) return;

	if(typeof PlatformAPI.IO != 'function') return;

	io = new PlatformAPI.IO();
}

var FileUtils = {
	getFileList: function () {
		initIO();

		return io.dir(DIR) || [];
	},

	writeEvent: function (core, filename, event) {
		initIO();

		var storage = core.getStorage();
		var counter = Number(storage.get(filename)) || 0;
		io.append(DIR, filename, event);
		counter++;
		storage.set(filename, counter + '');
	},

	deleteFile: function (core, filename) {
		initIO();

		io.deleteFile(DIR, filename);
		core.getStorage().remove(filename);
	},

	readCachedEvents: function (core, filename) {
		initIO();

		var events = io.read(DIR, filename);
		return events ? events.split('\n') : [];
	}
};

function existingString(value, newString) {
	return value.indexOf(newString) >= 0;
}

function isList(value) {
	value = value + '';
	if (value.indexOf(',') < 0) {// isn't a list
		return false;
	} else { // contains comma
		if (value.indexOf(' ') < 0) { // not contains space, so is a list
			return true;
		}
	}
	return false;
}

function getElementsFromList(list) {
	return list.split(',');
}

function isInteger(n) {
	return !isNaN(parseInt(n)) && isFinite(n);
}

function addValue(value, list) {
	var newValue = list;
	var elementList = getElementsFromList(value);
	for (var k = 0, len = elementList.length; k < len; k++) {
		var elem = elementList[k];
		if (elem.length > 0) {
			if (newValue.indexOf(elem) < 0) {
				if (newValue.length == 0) { // empty list
					newValue += elem + ':1';
				} else {
                    // not empty list
					newValue += ';' + elem + ':1';
				}
			} else {
                // element is in list, so count++
				var array = newValue.split(';');
				for (var i = 0, len2 = array.length; i < len2; i++) {
					if (array[i].indexOf(elem) >= 0) {
						var array2 = array[i].split(':');
						var count = Number(array2[1]);
						count++;
						var updatedValue = array2[0] + ':' + count;
						var idx = newValue.indexOf(array[i]);
						newValue = newValue.substring(0, idx) + updatedValue + newValue.substring(idx + array[i].length);
					}
				}
			}
		}
	}
	return newValue;
}

var aggregateLabels = function (labels, newLabels) {
	for (var name in newLabels) {
		if (newLabels.hasOwnProperty(name)) {
			var existingValue = labels[name],
				value = newLabels[name];

			if (existingValue == null) {
                // doesn't exist
				if (isList(value)) {
                    // change value format to list format
					labels[name] = addValue(value, '');
				} else {
                    // add label normally
					labels[name] = value;
				}
			} else {
                // exists
				if (isInteger(existingValue) && isInteger(value)) {
                    // is an integer
					labels[name] = (parseInt(existingValue) + parseInt(value)) + '';
				} else if (isList(value)) {
                    // is a list
					labels[name] = addValue(value, existingValue);
				} else {
                    // is a string
					if (!existingString(existingValue, value)) {
						labels[name] = existingValue + ',' + value;
					}
				}
			}
		}
	}
};

exports.aggregateLabels = aggregateLabels;
exports.FileUtils = FileUtils;
},{"36":36}],15:[function(require,module,exports){
var md5 = require(22),
	generalUtils = require(21);

var concatedProcessedEvents = [],
	_start = -1,
	_end = -1,
	HEADER_LABELS = [ 'c12', 'c1', 'ns_ap_an', 'ns_ap_pn', 'ns_ap_pv', 'ns_ap_device', 'ns_ak' ],
	SKIP_LABELS = [ 'c12', 'c1', 'ns_ap_an', 'ns_ap_pn', 'ns_ap_pv', 'ns_ap_device', 'ns_ts', 'ns_ak' ],
	ALL_CHECKED_MASK = (1 << SKIP_LABELS.length) - 1,
	MD5POS = -1;

function insertChecksum(b) {
	var checksum = md5(concatedProcessedEvents.join('')).toLowerCase();
	b.splice(MD5POS, 0, checksum);
}

function processLabel(header, event, label) {
	extractValueOffset(event, label);
	if (_start != -1) {
		if (_end > _start) {
			header.push(label, '="', event.substring(_start, _end), '" ');
		}
	}
}

/**
 * Find positions of the label within the event string
 *
 * @param event
 *            - where to find label
 * @param label
 *            - name of the label
 */
function extractValueOffset(event, label) {
	_start = _end = -1;
	var i = 0;
	do {
		i = event.indexOf(label, i);
		if (i >= 0) {
			var eqPos = i + label.length;
			if ((i == 0 || event.charAt(i - 1) == '&') && eqPos < event.length && event.charAt(eqPos) == '=') {
				_start = eqPos + 1; // + because of =
				_end = event.indexOf('&', _start);
				if (_end == -1) { // if ampersand not found then this is the last label in the event
					_end = event.length;
				}
				return;
			} else {
				i = eqPos + 1;
			}
		}
	} while (i >= 0 && i < event.length);
}

/**
 * Append events to the resulting string
 *
 * @param events
 *            - array of string events
 * @param result
 *            - resulting xml string
 */
function appendEvents(events, result) {
	concatedProcessedEvents = [];

	for (var i = 0, len = events.length; i < len; i++) {
		if (generalUtils.isNotEmpty(events[i])) {
			appendEvent(events[i], result);
		}
	}
}

/**
 * Append single event to the xml string
 *
 * @param event event string to proceed and append
 * @param result
 */
function appendEvent(event, result) {
	var checkMask = 0;

	extractValueOffset(event, 'ns_ts');
	if (_start != -1 && _end > _start) {
		result.push('<event t="', event.substring(_start, _end), '">');

		var start = 0, end, labelNameEnd;
		var labelsAdded = 0;
		while (start < event.length) {
			end = event.indexOf('&', start);
			if (end == -1) { // if ampersand not found then this is the last label in the event
				end = event.length;
			}

			if (end > start) {
				labelNameEnd = event.indexOf('=', start);
				if (labelNameEnd > start) {
					// Checking if label can be appended
					var canAppend = true;
					if (checkMask != ALL_CHECKED_MASK) {
						for (var i = 0, len = SKIP_LABELS.length; i < len; i++) {
							var mask = (1 << i);
							if ((checkMask & mask) == 0) {
								if (SKIP_LABELS[i].length == labelNameEnd - start && generalUtils.regionMatches(SKIP_LABELS[i], 0, event, start, SKIP_LABELS[i].length)) {
									canAppend = false;
									checkMask |= mask;
									break;
								}
							}
						}
					}

					if (canAppend) {
						if (labelsAdded > 0) {
							concatedProcessedEvents.push('&');
							result.push('&');
						}
						concatedProcessedEvents.push(event.substring(start, end));
						result.push(event.substring(start, end));
						labelsAdded++;
					}
				}
			}
			start = end + 1;
		}
		result.push('</event>');
	}
}

function createHeader(header, event, droppedCount) {
	var timeStamp = +new Date() + '';

	header.push('<events t="', timeStamp, '" ');

	for (var i = 0, len = HEADER_LABELS.length; i < len; i++) {
		processLabel(header, event, HEADER_LABELS[i]);
	}

	header.push('dropped="', droppedCount, '" md5="', '">');
	MD5POS = header.length - 1;
}

var XMLBuilder = {
	generateXMLRequestString: function(events, droppedCount) {
		var sb = ['<?xml version="1.0" encoding="UTF-8" ?>'];

		createHeader(sb, events[0], droppedCount);
		appendEvents(events, sb);
		insertChecksum(sb);

		sb.push('</events>');

		return sb.join('');
	},

	getLabelFromEvent: function(event, labelName) {
		extractValueOffset(event, labelName);

		if (_start != -1) {
			if (_end > _start) {
				return event.substring(_start, _end);
			}
		}
		return null;
	}
};

module.exports = XMLBuilder;

},{"21":21,"22":22}],16:[function(require,module,exports){
(function (global){
/* global window */

// To remove local js-common submodule when removing the loadModule.
var objectUtils = require(24);

// We use "exports" because that will prevent uglify to mangle all the rest of exports.
var ns_ = module['exports'] = global.ns_ || {};

// If running in a browser with CommonJS or AMD, library will always expose to global.
if(typeof window != 'undefined')	{
	window.ns_ = ns_;
}

ns_.comScore = require(2);

/**
 * This method, only available in common-js, module/export like enviroments and nodejs, loads other plugins and modules into a single namespace.
 * @param  {object} pluginNs Module or plugin namespace that we want to load into the main namespace.
 * @deprecated Since APP is integrated withtin the STA then that is no need anymore.
 * @return {object}          The main namespace.
 */
ns_.loadModule = ns_.loadModule || function (pluginNs) {
	for (var key in pluginNs) {
		if (key !== 'ns_') {
			objectUtils.extend(ns_, pluginNs);
		}
	}

	pluginNs.ns_ = ns_;

	return ns_;
};

ns_.PlatformAPIs = require(32);

// It overrides the PlatformAPI object from the core js-common dependency.
require(39);

// STA
ns_.StreamingAnalytics = require(67);
ns_.ReducedRequirementsStreamingAnalytics = require(64);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"2":2,"24":24,"32":32,"39":39,"64":64,"67":67}],17:[function(require,module,exports){
var CommonConstants = {
	UNKNOWN_VALUE: 'unknown',
	UNKNOWN_RESOLUTION: '0x0',
	RSA_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD0+fCVxGq3Bk24jUKO1PzsiUs3\nvqww6zR4n2e3AweVLUAgsrDRbAWJ/EjZm1WBLBVNMiTLpSAkV6sjOIrUs03xdUEj\nQZJHwOGK+MfzFaZukoo0qAsEMPwQ5posv0JdkBdUGhKchPk6+NYmD6Hb44Lkp7/a\nQnVeWzvfAPQyTJR5wQIDAQAB\n-----END PUBLIC KEY-----'
};

module.exports = CommonConstants;
},{}],18:[function(require,module,exports){
/* eslint no-console: "off" */
/* global console */

var HISTORYLOG_MAX_LINES = 10000,
	_undefined = 'undefined',
	_function = 'function';

function Logging(logNamespace, debugSettings) {
	var self = this,
		comScoreLogNamespace = 'comScore',
		logHistory = [];

	function createLogLineArgs(logginElements) {
		logginElements = logginElements || [];

		var line = [
			comScoreLogNamespace,
			+new Date()
		];

		if (logNamespace) {
			line.push(logNamespace);
		}

		logginElements = Array.prototype.slice.call(logginElements);

		line = line.concat(logginElements);

		return line;
	}

    /**
     * Defines if a certain log line should be printed out or not
     * by checking the provided debugSettings.
     * */
	function isShown(line) {
		var i, filteringPtrOption, strLine;

		if (typeof debugSettings == 'boolean' || !debugSettings) {
			return !!debugSettings;
		}

		strLine = line.join(' ');

        // In case of debug: [RegExp]
		if (debugSettings instanceof Array && debugSettings.length > 0) {
			for (i = 0; i < debugSettings.length; ++i) {
				filteringPtrOption = debugSettings[i];

				if (filteringPtrOption instanceof RegExp && filteringPtrOption.test(strLine)) {
					return true;
				}
			}

			return false;

        // In case of debug: {show: [RegExp], hidden: [RegExp]}
		} else if (typeof debugSettings == 'object') {
			var isMarkedAsToHide = false;

            // For the case of debug.hide: [RegExp]
			if (debugSettings.hide instanceof Array) {
				for (i = 0; i < debugSettings.hide.length; ++i) {
					filteringPtrOption = debugSettings.hide[i];

					if (filteringPtrOption instanceof RegExp && filteringPtrOption.test(strLine)) {
						isMarkedAsToHide = true;
						break;
					}
				}
			}

            // For the case of debug.show: [RegExp]
			if (debugSettings.show instanceof Array) {
				for (i = 0; i < debugSettings.show.length; ++i) {
					filteringPtrOption = debugSettings.show[i];

					if (filteringPtrOption instanceof RegExp && filteringPtrOption.test(strLine)) {
						return true;
					}
				}
			}

			if (isMarkedAsToHide) {
				return false;
			}

            // If show property is present, by default it will hide what reaches this point
            // In other cases, such as when show is not present or when hide is there (or not) then the default
            // behaviour is to log to console.
			return !debugSettings.show;
		}

        // In case an unknown data was passed.
		return true;
	}

	function addLogHistoryLine(line) {
		var logHistoryLength = logHistory.length;

		if (logHistoryLength > HISTORYLOG_MAX_LINES || typeof debugSettings == 'object' && debugSettings.max && logHistoryLength > debugSettings.max) {
			var maxLogLines = typeof debugSettings == 'object' && debugSettings.max || HISTORYLOG_MAX_LINES;
            // Remove oldest logged lines.
			logHistory.splice(0, logHistory.length - maxLogLines +1 /*because we're going to add one now*/);
		}

		logHistory.push(line);
	}

	self.log = function () {
		var line = createLogLineArgs(arguments);

		addLogHistoryLine(line);

		if (typeof console == _undefined || typeof console.log != _function) {
			return;
		}

		if (isShown(line)) {
			console.log.apply(console, line);
		}
	};
	self.warn = function () {
		var line = createLogLineArgs(arguments);

		addLogHistoryLine(line);

		if (typeof console == _undefined || typeof console.warn != _function) {
			return;
		}

		if (isShown(line)) {
			console.warn.apply(console, line);
		}
	};

	self.error = function () {
		var line = createLogLineArgs(arguments);

		addLogHistoryLine(line);

		if (typeof console == _undefined || typeof console.error != _function) {
			return;
		}

		if (isShown(line)) {
			console.error.apply(console, line);
		}
	};

	self.apiCall = function (methodName /*, ...args */) {
		var line = ['API call to:', methodName];

		for (var i = 1; i < arguments.length; ++i) {
			line.push('arg' + i + ':', arguments[i]);
		}

		this.log.apply(this, line);
	};

	self.infoLog = function (/*..args*/) {
		var line = ['Trace log:'];

		line.push.apply(line, Array.prototype.slice.call(arguments));

		this.log.apply(this, line);
	};

	self.deprecation = function (deprecatedStatement, optNewStatement) {
		var line = ['Deprecated API:',
			deprecatedStatement,
			'is deprecated and will be eventually removed.'
		];

		if (optNewStatement) {
			line.push('Use', optNewStatement, 'instead.');
		}

		this.warn.apply(this, line);
	};

	self.getLogHistory = function () {
		return logHistory;
	};
}

module.exports = Logging;
},{}],19:[function(require,module,exports){
var Utils = {},
	_undefined = 'undefined';

/**
 *  Utils.indexOf( value, array ) -> Integer
 *  - value (Object): the value to look for
 *  - array (Array): the array where to look into
 *
 *  Implementation of Array.indexOf, searches in `array` for the occurrence of
 *  `value` and returns its index in the array, otherwise `-1`.
 **/
Utils.indexOf = function (value, array) {
	var r = -1;
	Utils.forEach(array, function (item, key) {
		if (item == value)			{
			r = key;
		}
	});
	return r;
};

/**
 * Utils.forEach( array, iterator, context ) -> void
 * - array (Array): the array to iterate
 * - iterator (Function(value, index)): callback
 * - context (Object): (optional) Context where to execute the callback
 **/
Utils.forEach = function (array, iterator, context) {
	try {
		if (typeof(iterator) == 'function') {
			context = typeof(context) != _undefined ? context : null;
			// is it an object or an array?
			if (typeof array['length'] != 'number' || typeof array[0] == _undefined) {
				var hasProto = typeof(array.__proto__) != _undefined;
				for (var element in array) {
					if (array.hasOwnProperty(element)) {
						if ((!hasProto || (hasProto && typeof(array.__proto__[element]) == _undefined)) && typeof array[element] != 'function')							{
							iterator.call(context, array[element], element);
						}
					}
				}
			} else {
				for (var index = 0, l = array.length; index < l; index++) {
					iterator.call(context, array[index], index);
				}
			}
		}
	} catch (e) {
		// Do nothing
	}
};

exports.indexOf = Utils.indexOf;
exports.forEach = Utils.forEach;
},{}],20:[function(require,module,exports){
/* eslint-env browser */

var Utils = {},
	_undefined = 'undefined',
	_document = typeof document != _undefined && document || undefined;

/**
 * This helpers methods are meant to be used only in a browser environment.
 */

/**
 * Checks whether the current environment has support for the Page Visibility API or not.
 * @return {boolean}   True if the current environment supports any Page Visibility API, false otherwise.
 */
Utils.hasPageVisibilityAPISupport = (function () {
	if (!_document) return false;

	var hasSupport = false;
	if (typeof _document.hidden !== _undefined) { // Opera 12.10 and Firefox 18 and later support
		hasSupport = true;
	} else if (typeof _document.mozHidden !== _undefined) {
		hasSupport = true;
	} else if (typeof _document.msHidden !== _undefined) {
		hasSupport = true;
	} else if (typeof _document.webkitHidden !== _undefined) {
		hasSupport = true;
	}

	return function () {
		return hasSupport;
	};
})();

/**
 * This will return the right Page Visibility API considering the new and old browsers implementations.
 * @return {object} The Page Visibility API.
 */
Utils.getPageVisibilityAPI = (function () {
	if (!_document) return null;

	// Set the name of the hidden property and the change event for visibility
	//https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
	//https://davidwalsh.name/page-visibility
	var hidden, visibilityChange, state;
	if (typeof _document.hidden !== _undefined) { // Opera 12.10 and Firefox 18 and later support
		hidden = 'hidden';
		visibilityChange = 'visibilitychange';
		state = 'visibilityState';
	} else if (typeof _document.mozHidden !== _undefined) {
		hidden = 'mozHidden';
		visibilityChange = 'mozvisibilitychange';
		state = 'mozVisibilityState';
	} else if (typeof _document.msHidden !== _undefined) {
		hidden = 'msHidden';
		visibilityChange = 'msvisibilitychange';
		state = 'msVisibilityState';
	} else if (typeof _document.webkitHidden !== _undefined) {
		hidden = 'webkitHidden';
		visibilityChange = 'webkitvisibilitychange';
		state = 'webkitVisibilityState';
	}

	var pageVisibilityAPI = {
		hidden: hidden,
		visibilityChange: visibilityChange,
		state: state
	};

	return function () {
		return pageVisibilityAPI;
	};
})();

/**
 * Returns if the page is visible (if it is in background or in foreground).
 * according to the Page Visibility API.
 * @return {boolean} True if the page is visible; false if the page is not visible
 * and unknown in case there is no support.
 */
Utils.isTabInBackground = (function () {
	if (!_document) return null;

	var pageVisibilityAPI = Utils.getPageVisibilityAPI();

	return function () {
		return _document[pageVisibilityAPI.hidden];
	};
})();

/**
 * The part that detects IE browser in the following method is based on the following StackOverflow
 * answer http://stackoverflow.com/a/17907562/1979669
 * @returns string detected browser name
 */
Utils.getBrowserName = function () {
	if (!navigator) return '';

	var userAgent = navigator.userAgent || '';
	var appName = navigator.appName || '';
	var nameOffset, verOffset;

	// In Opera, the true version is after "Opera" or after "Version"
	if ((verOffset = userAgent.indexOf('Opera')) != -1 || (verOffset = userAgent.indexOf('OPR/')) != -1) {
		appName = 'Opera';

	// On android devices report Android as browser name
	} else if ((verOffset = userAgent.indexOf('Android')) != -1) {
		appName = 'Android';

		// In Chrome, the true version is after "Chrome"
	} else if ((verOffset = userAgent.indexOf('Chrome')) != -1) {
		appName = 'Chrome';

		// In Safari, the true version is after "Safari" or after "Version"
	} else if ((verOffset = userAgent.indexOf('Safari')) != -1) {
		appName = 'Safari';

		// In Firefox, the true version is after "Firefox"
	} else if ((verOffset = userAgent.indexOf('Firefox')) != -1) {
		appName = 'Firefox';

	} else if ((verOffset = userAgent.indexOf('IEMobile')) != -1) {
		appName = 'Internet Explorer Mobile';

		// In MSIE, the true version is after "MSIE" in userAgent
		// Note that in Microsoft Internet Explorer version 11 the MSIE word is no longer present in the user agent
	} else if (appName == 'Microsoft Internet Explorer' || appName == 'Netscape') {
		appName = 'Internet Explorer';

		// In most other browsers, "name/version" is at the end of userAgent
	} else if ((nameOffset = userAgent.lastIndexOf(' ') + 1) <
		(verOffset = userAgent.lastIndexOf('/'))) {
		appName = userAgent.substring(nameOffset, verOffset);
		if (appName.toLowerCase() == appName.toUpperCase()) {
			appName = navigator.appName;
		}
	} else {
		appName = 'unknown';
	}

	return appName;
};

/**
 * The part that detects IE browser version in the following method is based on the following StackOverflow
 * answer http://stackoverflow.com/a/17907562/1979669
 * @returns string detected browser version
 */
Utils.getBrowserFullVersion = function () {
	if (!navigator) return '';

	var userAgent = navigator.userAgent || '';
	var appName = navigator.appName || '';
	var fullVersion = navigator.appVersion ? '' + parseFloat(navigator.appVersion) : '';
	var majorVersion;
	var verOffset, ix, regExpression;

	// In Opera, the true version is after "Opera" or after "Version"
	if ((verOffset = userAgent.indexOf('Opera')) != -1) {
		fullVersion = userAgent.substring(verOffset + 6);
		if ((verOffset = userAgent.indexOf('Version')) != -1) {
			fullVersion = userAgent.substring(verOffset + 8);
		}
	} else if ((verOffset = userAgent.indexOf('OPR/')) != -1) {
		fullVersion = userAgent.substring(verOffset + 4);

		// On android devices, get the android OS version since these devices use an android browser
	} else if ((verOffset = userAgent.indexOf('Android')) != -1) {
		fullVersion = userAgent.substring(verOffset + 11);

		// In Chrome, the true version is after "Chrome"
	} else if ((verOffset = userAgent.indexOf('Chrome')) != -1) {
		fullVersion = userAgent.substring(verOffset + 7);

		// In Safari, the true version is after "Safari" or after "Version"
	} else if ((verOffset = userAgent.indexOf('Safari')) != -1) {
		fullVersion = userAgent.substring(verOffset + 7);
		if ((verOffset = userAgent.indexOf('Version')) != -1) {
			fullVersion = userAgent.substring(verOffset + 8);
		}

		// In Firefox, the true version is after "Firefox"
	} else if ((verOffset = userAgent.indexOf('Firefox')) != -1) {
		fullVersion = userAgent.substring(verOffset + 8);

		// In MSIE, the true version is after "MSIE" in userAgent
		// Note that in Microsoft Internet Explorer version 11 the MSIE word is no longer present in the user agent
	} else if (appName == 'Microsoft Internet Explorer') {
		regExpression = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
		if (regExpression.exec(userAgent) != null) {
			fullVersion = parseFloat(RegExp.$1);
		}
	} else if (appName == 'Netscape') {
		regExpression = new RegExp('Trident/.*rv:([0-9]{1,}[\.0-9]{0,})');
		if (regExpression.exec(userAgent) != null) {
			fullVersion = parseFloat(RegExp.$1);
		}

	// In most other browsers, "name/version" is at the end of userAgent
	} else if ((userAgent.lastIndexOf(' ') + 1) <
		(verOffset = userAgent.lastIndexOf('/'))) {
		fullVersion = userAgent.substring(verOffset + 1);
	} else {
		fullVersion = 'unknown';
	}

	// The following statement is essential for this method to work in IE
	// because at this stage IE is treating fullVersion variable as a number thus the later
	// indexOf method call on the fullVersion variable will not work if this variable is not being
	// recognized as string
	fullVersion = fullVersion.toString();

	// trim the fullVersion string at semicolon/space if present
	if ((ix = fullVersion.indexOf(';')) != -1)		{
		fullVersion = fullVersion.substring(0, ix);
	}
	if ((ix = fullVersion.indexOf(' ')) != -1)		{
		fullVersion = fullVersion.substring(0, ix);
	}
	if ((ix = fullVersion.indexOf(')')) != -1)		{
		fullVersion = fullVersion.substring(0, ix);
	}

	majorVersion = parseInt('' + fullVersion, 10);
	if (isNaN(majorVersion)) {
		fullVersion = '' + parseFloat(navigator.appVersion);
	}

	return fullVersion;
};


/**
 * Determines whether or not the current browser is capable of handling large URL requests. As this was
 * a known issue for IE browsers prior to version 9.
 * The code below is based on the following articles
 * http://mywebcases.com/the-shortest-way-to-detect-ie-in-javascript/
 * http://stackoverflow.com/questions/7690676/javascript-the-best-way-to-detect-ie
 * @returns {boolean} Returns true if the browser is IE version 9 or higher or is a non IE browser,
 * otherwise returns false
 */
Utils.browserAcceptsLargeURLs = function () {
	return (typeof window != _undefined) ? !((window.ActiveXObject !== null) && (!+'\v1')) : true;
};

/**
 * Checks if we are running inside a browser.
 * @return {boolean} True if browse otherwise false
 * */
Utils.isBrowser = function () {
	return typeof window != _undefined && _document;
};

Utils.isWebSecure = function () {
	if (!_document) return false;

	return _document.location.href.charAt(4) === 's';
};

module.exports.hasPageVisibilityAPISupport = Utils.hasPageVisibilityAPISupport;
module.exports.getPageVisibilityAPI = Utils.getPageVisibilityAPI;
module.exports.isTabInBackground = Utils.isTabInBackground;
module.exports.getBrowserName = Utils.getBrowserName;
module.exports.getBrowserFullVersion = Utils.getBrowserFullVersion;
module.exports.browserAcceptsLargeURLs = Utils.browserAcceptsLargeURLs;
module.exports.isBrowser = Utils.isBrowser;
module.exports.isWebSecure = Utils.isWebSecure;
},{}],21:[function(require,module,exports){
var Utils = Utils || {},
	_undefined = 'undefined';

/**
 * Generate unique ID composed by time (milliseconds) plus the number of IDs
 * generated so far..
 * @function
 * @return {String}
 */
Utils.uid = (function () {
	/**
	 * Number of unique generated IDs.
	 * @private
	 * @type Number
	 */
	var counter = 1;

	return function () { //NOT WORKING AS EXPECTED! TODO
		return +new Date() + '_' + counter++;
	};
}());

/**
 * Checks if a variable value is empty, understanding an empty value as it is undefined,
 * or null, or an empty string or if it is an Array then that it contains at least one element.
 * @param  {*}  o The value to check.
 * @return {Boolean}   True if the value is considered as empty or false otherwise.
 */
Utils.isEmpty = function (o) {
	return o === undefined
		|| o === null
		|| o === ''
		|| o instanceof Array && o.length === 0;
};

Utils.isNotEmpty = function (str) {
	return !this.isEmpty(str);
};

/**
 * Returns the object passed as parameter if it exists.
 * Otherwise returns the default value passed as parameter if exists.
 * Otherwise returns the empty string.
 * @param object
 * @param defaultValue
 * @returns {*}
 */
Utils.safeGet = function (object, defaultValue) {
	defaultValue = this.exists(defaultValue) ? defaultValue : '';
	return this.exists(object) ? object : defaultValue;
};

/**
 * Returns true if the value passed as parameter is boolean true or 'true', '1' or 'on'
 * @param value
 * @returns {boolean}
 */
Utils.isTrue = function (value) {

	if (typeof value == _undefined) {

		return false;
	}	else if (typeof value === 'string') {

		value = value.toLowerCase();
		return value === 'true' || value === '1' || value === 'on';
	}	else {
		return !!value;
	}
};

Utils.regionMatches = function (to, toOffset, other, oOffset, len) {
	if (toOffset < 0 || oOffset < 0 || toOffset + len > to.length || oOffset + len > other.length) return false;

	while (--len >= 0) {
		var c1 = to.charAt(toOffset++);
		var c2 = other.charAt(oOffset++);
		if (c1 != c2) return false;
	}
	return true;
};

/**
 * Convenience function to check if a value is defined and has a value
 * @param value
 * @returns {boolean|*}
 */
Utils.exists = function (value) {
	return typeof value != _undefined && value != null;
};

module.exports.exists = Utils.exists;
module.exports.regionMatches = Utils.regionMatches;
module.exports.isTrue = Utils.isTrue;
module.exports.safeGet = Utils.safeGet;
module.exports.isNotEmpty = Utils.isNotEmpty;
module.exports.isEmpty = Utils.isEmpty;
module.exports.uid = Utils.uid;

},{}],22:[function(require,module,exports){
/* eslint-disable */

var Utils = {};

Utils.md5 = (function() {
	function md5cycle(x, k) {
	    var a = x[0],
	        b = x[1],
	        c = x[2],
	        d = x[3];

	    a = ff(a, b, c, d, k[0], 7, -680876936);
	    d = ff(d, a, b, c, k[1], 12, -389564586);
	    c = ff(c, d, a, b, k[2], 17, 606105819);
	    b = ff(b, c, d, a, k[3], 22, -1044525330);
	    a = ff(a, b, c, d, k[4], 7, -176418897);
	    d = ff(d, a, b, c, k[5], 12, 1200080426);
	    c = ff(c, d, a, b, k[6], 17, -1473231341);
	    b = ff(b, c, d, a, k[7], 22, -45705983);
	    a = ff(a, b, c, d, k[8], 7, 1770035416);
	    d = ff(d, a, b, c, k[9], 12, -1958414417);
	    c = ff(c, d, a, b, k[10], 17, -42063);
	    b = ff(b, c, d, a, k[11], 22, -1990404162);
	    a = ff(a, b, c, d, k[12], 7, 1804603682);
	    d = ff(d, a, b, c, k[13], 12, -40341101);
	    c = ff(c, d, a, b, k[14], 17, -1502002290);
	    b = ff(b, c, d, a, k[15], 22, 1236535329);

	    a = gg(a, b, c, d, k[1], 5, -165796510);
	    d = gg(d, a, b, c, k[6], 9, -1069501632);
	    c = gg(c, d, a, b, k[11], 14, 643717713);
	    b = gg(b, c, d, a, k[0], 20, -373897302);
	    a = gg(a, b, c, d, k[5], 5, -701558691);
	    d = gg(d, a, b, c, k[10], 9, 38016083);
	    c = gg(c, d, a, b, k[15], 14, -660478335);
	    b = gg(b, c, d, a, k[4], 20, -405537848);
	    a = gg(a, b, c, d, k[9], 5, 568446438);
	    d = gg(d, a, b, c, k[14], 9, -1019803690);
	    c = gg(c, d, a, b, k[3], 14, -187363961);
	    b = gg(b, c, d, a, k[8], 20, 1163531501);
	    a = gg(a, b, c, d, k[13], 5, -1444681467);
	    d = gg(d, a, b, c, k[2], 9, -51403784);
	    c = gg(c, d, a, b, k[7], 14, 1735328473);
	    b = gg(b, c, d, a, k[12], 20, -1926607734);

	    a = hh(a, b, c, d, k[5], 4, -378558);
	    d = hh(d, a, b, c, k[8], 11, -2022574463);
	    c = hh(c, d, a, b, k[11], 16, 1839030562);
	    b = hh(b, c, d, a, k[14], 23, -35309556);
	    a = hh(a, b, c, d, k[1], 4, -1530992060);
	    d = hh(d, a, b, c, k[4], 11, 1272893353);
	    c = hh(c, d, a, b, k[7], 16, -155497632);
	    b = hh(b, c, d, a, k[10], 23, -1094730640);
	    a = hh(a, b, c, d, k[13], 4, 681279174);
	    d = hh(d, a, b, c, k[0], 11, -358537222);
	    c = hh(c, d, a, b, k[3], 16, -722521979);
	    b = hh(b, c, d, a, k[6], 23, 76029189);
	    a = hh(a, b, c, d, k[9], 4, -640364487);
	    d = hh(d, a, b, c, k[12], 11, -421815835);
	    c = hh(c, d, a, b, k[15], 16, 530742520);
	    b = hh(b, c, d, a, k[2], 23, -995338651);

	    a = ii(a, b, c, d, k[0], 6, -198630844);
	    d = ii(d, a, b, c, k[7], 10, 1126891415);
	    c = ii(c, d, a, b, k[14], 15, -1416354905);
	    b = ii(b, c, d, a, k[5], 21, -57434055);
	    a = ii(a, b, c, d, k[12], 6, 1700485571);
	    d = ii(d, a, b, c, k[3], 10, -1894986606);
	    c = ii(c, d, a, b, k[10], 15, -1051523);
	    b = ii(b, c, d, a, k[1], 21, -2054922799);
	    a = ii(a, b, c, d, k[8], 6, 1873313359);
	    d = ii(d, a, b, c, k[15], 10, -30611744);
	    c = ii(c, d, a, b, k[6], 15, -1560198380);
	    b = ii(b, c, d, a, k[13], 21, 1309151649);
	    a = ii(a, b, c, d, k[4], 6, -145523070);
	    d = ii(d, a, b, c, k[11], 10, -1120210379);
	    c = ii(c, d, a, b, k[2], 15, 718787259);
	    b = ii(b, c, d, a, k[9], 21, -343485551);

	    x[0] = add32(a, x[0]);
	    x[1] = add32(b, x[1]);
	    x[2] = add32(c, x[2]);
	    x[3] = add32(d, x[3]);

	}

	function cmn(q, a, b, x, s, t) {
	    a = add32(add32(a, q), add32(x, t));
	    return add32((a << s) | (a >>> (32 - s)), b);
	}

	function ff(a, b, c, d, x, s, t) {
	    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}

	function gg(a, b, c, d, x, s, t) {
	    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}

	function hh(a, b, c, d, x, s, t) {
	    return cmn(b ^ c ^ d, a, b, x, s, t);
	}

	function ii(a, b, c, d, x, s, t) {
	    return cmn(c ^ (b | (~d)), a, b, x, s, t);
	}

	function md51(s) {
	    var n = s.length,
	        state = [1732584193, -271733879, -1732584194, 271733878],
	        i;
	    for (i = 64; i <= s.length; i += 64) {
	        md5cycle(state, md5blk(s.substring(i - 64, i)));
	    }
	    s = s.substring(i - 64);
	    var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	    for (i = 0; i < s.length; i++)
	        tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
	    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
	    if (i > 55) {
	        md5cycle(state, tail);
	        for (i = 0; i < 16; i++) tail[i] = 0;
	    }
	    tail[14] = n * 8;
	    md5cycle(state, tail);
	    return state;
	}

	/* there needs to be support for Unicode here,
	 * unless we pretend that we can redefine the MD-5
	 * algorithm for multi-byte characters (perhaps
	 * by adding every four 16-bit characters and
	 * shortening the sum to 32 bits). Otherwise
	 * I suggest performing MD-5 as if every character
	 * was two bytes--e.g., 0040 0025 = @%--but then
	 * how will an ordinary MD-5 sum be matched?
	 * There is no way to standardize text to something
	 * like UTF-8 before transformation; speed cost is
	 * utterly prohibitive. The JavaScript standard
	 * itself needs to look at this: it should start
	 * providing access to strings as preformed UTF-8
	 * 8-bit unsigned value arrays.
	 */

	function md5blk(s) { /* I figured global was faster.   */
	    var md5blks = [],
	        i; /* Andy King said do it this way. */
	    for (i = 0; i < 64; i += 4) {
	        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
	    }
	    return md5blks;
	}

	var hex_chr = '0123456789abcdef'.split('');

	function rhex(n) {
	    var s = '',
	        j = 0;
	    for (; j < 4; j++)
	        s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
	    return s;
	}

	function hex(x) {
	    for (var i = 0; i < x.length; i++)
	        x[i] = rhex(x[i]);
	    return x.join('');
	}

	function md5(s) {
	    return hex(md51(s));
	}

	// Removed the 'faster' version due to the original code syntax was not valid, see #TAG-4459
	function add32(x, y) {
		var lsw = (x & 0xFFFF) + (y & 0xFFFF),
			msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
	}

	return md5;
})();

module.exports = Utils.md5;

},{}],23:[function(require,module,exports){
/**
 * Creates a new object and shallow copy the properties of the given object to this newly created object.
 * @param obj The object to be cloned
 */
var cloneObject = function (obj) {
	if (typeof obj != 'object') return obj;

	var copy;

	// Handle Array
	if (obj instanceof Array) {
		copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = cloneObject(obj[i]);
		}
		return copy;
	}

	copy = {};
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}

	return copy;
};

module.exports = cloneObject;

},{}],24:[function(require,module,exports){
var Utils = Utils || {};

/**
 * Filters the object with the provided function.
 * @param {Function} condition Function which will be used to filter the object, should return true if the item should be included in the returned object
 * @param {Object} obj Object that will be filtered. The provided object won't be modified.
 * @returns {Object} Returns the object which will contain only the values that pass the provided condition.
 */
Utils.filter = function (condition, obj) {
	var ret = {};
	for (var j in obj) {
		if (obj.hasOwnProperty(j) && condition(obj[j])) {
			ret[j] = obj[j];
		}
	}
	return ret;
};

/**
 * Extend toExtend with all the own properties of o1..N. If a property with the same
 * name already exists in toExtend, the value will be replaced with the value of
 * the oX property. toExtend will be EXTENDED and returned. The function doesn't
 * follow the property tree. WARNING the first argument will be MODIFIED.
 * @param {Object} toExtend object to be extended and returned
 * @returns {Object|null} toExtend extended with o1..n properties
 */
Utils.extend = function (toExtend /** o1, ... */) {
	var argsLength = arguments.length,
		obj;

	toExtend = toExtend || {};

	// Copy properties and values
	for (var i = 1; i < argsLength; i++) {
		obj = arguments[i];
		if (!obj) {
			continue; //-->
		}
		for (var j in obj) {
			if (obj.hasOwnProperty(j)) {
				toExtend[j] = obj[j];
			}
		}
	}

	return toExtend;
};

module.exports.filter = Utils.filter;
module.exports.extend = Utils.extend;
},{}],25:[function(require,module,exports){
/* eslint-disable */

var CommonConstants = require(17);

var Utils = {};

Utils.encrypt = (function(){
    var PADCHAR = '=';
    var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var getbyte64 = function(s,i) {
        var idx = ALPHA.indexOf(s.charAt(i));
        if (idx === -1) {
            throw new Error();
        }
        return idx;
    };

    var base64decode = function(s) {
        // convert to string
        s = '' + s;
        var pads, i, b10;
        var imax = s.length;
        if (imax === 0) {
            return s;
        }

        if (imax % 4 !== 0) {
            throw new Error();
        }

        pads = 0;
        if (s.charAt(imax - 1) === PADCHAR) {
            pads = 1;
            if (s.charAt(imax - 2) === PADCHAR) {
                pads = 2;
            }
            // either way, we want to ignore this last block
            imax -= 4;
        }

        var x = [];
        for (i = 0; i < imax; i += 4) {
            b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) |
                (getbyte64(s,i+2) << 6) | getbyte64(s,i+3);
            x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
        }

        switch (pads) {
        case 1:
            b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) | (getbyte64(s,i+2) << 6);
            x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));
            break;
        case 2:
            b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12);
            x.push(String.fromCharCode(b10 >> 16));
            break;
        }
        return x.join('');
    };

    var getbyte = function(s,i) {
        var x = s.charCodeAt(i);
        if (x > 255) {
            throw new Error();
        }
        return x;
    };

    var base64encode = function(s) {
        if (arguments.length !== 1) {
            throw new SyntaxError("Not enough arguments");
        }
        var padchar = PADCHAR;
        var alpha   = ALPHA;

        var i, b10;
        var x = [];

        // convert to string
        s = '' + s;

        var imax = s.length - s.length % 3;

        if (s.length === 0) {
            return s;
        }
        for (i = 0; i < imax; i += 3) {
            b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8) | getbyte(s,i+2);
            x.push(alpha.charAt(b10 >> 18));
            x.push(alpha.charAt((b10 >> 12) & 0x3F));
            x.push(alpha.charAt((b10 >> 6) & 0x3f));
            x.push(alpha.charAt(b10 & 0x3f));
        }
        switch (s.length - imax) {
        case 1:
            b10 = getbyte(s,i) << 16;
            x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                   padchar + padchar);
            break;
        case 2:
            b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8);
            x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                   alpha.charAt((b10 >> 6) & 0x3f) + padchar);
            break;
        }
        return x.join('');
    };
    
    var atob = base64decode;
    
    var dbits;

    // JavaScript engine analysis

    // (public) Constructor
    function BigInteger(a,b,c) {
      if(a != null)
        if("number" == typeof a) this.fromNumber(a,b,c);
        else if(b == null && "string" != typeof a) this.fromString(a,256);
        else this.fromString(a,b);
    }

    // return new, unset BigInteger
    function nbi() { return new BigInteger(null); }

    // am: Compute w_j += (x*this_i), propagate carries,
    // c is initial carry, returns final carry.
    // c < 3*dvalue, x < 2*dvalue, this_i < dvalue


    BigInteger.prototype.am = function (i,x,w,j,c,n) {
        var xl = x&0x3fff, xh = x>>14;
        while(--n >= 0) {
          var l = this[i]&0x3fff;
          var h = this[i++]>>14;
          var m = xh*l+h*xl;
          l = xl*l+((m&0x3fff)<<14)+w[j]+c;
          c = (l>>28)+(m>>14)+xh*h;
          w[j++] = l&0xfffffff;
        }
        return c;
    };

    dbits = 28;

    BigInteger.prototype.DB = dbits;
    BigInteger.prototype.DM = ((1<<dbits)-1);
    BigInteger.prototype.DV = (1<<dbits);

    var BI_FP = 52;
    BigInteger.prototype.FV = Math.pow(2,BI_FP);
    BigInteger.prototype.F1 = BI_FP-dbits;
    BigInteger.prototype.F2 = 2*dbits-BI_FP;

    // Digit conversions
    var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
    var BI_RC = [];
    var rr,vv;
    rr = "0".charCodeAt(0);
    for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
    rr = "a".charCodeAt(0);
    for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
    rr = "A".charCodeAt(0);
    for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

    function int2char(n) { return BI_RM.charAt(n); }
    function intAt(s,i) {
      var c = BI_RC[s.charCodeAt(i)];
      return (c==null)?-1:c;
    }

    // (protected) copy this to r
    function bnpCopyTo(r) {
      for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
      r.t = this.t;
      r.s = this.s;
    }

    // (protected) set from integer value x, -DV <= x < DV
    function bnpFromInt(x) {
      this.t = 1;
      this.s = (x<0)?-1:0;
      if(x > 0) this[0] = x;
      else if(x < -1) this[0] = x+DV;
      else this.t = 0;
    }

    // return bigint initialized to value
    function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

    // (protected) set from string and radix
    function bnpFromString(s,b) {
      var k;
      if(b == 16) k = 4;
      else if(b == 8) k = 3;
      else if(b == 256) k = 8; // byte array
      else if(b == 2) k = 1;
      else if(b == 32) k = 5;
      else if(b == 4) k = 2;
      else { this.fromRadix(s,b); return; }
      this.t = 0;
      this.s = 0;
      var i = s.length, mi = false, sh = 0;
      while(--i >= 0) {
        var x = (k==8)?s[i]&0xff:intAt(s,i);
        if(x < 0) {
          if(s.charAt(i) == "-") mi = true;
          continue;
        }
        mi = false;
        if(sh == 0)
          this[this.t++] = x;
        else if(sh+k > this.DB) {
          this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
          this[this.t++] = (x>>(this.DB-sh));
        }
        else
          this[this.t-1] |= x<<sh;
        sh += k;
        if(sh >= this.DB) sh -= this.DB;
      }
      if(k == 8 && (s[0]&0x80) != 0) {
        this.s = -1;
        if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
      }
      this.clamp();
      if(mi) BigInteger.ZERO.subTo(this,this);
    }

    // (protected) clamp off excess high words
    function bnpClamp() {
      var c = this.s&this.DM;
      while(this.t > 0 && this[this.t-1] == c) --this.t;
    }

    // (public) return string representation in given radix
    function bnToString(b) {
      if(this.s < 0) return "-"+this.negate().toString(b);
      var k;
      if(b == 16) k = 4;
      else if(b == 8) k = 3;
      else if(b == 2) k = 1;
      else if(b == 32) k = 5;
      else if(b == 4) k = 2;
      else return this.toRadix(b);
      var km = (1<<k)-1, d, m = false, r = "", i = this.t;
      var p = this.DB-(i*this.DB)%k;
      if(i-- > 0) {
        if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
        while(i >= 0) {
          if(p < k) {
            d = (this[i]&((1<<p)-1))<<(k-p);
            d |= this[--i]>>(p+=this.DB-k);
          }
          else {
            d = (this[i]>>(p-=k))&km;
            if(p <= 0) { p += this.DB; --i; }
          }
          if(d > 0) m = true;
          if(m) r += int2char(d);
        }
      }
      return m?r:"0";
    }

    // (public) -this
    function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

    // (public) |this|
    function bnAbs() { return (this.s<0)?this.negate():this; }

    // (public) return + if this > a, - if this < a, 0 if equal
    function bnCompareTo(a) {
      var r = this.s-a.s;
      if(r != 0) return r;
      var i = this.t;
      r = i-a.t;
      if(r != 0) return (this.s<0)?-r:r;
      while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
      return 0;
    }

    // returns bit length of the integer x
    function nbits(x) {
      var r = 1, t;
      if((t=x>>>16) != 0) { x = t; r += 16; }
      if((t=x>>8) != 0) { x = t; r += 8; }
      if((t=x>>4) != 0) { x = t; r += 4; }
      if((t=x>>2) != 0) { x = t; r += 2; }
      if((t=x>>1) != 0) { x = t; r += 1; }
      return r;
    }

    // (public) return the number of bits in "this"
    function bnBitLength() {
      if(this.t <= 0) return 0;
      return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
    }

    // (protected) r = this << n*DB
    function bnpDLShiftTo(n,r) {
      var i;
      for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
      for(i = n-1; i >= 0; --i) r[i] = 0;
      r.t = this.t+n;
      r.s = this.s;
    }

    // (protected) r = this >> n*DB
    function bnpDRShiftTo(n,r) {
      for(var i = n; i < this.t; ++i) r[i-n] = this[i];
      r.t = Math.max(this.t-n,0);
      r.s = this.s;
    }

    // (protected) r = this << n
    function bnpLShiftTo(n,r) {
      var bs = n%this.DB;
      var cbs = this.DB-bs;
      var bm = (1<<cbs)-1;
      var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
      for(i = this.t-1; i >= 0; --i) {
        r[i+ds+1] = (this[i]>>cbs)|c;
        c = (this[i]&bm)<<bs;
      }
      for(i = ds-1; i >= 0; --i) r[i] = 0;
      r[ds] = c;
      r.t = this.t+ds+1;
      r.s = this.s;
      r.clamp();
    }

    // (protected) r = this >> n
    function bnpRShiftTo(n,r) {
      r.s = this.s;
      var ds = Math.floor(n/this.DB);
      if(ds >= this.t) { r.t = 0; return; }
      var bs = n%this.DB;
      var cbs = this.DB-bs;
      var bm = (1<<bs)-1;
      r[0] = this[ds]>>bs;
      for(var i = ds+1; i < this.t; ++i) {
        r[i-ds-1] |= (this[i]&bm)<<cbs;
        r[i-ds] = this[i]>>bs;
      }
      if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
      r.t = this.t-ds;
      r.clamp();
    }

    // (protected) r = this - a
    function bnpSubTo(a,r) {
      var i = 0, c = 0, m = Math.min(a.t,this.t);
      while(i < m) {
        c += this[i]-a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      if(a.t < this.t) {
        c -= a.s;
        while(i < this.t) {
          c += this[i];
          r[i++] = c&this.DM;
          c >>= this.DB;
        }
        c += this.s;
      }
      else {
        c += this.s;
        while(i < a.t) {
          c -= a[i];
          r[i++] = c&this.DM;
          c >>= this.DB;
        }
        c -= a.s;
      }
      r.s = (c<0)?-1:0;
      if(c < -1) r[i++] = this.DV+c;
      else if(c > 0) r[i++] = c;
      r.t = i;
      r.clamp();
    }

    // (protected) r = this * a, r != this,a (HAC 14.12)
    // "this" should be the larger one if appropriate.
    function bnpMultiplyTo(a,r) {
      var x = this.abs(), y = a.abs();
      var i = x.t;
      r.t = i+y.t;
      while(--i >= 0) r[i] = 0;
      for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
      r.s = 0;
      r.clamp();
      if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
    }

    // (protected) r = this^2, r != this (HAC 14.16)
    function bnpSquareTo(r) {
      var x = this.abs();
      var i = r.t = 2*x.t;
      while(--i >= 0) r[i] = 0;
      for(i = 0; i < x.t-1; ++i) {
        var c = x.am(i,x[i],r,2*i,0,1);
        if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
          r[i+x.t] -= x.DV;
          r[i+x.t+1] = 1;
        }
      }
      if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
      r.s = 0;
      r.clamp();
    }

    // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
    // r != q, this != m.  q or r may be null.
    function bnpDivRemTo(m,q,r) {
      var pm = m.abs();
      if(pm.t <= 0) return;
      var pt = this.abs();
      if(pt.t < pm.t) {
        if(q != null) q.fromInt(0);
        if(r != null) this.copyTo(r);
        return;
      }
      if(r == null) r = nbi();
      var y = nbi(), ts = this.s, ms = m.s;
      var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
      if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
      else { pm.copyTo(y); pt.copyTo(r); }
      var ys = y.t;
      var y0 = y[ys-1];
      if(y0 == 0) return;
      var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
      var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
      var i = r.t, j = i-ys, t = (q==null)?nbi():q;
      y.dlShiftTo(j,t);
      if(r.compareTo(t) >= 0) {
        r[r.t++] = 1;
        r.subTo(t,r);
      }
      BigInteger.ONE.dlShiftTo(ys,t);
      t.subTo(y,y);	// "negative" y so we can replace sub with am later
      while(y.t < ys) y[y.t++] = 0;
      while(--j >= 0) {
        // Estimate quotient digit
        var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
        if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
          y.dlShiftTo(j,t);
          r.subTo(t,r);
          while(r[i] < --qd) r.subTo(t,r);
        }
      }
      if(q != null) {
        r.drShiftTo(ys,q);
        if(ts != ms) BigInteger.ZERO.subTo(q,q);
      }
      r.t = ys;
      r.clamp();
      if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
      if(ts < 0) BigInteger.ZERO.subTo(r,r);
    }

    // (public) this mod a
    function bnMod(a) {
      var r = nbi();
      this.abs().divRemTo(a,null,r);
      if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
      return r;
    }

    // Modular reduction using "classic" algorithm
    function Classic(m) { this.m = m; }
    function cConvert(x) {
      if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
      else return x;
    }
    function cRevert(x) { return x; }
    function cReduce(x) { x.divRemTo(this.m,null,x); }
    function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
    function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

    Classic.prototype.convert = cConvert;
    Classic.prototype.revert = cRevert;
    Classic.prototype.reduce = cReduce;
    Classic.prototype.mulTo = cMulTo;
    Classic.prototype.sqrTo = cSqrTo;

    // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
    // justification:
    //         xy == 1 (mod m)
    //         xy =  1+km
    //   xy(2-xy) = (1+km)(1-km)
    // x[y(2-xy)] = 1-k^2m^2
    // x[y(2-xy)] == 1 (mod m^2)
    // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
    // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
    // JS multiply "overflows" differently from C/C++, so care is needed here.
    function bnpInvDigit() {
      if(this.t < 1) return 0;
      var x = this[0];
      if((x&1) == 0) return 0;
      var y = x&3;		// y == 1/x mod 2^2
      y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
      y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
      y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
      // last step - calculate inverse mod DV directly;
      // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
      y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
      // we really want the negative inverse, and -DV < y < DV
      return (y>0)?this.DV-y:-y;
    }

    // Montgomery reduction
    function Montgomery(m) {
      this.m = m;
      this.mp = m.invDigit();
      this.mpl = this.mp&0x7fff;
      this.mph = this.mp>>15;
      this.um = (1<<(m.DB-15))-1;
      this.mt2 = 2*m.t;
    }

    // xR mod m
    function montConvert(x) {
      var r = nbi();
      x.abs().dlShiftTo(this.m.t,r);
      r.divRemTo(this.m,null,r);
      if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
      return r;
    }

    // x/R mod m
    function montRevert(x) {
      var r = nbi();
      x.copyTo(r);
      this.reduce(r);
      return r;
    }

    // x = x/R mod m (HAC 14.32)
    function montReduce(x) {
      while(x.t <= this.mt2)	// pad x so am has enough room later
        x[x.t++] = 0;
      for(var i = 0; i < this.m.t; ++i) {
        // faster way of calculating u0 = x[i]*mp mod DV
        var j = x[i]&0x7fff;
        var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
        // use am to combine the multiply-shift-add into one call
        j = i+this.m.t;
        x[j] += this.m.am(0,u0,x,i,0,this.m.t);
        // propagate carry
        while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
      }
      x.clamp();
      x.drShiftTo(this.m.t,x);
      if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
    }

    // r = "x^2/R mod m"; x != r
    function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

    // r = "xy/R mod m"; x,y != r
    function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

    Montgomery.prototype.convert = montConvert;
    Montgomery.prototype.revert = montRevert;
    Montgomery.prototype.reduce = montReduce;
    Montgomery.prototype.mulTo = montMulTo;
    Montgomery.prototype.sqrTo = montSqrTo;

    // (protected) true iff this is even
    function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

    // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
    function bnpExp(e,z) {
      if(e > 0xffffffff || e < 1) return BigInteger.ONE;
      var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
      g.copyTo(r);
      while(--i >= 0) {
        z.sqrTo(r,r2);
        if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
        else { var t = r; r = r2; r2 = t; }
      }
      return z.revert(r);
    }

    // (public) this^e % m, 0 <= e < 2^32
    function bnModPowInt(e,m) {
      var z;
      if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
      return this.exp(e,z);
    }

    // protected
    BigInteger.prototype.copyTo = bnpCopyTo;
    BigInteger.prototype.fromInt = bnpFromInt;
    BigInteger.prototype.fromString = bnpFromString;
    BigInteger.prototype.clamp = bnpClamp;
    BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
    BigInteger.prototype.drShiftTo = bnpDRShiftTo;
    BigInteger.prototype.lShiftTo = bnpLShiftTo;
    BigInteger.prototype.rShiftTo = bnpRShiftTo;
    BigInteger.prototype.subTo = bnpSubTo;
    BigInteger.prototype.multiplyTo = bnpMultiplyTo;
    BigInteger.prototype.squareTo = bnpSquareTo;
    BigInteger.prototype.divRemTo = bnpDivRemTo;
    BigInteger.prototype.invDigit = bnpInvDigit;
    BigInteger.prototype.isEven = bnpIsEven;
    BigInteger.prototype.exp = bnpExp;

    // public
    BigInteger.prototype.toString = bnToString;
    BigInteger.prototype.negate = bnNegate;
    BigInteger.prototype.abs = bnAbs;
    BigInteger.prototype.compareTo = bnCompareTo;
    BigInteger.prototype.bitLength = bnBitLength;
    BigInteger.prototype.mod = bnMod;
    BigInteger.prototype.modPowInt = bnModPowInt;

    // "constants"
    BigInteger.ZERO = nbv(0);
    BigInteger.ONE = nbv(1);
    // Copyright (c) 2005-2009  Tom Wu
    // All Rights Reserved.
    // See "LICENSE" for details.

    // Extended JavaScript BN functions, required for RSA private ops.

    // Version 1.1: new BigInteger("0", 10) returns "proper" zero
    // Version 1.2: square() API, isProbablePrime fix

    // (public)
    function bnClone() { var r = nbi(); this.copyTo(r); return r; }

    // (public) return value as integer
    function bnIntValue() {
      if(this.s < 0) {
        if(this.t == 1) return this[0]-this.DV;
        else if(this.t == 0) return -1;
      }
      else if(this.t == 1) return this[0];
      else if(this.t == 0) return 0;
      // assumes 16 < DB < 32
      return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
    }

    // (public) return value as byte
    function bnByteValue() { return (this.t==0)?this.s:(this[0]<<24)>>24; }

    // (public) return value as short (assumes DB>=16)
    function bnShortValue() { return (this.t==0)?this.s:(this[0]<<16)>>16; }

    // (protected) return x s.t. r^x < DV
    function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

    // (public) 0 if this == 0, 1 if this > 0
    function bnSigNum() {
      if(this.s < 0) return -1;
      else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
      else return 1;
    }

    // (protected) convert to radix string
    function bnpToRadix(b) {
      if(b == null) b = 10;
      if(this.signum() == 0 || b < 2 || b > 36) return "0";
      var cs = this.chunkSize(b);
      var a = Math.pow(b,cs);
      var d = nbv(a), y = nbi(), z = nbi(), r = "";
      this.divRemTo(d,y,z);
      while(y.signum() > 0) {
        r = (a+z.intValue()).toString(b).substr(1) + r;
        y.divRemTo(d,y,z);
      }
      return z.intValue().toString(b) + r;
    }

    // (protected) convert from radix string
    function bnpFromRadix(s,b) {
      this.fromInt(0);
      if(b == null) b = 10;
      var cs = this.chunkSize(b);
      var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
      for(var i = 0; i < s.length; ++i) {
        var x = intAt(s,i);
        if(x < 0) {
          if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
          continue;
        }
        w = b*w+x;
        if(++j >= cs) {
          this.dMultiply(d);
          this.dAddOffset(w,0);
          j = 0;
          w = 0;
        }
      }
      if(j > 0) {
        this.dMultiply(Math.pow(b,j));
        this.dAddOffset(w,0);
      }
      if(mi) BigInteger.ZERO.subTo(this,this);
    }

    // (protected) alternate constructor
    function bnpFromNumber(a,b,c) {
      if("number" == typeof b) {
        // new BigInteger(int,int,RNG)
        if(a < 2) this.fromInt(1);
        else {
          this.fromNumber(a,c);
          if(!this.testBit(a-1))	// force MSB set
            this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
          if(this.isEven()) this.dAddOffset(1,0); // force odd
          while(!this.isProbablePrime(b)) {
            this.dAddOffset(2,0);
            if(this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a-1),this);
          }
        }
      }
      else {
        // new BigInteger(int,RNG)
        var x = [], t = a&7;
        x.length = (a>>3)+1;
        b.nextBytes(x);
        if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
        this.fromString(x,256);
      }
    }

    // (public) convert to bigendian byte array
    function bnToByteArray() {
      var i = this.t, r = [];
      r[0] = this.s;
      var p = this.DB-(i*this.DB)%8, d, k = 0;
      if(i-- > 0) {
        if(p < this.DB && (d = this[i]>>p) != (this.s&this.DM)>>p)
          r[k++] = d|(this.s<<(this.DB-p));
        while(i >= 0) {
          if(p < 8) {
            d = (this[i]&((1<<p)-1))<<(8-p);
            d |= this[--i]>>(p+=this.DB-8);
          }
          else {
            d = (this[i]>>(p-=8))&0xff;
            if(p <= 0) { p += this.DB; --i; }
          }
          if((d&0x80) != 0) d |= -256;
          if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
          if(k > 0 || d != this.s) r[k++] = d;
        }
      }
      return r;
    }

    function bnEquals(a) { return(this.compareTo(a)==0); }
    function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
    function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

    // (protected) r = this op a (bitwise)
    function bnpBitwiseTo(a,op,r) {
      var i, f, m = Math.min(a.t,this.t);
      for(i = 0; i < m; ++i) r[i] = op(this[i],a[i]);
      if(a.t < this.t) {
        f = a.s&this.DM;
        for(i = m; i < this.t; ++i) r[i] = op(this[i],f);
        r.t = this.t;
      }
      else {
        f = this.s&this.DM;
        for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
        r.t = a.t;
      }
      r.s = op(this.s,a.s);
      r.clamp();
    }

    // (public) this & a
    function op_and(x,y) { return x&y; }
    function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

    // (public) this | a
    function op_or(x,y) { return x|y; }
    function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

    // (public) this ^ a
    function op_xor(x,y) { return x^y; }
    function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

    // (public) this & ~a
    function op_andnot(x,y) { return x&~y; }
    function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

    // (public) ~this
    function bnNot() {
      var r = nbi();
      for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
      r.t = this.t;
      r.s = ~this.s;
      return r;
    }

    // (public) this << n
    function bnShiftLeft(n) {
      var r = nbi();
      if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
      return r;
    }

    // (public) this >> n
    function bnShiftRight(n) {
      var r = nbi();
      if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
      return r;
    }

    // return index of lowest 1-bit in x, x < 2^31
    function lbit(x) {
      if(x == 0) return -1;
      var r = 0;
      if((x&0xffff) == 0) { x >>= 16; r += 16; }
      if((x&0xff) == 0) { x >>= 8; r += 8; }
      if((x&0xf) == 0) { x >>= 4; r += 4; }
      if((x&3) == 0) { x >>= 2; r += 2; }
      if((x&1) == 0) ++r;
      return r;
    }

    // (public) returns index of lowest 1-bit (or -1 if none)
    function bnGetLowestSetBit() {
      for(var i = 0; i < this.t; ++i)
        if(this[i] != 0) return i*this.DB+lbit(this[i]);
      if(this.s < 0) return this.t*this.DB;
      return -1;
    }

    // return number of 1 bits in x
    function cbit(x) {
      var r = 0;
      while(x != 0) { x &= x-1; ++r; }
      return r;
    }

    // (public) return number of set bits
    function bnBitCount() {
      var r = 0, x = this.s&this.DM;
      for(var i = 0; i < this.t; ++i) r += cbit(this[i]^x);
      return r;
    }

    // (public) true iff nth bit is set
    function bnTestBit(n) {
      var j = Math.floor(n/this.DB);
      if(j >= this.t) return(this.s!=0);
      return((this[j]&(1<<(n%this.DB)))!=0);
    }

    // (protected) this op (1<<n)
    function bnpChangeBit(n,op) {
      var r = BigInteger.ONE.shiftLeft(n);
      this.bitwiseTo(r,op,r);
      return r;
    }

    // (public) this | (1<<n)
    function bnSetBit(n) { return this.changeBit(n,op_or); }

    // (public) this & ~(1<<n)
    function bnClearBit(n) { return this.changeBit(n,op_andnot); }

    // (public) this ^ (1<<n)
    function bnFlipBit(n) { return this.changeBit(n,op_xor); }

    // (protected) r = this + a
    function bnpAddTo(a,r) {
      var i = 0, c = 0, m = Math.min(a.t,this.t);
      while(i < m) {
        c += this[i]+a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      if(a.t < this.t) {
        c += a.s;
        while(i < this.t) {
          c += this[i];
          r[i++] = c&this.DM;
          c >>= this.DB;
        }
        c += this.s;
      }
      else {
        c += this.s;
        while(i < a.t) {
          c += a[i];
          r[i++] = c&this.DM;
          c >>= this.DB;
        }
        c += a.s;
      }
      r.s = (c<0)?-1:0;
      if(c > 0) r[i++] = c;
      else if(c < -1) r[i++] = this.DV+c;
      r.t = i;
      r.clamp();
    }

    // (public) this + a
    function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

    // (public) this - a
    function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

    // (public) this * a
    function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

    // (public) this^2
    function bnSquare() { var r = nbi(); this.squareTo(r); return r; }

    // (public) this / a
    function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

    // (public) this % a
    function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

    // (public) [this/a,this%a]
    function bnDivideAndRemainder(a) {
      var q = nbi(), r = nbi();
      this.divRemTo(a,q,r);
      return [q,r];
    }

    // (protected) this *= n, this >= 0, 1 < n < DV
    function bnpDMultiply(n) {
      this[this.t] = this.am(0,n-1,this,0,0,this.t);
      ++this.t;
      this.clamp();
    }

    // (protected) this += n << w words, this >= 0
    function bnpDAddOffset(n,w) {
      if(n == 0) return;
      while(this.t <= w) this[this.t++] = 0;
      this[w] += n;
      while(this[w] >= this.DV) {
        this[w] -= this.DV;
        if(++w >= this.t) this[this.t++] = 0;
        ++this[w];
      }
    }

    // A "null" reducer
    function NullExp() {}
    function nNop(x) { return x; }
    function nMulTo(x,y,r) { x.multiplyTo(y,r); }
    function nSqrTo(x,r) { x.squareTo(r); }

    NullExp.prototype.convert = nNop;
    NullExp.prototype.revert = nNop;
    NullExp.prototype.mulTo = nMulTo;
    NullExp.prototype.sqrTo = nSqrTo;

    // (public) this^e
    function bnPow(e) { return this.exp(e,new NullExp()); }

    // (protected) r = lower n words of "this * a", a.t <= n
    // "this" should be the larger one if appropriate.
    function bnpMultiplyLowerTo(a,n,r) {
      var i = Math.min(this.t+a.t,n);
      r.s = 0; // assumes a,this >= 0
      r.t = i;
      while(i > 0) r[--i] = 0;
      var j;
      for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
      for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
      r.clamp();
    }

    // (protected) r = "this * a" without lower n words, n > 0
    // "this" should be the larger one if appropriate.
    function bnpMultiplyUpperTo(a,n,r) {
      --n;
      var i = r.t = this.t+a.t-n;
      r.s = 0; // assumes a,this >= 0
      while(--i >= 0) r[i] = 0;
      for(i = Math.max(n-this.t,0); i < a.t; ++i)
        r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
      r.clamp();
      r.drShiftTo(1,r);
    }

    // Barrett modular reduction
    function Barrett(m) {
      // setup Barrett
      this.r2 = nbi();
      this.q3 = nbi();
      BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
      this.mu = this.r2.divide(m);
      this.m = m;
    }

    function barrettConvert(x) {
      if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
      else if(x.compareTo(this.m) < 0) return x;
      else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
    }

    function barrettRevert(x) { return x; }

    // x = x mod m (HAC 14.42)
    function barrettReduce(x) {
      x.drShiftTo(this.m.t-1,this.r2);
      if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
      this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
      this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
      while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
      x.subTo(this.r2,x);
      while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
    }

    // r = x^2 mod m; x != r
    function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

    // r = x*y mod m; x,y != r
    function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

    Barrett.prototype.convert = barrettConvert;
    Barrett.prototype.revert = barrettRevert;
    Barrett.prototype.reduce = barrettReduce;
    Barrett.prototype.mulTo = barrettMulTo;
    Barrett.prototype.sqrTo = barrettSqrTo;

    // (public) this^e % m (HAC 14.85)
    function bnModPow(e,m) {
      var i = e.bitLength(), k, r = nbv(1), z;
      if(i <= 0) return r;
      else if(i < 18) k = 1;
      else if(i < 48) k = 3;
      else if(i < 144) k = 4;
      else if(i < 768) k = 5;
      else k = 6;
      if(i < 8)
        z = new Classic(m);
      else if(m.isEven())
        z = new Barrett(m);
      else
        z = new Montgomery(m);

      // precomputation
      var g = [], n = 3, k1 = k-1, km = (1<<k)-1;
      g[1] = z.convert(this);
      if(k > 1) {
        var g2 = nbi();
        z.sqrTo(g[1],g2);
        while(n <= km) {
          g[n] = nbi();
          z.mulTo(g2,g[n-2],g[n]);
          n += 2;
        }
      }

      var j = e.t-1, w, is1 = true, r2 = nbi(), t;
      i = nbits(e[j])-1;
      while(j >= 0) {
        if(i >= k1) w = (e[j]>>(i-k1))&km;
        else {
          w = (e[j]&((1<<(i+1))-1))<<(k1-i);
          if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
        }

        n = k;
        while((w&1) == 0) { w >>= 1; --n; }
        if((i -= n) < 0) { i += this.DB; --j; }
        if(is1) {	// ret == 1, don't bother squaring or multiplying it
          g[w].copyTo(r);
          is1 = false;
        }
        else {
          while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
          if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
          z.mulTo(r2,g[w],r);
        }

        while(j >= 0 && (e[j]&(1<<i)) == 0) {
          z.sqrTo(r,r2); t = r; r = r2; r2 = t;
          if(--i < 0) { i = this.DB-1; --j; }
        }
      }
      return z.revert(r);
    }

    // (public) gcd(this,a) (HAC 14.54)
    function bnGCD(a) {
      var x = (this.s<0)?this.negate():this.clone();
      var y = (a.s<0)?a.negate():a.clone();
      if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
      var i = x.getLowestSetBit(), g = y.getLowestSetBit();
      if(g < 0) return x;
      if(i < g) g = i;
      if(g > 0) {
        x.rShiftTo(g,x);
        y.rShiftTo(g,y);
      }
      while(x.signum() > 0) {
        if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
        if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
        if(x.compareTo(y) >= 0) {
          x.subTo(y,x);
          x.rShiftTo(1,x);
        }
        else {
          y.subTo(x,y);
          y.rShiftTo(1,y);
        }
      }
      if(g > 0) y.lShiftTo(g,y);
      return y;
    }

    // (protected) this % n, n < 2^26
    function bnpModInt(n) {
      if(n <= 0) return 0;
      var d = this.DV%n, r = (this.s<0)?n-1:0;
      if(this.t > 0)
        if(d == 0) r = this[0]%n;
        else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
      return r;
    }

    // (public) 1/this % m (HAC 14.61)
    function bnModInverse(m) {
      var ac = m.isEven();
      if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
      var u = m.clone(), v = this.clone();
      var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
      while(u.signum() != 0) {
        while(u.isEven()) {
          u.rShiftTo(1,u);
          if(ac) {
            if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
            a.rShiftTo(1,a);
          }
          else if(!b.isEven()) b.subTo(m,b);
          b.rShiftTo(1,b);
        }
        while(v.isEven()) {
          v.rShiftTo(1,v);
          if(ac) {
            if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
            c.rShiftTo(1,c);
          }
          else if(!d.isEven()) d.subTo(m,d);
          d.rShiftTo(1,d);
        }
        if(u.compareTo(v) >= 0) {
          u.subTo(v,u);
          if(ac) a.subTo(c,a);
          b.subTo(d,b);
        }
        else {
          v.subTo(u,v);
          if(ac) c.subTo(a,c);
          d.subTo(b,d);
        }
      }
      if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
      if(d.compareTo(m) >= 0) return d.subtract(m);
      if(d.signum() < 0) d.addTo(m,d); else return d;
      if(d.signum() < 0) return d.add(m); else return d;
    }

    var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];
    var lplim = (1<<26)/lowprimes[lowprimes.length-1];

    // (public) test primality with certainty >= 1-.5^t
    function bnIsProbablePrime(t) {
      var i, x = this.abs();
      if(x.t == 1 && x[0] <= lowprimes[lowprimes.length-1]) {
        for(i = 0; i < lowprimes.length; ++i)
          if(x[0] == lowprimes[i]) return true;
        return false;
      }
      if(x.isEven()) return false;
      i = 1;
      while(i < lowprimes.length) {
        var m = lowprimes[i], j = i+1;
        while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
        m = x.modInt(m);
        while(i < j) if(m%lowprimes[i++] == 0) return false;
      }
      return x.millerRabin(t);
    }

    // (protected) true if probably prime (HAC 4.24, Miller-Rabin)
    function bnpMillerRabin(t) {
      var n1 = this.subtract(BigInteger.ONE);
      var k = n1.getLowestSetBit();
      if(k <= 0) return false;
      var r = n1.shiftRight(k);
      t = (t+1)>>1;
      if(t > lowprimes.length) t = lowprimes.length;
      var a = nbi();
      for(var i = 0; i < t; ++i) {
        //Pick bases at random, instead of starting at 2
        a.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);
        var y = a.modPow(r,this);
        if(y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
          var j = 1;
          while(j++ < k && y.compareTo(n1) != 0) {
            y = y.modPowInt(2,this);
            if(y.compareTo(BigInteger.ONE) == 0) return false;
          }
          if(y.compareTo(n1) != 0) return false;
        }
      }
      return true;
    }

    // protected
    BigInteger.prototype.chunkSize = bnpChunkSize;
    BigInteger.prototype.toRadix = bnpToRadix;
    BigInteger.prototype.fromRadix = bnpFromRadix;
    BigInteger.prototype.fromNumber = bnpFromNumber;
    BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
    BigInteger.prototype.changeBit = bnpChangeBit;
    BigInteger.prototype.addTo = bnpAddTo;
    BigInteger.prototype.dMultiply = bnpDMultiply;
    BigInteger.prototype.dAddOffset = bnpDAddOffset;
    BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
    BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
    BigInteger.prototype.modInt = bnpModInt;
    BigInteger.prototype.millerRabin = bnpMillerRabin;

    // public
    BigInteger.prototype.clone = bnClone;
    BigInteger.prototype.intValue = bnIntValue;
    BigInteger.prototype.byteValue = bnByteValue;
    BigInteger.prototype.shortValue = bnShortValue;
    BigInteger.prototype.signum = bnSigNum;
    BigInteger.prototype.toByteArray = bnToByteArray;
    BigInteger.prototype.equals = bnEquals;
    BigInteger.prototype.min = bnMin;
    BigInteger.prototype.max = bnMax;
    BigInteger.prototype.and = bnAnd;
    BigInteger.prototype.or = bnOr;
    BigInteger.prototype.xor = bnXor;
    BigInteger.prototype.andNot = bnAndNot;
    BigInteger.prototype.not = bnNot;
    BigInteger.prototype.shiftLeft = bnShiftLeft;
    BigInteger.prototype.shiftRight = bnShiftRight;
    BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
    BigInteger.prototype.bitCount = bnBitCount;
    BigInteger.prototype.testBit = bnTestBit;
    BigInteger.prototype.setBit = bnSetBit;
    BigInteger.prototype.clearBit = bnClearBit;
    BigInteger.prototype.flipBit = bnFlipBit;
    BigInteger.prototype.add = bnAdd;
    BigInteger.prototype.subtract = bnSubtract;
    BigInteger.prototype.multiply = bnMultiply;
    BigInteger.prototype.divide = bnDivide;
    BigInteger.prototype.remainder = bnRemainder;
    BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
    BigInteger.prototype.modPow = bnModPow;
    BigInteger.prototype.modInverse = bnModInverse;
    BigInteger.prototype.pow = bnPow;
    BigInteger.prototype.gcd = bnGCD;
    BigInteger.prototype.isProbablePrime = bnIsProbablePrime;

    // JSBN-specific extension
    BigInteger.prototype.square = bnSquare;

    // BigInteger interfaces not implemented in jsbn:

    // BigInteger(int signum, byte[] magnitude)
    // double doubleValue()
    // float floatValue()
    // int hashCode()
    // long longValue()
    // static BigInteger valueOf(long val)
    // prng4.js - uses Arcfour as a PRNG

    function Arcfour() {
      this.i = 0;
      this.j = 0;
      this.S = [];
    }

    // Initialize arcfour context from key, an array of ints, each from [0..255]
    function ARC4init(key) {
      var i, j, t;
      for(i = 0; i < 256; ++i)
        this.S[i] = i;
      j = 0;
      for(i = 0; i < 256; ++i) {
        j = (j + this.S[i] + key[i % key.length]) & 255;
        t = this.S[i];
        this.S[i] = this.S[j];
        this.S[j] = t;
      }
      this.i = 0;
      this.j = 0;
    }

    function ARC4next() {
      var t;
      this.i = (this.i + 1) & 255;
      this.j = (this.j + this.S[this.i]) & 255;
      t = this.S[this.i];
      this.S[this.i] = this.S[this.j];
      this.S[this.j] = t;
      return this.S[(t + this.S[this.i]) & 255];
    }

    Arcfour.prototype.init = ARC4init;
    Arcfour.prototype.next = ARC4next;

    // Plug in your RNG constructor here
    function prng_newstate() {
      return new Arcfour();
    }

    // Pool size must be a multiple of 4 and greater than 32.
    // An array of bytes the size of the pool will be passed to init()
    var rng_psize = 256;
    // Random number generator - requires a PRNG backend, e.g. prng4.js

    // For best results, put code like
    // <body onClick='rng_seed_time();' onKeyPress='rng_seed_time();'>
    // in your main HTML document.

    var rng_state;
    var rng_pool;
    var rng_pptr;

    // Mix in a 32-bit integer into the pool
    function rng_seed_int(x) {
      rng_pool[rng_pptr++] ^= x & 255;
      rng_pool[rng_pptr++] ^= (x >> 8) & 255;
      rng_pool[rng_pptr++] ^= (x >> 16) & 255;
      rng_pool[rng_pptr++] ^= (x >> 24) & 255;
      if(rng_pptr >= rng_psize) rng_pptr -= rng_psize;
    }

    // Mix in the current time (w/milliseconds) into the pool
    function rng_seed_time() {
      rng_seed_int(new Date().getTime());
    }

    // Initialize the pool with junk if needed.
    if(rng_pool == null) {
      rng_pool = [];
      rng_pptr = 0;
      var t;
      while(rng_pptr < rng_psize) {  // extract some randomness from Math.random()
        t = Math.floor(65536 * Math.random());
        rng_pool[rng_pptr++] = t >>> 8;
        rng_pool[rng_pptr++] = t & 255;
      }
      rng_pptr = 0;
      rng_seed_time();
      //rng_seed_int(window.screenX);
      //rng_seed_int(window.screenY);
    }

    function rng_get_byte() {
      if(rng_state == null) {
        rng_seed_time();
        rng_state = prng_newstate();
        rng_state.init(rng_pool);
        for(rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr)
          rng_pool[rng_pptr] = 0;
        rng_pptr = 0;
        //rng_pool = null;
      }
      // TODO: allow reseeding after first request
      return rng_state.next();
    }

    function rng_get_bytes(ba) {
      var i;
      for(i = 0; i < ba.length; ++i) ba[i] = rng_get_byte();
    }

    function SecureRandom() {}

    SecureRandom.prototype.nextBytes = rng_get_bytes;
    // Depends on jsbn.js and rng.js

    // Version 1.1: support utf-8 encoding in pkcs1pad2

    // convert a (hex) string to a bignum object
    function parseBigInt(str,r) {
      return new BigInteger(str,r);
    }

    function linebrk(s,n) {
      var ret = "";
      var i = 0;
      while(i + n < s.length) {
        ret += s.substring(i,i+n) + "\n";
        i += n;
      }
      return ret + s.substring(i,s.length);
    }

    function byte2Hex(b) {
      if(b < 0x10)
        return "0" + b.toString(16);
      else
        return b.toString(16);
    }

    // PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
    function pkcs1pad2(s,n) {
      if(n < s.length + 11) { // TODO: fix for utf-8
        alert("Message too long for RSA");
        return null;
      }
      var ba = [];
      var i = s.length - 1;
      while(i >= 0 && n > 0) {
        var c = s.charCodeAt(i--);
        if(c < 128) { // encode using utf-8
          ba[--n] = c;
        }
        else if((c > 127) && (c < 2048)) {
          ba[--n] = (c & 63) | 128;
          ba[--n] = (c >> 6) | 192;
        }
        else {
          ba[--n] = (c & 63) | 128;
          ba[--n] = ((c >> 6) & 63) | 128;
          ba[--n] = (c >> 12) | 224;
        }
      }
      ba[--n] = 0;
      var rng = new SecureRandom();
      var x = [];
      while(n > 2) { // random non-zero pad
        x[0] = 0;
        while(x[0] == 0) rng.nextBytes(x);
        ba[--n] = x[0];
      }
      ba[--n] = 2;
      ba[--n] = 0;
      return new BigInteger(ba);
    }

    // "empty" RSA key constructor
    function RSAKey() {
      this.n = null;
      this.e = 0;
      this.d = null;
      this.p = null;
      this.q = null;
      this.dmp1 = null;
      this.dmq1 = null;
      this.coeff = null;
    }

    // Set the public key fields N and e from hex strings
    function RSASetPublic(N,E) {
      if(N != null && E != null && N.length > 0 && E.length > 0) {
        this.n = parseBigInt(N,16);
        this.e = parseInt(E,16);
      }
      else
        alert("Invalid RSA public key");
    }

    // Perform raw public operation on "x": return x^e (mod n)
    function RSADoPublic(x) {
      return x.modPowInt(this.e, this.n);
    }

    // Return the PKCS#1 RSA encryption of "text" as an even-length hex string
    function RSAEncrypt(text) {
      var m = pkcs1pad2(text,(this.n.bitLength()+7)>>3);
      if(m == null) return null;
      var c = this.doPublic(m);
      if(c == null) return null;
      var h = c.toString(16);
      if((h.length & 1) == 0) return h; else return "0" + h;
    }

    // Return the PKCS#1 RSA encryption of "text" as a Base64-encoded string
    //function RSAEncryptB64(text) {
    //  var h = this.encrypt(text);
    //  if(h) return hex2b64(h); else return null;
    //}

    // protected
    RSAKey.prototype.doPublic = RSADoPublic;

    // public
    RSAKey.prototype.setPublic = RSASetPublic;
    RSAKey.prototype.encrypt = RSAEncrypt;
    //RSAKey.prototype.encrypt_b64 = RSAEncryptB64;
    // Depends on rsa.js and jsbn2.js

    // Version 1.1: support utf-8 decoding in pkcs1unpad2

    // Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
    function pkcs1unpad2(d,n) {
      var b = d.toByteArray();
      var i = 0;
      while(i < b.length && b[i] == 0) ++i;
      if(b.length-i != n-1 || b[i] != 2)
        return null;
      ++i;
      while(b[i] != 0)
        if(++i >= b.length) return null;
      var ret = "";
      while(++i < b.length) {
        var c = b[i] & 255;
        if(c < 128) { // utf-8 decode
          ret += String.fromCharCode(c);
        }
        else if((c > 191) && (c < 224)) {
          ret += String.fromCharCode(((c & 31) << 6) | (b[i+1] & 63));
          ++i;
        }
        else {
          ret += String.fromCharCode(((c & 15) << 12) | ((b[i+1] & 63) << 6) | (b[i+2] & 63));
          i += 2;
        }
      }
      return ret;
    }

    // Set the private key fields N, e, and d from hex strings
    function RSASetPrivate(N,E,D) {
      if(N != null && E != null && N.length > 0 && E.length > 0) {
        this.n = parseBigInt(N,16);
        this.e = parseInt(E,16);
        this.d = parseBigInt(D,16);
      }
      else
        alert("Invalid RSA private key");
    }

    // Set the private key fields N, e, d and CRT params from hex strings
    function RSASetPrivateEx(N,E,D,P,Q,DP,DQ,C) {
      if(N != null && E != null && N.length > 0 && E.length > 0) {
        this.n = parseBigInt(N,16);
        this.e = parseInt(E,16);
        this.d = parseBigInt(D,16);
        this.p = parseBigInt(P,16);
        this.q = parseBigInt(Q,16);
        this.dmp1 = parseBigInt(DP,16);
        this.dmq1 = parseBigInt(DQ,16);
        this.coeff = parseBigInt(C,16);
      }
      else
        alert("Invalid RSA private key");
    }

    // Generate a new random private key B bits long, using public expt E
    function RSAGenerate(B,E) {
      var rng = new SecureRandom();
      var qs = B>>1;
      this.e = parseInt(E,16);
      var ee = new BigInteger(E,16);
      for(;;) {
        for(;;) {
          this.p = new BigInteger(B-qs,1,rng);
          if(this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.p.isProbablePrime(10)) break;
        }
        for(;;) {
          this.q = new BigInteger(qs,1,rng);
          if(this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.q.isProbablePrime(10)) break;
        }
        if(this.p.compareTo(this.q) <= 0) {
          var t = this.p;
          this.p = this.q;
          this.q = t;
        }
        var p1 = this.p.subtract(BigInteger.ONE);
        var q1 = this.q.subtract(BigInteger.ONE);
        var phi = p1.multiply(q1);
        if(phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
          this.n = this.p.multiply(this.q);
          this.d = ee.modInverse(phi);
          this.dmp1 = this.d.mod(p1);
          this.dmq1 = this.d.mod(q1);
          this.coeff = this.q.modInverse(this.p);
          break;
        }
      }
    }

    // Perform raw private operation on "x": return x^d (mod n)
    function RSADoPrivate(x) {
      if(this.p == null || this.q == null)
        return x.modPow(this.d, this.n);

      // TODO: re-calculate any missing CRT params
      var xp = x.mod(this.p).modPow(this.dmp1, this.p);
      var xq = x.mod(this.q).modPow(this.dmq1, this.q);

      while(xp.compareTo(xq) < 0)
        xp = xp.add(this.p);
      return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
    }

    // Return the PKCS#1 RSA decryption of "ctext".
    // "ctext" is an even-length hex string and the output is a plain string.
    function RSADecrypt(ctext) {
      var c = parseBigInt(ctext, 16);
      var m = this.doPrivate(c);
      if(m == null) return null;
      return pkcs1unpad2(m, (this.n.bitLength()+7)>>3);
    }

    // Return the PKCS#1 RSA decryption of "ctext".
    // "ctext" is a Base64-encoded string and the output is a plain string.
    //function RSAB64Decrypt(ctext) {
    //  var h = b64tohex(ctext);
    //  if(h) return this.decrypt(h); else return null;
    //}

    // protected
    RSAKey.prototype.doPrivate = RSADoPrivate;

    // public
    RSAKey.prototype.setPrivate = RSASetPrivate;
    RSAKey.prototype.setPrivateEx = RSASetPrivateEx;
    RSAKey.prototype.generate = RSAGenerate;
    RSAKey.prototype.decrypt = RSADecrypt;
    //RSAKey.prototype.b64_decrypt = RSAB64Decrypt;
    var b64map="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var b64pad="=";

    function hex2b64(h) {
      var i;
      var c;
      var ret = "";
      for(i = 0; i+3 <= h.length; i+=3) {
        c = parseInt(h.substring(i,i+3),16);
        ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
      }
      if(i+1 == h.length) {
        c = parseInt(h.substring(i,i+1),16);
        ret += b64map.charAt(c << 2);
      }
      else if(i+2 == h.length) {
        c = parseInt(h.substring(i,i+2),16);
        ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
      }
      while((ret.length & 3) > 0) ret += b64pad;
      return ret;
    }

    // convert a base64 string to hex
    function b64tohex(s) {
      var ret = "";
      var i;
      var k = 0; // b64 state, 0-3
      var slop;
      for(i = 0; i < s.length; ++i) {
        if(s.charAt(i) == b64pad) break;
        var v = b64map.indexOf(s.charAt(i));
        if(v < 0) continue;
        if(k == 0) {
          ret += int2char(v >> 2);
          slop = v & 3;
          k = 1;
        }
        else if(k == 1) {
          ret += int2char((slop << 2) | (v >> 4));
          slop = v & 0xf;
          k = 2;
        }
        else if(k == 2) {
          ret += int2char(slop);
          ret += int2char(v >> 2);
          slop = v & 3;
          k = 3;
        }
        else {
          ret += int2char((slop << 2) | (v >> 4));
          ret += int2char(v & 0xf);
          k = 0;
        }
      }
      if(k == 1)
        ret += int2char(slop << 2);
      return ret;
    }

    // convert a base64 string to a byte/number array
    function b64toBA(s) {
      //piggyback on b64tohex for now, optimize later
      var h = b64tohex(s);
      var i;
      var a = [];
      for(i = 0; 2*i < h.length; ++i) {
        a[i] = parseInt(h.substring(2*i,2*i+2),16);
      }
      return a;
    }
    /**
     * Add a translate method to the RSAKey class.
     */
    RSAKey.prototype.parseKey = function(keyString) {

      // Prepare the key string.
      keyString = this.prepareKey(keyString);

      // Get the structure of this key.
      var structure = this.structure();

      // Go through and parse all the properties.
      var offset = 0, info = null, value = null, length = 0;
      for (var prop in structure) {
          if (structure.hasOwnProperty(prop)) {
              info = structure[prop];
              if (info.hasOwnProperty('offset')) {
                  offset += (info.offset * 2);
              }

              // Determine the length.
              length = typeof info.length == 'string' ? this[info.length] : info.length;
              length *= 2;
              value = keyString.substr(offset, length);
              if (info.hasOwnProperty('type')) {
                  if (info.type == 'int') {
                      value = parseInt(value, 16);
                  }
                  else if (info.type == 'bigint') {
                      value = parseBigInt(value, 16);
                  }
              }

              // Increment the offset with the length.
              offset += length;

              // Assign the property.
              this[prop] = value;
          }
      }
    };

    /**
     * Add a char64toHex method.
     */
    RSAKey.prototype.char64ToHex = function(str) {
      var hex = '';
      str = atob(str);
      for (var i = 0; i < str.length; ++i) {
        var tmp = str.charCodeAt(i).toString(16);
        if (tmp.length === 1) tmp = "0" + tmp;
        hex += tmp;
      }
      return hex;
    };

    /**
     * Add a prepare key method.
     *
     * @param {string} The key to prepare.
     * @return {string} The hexidecimal version of the key.
     */
    RSAKey.prototype.prepareKey = function(keyString) {

      // Trim the keystring first.
      keyString = keyString.replace(/^\s+|\s+$/g, '');

      // Split the key from the line feeds.
      var lines = keyString.split(/\r?\n/);

      // Only remove the first and last lines if it contains the begin stmt.
      if (lines[0].substring(0,10) == '-----BEGIN') {

        // Remove the first and last lines.
        lines = lines.slice(1, (lines.length - 1));
      }

      // Join these back into the key.
      keyString = lines.join('');

      // Convert the key to hex.
      return this.char64ToHex(keyString);
    };

    /**
     * Returns the base key without header in base16 (hex) format.
     */
    RSAKey.prototype.getBaseKey = function() {
      var b16 = '';
      var structure = this.structure();
      var info = null, value = null, length = 0;
      for (var prop in structure) {
          if (structure.hasOwnProperty(prop)) {
              info = structure[prop];
              if (info.variable) {

                  // Get the value in hex form.
                  value = this[prop].toString(16);
                  if (!!(value.length % 2)) {
                      value = "0" + value;
                  }
                  if (info.hasOwnProperty('padded') && info.padded) {
                      value = "00" + value;
                  }

                  // Get the length in hex form.
                  length = (value.length / 2);
                  length = length.toString(16);
                  if (!!(length.length % 2)) {
                      length = "0" + length;
                  }

                  // If the value has an extra space then add it.
                  if (info.hasOwnProperty('extraspace')) {
                      b16 += length;
                  }

                  // Add the length.
                  b16 += length;

                  // Add the value.
                  b16 += value;

                  // Add the spacer.
                  b16 += "02";
              }
          }
      }

      // Remove the last spacer.
      return b16.slice(0, -2);
    };

    /**
     * Create a word wrap.
     */
    RSAKey.prototype.wordwrap = function(str, width) {
      width = width || 64;
      if (!str) {
        return str;
      }
      var regex = '(.{1,' + width + '})( +|$\n?)|(.{1,' + width + '})';
      return str.match(new RegExp(regex, 'g')).join('\n');
    };

    // Return a new Private key.
    RSAKey.prototype.getPrivateKey = function() {
      var key = "-----BEGIN RSA PRIVATE KEY-----\n";
      var b16 = "3082025e02010002";  // header + spacer + verlen + version + spacer.
      b16 += this.getBaseKey();
      key += this.wordwrap(hex2b64(b16)) + "\n";
      key += "-----END RSA PRIVATE KEY-----";
      return key;
    };

    // Return a new Public key.
    RSAKey.prototype.getPublicKey = function() {
      var key = "-----BEGIN PUBLIC KEY-----\n";
      var b16 = "30819f300d06092a864886f70d010101050003818d0030818902";  // header + spacer.
      b16 += this.getBaseKey();
      key += this.wordwrap(hex2b64(b16)) + "\n";
      key += "-----END PUBLIC KEY-----";
      return key;
    };

    /**
     * Create a private key class to extend the RSAKey.
     *
     * @param string privkey - The private key in string format.
     */
    var RSAPrivateKey = function(privkey) {

      // Call teh constructor.
      RSAKey.call(this);

      // If a private key was provided.
      if (privkey) {

        // Parse the key.
        this.parseKey(privkey);
      }
    };

    // Derive from RSAKey.
    RSAPrivateKey.prototype = new RSAKey();

    // Reset the contructor.
    RSAPrivateKey.prototype.constructor = RSAPrivateKey;

    // Returns the structure for the private key.
    // See http://etherhack.co.uk/asymmetric/docs/rsa_key_breakdown.html
    RSAPrivateKey.prototype.structure = function() {
      return {
        'header': {length: 4},
        'versionlength': {length: 1, offset: 1, type: 'int'},
        'version': {length:'versionlength', type: 'int'},
        'n_length': {length:1, offset:2, type: 'int'},
        'n': {length:'n_length', type: 'bigint', variable:true, padded: true, extraspace: true},
        'e_length': {length:1, offset:1, type: 'int'},
        'e': {length:'e_length', type: 'int', variable:true},
        'd_length': {length:1, offset:2, type: 'int'},
        'd': {length:'d_length', type: 'bigint', variable:true, padded: true, extraspace: true},
        'p_length': {length:1, offset:1, type: 'int'},
        'p': {length:'p_length', type: 'bigint', variable:true, padded: true},
        'q_length': {length:1, offset:1, type: 'int'},
        'q': {length:'q_length', type: 'bigint', variable:true, padded: true},
        'dmp1_length': {length: 1, offset: 1, type: 'int'},
        'dmp1': {length: 'dmp1_length', type: 'bigint', variable:true},
        'dmq1_length': {length: 1, offset: 1, type: 'int'},
        'dmq1': {length: 'dmq1_length', type: 'bigint', variable:true, padded: true},
        'coeff_length': {length: 1, offset: 1, type: 'int'},
        'coeff': {length: 'coeff_length', type: 'bigint', variable:true, padded: true}
      };
    };

    /**
     * Create a public key class to extend the RSAKey.
     *
     * @param string pubkey - The public key in string format, or RSAPrivateKey.
     */
    var RSAPublicKey = function(pubkey) {

      // Call teh constructor.
      RSAKey.call(this);

      // If a pubkey key was provided.
      if (pubkey) {

        // If this is a string...
        if (typeof pubkey == 'string') {
          this.parseKey(pubkey);
        }
        else if (pubkey.hasOwnProperty('n') && pubkey.hasOwnProperty('e')) {

          // Set the values for the public key.
          this.n = pubkey.n;
          this.e = pubkey.e;
        }
      }
    };

    // Derive from RSAKey.
    RSAPublicKey.prototype = new RSAKey();

    // Reset the contructor.
    RSAPublicKey.prototype.constructor = RSAPublicKey;

    // Returns the structure for the public key.
    // See http://etherhack.co.uk/asymmetric/docs/rsa_key_breakdown.html
    RSAPublicKey.prototype.structure = function() {
      return {
        'header': {length: 25},
        'n_length': {length:1, offset:2, type: 'int'},
        'n': {length:'n_length', type: 'bigint', variable:true, padded: true, extraspace: true},
        'e_length': {length:1, offset:1, type: 'int'},
        'e': {length:'e_length', type: 'int', variable:true}
      };
    };

    /**
     * Class to do the encryption.
     */
    var JSEncrypt = function() {

      // The private and public keys.
      this.privkey = null;
      this.pubkey = null;
    };

    /**
     * Set the private key.
     */
    JSEncrypt.prototype.setPrivateKey = function(privkey) {

      // Create the private key.
      this.privkey = new RSAPrivateKey(privkey);

      // Make sure the public key is based off of the private key.
      this.pubkey = new RSAPublicKey(this.privkey);
    };

    /**
     * Set the public key.
     */
    JSEncrypt.prototype.setPublicKey = function(pubkey) {

      // Sets the public key.
      this.pubkey = new RSAPublicKey(pubkey);
    };

    /**
     * Decryption method to take a private PEM string and decrypt text.
     */
    JSEncrypt.prototype.decrypt = function(string) {

      // If a private ke is available, then decrypt.
      if (this.privkey) {

        // Return the decrypted string.
        return this.privkey.decrypt(b64tohex(string));
      }
      else {

        // Return false...
        return false;
      }
    };

    /**
     * Encrypttion method to take a public PEM string and encrypt text.
     */
    JSEncrypt.prototype.encrypt = function(string) {

      // We can use either the public key or the private key for encryption.
      var key = this.pubkey || this.privkey;

      // If the key exists.
      if (key) {

        // Return the encrypted string.
        return hex2b64(key.encrypt(string));
      }
      else {

        // Return false.
        return false;
      }
    };

    /**
     * Return the private key, or a generated one if it doesn't exist.
     */
    JSEncrypt.prototype.getPrivateKey = function() {

      // Only create new if it does not exist.
      if (!this.privkey) {

        // Get a new private key.
        this.privkey = new RSAPrivateKey();

        // Generate the key.
        this.privkey.generate(1024, '010001');

        // Make sure the public key is based off of the private key.
        this.pubkey = new RSAPublicKey(this.privkey);
      }

      // Return the private representation of this key.
      return this.privkey.getPrivateKey();
    };

    /**
     * Return the public key, or a generated one if it doesn't exist.
     */
    JSEncrypt.prototype.getPublicKey = function() {

      // Only create new if it does not exist.
      if (!this.pubkey) {

        // Get a new private key.
        this.pubkey = new RSAPublicKey();

        // Generate the key.
        this.pubkey.generate(1024, '010001');
      }

      // Return the private representation of this key.
      return this.pubkey.getPublicKey();
    };
    
    return function(value) {
        var crypt = new JSEncrypt();
        crypt.setPublicKey(CommonConstants.RSA_PUBLIC_KEY);
        
        return crypt.encrypt(value);
    }
})();

module.exports = Utils.encrypt;
},{"17":17}],26:[function(require,module,exports){
var Utils = Utils || {},
	_undefined = 'undefined';

Utils.parseBoolean = function (value, defaultValue) {
	defaultValue = defaultValue || false;

	if (!value)		{
		return defaultValue;
	}

	return value != '0';
};

/**
 * Parses an string to get an Integer
 * @type {string} value The string to parse
 * @type {int} defaultValue The default value in case the argument value is undefined or null.
 * @return {int} Parsed value from the argument value using parseInt function, or the defaultValue argument,
 * in case there is not given value.
 * */
Utils.parseInteger = function (value, defaultValue) {
	if (value == null || isNaN(value))		{
		return defaultValue || 0;
	}

	return parseInt(value);
};

Utils.parseLong = function (value, defaultValue) {
	var ret = Number(value);
	return (value == null || isNaN(ret)) ? (defaultValue || 0) : ret;
};

Utils.toString = function (object) {

	if (typeof object == _undefined) {

		return _undefined;
	}	else if (typeof object === 'string') {

		return object;
	}	else if (object instanceof Array) {

		return object.join(',');
	} else {
		var result = '';

		for (var key in object) {
			if (object.hasOwnProperty(key)) {
				result += key + ':' + object[key] + ';';
			}
		}

		return result || object.toString();
	}
};

module.exports.parseBoolean = Utils.parseBoolean;
module.exports.parseInteger = Utils.parseInteger;
module.exports.parseLong = Utils.parseLong;
module.exports.toString = Utils.toString;
},{}],27:[function(require,module,exports){
/* global localStorage */

var arrayUtils = require(19),
	_undefined = 'undefined',
	objectUtils = require(24);

function LocalStorageIO() {
	var self = this;

	var esc = typeof encodeURIComponent !== _undefined ? encodeURIComponent : escape,
		unesc = typeof decodeURIComponent !== _undefined ? decodeURIComponent : unescape,
		DIR_PREFIX = 'cs_dir_',
		FILE_PREFIX = 'cs_file_',
		storage = typeof localStorage !== _undefined ? localStorage : null,
		dirContents = {},
		DELIM = '|';

	var valid = storage && esc && unesc;

	function createDir(path) {
		var key = DIR_PREFIX + path;
		if (typeof storage.setItem == 'function') {
			storage.setItem(key, '');
		} else {
			storage[key] = '';
		}
		dirContents[key] = [];
	}

	function createFile(path, name) {
		var key = DIR_PREFIX + path;
		try {
			if (typeof storage.setItem == 'function') {
				storage.setItem(key, storage.getItem(key) + DELIM + esc(name));
			} else {
				storage[key] = storage.getItem(key) + DELIM + esc(name);
			}
		} catch (ex) {
			// do nothing
		}

		dirContents[key].push(name);
	}

	function deleteFile(path, name) {
		var key = DIR_PREFIX + path;
		var dirContent = dirContents[key];
		dirContent.splice(arrayUtils.indexOf(name, dirContent), 1);
		var newContents = [];
		for (var i = 0, len = dirContent.length; i < len; i++) {
			newContents.push(esc(dirContent[i]));
		}

		try {
			if (typeof storage.setItem == 'function') {
				storage.setItem(key, newContents.join(DELIM));
			} else {
				storage[key] = newContents.join(DELIM);
			}
			if (typeof storage.removeItem == 'function') {
				storage.removeItem(FILE_PREFIX + path + name);
			} else {
				delete storage[FILE_PREFIX + path + name];
			}
		} catch (ex) {
			// do nothing
		}
	}

	function store(path, name, data) {
		try {
			if (typeof storage.setItem == 'function') {
				storage.setItem(FILE_PREFIX + path + name, data);
			} else {
				storage[FILE_PREFIX + path + name] = data;
			}
		} catch (ex) {
			// do nothing
		}
	}

	function restore(path, name) {
		try {
			if (typeof storage.getItem == 'function') {
				return storage.getItem(FILE_PREFIX + path + name);
			} else {
				return storage[FILE_PREFIX + path + name];
			}
		} catch (ex) {
			// do nothing
		}
	}

	objectUtils.extend(self, {
		dir: function (path) {
			if (!valid) return null;

			var key = DIR_PREFIX + path;
			var ret = dirContents[key];

			if (ret) {
				return ret.slice();
			}

			var content = storage.getItem(key);
			if (content) {
				content = content.split(DELIM);
				ret = [];
				for (var i = 0, len = content.length; i < len; i++) {
					if (content[i].length > 0) {
						ret.push(unesc(content[i]));
					}
				}
				dirContents[key] = ret;
				return ret.slice();
			}

			return null; // dir does not exist
		},

		append: function (path, filename, data) {
			if (!valid) return;

			var content = self.read(path, filename);
			if (!content) {
				content = data;
			} else {
				content += data;
			}
			self.write(path, filename, content);
		},

		write: function (path, filename, data) {
			if (!valid) return;

			var content = self.dir(path);
			if (!content) {
				// Dir does not exist
				createDir(path);
				content = [];
			}
			if (arrayUtils.indexOf(filename, content) == -1) {
				// File does not exist
				createFile(path, filename);
			}
			store(path, filename, data);
		},

		deleteFile: function (path, filename) {
			if (!valid) return false;

			var content = self.dir(path);
			if (!content) {
				// Dir does not exist
				return false;
			}
			if (arrayUtils.indexOf(filename, content) == -1) {
				return false;
			}
			deleteFile(path, filename);
			return true;
		},

		read: function (path, filename) {
			if (!valid) return null;

			var content = self.dir(path);
			if (!content) {
				// Dir does not exist
				return null;
			}
			if (arrayUtils.indexOf(filename, content) == -1) {
				return null;
			}
			return restore(path, filename);
		}
	});
}

module.exports = LocalStorageIO;
},{"19":19,"24":24}],28:[function(require,module,exports){
/* global FileSystem, curWidget, sf */

var arrayUtils = require(19),
	_undefined = 'undefined',
	objectUtils = require(24);

var io = null,
	dataDir = null,
	PREFIX = 'cs_dir_',
	DELIM = '|',
	dirs = {},
	initialized = false,
	get,
	set;

// Every method is expected to initialise internal variables by calling this method before further use of them.
function initialize() {
	io = typeof FileSystem != _undefined ? new FileSystem() : null;
	dataDir = typeof curWidget != _undefined ? curWidget.id : null;

	if (typeof(sf) !== _undefined) {
		// AppsFramework 2.0.0
		set = get = function (key, value) {
			sf.core.localData(key, value);
		};
	}

	if (io != null && typeof io.isValidCommonPath != _undefined && !io.isValidCommonPath(dataDir)) {
		io.createCommonDir(dataDir);
	}

	initialized = true;
}

function trim(str) {
	return str.replace(/^\s+|\s+$/g, '');
}

function onFileCreated(path, filename) {
	var listing = dirs[path];
	if (!listing) {
		listing = (dirs[path] = [filename]);
	} else {
		listing.push(filename);
	}
	set(PREFIX + path, listing.join(DELIM));
}

function onFileDeleted(path, filename) {
	var listing = dirs[path];
	var idx = arrayUtils.indexOf(filename, listing);
	if (idx >= 0) {
		listing.splice(idx, 1);
		set(PREFIX + path, listing.length === 0 ? null : listing.join(DELIM));
	}
}

function SmartTVIO() {
	var self = this;

	objectUtils.extend(self, {
		dir: function(path) {
			if(!initialized) {
				initialize();
			}

			if (!io.isValidCommonPath(dataDir + '/' + path)) {
				return null;
			} else {
				var content = dirs[path];
				if (!content) {
					content = get(PREFIX + path);
					if (content) {
						content = (dirs[path] = content.split(DELIM));
					} else {
						return null;
					}
				}
				var ret = content.slice();
				for (var i = 0, len = ret.length; i < len; i++) {
					var filename = content[i];
					if (!io.isValidCommonPath(dataDir + '/' + path + '/' + filename)) {
						onFileDeleted(path, filename);
					}
				}
				return ret;
			}
		},

		append: function(path, filename, data) {
			if(!initialized) {
				initialize();
			}

			var dir = dataDir + '/' + path;
			if (!io.isValidCommonPath(dir)) {
				io.createCommonDir(dir);
			}

			if (!io.isValidCommonPath(dir + '/' + filename)) {
				onFileCreated(path, filename);
			}

			var file = io.openCommonFile(dir + '/' + filename, 'a');
			file.writeLine(trim(data));
			io.closeCommonFile(file);
		},

		write: function(path, filename, data) {
			if(!initialized) {
				initialize();
			}

			var dir = dataDir + '/' + path;
			if (!io.isValidCommonPath(dir)) {
				io.createCommonDir(dir);
			}

			if (!io.isValidCommonPath(dir + '/' + filename)) {
				onFileCreated(path, filename);
			}

			var file = io.openCommonFile(dir + '/' + filename, 'w');
			file.writeLine(trim(data));
			io.closeCommonFile(file);
		},

		deleteFile: function(path, filename) {
			if(!initialized) {
				initialize();
			}

			var dir = dataDir + '/' + path;
			if (!io.isValidCommonPath(dir)) {
				return false;
			}
			onFileDeleted(path, filename);

			return io.deleteCommonFile(dir + '/' + filename);
		},

		read: function(path, filename) {
			if(!initialized) {
				initialize();
			}

			var dir = dataDir + '/' + path;
			if (!io.isValidCommonPath(dir)) {
				return null;
			}

			var file = io.openCommonFile(dir + '/' + filename, 'r');
			if (file) {
				var str, ret = [];
				while ((str = file.readLine())) {
					ret.push(str);
				}
				io.closeCommonFile(file);
				return ret.join('\n');
			} else {
				onFileDeleted(path, filename);
				return '';
			}
		}
	});
}

module.exports = SmartTVIO;
},{"19":19,"24":24}],29:[function(require,module,exports){
var objectUtils = require(24);

function VoidIO() {
	var self = this;

	objectUtils.extend(self, {
		dir: function () {
			return null;
		},

		append: function(path, filename, data) {
		},

		write: function(path, filename, data) {
		},

		deleteFile: function () {
			return false;
		},

		read: function () {
			return null;
		}
	});
}

module.exports = VoidIO;

},{"24":24}],30:[function(require,module,exports){
/* eslint-env browser */
/* global atv */

var generalUtils = require(21),
	CommonConstants = require(17),
	atvHttpGet = require(49).atvHttpGet,
	atvHttpPost = require(49).atvHttpPost,
	ATVLocalStorage = require(45),
	VoidIO = require(29),

	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var visitorId = null,
	visitorIdSuffix = null,
	crossPublisherId = null;

function isCompatible() {
	return typeof window == _undefined && typeof atv != _undefined;
}

function initIds() {
	if (visitorId == null) {
		if (typeof atv != _undefined && typeof atv.device != _undefined && atv.device.idForVendor) {
			visitorId = generalUtils.safeGet(atv.device.idForVendor, '');
			visitorIdSuffix = '62';
		} else {
			visitorId = (+new Date()) + (~~(Math.random() * 1000));
			visitorIdSuffix = '72';
		}

		crossPublisherId = null;
	}
}

var ATVPlatformAPI = {
	PLATFORM: 'atv',
	httpGet: atvHttpGet,
	httpPost: atvHttpPost,
	Storage: ATVLocalStorage,
	IO: VoidIO,
	getCrossPublisherId: function () {
		initIds();
		return crossPublisherId;
	},
	getAppName: function () {
		return UNKNOWN_VALUE;
	},
	getAppVersion: function () {
		return UNKNOWN_VALUE;
	},
	getVisitorId: function () {
		initIds();
		return visitorId;
	},
	getVisitorIdSuffix: function () {
		return visitorIdSuffix;
	},
	getDeviceModel: function () {
		return 'Apple TV';
	},
	getPlatformVersion: function () {
		return typeof atv != _undefined && typeof atv.device != _undefined && generalUtils.safeGet(atv.device.softwareVersion, UNKNOWN_VALUE);
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		return 'atv';
	},
	getRuntimeVersion: function () {
		return typeof atv != _undefined && typeof atv.device != _undefined && generalUtils.safeGet(atv.device.softwareVersion, UNKNOWN_VALUE);
	},
	getDisplayResolution: function () {
		if (typeof atv.device != _undefined && typeof atv.device.screenFrame != _undefined
                && typeof atv.device.screenFrame.height != _undefined && typeof atv.device.screenFrame.width != _undefined) {
			return atv.device.screenFrame.height + 'x' + atv.device.screenFrame.width;
		}
		return UNKNOWN_RESOLUTION;
	},
	getLanguage: function () {
		return typeof atv != _undefined && typeof atv.device != _undefined && generalUtils.safeGet(atv.device.language, '');
	},
	getPackageName: function () {
		return ''; // Cannot retrieve
	},
	isConnectionAvailable: function () {
		return true;
	},
	setTimeout: function (onTimer, interval) {
		return typeof atv != _undefined && typeof atv.setTimeout != _undefined && atv.setTimeout(onTimer, interval);
	},
	setInterval: function (onTimer, interval) {
		return typeof atv != _undefined && typeof atv.setInterval != _undefined && atv.setInterval(onTimer, interval);
	},
	clearTimeout: function (timeoutId) {
		return typeof atv != _undefined && typeof atv.clearTimeout != _undefined && atv.clearTimeout(timeoutId);
	},
	clearInterval: function (intervalId) {
		return typeof atv != _undefined && typeof atv.clearInterval != _undefined && atv.clearInterval(intervalId);
	},
	isCompatible: isCompatible,

	isConnectionSecure: function () {
		if (typeof document == _undefined || document == null) return false;

		return document.location.href.charAt(4) === 's';
	}
};

module.exports = ATVPlatformAPI;
},{"17":17,"21":21,"29":29,"45":45,"49":49}],31:[function(require,module,exports){
/* eslint-env browser */
/* globals ns_, cast */

/**
 * In order to initialize the comScore Application Tag from a Chromecast receiver:
 *
 * 1. add the comScore javascript file to the project.
 *
 * 2. add the standar chromecast javascript file that will expose the cast variable on the global scope.
 *
 * 3. Reference the `castReceiverManager` in the ns_.crm:
 *
 * <script type="text/javascript">
 *  $(document).ready(function() {
 *      var castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
 *
 *      ns_.crm = castReceiverManager;
 *      ns_.comScore.setAppContext(this);
 *      ns_.comScore.setCustomerC2('1000001');
 *      ns_.comScore.setPublisherSecret('9c455c81a801d3832a2cd281843dff30');
 *      ns_.comScore.start();
 *      ...
 */

var generalUtils = require(21),
	browserUtils = require(20),
	CommonConstants = require(17),
	imgHttpGet = require(50),
	ajaxHttpPost = require(48).ajaxHttpPost,
	LocalStorage = require(46),
	LocalStorageIO = require(27),

	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

function isCompatible() {
	return typeof window !== _undefined && !generalUtils.isEmpty(window.cast) && !generalUtils.isEmpty(cast.receiver);
}

var ChromecastPlatformAPI = {
	PLATFORM: 'chromecast',
	httpGet: imgHttpGet,
	httpPost: ajaxHttpPost,
	Storage: LocalStorage,
	IO: LocalStorageIO,
	getCrossPublisherId: function () {
		return null;
	},
	getAppName: function () {
		if (typeof ns_.crm === _undefined) return UNKNOWN_VALUE;

		var applicationData = ns_.crm.getApplicationData();
		return applicationData.name;
	},
	getAppVersion: function () {
		return UNKNOWN_VALUE;
	},
	getVisitorId: function () {
		return (+new Date()) + (~~(Math.random() * 1000));
	},
	getVisitorIdSuffix: function () {
		return '72';
	},
	getDeviceModel: function () {
		return 'chromecast';
	},
	getPlatformVersion: function () {
		return cast.receiver.VERSION + '-' + generalUtils.safeGet(browserUtils.getBrowserName() + ' ' + browserUtils.getBrowserFullVersion(), UNKNOWN_VALUE);
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		return 'html';
	},
	getRuntimeVersion: function () {
		return '5';
	},
	getDisplayResolution: function () {
		var width = ((typeof window != _undefined) && generalUtils.exists(window.screen)
                    && generalUtils.exists(window.screen.availWidth)) ? window.screen.availWidth : 0;
		var height = ((typeof window != _undefined) && generalUtils.exists(window.screen)
                    && generalUtils.exists(window.screen.availHeight)) ? window.screen.availHeight : 0;
		if (width > 0 && height > 0) {
			return width + 'x' + height;
		}

		return UNKNOWN_RESOLUTION;
	},
	getLanguage: function () {
		return typeof window != _undefined
            && generalUtils.exists(window.navigator)
            && generalUtils.safeGet(window.navigator.language, '') || UNKNOWN_VALUE;
	},
	getPackageName: function () {
		return UNKNOWN_VALUE;
	},
	isConnectionAvailable: function () {
		return true;
	},
	isCompatible: isCompatible,

	isConnectionSecure: function () {
		if (typeof document == _undefined || document == null) return false;

		return document.location.href.charAt(4) === 's';
	}
};

module.exports = ChromecastPlatformAPI;
},{"17":17,"20":20,"21":21,"27":27,"46":46,"48":48,"50":50}],32:[function(require,module,exports){
var platformAPIs = {
	SmartTV: 0,
	Netcast: 1,
	Cordova: 2,
	Trilithium: 3,
	AppleTV: 4,
	Chromecast: 5,
	Xbox: 6,
	webOS: 7,
	tvOS: 8,
	nodejs: 9,
	html5: 10,
	JSMAF: 11,
	Skeleton: 12
};

module.exports = platformAPIs;
},{}],33:[function(require,module,exports){
/* eslint-env browser */
/* globals device*/

/** http://developer.lge.com/webOSTV/api/cordova-api/
 *
 * In order to initialize the comScore Application Tag from a webOS app:
 *
 * 1. add the comScore javascript file to the project.
 *
 * 2. add the path to file you just added to the 'app/package.js' file.
 *
 * 3. add the cordova engine to the 'app/package.js' file.
 *
 * 'app/package.js' should look something like this:
 *
 * enyo.depends(
 *      // Cordova (PhoneGap) library
 *      "$lib/enyo-cordova",
 *
 *      // comScore Application Tag
 *      "comscore.html5.js",
 *      .
 *      .
 *      .
 * );
 *
 * 4. initialize the sdk when the 'deviceready' event is called.
 *    your 'app.js' file should look something like this:
 *
 * enyo.kind({
 *	name: "myapp.Application",
 *	kind: "enyo.Application",
 *	view: "myapp.MainView",
 *	components: [ {kind: "Signals", ondeviceready: "deviceready"}],
 *	deviceready: function(inSender, inEvent) {
 *      // After deviceready, Cordova is loaded and ready to be used
 *		ns_.comScore.setAppContext(this);
 *	    ns_.comScore.setCustomerC2('1000001');
 *	    ns_.comScore.setPixelURL('http://www.google.com/?');
 *	    ns_.comScore.setPublisherSecret('9c455c81a801d3832a2cd281843dff30');
 *	    // add your custom initialization here...
 *	    ns_.comScore.start();
 *   }
 *  });
 *
 */

var generalUtils = require(21),
	CommonConstants = require(17),
	imgHttpGet = require(50),
	ajaxHttpGet = require(48).ajaxHttpGet,
	ajaxHttpPost = require(48).ajaxHttpPost,
	LocalStorage = require(46),
	LocalStorageIO = require(27),
	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var visitorId = null,
	visitorIdSuffix = null,
	crossPublisherId = null;

function isCompatible() {
	return typeof device != _undefined &&
		typeof device.available != _undefined &&
		device.available &&
		typeof window != _undefined &&
		typeof window.navigator != _undefined;
}

function getUniqueId() {
	if (isCompatible() && (typeof device != _undefined) && generalUtils.exists(device.uuid) && device.uuid.length > 0) {
		return device.uuid;
	}
	return null;
}

function initIds() {
	if (visitorId == null) {
		var uniqueDeviceId = getUniqueId();
		if (uniqueDeviceId != null) {
			visitorId = uniqueDeviceId;
			visitorIdSuffix = '31';
			crossPublisherId = uniqueDeviceId;
		} else {
			visitorId = (+new Date()) + (~~(Math.random() * 1000));
			visitorIdSuffix = '72';
			crossPublisherId = null;
		}
	}
}

var CordovaPlatformAPI = {
	PLATFORM: 'cordova',
	httpGet: function () {
		if (typeof Image != _undefined) {
			return imgHttpGet.apply(this, arguments);
		} else {
			return ajaxHttpGet.apply(this, arguments);
		}
	},
	httpPost: ajaxHttpPost,
	Storage: LocalStorage,
	IO: LocalStorageIO,
	getCrossPublisherId: function () {
		initIds();
		return crossPublisherId;
	},
	getAppName: function () {
		return UNKNOWN_VALUE;
	},
	getAppVersion: function () {
		return UNKNOWN_VALUE;
	},
	getVisitorId: function () {
		initIds();
		return visitorId;
	},
	getVisitorIdSuffix: function () {
		return visitorIdSuffix;
	},
	getDeviceModel: function () {
		return (typeof device != _undefined) && generalUtils.exists(device.model) || UNKNOWN_VALUE;
	},
	getPlatformVersion: function () {
		return (typeof device != _undefined) && generalUtils.exists(device.cordova) && device.cordova || UNKNOWN_VALUE;
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		return (typeof device != _undefined) && generalUtils.exists(device.platform) && ('cordova' + device.platform) || 'cordova';
	},
	getRuntimeVersion: function () {
		return (typeof device != _undefined) && generalUtils.exists(device.version) || UNKNOWN_VALUE;
	},
	getDisplayResolution: function () {
		var width = (typeof window != _undefined) && generalUtils.exists(window.screen) && generalUtils.exists(window.screen.availWidth)
            && window.screen.availWidth || 0;
		var height = (typeof window != _undefined) && generalUtils.exists(window.screen) && generalUtils.exists(window.screen.availHeight)
            && window.screen.availHeight || 0;
		if (width > 0 && height > 0) {
			return width + 'x' + height;
		}

		return UNKNOWN_RESOLUTION;
	},
	getLanguage: function () {
		return (typeof window != _undefined) && generalUtils.exists(window.navigator) && generalUtils.exists(window.navigator.language)
            && window.navigator.language || UNKNOWN_VALUE;
	},
	getPackageName: function () {
		return ''; // Cannot retrieve
	},
	isConnectionAvailable: function () {
		if (typeof window == _undefined) return true;

		if (!generalUtils.exists(window.navigator) || !generalUtils.exists(window.navigator.onLine)) {
			return true;
		}

		return window.navigator.onLine;
	},
	isCompatible: isCompatible,

	isConnectionSecure: function () {
		if (typeof document == _undefined || document == null) return false;

		return document.location.href.charAt(4) === 's';
	}
};

module.exports = CordovaPlatformAPI;
},{"17":17,"21":21,"27":27,"46":46,"48":48,"50":50}],34:[function(require,module,exports){
/* eslint-env browser */

var generalUtils = require(21),
	browserUtils = require(20),
	CommonConstants = require(17),
	imgHttpGet = require(50),
	ajaxHttpGet = require(48).ajaxHttpGet,
	ajaxHttpPost = require(48).ajaxHttpPost,
	LocalStorage = require(46),
	LocalStorageIO = require(27),

	_undefined = 'undefined',
	_document = typeof document != _undefined && document || undefined,
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var Html5PlatformAPI = {
	PLATFORM: 'html5',
	httpGet: function () {
		if (typeof Image != _undefined) {
			return imgHttpGet.apply(this, arguments);
		} else {
			return ajaxHttpGet.apply(this, arguments);
		}
	},
	httpPost: ajaxHttpPost,
	Storage: LocalStorage,
	IO: LocalStorageIO,
	getCrossPublisherId: function () {
		return null;
	},
	getAppName: function () {
		return _document && generalUtils.exists(_document.title) && _document.title
			|| UNKNOWN_VALUE;
	},
	getAppVersion: function () {
		return UNKNOWN_VALUE;
	},
	getVisitorId: function () {
		return this.getDeviceModel() + (+new Date()) + (~~(Math.random() * 1000));
	},
	getVisitorIdSuffix: function () {
		return '72';
	},
	getDeviceModel: function () {
		return (typeof window != _undefined) && generalUtils.exists(window.navigator) && generalUtils.safeGet(window.navigator.platform, '') || '';
	},
	getPlatformVersion: function () {
		return generalUtils.safeGet(browserUtils.getBrowserName() + ' ' + browserUtils.getBrowserFullVersion(), '');
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		return 'html';
	},
	getRuntimeVersion: function () {
		return '5';
	},
	getDisplayResolution: function () {
		var width, height;
		if (typeof window != _undefined && window.screen && window.screen.width) {
			width = window.screen.width;
		}
		if (typeof window != _undefined && window.screen && window.screen.width) {
			height = window.screen.height;
		}

		var scale = 1;
		if (typeof window != _undefined && window.devicePixelRatio) {
			scale = window.devicePixelRatio;
		}

		if (width > 0 && height > 0) {
			width *= scale;
			height *= scale;

			return width + 'x' + height;
		}

		return UNKNOWN_RESOLUTION;
	},
	getApplicationResolution: function () {
		var width, height;
		if (typeof window != _undefined && window.innerWidth) {
			width = window.innerWidth;
		}
		if (typeof window != _undefined && window.innerHeight) {
			height = window.innerHeight;
		}

		var scale = 1;
		if (typeof window != _undefined && window.devicePixelRatio) {
			scale = window.devicePixelRatio;
		}

		if (width > 0 && height > 0) {
			width *= scale;
			height *= scale;

			return width + 'x' + height;
		}

		return UNKNOWN_RESOLUTION;
	},
	getLanguage: function () {
		return (typeof window != _undefined) && generalUtils.exists(window.navigator) && generalUtils.safeGet(window.navigator.language, '') || UNKNOWN_VALUE;
	},
	getPackageName: function () {
		return ''; // Cannot retrieve
	},
	isConnectionAvailable: function () {
		if (typeof window == _undefined) return true;

		if (!generalUtils.exists(window.navigator) || !generalUtils.exists(window.navigator.onLine)) {
			return true;
		}

		return window.navigator.onLine;
	},
	isCompatible: function () {
		try{
			return typeof window !== _undefined
				&& generalUtils.exists(window.navigator)
				&& generalUtils.exists(window.localStorage)
				&& generalUtils.exists(_document)
				&& !!_document.createElement('canvas').getContext;
		} catch(ex) { // Workaround for localStorage when Chrome has cookies disabled.
			return false;
		}
	},

	isConnectionSecure: function () {
		if (!_document) return false;

		return _document.location.href.charAt(4) === 's';
	}
};

module.exports = Html5PlatformAPI;
},{"17":17,"20":20,"21":21,"27":27,"46":46,"48":48,"50":50}],35:[function(require,module,exports){
/* globals jsmaf */
/* eslint-env browser */

var generalUtils = require(21),
	CommonConstants = require(17),
	ajaxHttpGet = require(48).ajaxHttpGet,
	ajaxHttpPost = require(48).ajaxHttpPost,
	LocalStorage = require(46),
	LocalStorageIO = require(27),
	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var visitorId = null,
	visitorIdSuffix = null,
	crossPublisherId = null;

function initIds() {
	if (visitorId == null) {
		if (typeof jsmaf != _undefined && generalUtils.exists(jsmaf.hardwareId)) {
			var uniqueDeviceId = jsmaf.hardwareId;

			visitorId = uniqueDeviceId;
			visitorIdSuffix = '31';
			crossPublisherId = uniqueDeviceId;
		} else {
			visitorId = (+new Date()) + (~~(Math.random() * 1000));
			visitorIdSuffix = '72';
			crossPublisherId = null;
		}
	}
}

function isConnectionAvailable() {
	if (typeof jsmaf == _undefined || !generalUtils.exists(jsmaf.networkStatus)) {
		return true;
	}

	if (jsmaf.networkStatus == 'connected') return true;
	else return false;
}

var JSMAFPlatformAPI = {
	PLATFORM: 'jsmaf',
	httpGet: ajaxHttpGet,
	httpPost: ajaxHttpPost,
	Storage: LocalStorage,
	IO: LocalStorageIO,
	getCrossPublisherId: function () {
		initIds();
		return crossPublisherId;
	},
	getAppName: function () {
		return UNKNOWN_VALUE;
	},
	getAppVersion: function () {
		return UNKNOWN_VALUE;
	},
	getVisitorId: function () {
		initIds();
		return visitorId;
	},
	getVisitorIdSuffix: function () {
		initIds();
		return visitorIdSuffix;
	},
	getDeviceModel: function () {
		if (typeof jsmaf == _undefined || !generalUtils.exists(jsmaf.platform)) {
			return UNKNOWN_VALUE;
		}

		return jsmaf.platform;
	},
	getPlatformName: function () {
		return 'js';
	},
	getPlatformVersion: function () {
		return UNKNOWN_VALUE;
	},
	getRuntimeName: function () {
		return 'jsmaf';
	},
	getRuntimeVersion: function () {
		if (typeof jsmaf == _undefined || !generalUtils.exists(jsmaf.version)) {
			return UNKNOWN_VALUE;
		}

		return jsmaf.version;
	},
	getDisplayResolution: function () {
		if (typeof jsmaf == _undefined || !generalUtils.exists(jsmaf.screenWidth) || !generalUtils.exists(jsmaf.screenHeight)) {
			return UNKNOWN_RESOLUTION;
		}

		return jsmaf.screenWidth + 'x' + jsmaf.screenHeight;
	},
	getLanguage: function () {
		if (typeof jsmaf == _undefined || !generalUtils.exists(jsmaf.locale)) {
			return UNKNOWN_VALUE;
		}

		return jsmaf.locale;
	},
	getPackageName: function () {
		return null; // Cannot retrieve
	},
	isConnectionAvailable: isConnectionAvailable,
	isCompatible: function () {
		return typeof jsmaf != _undefined;
	},
	setTimeout: function (onTimer, interval) {
		return jsmaf.setTimeout(onTimer, interval);
	},
	setInterval: function (onTimer, interval) {
		return jsmaf.setInterval(onTimer, interval);
	},
	clearTimeout: function (timerId) {
		return jsmaf.clearTimeout(timerId);
	},
	clearInterval: function (timerId) {
		return jsmaf.clearInterval(timerId);
	},
	getDeviceArchitecture: function () {
		if (typeof jsmaf == _undefined || !generalUtils.exists(jsmaf.platform)) {
			var arch = UNKNOWN_VALUE;
		}
		if (jsmaf.platform == 'ps3') {
			arch = 'cell';
		} else if (jsmaf.platform == 'ps4') {
			arch = 'ps4';
		} else if (jsmaf.platform == 'vita') {
			arch = 'vita';
		}

		return arch;
	},
	getConnectionType: function () {
		if (!isConnectionAvailable()) {
			return UNKNOWN_VALUE;
		}

		if (typeof jsmaf == _undefined || !generalUtils.exists(jsmaf.connectionType)) {
			return UNKNOWN_VALUE;
		}

		if (jsmaf.connectionType == 'wired') {
			return 'eth';
		} else if (jsmaf.connectionType == 'wireless') {
			return 'wifi';
		} else if (jsmaf.connectionType == 'phone') {
			return 'wwan';
		} else {
			return UNKNOWN_VALUE;
		}
	},
	getDeviceJailBrokenFlag: function () {
		return UNKNOWN_VALUE;
	},

	isConnectionSecure: function () {
		if (typeof document == _undefined || document == null) return false;

		return document.location.href.charAt(4) === 's';
	}
};

module.exports = JSMAFPlatformAPI;
},{"17":17,"21":21,"27":27,"46":46,"48":48}],36:[function(require,module,exports){
/* eslint-env browser */

var imgHttpGet = require(50),
	voidHttpPost = require(52).voidHttpPost,
	LocalStorage = require(46),
	VoidIO = require(29),
	CommonConstants = require(17),
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var PlatformAPI = {
	PLATFORM: 'generic',
	httpGet: imgHttpGet,
	httpPost: voidHttpPost,
	Storage: LocalStorage,
	IO: VoidIO,
	onDataFetch: function (onEnd) {
		onEnd();
	},
	getCrossPublisherId: function () {
		return null;
	},
	getAppName: function () {
		return UNKNOWN_VALUE;
	},
	getAppVersion: function () {
		return UNKNOWN_VALUE;
	},
	getVisitorId: function () {
		return (+new Date()) + (~~(Math.random() * 1000));
	},
	getVisitorIdSuffix: function () {
		return '72';
	},
	getDeviceModel: function () {
		return UNKNOWN_VALUE;
	},
	getPlatformVersion: function () {
		return UNKNOWN_VALUE;
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		return UNKNOWN_VALUE;
	},
	getRuntimeVersion: function () {
		return UNKNOWN_VALUE;
	},
	getDisplayResolution: function () {
		return UNKNOWN_RESOLUTION;
	},
	getApplicationResolution: function () {
		return UNKNOWN_RESOLUTION;
	},
	getLanguage: function () {
		return UNKNOWN_VALUE;
	},
	getPackageName: function () {
		return null; // Cannot retrieve
	},
	isConnectionAvailable: function () {
		return true;
	},
	isCompatible: function () {
		return true;
	},
	autoSelect: function () {
	},
	autoDetect: function() {
	},
	setPlatformAPI: function () {
	},
	isCrossPublisherIdChanged: function () {
		return false;
	},
	setTimeout: function (onTimer, interval) {
		return setTimeout(onTimer, interval);
	},
	setInterval: function (onTimer, interval) {
		return setInterval(onTimer, interval);
	},
	clearTimeout: function (timeoutId) {
		return clearTimeout(timeoutId);
	},
	clearInterval: function (intervalId) {
		return clearInterval(intervalId);
	},
	getDeviceArchitecture: function () {
		return UNKNOWN_VALUE;
	},
	getConnectionType: function () {
		return UNKNOWN_VALUE;
	},
	getDeviceJailBrokenFlag: function () {
		return UNKNOWN_VALUE;
	},
	isConnectionSecure: function () {
		return false;
	},
	processMeasurementLabels: function () {
	}
};

module.exports = PlatformAPI;
},{"17":17,"29":29,"46":46,"50":50,"52":52}],37:[function(require,module,exports){
/* global ns_ */
/* eslint-env browser */
/*eslint no-multi-spaces: "error"*/

/** http://developer.lgappstv.com/TV_HELP/index.jsp?topic=%2Flge.tvsdk.developing.book%2Fhtml%2FAPI%2FAPI%2FProperties2.htm
 *
 * In order to initialize the comScore Application Tag from a LG Netcast app:
 *
 * 1. add the comScore javascript file to the project.
 *
 * 2. add an object referencing the netcast device:
 *
 * <object type="application/x-netcast-info"
 *         id="device"
 *         width="0"
 *         height="0">
 * </object>
 *
 * 3. add the necast device object to ns_ object after the document is ready and initialize the comScore library:
 *
 * <script type="text/javascript">
 *  $(document).ready(function() {
 *  var app = new LGE.initialize();
 *  ns_.netcastDevice = device;
 *  ns_.comScore.setAppContext(this);
 *  ns_.comScore.setCustomerC2('1000001');
 *  ns_.comScore.setPublisherSecret('9c455c81a801d3832a2cd281843dff30');
 *  ns_.comScore.start();
 *  ...
 */

var generalUtils = require(21),
	CommonConstants = require(17),
	imgHttpGet = require(50),
	ajaxHttpGet = require(48).ajaxHttpGet,
	voidHttpPost = require(52).voidHttpPost,
	LocalStorage = require(46),
	VoidIO = require(29),
	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var visitorId = null,
	visitorIdSuffix = null,
	crossPublisherId = null;

function isCompatible() {
	return typeof ns_ != _undefined &&
        typeof ns_.netcastDevice != _undefined &&
        typeof ns_.netcastDevice.version != _undefined &&
        typeof window != _undefined &&
        typeof window.navigator != _undefined;
}

function getUniqueId() {
	if ((typeof ns_ != _undefined) && generalUtils.exists(ns_.netcastDevice)) {
		if (generalUtils.exists(ns_.netcastDevice.net_macAddress) && generalUtils.isNotEmpty(ns_.netcastDevice.net_macAddress)) {
			return ns_.netcastDevice.net_macAddress;
		} else if (generalUtils.exists(ns_.netcastDevice.serialNumber) && generalUtils.isNotEmpty(ns_.netcastDevice.serialNumber)) {
			return ns_.netcastDevice.serialNumber;
		}
	}

	return null;
}

function initIds() {
	if (visitorId == null) {
		var uniqueDeviceId = getUniqueId();
		if (uniqueDeviceId != null) {
			visitorId = uniqueDeviceId;
			visitorIdSuffix = '31';
			crossPublisherId = uniqueDeviceId;
		} else {
			visitorId = (+new Date()) + (~~(Math.random() * 1000));
			visitorIdSuffix = '72';
			crossPublisherId = null;
		}
	}
}

var NetcastPlatformAPI = {
	PLATFORM: 'netcast',
	httpGet: function() {
		if (typeof Image != _undefined) {
			return imgHttpGet.apply(this, arguments);
		} else {
			return ajaxHttpGet.apply(this, arguments);
		}
	},
	httpPost: voidHttpPost,
	Storage: LocalStorage,
	IO: VoidIO,
	getCrossPublisherId: function () {
		initIds();
		return crossPublisherId;
	},
	getAppName: function () {
		return UNKNOWN_VALUE;
	},
	getAppVersion: function () {
		return UNKNOWN_VALUE;
	},
	getVisitorId: function () {
		initIds();
		return visitorId;
	},
	getVisitorIdSuffix: function () {
		return visitorIdSuffix;
	},
	getDeviceModel: function () {
		return (typeof ns_ != _undefined) && generalUtils.exists(ns_.netcastDevice) && generalUtils.exists(ns_.netcastDevice.modelName)
            && ns_.netcastDevice.modelName || UNKNOWN_VALUE;
	},
	getPlatformVersion: function () {
		return (typeof ns_ != _undefined) && generalUtils.exists(ns_.netcastDevice) && generalUtils.safeGet(ns_.netcastDevice.version, UNKNOWN_VALUE)
            || UNKNOWN_VALUE;
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		if ((typeof ns_ != _undefined) && generalUtils.exists(ns_.netcastDevice)) {
			return 'lg-ott' + generalUtils.safeGet((ns_.netcastDevice.platform), UNKNOWN_VALUE);
		}		else {
			return UNKNOWN_VALUE;
		}
	},
	getRuntimeVersion: function () {
		if ((typeof ns_ != _undefined) && generalUtils.exists(ns_.netcastDevice)) {
			if (generalUtils.exists(ns_.netcastDevice.version)) {
				return ns_.netcastDevice.version;
			} else if (generalUtils.exists(ns_.netcastDevice.hwVersion)) {
				return ns_.netcastDevice.hwVersion;
			} else if (generalUtils.exists(ns_.netcastDevice.swVersion)) {
				return ns_.netcastDevice.swVersion;
			}
		}

		return UNKNOWN_VALUE;
	},
	getDisplayResolution: function () {
		if ((typeof ns_ != _undefined) && generalUtils.exists(ns_.netcastDevice) && generalUtils.exists(ns_.netcastDevice.osdResolution)) {
			switch (ns_.netcastDevice.osdResolution) {
				case 0:
					return '640x480';
				case 1:
					return '720x576';
				case 2:
					return '1280x720';
				case 3:
					return '1920x1080';
				case 4:
					return '1366x768';
			}
		}
		return UNKNOWN_RESOLUTION;
	},
	getLanguage: function () {
		return (typeof ns_ != _undefined) && generalUtils.exists(ns_.netcastDevice)
            && generalUtils.safeGet(ns_.netcastDevice.tvLanguage2, generalUtils.safeGet(window.navigator.language)) || UNKNOWN_VALUE;
	},
	getPackageName: function () {
		return null; // Cannot retrieve
	},
	isConnectionAvailable: function () {
		if (typeof ns_.netcastDevice !== _undefined) {
			return !!ns_.netcastDevice.net_isConnected;
		}

		return true;
	},
	getConnectionType: function () {
		if (typeof ns_.netcastDevice !== _undefined) {
			if (ns_.netcastDevice.networkType === 0) {
				return 'eth';
			} else if (ns_.netcastDevice.networkType === 1) {
				return 'wifi';
			}
		}

		return UNKNOWN_VALUE;
	},
	isCompatible: isCompatible,

	isConnectionSecure: function () {
		if (typeof document == _undefined || document == null) return false;

		return document.location.href.charAt(4) === 's';
	}
};

module.exports = NetcastPlatformAPI;

},{"17":17,"21":21,"29":29,"46":46,"48":48,"50":50,"52":52}],38:[function(require,module,exports){
(function (global){
/* eslint-env node */

var generalUtils = require(21),
	CommonConstants = require(17),
	voidHttpPost = require(52).voidHttpPost,
	LocalStorage = require(46),
	VoidIO = require(29),
	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var visitorId = null,
	visitorIdSuffix = null,
	crossPublisherId = null;

function initIds() {
	if (visitorId == null) {
		visitorId = (+new Date()) + (~~(Math.random() * 1000));
		visitorIdSuffix = '72';
		crossPublisherId = null;
	}
}

function Request(callback) {
	var self = this,
		redirects = 0;

	self.send = function (url) {
		var http = require('http');

		http.get(url, function(res) {
			var requestCode = res.statusCode;

			if((requestCode == 302 || requestCode == 301) && redirects < 20) {
				if (res.headers && res.headers.location) {
					redirects++;

					self.send(res.headers.location);

					return;
				}
			}

			callback(requestCode);
		}).on('error', function() {
			callback();
		});
	};
}

var NodejsPlatformAPI = {
	PLATFORM: 'nodejs',
	httpGet: function (url, callback) {
		var req = new Request(callback);
		req.send(url);
	},
	httpPost: voidHttpPost,
	Storage: LocalStorage,
	IO: VoidIO,

	getCrossPublisherId: function () {
		initIds();
		return crossPublisherId;
	},
	getVisitorId: function () {
		initIds();
		return visitorId;
	},
	getVisitorIdSuffix: function () {
		return visitorIdSuffix;
	},
	getPlatformVersion: function () {
		var os = require('os');
		return [os.type(), os.platform(), os.release()].join(';');
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		return 'nodejs';
	},
	getRuntimeVersion: function () {
		if (typeof process === _undefined || generalUtils.isEmpty(process.version)) {
			return UNKNOWN_VALUE;
		} else {
			return process.version;
		}
	},
	getDisplayResolution: function () {
		return UNKNOWN_RESOLUTION;
	},
	isCompatible: function () {
		return typeof window === _undefined
            && typeof module !== _undefined
            && typeof exports !== _undefined
            && typeof global !== _undefined
            && typeof process !== _undefined
            && generalUtils.exists(process.version);
	},

	isConnectionSecure: function () {
		return false;
	}
};

module.exports = NodejsPlatformAPI;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"17":17,"21":21,"29":29,"46":46,"52":52,"undefined":undefined}],39:[function(require,module,exports){
var objectUtils = require(24),
	platformAPIs = require(32),
	PlatformAPI = require(36),

	SmartTVPlatformAPI = require(40),
	NetcastPlatformAPI = require(37),
	WebosPlatformAPI = require(43),
	CordovaPlatformAPI = require(33),
	TrilithiumPlatformAPI = require(41),
	ATVPlatformAPI = require(30),
	XboxPlatformAPI = require(44),
	ChromecastPlatformAPI = require(31),
	TvOSPlatformAPI = require(42),
	JSMAFPlatformAPI = require(35),
	NodejsPlatformAPI = require(38),
	Html5PlatformAPI = require(34);

var isPlatformConfigured = false;

/**
 * This function is called by the core.setAppContext function and
 * it will add the specific platform APIs on demand.
 */
PlatformAPI.autoDetect = function () {
	if(isPlatformConfigured) return;

    // The default platform is the Skeleton platform.
	isPlatformConfigured = true;

	if (SmartTVPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, SmartTVPlatformAPI);
	} else if (NetcastPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, NetcastPlatformAPI);
	} else if (WebosPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, WebosPlatformAPI);
	} else if (CordovaPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, CordovaPlatformAPI);
	} else if (TrilithiumPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, TrilithiumPlatformAPI);
	} else if (ATVPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, ATVPlatformAPI);
	} else if (XboxPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, XboxPlatformAPI);
	} else if (ChromecastPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, ChromecastPlatformAPI);
	} else if (TvOSPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, TvOSPlatformAPI);
	} else if (JSMAFPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, JSMAFPlatformAPI);
	} else if (NodejsPlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, NodejsPlatformAPI);
	} else if (Html5PlatformAPI.isCompatible()) {
		objectUtils.extend(PlatformAPI, Html5PlatformAPI);
	}
};

// Deprecated, to be removed eventually.
PlatformAPI.autoSelect = PlatformAPI.autoDetect;

PlatformAPI.setPlatformAPI = function (platformName) {
	isPlatformConfigured = true;

	switch (platformName) {
		case platformAPIs.SmartTV:
			objectUtils.extend(PlatformAPI, SmartTVPlatformAPI);
			break;
		case platformAPIs.Netcast:
			objectUtils.extend(PlatformAPI, NetcastPlatformAPI);
			break;
		case platformAPIs.Cordova:
			objectUtils.extend(PlatformAPI, CordovaPlatformAPI);
			break;
		case platformAPIs.Trilithium:
			objectUtils.extend(PlatformAPI, TrilithiumPlatformAPI);
			break;
		case platformAPIs.AppleTV:
			objectUtils.extend(PlatformAPI, ATVPlatformAPI);
			break;
		case platformAPIs.Chromecast:
			objectUtils.extend(PlatformAPI, ChromecastPlatformAPI);
			break;
		case platformAPIs.Xbox:
			objectUtils.extend(PlatformAPI, XboxPlatformAPI);
			break;
		case platformAPIs.webOS:
			objectUtils.extend(PlatformAPI, WebosPlatformAPI);
			break;
		case platformAPIs.tvOS:
			objectUtils.extend(PlatformAPI, TvOSPlatformAPI);
			break;
		case platformAPIs.JSMAF:
			objectUtils.extend(PlatformAPI, JSMAFPlatformAPI);
			break;
		case platformAPIs.nodejs:
			objectUtils.extend(PlatformAPI, NodejsPlatformAPI);
			break;
		case platformAPIs.html5:
			objectUtils.extend(PlatformAPI, Html5PlatformAPI);
			break;
		case platformAPIs.Skeleton:
			break;
		default:
			isPlatformConfigured = false;
	}
};

},{"24":24,"30":30,"31":31,"32":32,"33":33,"34":34,"35":35,"36":36,"37":37,"38":38,"40":40,"41":41,"42":42,"43":43,"44":44}],40:[function(require,module,exports){
/* global sf */
/* eslint-env browser */

/** http://www.samsungdforum.com/Guide
 *
 * In order to initialize the comScore Application Tag from a SmartTV app:
 *
 * 1. add the comScore javascript file to the project.
 *
 * 2. add the following code to the 'app/init.js' file:
 *
 * function onStart () {
 *	sf.core.loadJS('comscore.js', function(){
 *		ns_.comScore.setAppContext(this);
 *	    ns_.comScore.setCustomerC2('1000001');
 *	    ns_.comScore.setPublisherSecret('9c455c81a801d3832a2cd281843dff30');
 *	    // add here your custom initialization...
 *	    ns_.comScore.start();
 *   });
 *	sf.scene.show('MainPage');
 *	sf.scene.focus('MainPage');
 * }
 */

var generalUtils = require(21),
	CommonConstants = require(17),
	ajaxHttpGet = require(48).ajaxHttpGet,
	voidHttpPost = require(52).voidHttpPost,
	SmartTVStorage = require(47),
	SmartTVIO = require(28),

	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var visitorId = null,
	visitorIdSuffix = null,
	crossPublisherId = null;

function getUniqueId() {
	if (typeof sf !== 'object' ||
        typeof sf.core !== 'object' ||
        typeof sf.core.sefplugin !== 'function') {
		return null;
	}

	var plugin = sf.core.sefplugin('NNAVI');

	if (typeof plugin.Open !== 'function' || typeof plugin.Execute !== 'function') {
		return null;
	}

	plugin.Open('Network', '1.001', 'Network');
	var mac = plugin.Execute('GetMAC', '0');
	if ( !generalUtils.isEmpty(mac) ) {
		return mac;
	}

	mac = plugin.Execute('GetMAC', '1');
	if (!generalUtils.isEmpty(mac)) {
		return mac;
	}

	var deviceId = plugin.Execute('GetDeviceID');
	if ( !generalUtils.isEmpty(deviceId) ) {
		return deviceId;
	}

	return null;
}

function initIds() {
	if (visitorId == null) {
		var uniqueDeviceId = getUniqueId();
		if (uniqueDeviceId != null) {
			visitorId = uniqueDeviceId;
			visitorIdSuffix = '31';
			crossPublisherId = uniqueDeviceId;
		} else {
			visitorId = (+new Date()) + (~~(Math.random() * 1000));
			visitorIdSuffix = '72';
			crossPublisherId = null;
		}
	}
}

var SmartTVPlatformAPI = {
	PLATFORM: 'smarttv',
	httpGet: ajaxHttpGet,
	httpPost: voidHttpPost,
	Storage: SmartTVStorage,
	IO: SmartTVIO,
	getCrossPublisherId: function () {
		initIds();
		return crossPublisherId;
	},
	getAppName: function () {
		return UNKNOWN_VALUE;
	},
	getAppVersion: function () {
		return (typeof sf != _undefined) && generalUtils.exists(sf.env) && generalUtils.exists(sf.env.getAppVersion)
            && sf.env.getAppVersion() || UNKNOWN_VALUE;
	},
	getVisitorId: function () {
		initIds();
		return visitorId;
	},
	getVisitorIdSuffix: function () {
		return visitorIdSuffix;
	},
	getDeviceModel: function () {
		return (typeof sf != _undefined) && generalUtils.exists(sf.core) && generalUtils.exists(sf.core.getEnvValue)
            && sf.core.getEnvValue('modelid') || UNKNOWN_VALUE;
	},
	getPlatformVersion: function () {
		return '2.0.0';
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		if (typeof sf === _undefined || !generalUtils.exists(sf.env) || !generalUtils.exists(sf.env.getProductType)
            || !generalUtils.exists(sf.env.PRODUCTTYPE_TV) || !generalUtils.exists(sf.env.PRODUCTTYPE_MONITOR)
            || !generalUtils.exists(sf.env.PRODUCTTYPE_BD)) {
			return;
		}

		var productMap = [];
		productMap[sf.env.PRODUCTTYPE_TV] = 'samsung-smarttv-tv';
		productMap[sf.env.PRODUCTTYPE_MONITOR] = 'samsung-smarttv-monitor';
		productMap[sf.env.PRODUCTTYPE_BD] = 'samsung-smarttv-bd';
		return productMap[sf.env.getProductType()];
	},
	getRuntimeVersion: function () {
		return (typeof sf != _undefined) && generalUtils.exists(sf.env) && generalUtils.exists(sf.env.getFirmwareVer)
            && sf.env.getFirmwareVer().version;
	},
	getDisplayResolution: function () {
		if (typeof sf === _undefined || !generalUtils.exists(sf.env) || !generalUtils.exists(sf.env.getScreenSize)) {
			return UNKNOWN_RESOLUTION;
		}

		var size = sf.env.getScreenSize();
		return size.width + 'x' + size.height;
	},
	getLanguage: function () {
		if (typeof sf === _undefined || !generalUtils.exists(sf.env) || !generalUtils.exists(sf.env.getLanguageCode)) {
			return;
		}

		return sf.env.getLanguageCode();
	},
	getPackageName: function () {
		return null; // Cannot retrieve
	},
	isConnectionAvailable: function () {
		return true; // always online
	},
	isCompatible: function () {
		return typeof window != _undefined &&
            typeof window.navigator != _undefined &&
            typeof sf != _undefined &&
            typeof sf.env != _undefined;
	},
	getConnectionType: function () {
		if (typeof sf !== 'object' ||
            typeof sf.core !== 'object' ||
            typeof sf.core.sefplugin !== 'function') {
			return UNKNOWN_VALUE;
		}

		var plugin = sf.core.sefplugin('NETWORK');

		if (typeof plugin.Open !== 'function' || typeof plugin.Execute !== 'function') {
			return UNKNOWN_VALUE;
		}

		plugin.Open('Network', '1.001', 'Network');
		var cType = plugin.Execute('GetActiveType');

		if (cType === 0) {
			return 'wired';
		} else if (cType === 1) {
			return 'wireless';
		} else {
			return UNKNOWN_VALUE;
		}
	},

	isConnectionSecure: function () {
		if (typeof document == _undefined || document == null) return false;

		return document.location.href.charAt(4) === 's';
	}
};

module.exports = SmartTVPlatformAPI;

},{"17":17,"21":21,"28":28,"47":47,"48":48,"52":52}],41:[function(require,module,exports){
/* global engine */
/* eslint-env browser */

var generalUtils = require(21),
	CommonConstants = require(17),
	trilithiumHttpGet = require(51),
	voidHttpPost = require(52),
	LocalStorage = require(46),
	VoidIO = require(29),

	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var visitorId = null,
	visitorIdSuffix = null,
	crossPublisherId = null;

function isCompatible() {
	return typeof engine != _undefined &&
           typeof engine.stats != _undefined;
}

function getUniqueId() {
	if (generalUtils.isNotEmpty(engine.stats.device.id)) {
		return engine.stats.device.id;
	} else if (generalUtils.isNotEmpty(engine.stats.network.mac)) {
		return engine.stats.network.mac;
	}
	return null;
}

function initIds() {
	if (visitorId == null) {
		var uniqueDeviceId = getUniqueId();
		if (uniqueDeviceId != null) {
			visitorId = uniqueDeviceId;
			visitorIdSuffix = '31';
			crossPublisherId = uniqueDeviceId;
		} else {
			visitorId = (+new Date()) + (~~(Math.random() * 1000));
			visitorIdSuffix = '72';
			crossPublisherId = null;
		}
	}
}

var TrilithiumPlatformAPI = {
	PLATFORM: 'trilithium',
	httpGet: trilithiumHttpGet,
	httpPost: voidHttpPost,
	Storage: LocalStorage,
	IO: VoidIO,
	getCrossPublisherId: function() {
		initIds();
		return crossPublisherId;
	},
	getAppName: function() {
		return generalUtils.isNotEmpty(engine.stats.application.name) ? engine.stats.application.name : UNKNOWN_VALUE;
	},
	getAppVersion: function() {
		return generalUtils.isNotEmpty(engine.stats.application.version) ? engine.stats.application.version : UNKNOWN_VALUE;
	},
	getVisitorId: function() {
		initIds();
		return visitorId;
	},
	getVisitorIdSuffix: function() {
		return visitorIdSuffix;
	},
	getDeviceModel: function() {
		return generalUtils.safeGet(engine.stats.device.platform, UNKNOWN_VALUE);
	},
	getPlatformVersion: function() {
		return '';
	},
	getPlatformName: function() {
		return 'js';
	},
	getRuntimeName: function() {
		return 'trilithium';
	},
	getRuntimeVersion: function() {
		return generalUtils.safeGet(engine.stats.device.version, UNKNOWN_VALUE);
	},
	getDisplayResolution: function() {
		if (typeof screen != _undefined && typeof screen.height != _undefined && typeof screen.width != _undefined) {
			return screen.height + 'x' + screen.width;
		}
		return UNKNOWN_RESOLUTION;
	},
	getLanguage: function() {
		return UNKNOWN_VALUE;
	},
	getPackageName: function() {
		return null; // Cannot retrieve
	},
	isConnectionAvailable: function() {
		return true;
	},
	isCompatible: isCompatible,

	isConnectionSecure: function () {
		if (typeof document == _undefined || document == null) return false;

		return document.location.href.charAt(4) === 's';
	}
};

module.exports = TrilithiumPlatformAPI;
},{"17":17,"21":21,"29":29,"46":46,"51":51,"52":52}],42:[function(require,module,exports){
/* globals Device, Settings */

var generalUtils = require(21),
	CommonConstants = require(17),
	ajaxHttpGet = require(48).ajaxHttpGet,
	ajaxHttpPost = require(48).ajaxHttpPost,
	LocalStorage = require(46),
	LocalStorageIO = require(27),

	_undefined = 'undefined',
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var visitorId = null,
	visitorIdSuffix = null,
	crossPublisherId = null;

function isCompatible() {
    //window var does not exists.
	return typeof window === _undefined && typeof Device !== _undefined && Device.model === 'Apple TV';
}

function initIds() {
	if (visitorId == null) {
		if ( !generalUtils.isEmpty(Device.vendorIdentifier) ) {
			visitorId = Device.vendorIdentifier;
			visitorIdSuffix = '62';
		} else {
			visitorId = (+new Date()) + (~~(Math.random() * 1000));
			visitorIdSuffix = '72';
		}

		crossPublisherId = visitorId;
	}
}

var TvOSPlatformAPI = {
	PLATFORM: 'tvos',
	httpGet: ajaxHttpGet,
	httpPost: ajaxHttpPost,
	Storage: LocalStorage,
	IO: LocalStorageIO,
	getCrossPublisherId: function () {
		initIds();
		return crossPublisherId;
	},
	getAppName: function () {
		return Device.appIdentifier;
	},
	getAppVersion: function () {
		return Device.appVersion;
	},
	getVisitorId: function () {
		initIds();
		return visitorId;
	},
	getVisitorIdSuffix: function () {
		return visitorIdSuffix;
	},
	getDeviceModel: function () {
		return Device.productType;
	},
	getPlatformVersion: function () {
		return Device.systemVersion;
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		return 'tvos';
	},
	getRuntimeVersion: function () {
		return Device.systemVersion;
	},
	getDisplayResolution: function () {
		return UNKNOWN_RESOLUTION;
	},
	getLanguage: function () {
		return Settings.language;
	},
	getPackageName: function () {
		return Device.appIdentifier;
	},
	isConnectionAvailable: function () {
		return true;
	},
	isCompatible: isCompatible,
	isConnectionSecure: function () {
		return true;
	}
};

module.exports = TvOSPlatformAPI;
},{"17":17,"21":21,"27":27,"46":46,"48":48}],43:[function(require,module,exports){
/* globals webOS */
/* eslint-env browser */

/**
 * In order to initialize the comScore Application Tag from a LG WebOS app:
 *
 * 1. add the comScore javascript file to the project.
 *
 * 2. Add the standard script webOSjs-0.1.0.js of the webOS platform.
 *
 * 3. Initialize
 *
 * <script type="text/javascript">
 *  $(document).ready(function() {
 *      ns_.comScore.setAppContext(this);
 *      ns_.comScore.setCustomerC2('1000001');
 *      ns_.comScore.setPublisherSecret('9c455c81a801d3832a2cd281843dff30');
 *      ns_.comScore.start();
 *
 *      ...
 */

var generalUtils = require(21),
	CommonConstants = require(17),
	imgHttpGet = require(50),
	ajaxHttpPost = require(48).ajaxHttpPost,
	LocalStorage = require(46),
	LocalStorageIO = require(27),

	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var systemProperty,
	settings,
	connection;

function update_systemProperty(onEnd, onError) {
	webOS.service.request('luna://com.webos.service.tv.systemproperty', {
		method: 'getSystemInfo',
		parameters: {
			'keys': ['modelName', 'firmwareVersion', 'UHD', 'sdkVersion']
		},
		onSuccess: function (res) {
			if(res.returnValue) {
				systemProperty = res;
			}

			onEnd();
		},
		onFailure: function () {
			onEnd();
		}
	});
}

function update_settingsService(onEnd, onError) {
	webOS.service.request('luna://com.webos.settingsservice', {
		method: 'getSystemSettings',
		parameters: {
			'category': 'option'
		},
		onSuccess: function (res) {
			if(res.returnValue) {
				settings = res;
			}

			onEnd();
		},
		onFailure: function () {
			onEnd();
		}
	});
}

function update_connectionManager(onEnd, onError) {
	webOS.service.request('luna://com.webos.service.connectionmanager', {
		method: 'getStatus',
		onSuccess: function (res) {
			if(res.returnValue) {
				connection = res;
			}

			onEnd();
		},
		onFailure: function () {
			onEnd();
		}
	});
}

function isCompatible() {
	return typeof window !== _undefined
		&& !generalUtils.isEmpty(window.webOS)
		&& !generalUtils.isEmpty(webOS.service)
		&& !generalUtils.isEmpty(webOS.service.request);
}

var WebosPlatformAPI = {
	PLATFORM: 'webos',
	httpGet: imgHttpGet,
	httpPost: ajaxHttpPost,
	Storage: LocalStorage,
	IO: LocalStorageIO,
	onDataFetch: function (onEnd, onError) {
		var pendingItems = 3;

		var onItemEnd = function () {
			pendingItems--;

			if (pendingItems == 0) {
				onEnd();
			}
		};

		update_systemProperty(onItemEnd, onError);
		update_settingsService(onItemEnd, onError);
		update_connectionManager(onItemEnd, onError);
	},
	getCrossPublisherId: function () {
		if (typeof webOS !== _undefined && webOS.device && webOS.device.serialNumber && webOS.device.serialNumber != 'Unknown') {
			return webOS.device.serialNumber;
		}

		return null;
	},
	getAppName: function () {
		return UNKNOWN_VALUE;
	},
	getAppVersion: function () {
		return UNKNOWN_VALUE;
	},
	getVisitorId: function () {
		return (+new Date()) + (~~(Math.random() * 1000));
	},
	getVisitorIdSuffix: function () {
		return '72';
	},
	getDeviceModel: function () {
		if (systemProperty && systemProperty.modelName) {
			return systemProperty.modelName;
		}

		return UNKNOWN_VALUE;
	},
	getPlatformVersion: function () {
		if (systemProperty && systemProperty.sdkVersion) {
			return systemProperty.sdkVersion;
		}

		return UNKNOWN_VALUE;
	},
	getPlatformName: function () {
		return 'js';
	},
	getRuntimeName: function () {
		return 'webOS';
	},
	getRuntimeVersion: function () {
		if (typeof webOS !== _undefined && webOS.device) {
			return webOS.device.platformVersion;
		}

		return UNKNOWN_VALUE;
	},
	getDisplayResolution: function () {
		var width = 0;
		if (typeof webOS !== _undefined && webOS.device) {
			width = webOS.device.screenWidth;
		} else if (typeof window != _undefined && window.screen) {
			width = window.screen.availWidth;
		}

		var height = 0;
		if (typeof webOS !== _undefined && typeof webOS.device !== _undefined) {
			height = webOS.device.screenHeight;
		} else if (typeof window != _undefined && window.screen) {
			height = window.screen.availHeight;
		}

		if (width > 0 && height > 0) {
			return width + 'x' + height;
		} else {
			return UNKNOWN_RESOLUTION;
		}
	},
	getLanguage: function () {
		if (settings && settings.locales) {
			return settings.locales.UI || settings.locales.TV || UNKNOWN_VALUE;
		}

		return UNKNOWN_VALUE;
	},
	getPackageName: function () {
		return UNKNOWN_VALUE;
	},
	isConnectionAvailable: function () {
		if (connection && connection.isInternetConnectionAvailable) {
			return connection.isInternetConnectionAvailable;
		}

		return true;
	},
	isCompatible: isCompatible,
	getConnectionType: function () {
		if (connection && (connection.wired || connection.wifi)) {
			if (connection.wired.state === 'connected' && connection.wired.onInternet === 'yes') {
				return 'eth';
			} else if (connection.wifi.state === 'connected' && connection.wifi.onInternet === 'yes') {
				return 'wifi';
			}
		}

		return UNKNOWN_VALUE;
	},

	isConnectionSecure: function () {
		if (typeof document == _undefined || document == null) return false;

		return document.location.href.charAt(4) === 's';
	}
};

module.exports = WebosPlatformAPI;
},{"17":17,"21":21,"27":27,"46":46,"48":48,"50":50}],44:[function(require,module,exports){
/* globals Windows, WinJS */
/* eslint-env browser */

var CommonConstants = require(17),
	xboxHttpGet = require(53).xboxHttpGet,
	xboxHttpPost = require(53).xboxHttpPost,
	LocalStorage = require(46),
	LocalStorageIO = require(27),

	_undefined = 'undefined',
	UNKNOWN_VALUE = CommonConstants.UNKNOWN_VALUE,
	UNKNOWN_RESOLUTION = CommonConstants.UNKNOWN_RESOLUTION;

var visitorId = null,
	visitorIdSuffix = null,
	crossPublisherId = null,
	isVisitorIdInitialized = false,
	isCrossPublisherIdChanged = false,
	isCrossPublisherIdInitialized = false;

function initVisitorId() {
	if (typeof Windows != _undefined
          && Windows
          && Windows.Xbox
          && Windows.Xbox.System
          && Windows.Xbox.System.Console
          && Windows.Xbox.System.Console.applicationSpecificDeviceId) {
		visitorId = Windows.Xbox.System.Console.applicationSpecificDeviceId;
		visitorIdSuffix = '72';
	} else {
		visitorId = this.getDeviceModel() + (+new Date()) + (~~(Math.random() * 1000));
		visitorIdSuffix = '72';
	}

	isVisitorIdInitialized = true;
}

function initCrossPublisherId() {
	if(typeof Windows != _undefined
          && Windows
          && Windows.Xbox
          && Windows.Xbox.ApplicationModel
          && Windows.Xbox.ApplicationModel.Core
          && Windows.Xbox.ApplicationModel.Core.CoreApplicationContext) {
		Windows.Xbox.ApplicationModel.Core.CoreApplicationContext.addEventListener('currentuserchanged'
			, function() {
				isCrossPublisherIdChanged = true;
			});
	}

	setCrossPublisherId();
	isCrossPublisherIdInitialized = true;
}

function setCrossPublisherId() {
	var ret = null;

	if(typeof Windows != _undefined
          && Windows
          && Windows.Xbox
          && Windows.Xbox.ApplicationModel
          && Windows.Xbox.ApplicationModel.Core
          && Windows.Xbox.ApplicationModel.Core.CoreApplicationContext
          && Windows.Xbox.ApplicationModel.Core.CoreApplicationContext.currentUser) {
		var currentUser = Windows.Xbox.ApplicationModel.Core.CoreApplicationContext.currentUser;

		if (currentUser != null && !currentUser.isGuest && currentUser.isSignedIn) {
			ret = Windows.Xbox.ApplicationModel.Core.CoreApplicationContext.currentUser.xboxUserId;
		}
	}

	crossPublisherId = ret;
}

var XboxPlatformAPI = {
	PLATFORM: 'xbox',
	httpGet: xboxHttpGet,
	httpPost: xboxHttpPost,
	Storage: LocalStorage,
	IO: LocalStorageIO,
	getCrossPublisherId: function () {
		if (!isCrossPublisherIdInitialized) {
			initCrossPublisherId();
		}

		if(isCrossPublisherIdChanged) {
			setCrossPublisherId();
		}

		return crossPublisherId;
	},
	getAppName: function () {
		var ret = UNKNOWN_VALUE;

		if(typeof Windows != _undefined
              && Windows
              && Windows.ApplicationModel
              && Windows.ApplicationModel.Package
              && Windows.ApplicationModel.Package.current
              && Windows.ApplicationModel.Package.current.id
              && Windows.ApplicationModel.Package.current.id.name) {
			ret = Windows.ApplicationModel.Package.current.id.name;
		}

		return ret;
	},
	getAppVersion: function () {
		var ret = UNKNOWN_VALUE;

		if(typeof Windows != _undefined
              && Windows
              && Windows.ApplicationModel
              && Windows.ApplicationModel.Package
              && Windows.ApplicationModel.Package.current
              && Windows.ApplicationModel.Package.current.id
              && Windows.ApplicationModel.Package.current.id.version) {
			var packageVersion = Windows.ApplicationModel.Package.current.id.version;
			ret = packageVersion.major + '.' + packageVersion.minor + '.' + packageVersion.build + '.' + packageVersion.revision;
		}

		return ret;
	},
	getVisitorId: function () {
		if(!isVisitorIdInitialized) {
			initVisitorId();
		}

		return visitorId;
	},
	getVisitorIdSuffix: function () {
		return visitorIdSuffix;
	},
	getDeviceModel: function () {
		return 'xbox one';
	},
	getPlatformVersion: function () {
		var ret = UNKNOWN_VALUE;

		if(typeof navigator != _undefined
                && navigator
                && navigator.userAgent) {
			navigator.userAgent.split(';')
				.filter(function (part) {
					return part.indexOf('Windows NT') != -1;
				})
				.forEach(function (part) {
					ret = part.substr(part.indexOf('Windows NT') + 11, part.length - 1);
				});
		}

		return ret;
	},
	getPlatformName: function () {
		return 'xbox';
	},
	getRuntimeName: function () {
		return 'winjs';
	},
	getRuntimeVersion: function () {
		var ret = UNKNOWN_VALUE;

		if(typeof Windows != _undefined
                && Windows
                && Windows.ApplicationModel
                && Windows.ApplicationModel.Package
                && Windows.ApplicationModel.Package.current
                && Windows.ApplicationModel.Package.current.dependencies) {
			Windows.ApplicationModel.Package.current.dependencies
                    .filter(function (dep) {
	return dep
                        && dep.id
                        && dep.id.name
						&& dep.id.name.indexOf('WinJS') != -1
						&& dep.id.version;
})
				.forEach(function (dep) {
					ret = dep.id.version.major + '.' + dep.id.version.minor + '.' + dep.id.version.build + '.' + dep.id.version.revision;
				});
		}

		return ret;
	},
	getDisplayResolution: function () {
		var ret = UNKNOWN_RESOLUTION;

		if(typeof Windows != _undefined
              && Windows
              && Windows.Xbox
              && Windows.Xbox.Graphics
              && Windows.Xbox.Graphics.Display
              && Windows.Xbox.Graphics.Display.DisplayConfiguration
              && Windows.Xbox.Graphics.Display.DisplayConfiguration.getForCurrentView
              && Windows.Xbox.Graphics.Display.DisplayConfiguration.getForCurrentView()
              && Windows.Xbox.Graphics.Display.DisplayConfiguration.getForCurrentView().currentDisplayMode
              && Windows.Xbox.Graphics.Display.DisplayConfiguration.getForCurrentView().currentDisplayMode.rawWidth
              && Windows.Xbox.Graphics.Display.DisplayConfiguration.getForCurrentView().currentDisplayMode.rawHeight) {
			var displayMode = Windows.Xbox.Graphics.Display.DisplayConfiguration.getForCurrentView().currentDisplayMode;

			ret = displayMode.rawWidth + 'x' + displayMode.rawHeight;
		}

		return ret;
	},
	getApplicationResolution: function () {
		var ret = UNKNOWN_RESOLUTION;

		if(typeof window != _undefined
              && window.innerWidth
              && window.innerHeight) {
			ret = window.innerWidth + 'x' + window.innerHeight;
		}

		return ret;
	},
	getLanguage: function () {
		var ret = UNKNOWN_VALUE;

		if(typeof Windows != _undefined
              && Windows
              && Windows.System
              && Windows.System.UserProfile
              && Windows.System.UserProfile.GlobalizationPreferences
              && Windows.System.UserProfile.GlobalizationPreferences.languages) {
			ret = Windows.System.UserProfile.GlobalizationPreferences.languages.getAt(0);
		}

		return ret;
	},
	getPackageName: function () {
		var ret = UNKNOWN_VALUE;

		if(typeof Windows != _undefined
              && Windows
              && Windows.ApplicationModel
              && Windows.ApplicationModel.Package
              && Windows.ApplicationModel.Package.current
              && Windows.ApplicationModel.Package.current.id
              && Windows.ApplicationModel.Package.current.id.name) {
			ret = Windows.ApplicationModel.Package.current.id.name;
		}

		return ret;
	},
	isConnectionAvailable: function () {
		if(typeof Windows != _undefined
              && Windows
              && Windows.Networking
              && Windows.Networking.Connectivity
              && Windows.Networking.Connectivity.NetworkInformation
              && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile
              && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile()
              && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile().getNetworkConnectivityLevel
              && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile().getNetworkConnectivityLevel()) {
			return Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile().getNetworkConnectivityLevel() == 4;
		}

		return true;
	},
	isCompatible: function () {
		return (typeof WinJS != _undefined
              && WinJS
              && typeof Windows != _undefined
              && Windows
              && Windows.Xbox);
	},
	setPlatformAPI: function () {
	},
	isCrossPublisherIdChanged: function () {
		if (!isCrossPublisherIdInitialized) {
			initCrossPublisherId();
		}

		return isCrossPublisherIdChanged;
	},
	getDeviceArchitecture: function () {
		var ret = 'unknown';

		if(typeof Windows != _undefined
              && Windows
              && Windows.ApplicationModel
              && Windows.ApplicationModel.Package
              && Windows.ApplicationModel.Package.current
              && Windows.ApplicationModel.Package.current.id
              && Windows.ApplicationModel.Package.current.id.architecture) {
			var architecture = Windows.ApplicationModel.Package.current.id.architecture;

			switch (architecture) {
				case 5:
					ret = 'arm';
					break;
				case 11:
					ret = 'neutral';
					break;
				case 9:
					ret = 'x64';
					break;
				case 0:
					ret = 'x86';
					break;
				default:
			}
		}

		return ret;
	},
	getConnectionType: function () {
		var ret = UNKNOWN_VALUE;

		if(typeof Windows != _undefined
              && Windows
              && Windows.Networking
              && Windows.Networking.Connectivity
              && Windows.Networking.Connectivity.NetworkInformation
              && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile
              && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile()
              && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile().networkAdapter
              && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile().networkAdapter.ianaInterfaceType) {
			var connectionType = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile().networkAdapter.ianaInterfaceType;

			switch (connectionType) {
				case 6:
					ret = 'eth';
					break;
				case 71:
					ret = 'wifi';
					break;
				default:
			}
		}

		return ret;
	},
	getDeviceJailBrokenFlag: function() {
		return UNKNOWN_VALUE;
	},

	isConnectionSecure: function () {
		if (typeof document == _undefined || document == null) return false;

		return document.location.href.charAt(4) === 's';
	}
};

module.exports = XboxPlatformAPI;
},{"17":17,"27":27,"46":46,"53":53}],45:[function(require,module,exports){
/* global atv */

var objectUtils = require(24),
	_undefined = 'undefined';

var PREFIX = 'cs_';

var ATVLocalStorage = function () {
	var data = typeof atv != _undefined && typeof(atv.localStorage) != _undefined && atv.localStorage || null;

	objectUtils.extend(this, {
		get: function (name) {
			return data && name && data.getItem(PREFIX + name) || null;
		},

		set: function (name, value) {
			if (data && name) {
				data[PREFIX + name] = value;
			}
		},

		has: function (name) {
			return data && name && data.getItem(PREFIX + name) != null || false;
		},

		remove: function (name) {
			if (data && name) {
				data.removeItem(PREFIX + name);
			}
		},

		clear: function () {
            //TODO: still need to figure a way to list all the cs_ entries in localstorage on ATV platform
            //for (var key in data) {
            //    if (data.getItem(key) != null) {
            //        data.removeItem(key);
            //    }
            //}
		}
	});
};

module.exports = ATVLocalStorage;

},{"24":24}],46:[function(require,module,exports){
/* global localStorage */

var objectUtils = require(24);

var PREFIX = 'cs_';

function LocalStorage() {
	var self = this,
		storage;
		
	function init() {
		try {
			storage = typeof localStorage !== 'undefined' ? localStorage : null;
		} catch(ex) {
			storage = null;
		}
	}

	init();

	objectUtils.extend(self, {
		get: function(name) {
			try {
				if (storage && typeof storage.getItem == 'function') {
					return storage.getItem(PREFIX + name);
				} else if (storage) {
					return storage[PREFIX + name];
				} else {
					return storage;
				}
			} catch (ex) {
				// do nothing
			}
		},

		set: function(name, value) {
			try {
				if (storage && typeof storage.setItem == 'function') {
					storage.setItem(PREFIX + name, value);
				} else if(storage) {
					storage[PREFIX + name] = value;
				}
			} catch(ex) {
				// do nothing
			}
		},

		has: function(name) {
			// TvOS returns undefined instead of null, against the specification. Because of that it is compared against falsy instead of null.
			try {
				if (storage && typeof storage.getItem == 'function') {
					return storage.getItem(PREFIX + name);
				} else if (storage) {
					return storage[PREFIX + name];
				} else {
					return storage;
				}
			} catch(ex) {
				// do nothing
			}
		},

		remove: function(name) {
			try {
				if (storage && typeof storage.removeItem == 'function') {
					storage.removeItem(PREFIX + name);
				} else if(storage) {
					delete storage[PREFIX + name];
				}
			} catch(ex) {
				// do nothing
			}
		},

		clear: function() {
			try {
				for (var i = 0; storage && i < storage.length; ++i) {
					var key = storage.key(i);

					if (key.substr(0, PREFIX.length) === PREFIX) {
						if (typeof storage.removeItem == 'function') {
							storage.removeItem(key);
						} else {
							delete storage[key];
						}
					}
				}
			} catch(ex) {
				// do nothing
			}
		}
	});
}

module.exports = LocalStorage;
},{"24":24}],47:[function(require,module,exports){
/* globals $, sf */

var objectUtils = require(24);

var PREFIX = 'cs_',
	get, set;

if (typeof(sf) !== 'undefined') {
	// AppsFramework 2.0.0
	set = get = function (key, value) {
		sf.core.localData(key, value);
	};
} else {
	// AppsFramework 1.0.0
	set = function (key, value) {
		$.sf.setData(key, value === undefined ? null : value);
	};
	get = function (key) {
		return $.sf.getData(key);
	};
}
var SmartTVStorage = function() {
	objectUtils.extend(this, {
		get: function(name) {
			return get(PREFIX + name);
		},

		set: function(name, value) {
			set(PREFIX + name, value);
		},

		has: function(name) {
			return get(PREFIX + name) !== undefined;
		},

		remove: function(name) {
			set(PREFIX + name, null);
		}
	});
};

module.exports = SmartTVStorage;
},{"24":24}],48:[function(require,module,exports){
/* globals setTimeout, XMLHttpRequest */

var _undefined = 'undefined';

var ajaxHttpGet = function (url, callback) {
	if (typeof XMLHttpRequest == _undefined) {
		if (typeof setTimeout == 'function') {
			callback && setTimeout(callback, 0);
		} else {
			callback && callback();
		}

		return;
	}

	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onreadystatechange = function () {
		if (request.readyState === 4) {
			callback && callback(request.status);
			request = null;
		}
	};
	request.send();
};

var ajaxHttpPost = function (url, data, callback) {
	if (typeof XMLHttpRequest == _undefined) {
		if (typeof setTimeout == 'function') {
			callback && setTimeout(callback, 0);
		} else {
			callback && callback();
		}

		return;
	}

	var request = new XMLHttpRequest();
	request.open('POST', url, true);
	request.onreadystatechange = function () {
		if (request.readyState === 4) {
			callback && callback(request.status);
			request = null;
		}
	};
	request.send(data);
};

exports.ajaxHttpGet = ajaxHttpGet;
exports.ajaxHttpPost = ajaxHttpPost;
},{}],49:[function(require,module,exports){
/* globals atv, XMLHttpRequest */

var _undefined = 'undefined';

var atvHttpGet = function (url, callback) {
	if (typeof atv == _undefined || typeof XMLHttpRequest == _undefined) {
		if (typeof atv != _undefined && typeof atv.setTimeout == 'function') {
			callback && atv.setTimeout(callback, 0);
		} else {
			callback && callback();
		}

		return;
	}

	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onreadystatechange = function () {
		if (request.readyState == 4) {
			callback && callback(request.status);
			request = null;
		}
	};
	request.send();
};

var atvHttpPost = function (url, data, callback) {
	if (typeof atv == _undefined || typeof XMLHttpRequest == _undefined) {
		if (typeof atv != _undefined && typeof atv.setTimeout == 'function') {
			callback && atv.setTimeout(callback, 0);
		} else {
			callback && callback();
		}

		return;
	}

	var request = new XMLHttpRequest();
	request.open('POST', url, true);
	request.onreadystatechange = function () {
		if (request.readyState === 4) {
			callback && callback(request.status);
			request = null;
		}
	};
	request.send(data);
};

exports.atvHttpGet = atvHttpGet;
exports.atvHttpPost = atvHttpPost;
},{}],50:[function(require,module,exports){
/* eslint-env browser */

var _undefined = 'undefined';

var imgHttpGet = function (url, callback) {
	if (typeof Image == _undefined) {
		if (typeof setTimeout == 'function') {
			callback && setTimeout(callback, 0);
		} else {
			callback && callback();
		}

		return;
	}

	var img = new Image();

	img.onload = function () {
		callback && callback(200);
		img = null;
	};

	img.onerror = function () {
		callback && callback();
		img = null;
	};

	img.src = url;
};

module.exports = imgHttpGet;
},{}],51:[function(require,module,exports){
/* globals engine, setTimeout */

var trilithiumHttpGet = function (url, callback) {
	if (typeof engine == 'undefined') {
		if (typeof setTimeout == 'function') {
			callback && setTimeout(callback, 0);
		} else {
			callback && callback();
		}

		return;
	}

	var client = engine.createHttpClient();
	var req = client.createRequest('GET', url, null);
	req.start();
	callback && setTimeout(callback, 0);
};

module.exports = trilithiumHttpGet;

},{}],52:[function(require,module,exports){
/* globals setTimeout */

var voidHttpGet = function (url, callback) {
	if (typeof setTimeout == 'function') {
		callback && setTimeout(function () {
			callback(200);
		}, 0);
	} else {
		callback && callback(200);
	}
};

var voidHttpPost = function (url, data, callback) {
	if (typeof setTimeout == 'function') {
		callback && setTimeout(function () {
			callback(200);
		}, 0);
	} else {
		callback && callback(200);
	}
};

module.exports.voidHttpGet = voidHttpGet;
module.exports.voidHttpPost = voidHttpPost;
},{}],53:[function(require,module,exports){
/* globals WinJS, setTimeout */

var _undefined = 'undefined';

var xboxHttpGet = function (url, callback) {
	if (typeof WinJS == _undefined || typeof WinJS.xhr == _undefined) {
		if (typeof setTimeout == 'function') {
			callback && setTimeout(callback, 0);
		} else {
			callback && callback();
		}

		return;
	}

	WinJS
		.xhr({url: url})
		.then(function (result) {
			callback && callback(result.status);
		}, function () {
			callback && callback();
		});
};

var xboxHttpPost = function (url, data, callback) {
	if (typeof WinJS == _undefined || typeof WinJS.xhr == _undefined) {
		if (typeof setTimeout == 'function') {
			callback && setTimeout(callback, 0);
		} else {
			callback && callback();
		}

		return;
	}

	WinJS
		.xhr({
			type: 'post',
			url: url,
			data: data,
			headers: {'Content-type': 'application/xml'}
		})
		.then(function (result) {
			callback && callback(result.status);
		}, function () {
			callback && callback();
		});
};

exports.xboxHttpGet = xboxHttpGet;
exports.xboxHttpPost = xboxHttpPost;

},{}],54:[function(require,module,exports){
var objectUtils = require(24),
	CommonConstants = require(17),
	generalUtils = require(21),
	staUtils = require(68),
	cloneObjectUtils = require(23),

	INTERVAL_MERGE_TOLERANCE = 500,
	DEFAULT_ASSET_PLAYBACK_RATE = 100; // The playback rate value is expected to be an Integer value representing the rate as percentage

function Asset() {
	var self = this,
		hash,
		assetStarted,
		playbackStarted,

		internalLabels,
		userSpecifiedLabels,

		autoCalculatePositions,

		isLiveStream,

    /* Playback registers */
		playbackTime,
		playbackTimestamp,
		previousPlaybackTime,
		previousEventIndependentPlaybackTime,
		playbackTimeOffset,
		playbackTimeOffsetTimestamp,
		elapsedTime,
		elapsedTimestamp,
		previousElapsedTime,
		lowestPartNumberPlayed,
		playbackWindowLength,
		playbackWindowOffset,
		previousPlaybackWindowOffset,
		accumulatedPlayback,
		previousAccumulatedPlayback,

    /* Playback Intervals */
		playbackIntervalMergeTolerance = INTERVAL_MERGE_TOLERANCE,
		segmentPlaybackIntervals,
		assetPlaybackIntervals,
		playbackStartPosition,

		previousUniquePlaybackInterval,
		previousEventIndependentUniquePlaybackInterval,
		previousLongestPlaybackInterval,

		assetPreviousUniquePlaybackInterval,
		assetPreviousEventIndependentUniquePlaybackInterval,
		assetPreviousLongestPlaybackInterval,
    /* Buffering registers */
		bufferingTime,
		bufferingTimestamp,
		previousBufferingTime,
		buffers,
		previousBufferCounter,
    /* Seeking registers */
		seeking,
		seekingTimestamp,
		seekingTime,
		previousSeekingTime,
		seekStartPosition,
		collectingSeekingTime,
		seekingAmount,
		previousSeekingAmount,
		seekingTimeBeforeEnd,
    /* Playback counters */
		pauses,
		previousPausesCounter,
		seeks,
		previousSeeksCounter,
		segmentPlaybackCounter,
		assetPlaybackCounter,
		segmentPlaySequenceCounter,
		playSequenceCounter,
    /* Other registers */
		assetLoadCounter,
    /* Other asset registers */
		playbackSessionLooping,
		playbackRate;

	function init() {
		internalLabels = {};
		internalLabels['ns_st_cl'] = '0';
		internalLabels['ns_st_pn'] = '1';
		internalLabels['ns_st_tp'] = '0';
		internalLabels['ns_st_cn'] = '1';
		internalLabels['ns_st_skd'] = '0';
		internalLabels['ns_st_ci'] = '0';

        // Initialize metadata labels with a default value
		internalLabels['c3'] = '*null';
		internalLabels['c4'] = '*null';
		internalLabels['c6'] = '*null';
		internalLabels['ns_st_st'] = '*null';
		internalLabels['ns_st_pu'] = '*null';
		internalLabels['ns_st_pr'] = '*null';
		internalLabels['ns_st_ep'] = '*null';
		internalLabels['ns_st_sn'] = '*null';
		internalLabels['ns_st_en'] = '*null';
		internalLabels['ns_st_ct'] = '*null';

		userSpecifiedLabels = {};

		playbackStarted = false;
		assetStarted = false;
		hash = CommonConstants.UNKNOWN_VALUE;

		autoCalculatePositions = true;

		isLiveStream = false;

        /* Playback registers */
		playbackTime = 0;
		playbackTimestamp = NaN;
		playbackTimeOffset = 0;
		previousPlaybackTime = 0;
		elapsedTime = 0;
		elapsedTimestamp = NaN;
		lowestPartNumberPlayed = 0;
		previousElapsedTime = 0;
		previousEventIndependentPlaybackTime = 0;
		playbackWindowLength = 0;
		playbackWindowOffset = 0;
		previousPlaybackWindowOffset = 0;
		accumulatedPlayback = 0;
		previousAccumulatedPlayback = 0;

        /* Playback Intervals */
		playbackStartPosition = NaN;
		segmentPlaybackIntervals = [];
		assetPlaybackIntervals = [];

		previousUniquePlaybackInterval = 0;
		previousEventIndependentUniquePlaybackInterval = 0;
		previousLongestPlaybackInterval = 0;

		assetPreviousUniquePlaybackInterval = 0;
		assetPreviousEventIndependentUniquePlaybackInterval = 0;
		assetPreviousLongestPlaybackInterval = 0;

        /* Buffering registers */
		bufferingTime = 0;
		bufferingTimestamp = NaN;
		previousBufferingTime = 0;
		buffers = 0;
		previousBufferCounter = 0;

        /* Seeking registers */
		seeking = false;
		seekingTimestamp = NaN;
		collectingSeekingTime = false;
		seekStartPosition = 0;
		seekingTimeBeforeEnd = 0;
		seekingTime = 0;
		previousSeekingTime = 0;
		seekingAmount = 0;
		previousSeekingAmount = 0;

        /* Playback counters */
		pauses = 0;
		previousPausesCounter = 0;

		seeks = 0;
		previousSeeksCounter = 0;

		segmentPlaybackCounter = 0;
		assetPlaybackCounter = 0;

		segmentPlaySequenceCounter = 0;
		playSequenceCounter = 0;

        /* Other registers */
		assetLoadCounter = 0;

        /* Asset registers */
		playbackSessionLooping = false;
		playbackRate = DEFAULT_ASSET_PLAYBACK_RATE;
	}

	objectUtils.extend(self, {
		getHash: function () {
			return hash;
		},

		setHash: function (value) {
			hash = value;
		},

		setPlaybackIntervalMergeTolerance: function (value) {
			playbackIntervalMergeTolerance = value;
		},

		getPlaybackIntervalMergeTolerance: function () {
			return playbackIntervalMergeTolerance;
		},

		setInternalLabel: function (labelName, value) {
			internalLabels[labelName] = value;
		},

		getInternalLabel: function (labelName) {
			return internalLabels[labelName];
		},

		hasInternalLabel: function (labelName) {
			return internalLabels[labelName] != null;
		},

		setLabels: function (labels) {
			if (!labels) return;

			objectUtils.extend(userSpecifiedLabels, labels);
		},

		getLabels: function () {
			return userSpecifiedLabels;
		},

		setLabel: function (labelName, value) {
			userSpecifiedLabels[labelName] = value;
		},

		getLabel: function (labelName) {
			return userSpecifiedLabels[labelName];
		},

		hasLabel: function (labelName) {
			return labelName in userSpecifiedLabels;
		},

		getClipNumber: function () {
			return parseInt(self.getInternalLabel('ns_st_cn'));
		},

		setClipNumber: function (value) {
			self.setInternalLabel('ns_st_cn', value + '');
		},

		getPartNumber: function () {
			if (self.hasLabel('ns_st_pn')) {
				return parseInt( self.getLabel('ns_st_pn') );
			} else {
				return parseInt( self.getInternalLabel('ns_st_pn') );
			}
		},

		createLabels: function (initialLabels, eventTimestamp, useCurrentInterval) {
			var labels = initialLabels;

			var currentPosition = parseInt(labels['ns_st_po']);

			var currentAccumulatedPlayback = !generalUtils.isEmpty(labels['ns_st_ap']) ? parseInt(labels['ns_st_ap']) : accumulatedPlayback;
			if (useCurrentInterval && playbackRate < 0 && (playbackTimeOffset - currentPosition > 0)) {
				labels['ns_st_ap'] = currentAccumulatedPlayback + playbackTimeOffset - currentPosition;
				labels['ns_st_dap'] = currentAccumulatedPlayback + playbackTimeOffset - currentPosition - previousAccumulatedPlayback;
			} else if(useCurrentInterval && playbackRate > 0 && (currentPosition - playbackTimeOffset > 0)) {
				labels['ns_st_ap'] = currentAccumulatedPlayback + currentPosition - playbackTimeOffset;
				labels['ns_st_dap'] = currentAccumulatedPlayback + currentPosition - playbackTimeOffset - previousAccumulatedPlayback;
			} else {
				labels['ns_st_ap'] = currentAccumulatedPlayback;
				labels['ns_st_dap'] = currentAccumulatedPlayback - previousAccumulatedPlayback;
			}

			var playbackTime = !generalUtils.isEmpty(labels['ns_st_pt']) ? parseInt(labels['ns_st_pt']) : self.getPlaybackTime();
			labels['ns_st_pt'] = playbackTime + (!isNaN(playbackTimestamp) ? eventTimestamp - playbackTimestamp : 0) + '';
			labels['ns_st_dpt'] = playbackTime + (!isNaN(playbackTimestamp) ? eventTimestamp - playbackTimestamp : 0) - previousPlaybackTime + '';
			labels['ns_st_ipt'] = playbackTime + (!isNaN(playbackTimestamp) ? eventTimestamp - playbackTimestamp : 0) - previousEventIndependentPlaybackTime + '';

			var elapsedTime = !generalUtils.isEmpty(labels['ns_st_et']) ? parseInt(labels['ns_st_et']) : self.getElapsedTime();
			labels['ns_st_et'] = elapsedTime + (!isNaN(elapsedTimestamp) ? eventTimestamp - elapsedTimestamp : 0) + '';
			labels['ns_st_det'] = elapsedTime + (!isNaN(elapsedTimestamp) ? eventTimestamp - elapsedTimestamp : 0) - previousElapsedTime + '';

			var bufferingTime = !generalUtils.isEmpty(labels['ns_st_bt']) ? parseInt(labels['ns_st_bt']) : self.getBufferingTime();
			labels['ns_st_bt'] = bufferingTime + '';
			labels['ns_st_dbt'] = bufferingTime + (!isNaN(bufferingTimestamp) ? eventTimestamp - bufferingTimestamp : 0) - previousBufferingTime + '';

			var updatedSegmentPlaybackIntervals = segmentPlaybackIntervals;
			var updatedAssetPlaybackIntervals = assetPlaybackIntervals;

            // We add a new playback interval only for measurements generated while playing
            // but where these measurements were not accumulating into time.
            // That only happens with the HB.
			if(useCurrentInterval) {
				updatedSegmentPlaybackIntervals = staUtils.addNewPlaybackInterval(
                    cloneObjectUtils(segmentPlaybackIntervals),
                    playbackRate < 0 ? currentPosition : playbackStartPosition,
                    playbackRate < 0 ? playbackStartPosition : currentPosition,
                    playbackIntervalMergeTolerance);

				updatedAssetPlaybackIntervals = staUtils.addNewPlaybackInterval(
                    cloneObjectUtils(assetPlaybackIntervals),
                    playbackRate < 0 ? currentPosition : playbackStartPosition,
                    playbackRate < 0 ? playbackStartPosition : currentPosition,
                    playbackIntervalMergeTolerance);
			}

			var uniquePlaybackInterval = 0, longestPlaybackInterval = 0;
			for (var i = 0, interval; i < updatedSegmentPlaybackIntervals.length; i++) {
				interval = Math.abs(updatedSegmentPlaybackIntervals[i].end - updatedSegmentPlaybackIntervals[i].start);

				uniquePlaybackInterval += interval;

				if (interval > longestPlaybackInterval) {
					longestPlaybackInterval = interval;
				}
			}

			var assetUniquePlaybackInterval = 0, assetLongestPlaybackInterval = 0;
			for (i = 0, interval; i < updatedAssetPlaybackIntervals.length; i++) {
				interval = Math.abs(updatedAssetPlaybackIntervals[i].end - updatedAssetPlaybackIntervals[i].start);

				assetUniquePlaybackInterval += interval;

				if (interval > assetLongestPlaybackInterval) {
					assetLongestPlaybackInterval = interval;
				}
			}

			labels['ns_st_upc'] = uniquePlaybackInterval + '';
			labels['ns_st_dupc'] = uniquePlaybackInterval - previousUniquePlaybackInterval + '';
			labels['ns_st_iupc'] = uniquePlaybackInterval - previousEventIndependentUniquePlaybackInterval + '';
			if (uniquePlaybackInterval > previousEventIndependentUniquePlaybackInterval) {
				labels['ns_st_iupc'] = uniquePlaybackInterval - previousEventIndependentUniquePlaybackInterval + '';
			} else {
				labels['ns_st_iupc'] = '0';
			}

			labels['ns_st_lpc'] = longestPlaybackInterval + '';
			labels['ns_st_dlpc'] = longestPlaybackInterval - previousLongestPlaybackInterval + '';

			labels['ns_st_upa'] = assetUniquePlaybackInterval + '';
			labels['ns_st_dupa'] = assetUniquePlaybackInterval - assetPreviousUniquePlaybackInterval + '';
			if (assetUniquePlaybackInterval > assetPreviousEventIndependentUniquePlaybackInterval) {
				labels['ns_st_iupa'] = assetUniquePlaybackInterval - assetPreviousEventIndependentUniquePlaybackInterval + '';
			} else {
				labels['ns_st_iupa'] = '0';
			}

			labels['ns_st_lpa'] = assetLongestPlaybackInterval + '';
			labels['ns_st_dlpa'] = assetLongestPlaybackInterval - assetPreviousLongestPlaybackInterval + '';

			var pauses = !generalUtils.isEmpty(labels['ns_st_pc']) ? parseInt(labels['ns_st_pc']) : self.getPauses();
			labels['ns_st_pc'] = pauses + '';
			labels['ns_st_dpc'] = pauses - previousPausesCounter + '';

			var seeks = !generalUtils.isEmpty(labels['ns_st_skc']) ? parseInt(labels['ns_st_skc']) : self.getSeeks();
			labels['ns_st_skc'] = seeks + '';
			labels['ns_st_dskc'] = seeks - previousSeeksCounter + '';

			var buffers = !generalUtils.isEmpty(labels['ns_st_bc']) ? parseInt(labels['ns_st_bc']) : self.getBuffers();
			labels['ns_st_bc'] = buffers + '';
			labels['ns_st_dbc'] = buffers - previousBufferCounter + '';

			var seekingTime = !generalUtils.isEmpty(labels['ns_st_skt']) ? parseInt(labels['ns_st_skt']) : self.getSeekingTime();
			labels['ns_st_skt'] = seekingTime + '';
			labels['ns_st_dskt'] = seekingTime - previousSeekingTime + '';

			var seekingAmount = !generalUtils.isEmpty(labels['ns_st_ska']) ? parseInt(labels['ns_st_ska']) : self.getSeekingAmount();
			labels['ns_st_ska'] = seekingAmount + '';
			labels['ns_st_dska'] = seekingAmount - previousSeekingAmount + '';

            // the following code is there to not report ppc = 1 and apc = 1 in cases
            // where events such as CTA, Transfer, Error... are fired outside asset playback
			if (playbackStarted) {
				labels['ns_st_spc'] = segmentPlaybackCounter + '';
				labels['ns_st_apc'] = assetPlaybackCounter + '';

				labels['ns_st_sq'] = segmentPlaySequenceCounter + '';
				labels['ns_st_asq'] = playSequenceCounter + '';
			}

			if (!playbackStarted && assetLoadCounter == 0) {
				labels['ns_st_sc'] = '1';
			} else {
				labels['ns_st_sc'] = assetLoadCounter + '';
			}

			labels['ns_st_rt'] = playbackRate + '';

			labels['ns_st_ldw'] = playbackWindowLength;
			labels['ns_st_ldo'] = playbackWindowOffset;

			objectUtils.extend(labels, internalLabels);
		},

		updateDeltaLabels: function (labels) {
			previousPlaybackTime = parseInt(labels['ns_st_pt']); //Used for ns_st_dpt
			previousAccumulatedPlayback = parseInt(labels['ns_st_ap']); //Used for ns_st_dap
			previousElapsedTime = parseInt(labels['ns_st_et']); //Used for ns_st_det
			previousBufferingTime = parseInt(labels['ns_st_bt']); //Used for ns_st_dbt

			previousUniquePlaybackInterval = parseInt(labels['ns_st_upc']); // Used for ns_st_dupc
			previousLongestPlaybackInterval = parseInt(labels['ns_st_lpc']); // Used for ns_st_dlpc

			assetPreviousUniquePlaybackInterval = parseInt(labels['ns_st_upa']); // Used for ns_st_dupa
			assetPreviousLongestPlaybackInterval = parseInt(labels['ns_st_lpa']);  // Used for ns_st_dlpa

			previousPausesCounter = parseInt(labels['ns_st_pc']); // Used for ns_st_dpc
			previousSeeksCounter = parseInt(labels['ns_st_skc']); // Used for ns_st_dskc
			previousBufferCounter = parseInt(labels['ns_st_bc']); // Used for ns_st_dbc
			previousSeekingTime = parseInt(labels['ns_st_skt']); // Used for ns_st_dskt
			previousSeekingAmount = parseInt(labels['ns_st_ska']); // Used for ns_st_dska

            // reset seeking direction
			self.setSeekingDirection(0);
		},

		updateIndependentLabels: function (labels) {
			previousEventIndependentPlaybackTime = parseInt(labels['ns_st_pt']); //Used for ns_st_ipt

			previousEventIndependentUniquePlaybackInterval = parseInt(labels['ns_st_upc']); // Used for ns_st_iupc
			assetPreviousEventIndependentUniquePlaybackInterval = parseInt(labels['ns_st_upa']); // Used for ns_st_iupa
		},

		getVideoTrack: function () {
			return self.getInternalLabel('ns_st_vt');
		},

		setVideoTrack: function (value) {
			self.setInternalLabel('ns_st_vt', value + '');
		},

		getAudioTrack: function () {
			return self.getInternalLabel('ns_st_at');
		},

		setAudioTrack: function (value) {
			self.setInternalLabel('ns_st_at', value + '');
		},

		getSubtitleTrack: function () {
			return self.getInternalLabel('ns_st_tt');
		},

		setSubtitleTrack: function (value) {
			self.setInternalLabel('ns_st_tt', value + '');
		},

		getCDN: function () {
			return self.getInternalLabel('ns_st_cdn');
		},

		setCDN: function (value) {
			self.setInternalLabel('ns_st_cdn', value + '');
		},

		getSegmentPlaybackIntervals: function () {
			return segmentPlaybackIntervals;
		},

		setAssetPlaybackIntervals: function (value) {
			segmentPlaybackIntervals = value;
		},

		getAssetPlaybackIntervals: function () {
			return assetPlaybackIntervals;
		},

		incrementPauses: function () {
			pauses++;
		},

		incrementSeeks: function () {
			seeks++;
		},

		incrementPlayCounter: function () {
			segmentPlaySequenceCounter++;
		},

		getPlayCounter: function () {
			return segmentPlaySequenceCounter;
		},

		getBufferingTime: function () {
			return bufferingTime;
		},

		setBufferingTime: function (value) {
			bufferingTime = value;
		},

		addBufferingTime: function (now) {
			if (isNaN(bufferingTimestamp)) return;

			var bufferingTime = self.getBufferingTime();
			bufferingTime += now - bufferingTimestamp;
			self.setBufferingTime(bufferingTime);
			bufferingTimestamp = NaN;
		},

		setPlaybackStartPosition: function (value) {
			playbackStartPosition = parseInt(value);
		},

		getPlaybackStartPosition: function () {
			return playbackStartPosition;
		},

		addInterval: function (endIntervalPosition) {
			if (isNaN(playbackStartPosition) || isNaN(endIntervalPosition)) return;

			segmentPlaybackIntervals = staUtils.addNewPlaybackInterval(segmentPlaybackIntervals,
                playbackRate < 0 ? endIntervalPosition : playbackStartPosition,
                playbackRate < 0 ? playbackStartPosition : endIntervalPosition,
                playbackIntervalMergeTolerance);
			assetPlaybackIntervals = staUtils.addNewPlaybackInterval(assetPlaybackIntervals,
                playbackRate < 0 ? endIntervalPosition : playbackStartPosition,
                playbackRate < 0 ? playbackStartPosition : endIntervalPosition,
                playbackIntervalMergeTolerance);

			playbackStartPosition = NaN;
		},

		getElapsedTime: function () {
			return elapsedTime;
		},

		setElapsedTime: function (value) {
			elapsedTime = value;
		},

		addElapsedTime: function (now) {
			if (isNaN(elapsedTimestamp)) return;

			var elapsedTime = self.getElapsedTime();
			elapsedTime += now - elapsedTimestamp;
			self.setElapsedTime(elapsedTime);
			elapsedTimestamp = NaN;
		},

		getElapsedTimestamp: function () {
			return elapsedTimestamp;
		},

		setElapsedTimestamp: function (value) {
			elapsedTimestamp = value;
		},

		addPlaybackTime: function (now) {
			if (isNaN(playbackTimestamp)) return;

			playbackTime += now - playbackTimestamp;

			playbackTimestamp = NaN;
		},

		getPlaybackTime: function () {
			return playbackTime;
		},

		getExpectedPlaybackPosition: function (now) {
			var expectedPosition = playbackTimeOffset + previousPlaybackWindowOffset - playbackWindowOffset;

            // In Live Streams, we always include time that has passed.
			if(isLiveStream || !isNaN(playbackTimestamp)) {
				expectedPosition += Math.floor((now - playbackTimeOffsetTimestamp) * playbackRate / 100);
			}

			return expectedPosition;
		},

		getExpectedWindowOffset: function (currentPosition, now) {
			if (!isLiveStream) return 0;

			return playbackTimeOffset - currentPosition + Math.floor((now - playbackTimeOffsetTimestamp) * playbackRate / 100) + previousPlaybackWindowOffset;
		},

		setPlaybackTimeOffset: function (value, timestamp) {
			playbackTimeOffset = value;
			playbackTimeOffsetTimestamp = timestamp;
		},

		getPlaybackTimestamp: function () {
			return playbackTimestamp;
		},

        /*
        * Indicates that the asset just started a playback interval.
        * */
		setPlaybackTimestamp: function (value) {
			playbackTimestamp = value;
		},

		setPreviousPlaybackTime: function (value) {
			previousPlaybackTime = value;
		},


		getBufferingTimestamp: function () {
			return bufferingTimestamp;
		},

		setBufferingTimestamp: function (value) {
			bufferingTimestamp = value;
		},

		getPauses: function () {
			return pauses;
		},

		setPauses: function (value) {
			pauses = value;
		},

		getSeeks: function () {
			return seeks;
		},

		setSeeks: function (value) {
			seeks = value;
		},

		setSeeking: function (flag) {
			seeking = flag;
		},

		isSeeking: function () {
			return seeking;
		},

		setCollectingSeekingTime: function (flag) {
			collectingSeekingTime = flag;
		},

		isCollectingSeekingTime: function () {
			return collectingSeekingTime;
		},

		setAssetStarted: function (flag) {
			assetStarted = flag;
		},

		isAssetStarted: function () {
			return assetStarted;
		},

		setPlaybackStarted: function (flag) {
			playbackStarted = flag;
		},

		isPlaybackStarted: function () {
			return playbackStarted;
		},

		setSeekingTimestamp: function (value) {
			seekingTimestamp = value;
		},

		getSeekingTimestamp: function () {
			return seekingTimestamp;
		},

		addSeekingTime: function (now) {
			if (isNaN(seekingTimestamp)) return;

			var seekingTime = self.getSeekingTime();
			seekingTime += now - seekingTimestamp;
			self.setSeekingTime(seekingTime);
			seekingTimestamp = NaN;
		},

		getSeekingTime: function () {
			return seekingTime;
		},

		setSeekingTime: function (value) {
			seekingTime = value;
		},

		setSeekingTimeBeforeEnd: function (value) {
			seekingTimeBeforeEnd = value;
		},

		getSeekingTimeBeforeEnd: function () {
			return seekingTimeBeforeEnd;
		},

		setSeekStartPosition: function (value) {
			seekStartPosition = value;
		},

		getSeekStartPosition: function () {
			return seekStartPosition;
		},

		setSeekingAmount: function (value) {
			seekingAmount = value;
		},

		getSeekingAmount: function () {
			return seekingAmount;
		},

		addSeekingAmount: function (seekingEndPosition) {
			var seekingAmount = self.getSeekingAmount();
			seekingAmount += Math.abs(seekingEndPosition - seekStartPosition);
			self.setSeekingAmount(seekingAmount);

			var seekingDirection;
			if (seekStartPosition == seekingEndPosition) {
				seekingDirection = 0;
			} else if (seekStartPosition > seekingEndPosition) {
				seekingDirection = -1;
			} else if (seekStartPosition < seekingEndPosition) {
				seekingDirection = 1;
			}
			self.setSeekingDirection(seekingDirection);

			seekStartPosition = 0;
		},

		getSeekingDirection: function () {
			return parseInt(self.getInternalLabel('ns_st_skd'));
		},

		setSeekingDirection: function (value) {
			self.setInternalLabel('ns_st_skd', value + '');
		},

		resetAssetLifecycleLabels: function () {
			accumulatedPlayback = 0;
			previousAccumulatedPlayback = 0;

			playbackTime = 0;
			previousPlaybackTime = 0;
			previousEventIndependentPlaybackTime = 0;

			bufferingTime = 0;
			previousBufferingTime = 0;

			buffers = 0;
			previousBufferCounter = 0;

			pauses = 0;
			previousPausesCounter = 0;

			segmentPlaySequenceCounter = 0;

			assetPlaybackIntervals = [];
			assetPreviousUniquePlaybackInterval = 0;
			assetPreviousEventIndependentUniquePlaybackInterval = 0;
			assetPreviousLongestPlaybackInterval = 0;

			elapsedTime = 0;
			previousElapsedTime = 0;

			seekingTime = 0;
			previousSeekingTime = 0;

			seekingAmount = 0;
			previousSeekingAmount = 0;

			seeks = 0;
			previousSeeksCounter = 0;
		},

		incrementSegmentPlaybackCounter: function () {
			segmentPlaybackCounter++;
		},

		incrementAssetLoadCounter: function () {
			assetLoadCounter++;
		},

		incrementAssetPlaybackCounter: function () {
			assetPlaybackCounter++;
		},

		getPreviousUniquePlaybackInterval: function () {
			return previousUniquePlaybackInterval;
		},

		setPreviousUniquePlaybackInterval: function (value) {
			previousUniquePlaybackInterval = value;
		},

		getPreviousEventIndependentUniquePlaybackInterval: function () {
			return previousEventIndependentUniquePlaybackInterval;
		},

		setPreviousEventIndependentUniquePlaybackInterval: function (value) {
			previousEventIndependentUniquePlaybackInterval = value;
		},

		setPreviousLongestPlaybackInterval: function (value) {
			previousLongestPlaybackInterval = value;
		},

		getPreviousLongestPlaybackInterval: function () {
			return previousLongestPlaybackInterval;
		},

		resetAssetPlaybackIntervals: function () {
			assetPlaybackIntervals = [];
			assetPreviousUniquePlaybackInterval = 0;
			assetPreviousEventIndependentUniquePlaybackInterval = 0;
			assetPreviousLongestPlaybackInterval = 0;
		},

		setSegmentPlaybackCounter: function (value) {
			segmentPlaybackCounter = value;
		},

		setAssetLoadCounter: function (value) {
			assetLoadCounter = value;
		},

		setAssetPlaybackCounter: function (value) {
			assetPlaybackCounter = value;
		},

		setLowestPartNumberPlayed: function (value) {
			lowestPartNumberPlayed = value;
		},

		getSegmentPlaybackCounter: function () {
			return segmentPlaybackCounter;
		},

		getAssetLoadCounter: function () {
			return assetLoadCounter;
		},

		getAssetPlaybackCounter: function () {
			return assetPlaybackCounter;
		},

		getLowestPartNumberPlayed: function () {
			return lowestPartNumberPlayed;
		},

		getBuffers: function () {
			return buffers;
		},

		incrementBufferCount: function () {
			buffers++;
		},

		getPreviousBufferingTime: function () {
			return previousBufferingTime;
		},

		setPlaySequenceCounter: function (value) {
			playSequenceCounter = value;
		},

		incrementPlaySequenceCounter: function () {
			playSequenceCounter++;
		},

		getPlaySequenceCounter: function () {
			return playSequenceCounter;
		},

		isPlaybackSessionLooping: function () {
			return playbackSessionLooping;
		},

		setPlaybackSessionLooping: function (value) {
			playbackSessionLooping = value;
		},

		enableAutoCalculatePositions: function (enabled) {
			autoCalculatePositions = !!enabled;
		},

		isAutoCalculatePositionsEnabled: function () {
			return autoCalculatePositions;
		},

		getPlaybackRate: function () {
			return playbackRate;
		},

        /**
         * Sets the asset playback rate.
         * @param {int} newValue New Playback rate.
         * @private
         */
		setPlaybackRate: function (newValue) {
			playbackRate = newValue;
		},

		addAccumulatedPlayback: function (currentPosition) {
			if (playbackRate < 0 && (playbackTimeOffset - currentPosition > 0)) {
				accumulatedPlayback += playbackTimeOffset - currentPosition;
			} else if(playbackRate > 0 && (currentPosition - playbackTimeOffset > 0)) {
				accumulatedPlayback += currentPosition - playbackTimeOffset;
			}
		},

		setPlaybackWindowLength: function (newValue) {
			playbackWindowLength = newValue;
		},

		getPlaybackWindowLength: function () {
			return playbackWindowLength;
		},

		setPlaybackWindowOffset: function (newValue) {
			playbackWindowOffset = newValue;
		},

		getPlaybackWindowOffset: function () {
			return playbackWindowOffset;
		},

		setPreviousPlaybackWindowOffset: function (newValue) {
			previousPlaybackWindowOffset = newValue;
		},
        
		asLiveStream: function (_isLiveStream) {
			isLiveStream = _isLiveStream;
		}
	});

	init();
}

Asset.resetAsset = function (oldAsset, newAsset, keepLabels) {
	var oldAssetLabels = oldAsset.getLabels();
	var initialAssetLabels = {};

	for (var i = 0; keepLabels && i < keepLabels.length; ++i) {
		if (oldAssetLabels.hasOwnProperty(keepLabels[i])) {
			initialAssetLabels[keepLabels[i]] = oldAssetLabels[keepLabels[i]];
		}
	}

	newAsset.setLabels(initialAssetLabels);
	newAsset.setPlaybackIntervalMergeTolerance(oldAsset.getPlaybackIntervalMergeTolerance());
};

module.exports = Asset;

},{"17":17,"21":21,"23":23,"24":24,"68":68}],55:[function(require,module,exports){
var StreamingAnalyticsConstants = {
	PAGE_NAME_LABEL: 'name',
	HASH_LABELS: ['ns_st_st', 'ns_st_ci', 'ns_st_pr', 'ns_st_sn', 'ns_st_en', 'ns_st_ep', 'ns_st_ty', 'ns_st_ct', 'ns_st_li', 'ns_st_ad', 'ns_st_bn', 'ns_st_tb', 'ns_st_an', 'ns_st_ta', 'ns_st_pu', 'c3', 'c4', 'c6']
};

module.exports = StreamingAnalyticsConstants;
},{}],56:[function(require,module,exports){
/* global document, ns_p, ns_pixelUrl */

var TransitionsForIdle = require(73),
	TransitionsForPaused = require(74),
	TransitionsForPlaybackNotStarted = require(76),
	TransitionsForPlaying = require(77),
	TransitionsForBufferingBeforePlayback = require(69),
	TransitionsForBufferingDuringPlayback = require(71),
	TransitionsForBufferingDuringSeeking = require(72),
	TransitionsForBufferingDuringPause = require(70),
	TransitionsForPausedDuringBuffering = require(75),
	TransitionsForSeekingBeforePlayback = require(78),
	TransitionsForSeekingDuringBuffering = require(79),
	TransitionsForSeekingDuringPlayback = require(80),
	SharedTransitions = require(81),

	StreamingAnalyticsConstants = require(55),
	staUtils = require(68),
	STASharedManager = require(65),
	browserUtils = require(20),
	objectUtils = require(24),
	arrayUtils = require(19),
	systemClockJumpDetector = require(82),

	handlePageExit = require(62),

	PlaybackSession = require(63),
	State = require(58).State,
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType,
	ImplementationType = require(58).ImplementationType,

	KeepAlive = require(61),
	Heartbeat = require(60),
	EventManager = require(59),
	Logging = require(18),

	StateMachine = require(66),

	CommonConstants = require(17),

	comScore = require(2),

	_undefined = 'undefined',
	STREAMINGANALYTICS_VERSION = '6.3.4.190424',
	MODEL_VERSION = '5.10',
	LOG_NAMESPACE = 'STA',
	DEFAULT_PLAYERNAME = 'js_api',
	DEFAULT_PAUSED_ON_BUFFERING_INTERVAL = 500,
	THROTTLING_DELAY = 500;

function STACore (configuration) {
	var self = this,
		staSM,
		exports = {},

		transitionsForIdle,
		transitionsForPaused,
		transitionsForPlaybackNotStarted,
		transitionsForPlaying,
		transitionsForBufferingBeforePlayback,
		transitionsForBufferingDuringPlayback,
		transitionsForBufferingDuringSeeking,
		transitionsForBufferingDuringPause,
		transitionsForPausedDuringBuffering,
		transitionsForSeekingBeforePlayback,
		transitionsForSeekingDuringBuffering,
		transitionsForSeekingDuringPlayback,
		sharedTransitions,

		loadingTimeSent,
		loadTimeOffset,
		initTimestamp,
		lastEventTimestamp,

		pauseOnBufferingInterval = DEFAULT_PAUSED_ON_BUFFERING_INTERVAL,
		pauseOnBufferingEnabled,
		pausedOnBufferingTimer,

		throttlingEnabled,
		throttlingDelay = THROTTLING_DELAY,
		delayedTransitionTimer,

		listenerList,

		userSpecifiedPersistentLabels = {},
		liveEndpointURL,
		publisherId,
		isStandaloneModeEnabled = false,
        
		isExitEndEventEnabled = true,
        
		isSystemClockJumpDetectionEnabled = false,
		systemClockJumpDetected = false,
		latestEventPosition,
		wasSystemClockJumpToFuture;

	function init() {
		staSM = new STASharedManager(self);

		staSM.setAppCore( comScore.getCore() );
		staSM.setKeepAlive(new KeepAlive(staSM));
		staSM.setHeartbeat(new Heartbeat(staSM));
		staSM.setEventManager(new EventManager(staSM));
		staSM.setStateMachine(new StateMachine());
		staSM.setLogging(new Logging(LOG_NAMESPACE, configuration.debug));
		staSM.setPlaybackSession(new PlaybackSession(staSM));

		transitionsForIdle = new TransitionsForIdle(staSM);
		transitionsForPaused = new TransitionsForPaused(staSM);
		transitionsForPlaybackNotStarted = new TransitionsForPlaybackNotStarted(staSM);
		transitionsForPlaying = new TransitionsForPlaying(staSM);
		transitionsForBufferingBeforePlayback = new TransitionsForBufferingBeforePlayback(staSM);
		transitionsForBufferingDuringPlayback = new TransitionsForBufferingDuringPlayback(staSM);
		transitionsForBufferingDuringSeeking = new TransitionsForBufferingDuringSeeking(staSM);
		transitionsForBufferingDuringPause = new TransitionsForBufferingDuringPause(staSM);
		transitionsForPausedDuringBuffering = new TransitionsForPausedDuringBuffering(staSM);
		transitionsForSeekingBeforePlayback = new TransitionsForSeekingBeforePlayback(staSM);
		transitionsForSeekingDuringBuffering = new TransitionsForSeekingDuringBuffering(staSM);
		transitionsForSeekingDuringPlayback = new TransitionsForSeekingDuringPlayback(staSM);
		sharedTransitions = new SharedTransitions(staSM);

		loadingTimeSent = false;
		loadTimeOffset = 0;
		initTimestamp = +new Date();

		pauseOnBufferingEnabled = true;

		throttlingEnabled = false;

		listenerList = [];

		if (configuration['publisherId']) {
			isStandaloneModeEnabled = true;
			publisherId = configuration['publisherId'] + '';

			var secureModeEnabled;
			if('secure' in configuration) {
				secureModeEnabled = configuration['secure'];
			} else if (staSM.getAppCore() && staSM.getAppCore().isProperlyInitialized()) {
				secureModeEnabled = staSM.getAppCore().isSecure();
			} else if (staUtils.isBrowser()) {
				secureModeEnabled = browserUtils.isWebSecure();
			} else {
				secureModeEnabled = false;
			}

			var newLiveEndPointURL = (secureModeEnabled ? 'https://sb' : 'http://b') + '.scorecardresearch.com/p?c1=2';
			self.setLiveEndpointURL(newLiveEndPointURL);
		}

		if (configuration['liveEndpointURL']) {
			self.setLiveEndpointURL(configuration['liveEndpointURL']);
		}

		if(configuration['systemClockJumpDetection']) {
			systemClockJumpDetector.setPlatformAPI(self.getPlatformAPI());

			if(configuration['systemClockJumpDetectionInterval']) {
				systemClockJumpDetector.configureInterval(parseInt(configuration['systemClockJumpDetectionInterval']), true);
			} else {
				systemClockJumpDetector.configureInterval();
			}

			if(configuration['systemClockJumpDetectionPrecision']) {
				systemClockJumpDetector.configureError(parseInt(configuration['systemClockJumpDetectionPrecision']), true);
			} else {
				systemClockJumpDetector.configureError();
			}

			enableSystemClockJumpsDetection();
		}
	}

	function willCauseMeasurement(eventType) {
		var currentState = staSM.getStateMachine().getCurrentState();

		if (currentState == State.IDLE
            || currentState == State.PLAYBACK_NOT_STARTED
            || currentState == State.BUFFERING_BEFORE_PLAYBACK
            || currentState == State.SEEKING_BEFORE_PLAYBACK) {
			if (eventType == StreamingAnalyticsEventType.PLAY) {
				return true;
			}
		} else if (currentState == State.PLAYING) {
			if (eventType == StreamingAnalyticsEventType.END
                || eventType == StreamingAnalyticsEventType.AD_SKIP
                || eventType == StreamingAnalyticsEventType.SEEK_START
                || eventType == StreamingAnalyticsEventType.PAUSE) {
				return true;
			}
		} else if (currentState == State.PAUSED
            || currentState == State.BUFFERING_DURING_PAUSE
            || currentState == State.SEEKING_DURING_PLAYBACK
            || currentState == State.SEEKING_DURING_BUFFERING
            || currentState == State.SEEKING_DURING_PAUSE) {
			if (eventType == StreamingAnalyticsEventType.END
                || eventType == StreamingAnalyticsEventType.AD_SKIP
                || eventType == StreamingAnalyticsEventType.PLAY) {
				return true;
			}
		} else if (currentState == State.BUFFERING_DURING_PLAYBACK) {
			if (eventType == StreamingAnalyticsEventType.PAUSE_ON_BUFFERING
                || eventType == StreamingAnalyticsEventType.END
                || eventType == StreamingAnalyticsEventType.AD_SKIP
                || eventType == StreamingAnalyticsEventType.SEEK_START
                || eventType == StreamingAnalyticsEventType.PAUSE
                || eventType == StreamingAnalyticsEventType.PLAY) {
				return true;
			}
		} else if (currentState == State.BUFFERING_DURING_SEEKING) {
			if (eventType == StreamingAnalyticsEventType.END
                || eventType == StreamingAnalyticsEventType.AD_SKIP
                || eventType == StreamingAnalyticsEventType.PAUSE
                || eventType == StreamingAnalyticsEventType.PLAY) {
				return true;
			}
		} else if (currentState == State.PAUSED_DURING_BUFFERING) {
			if (eventType == StreamingAnalyticsEventType.END
                || eventType == StreamingAnalyticsEventType.AD_SKIP
                || eventType == StreamingAnalyticsEventType.BUFFER_STOP
                || eventType == StreamingAnalyticsEventType.PLAY) {
				return true;
			}
		}

		return false;
	}

	function handleTransition(eventType, eventTimestamp, eventLabels) {
		var currentState = staSM.getStateMachine().getCurrentState();

		if (eventType == StreamingAnalyticsEventType.AD_SKIP
            && !eventLabels.hasOwnProperty('ns_st_ui')
            && willCauseMeasurement(eventType)) {
            // add the skip label value when notified of an AD_SKIP event
            // (only in case if it is not overriden by an event specific value)
			eventLabels['ns_st_ui'] = 'skip';
		} else if (eventType == StreamingAnalyticsEventType.SEEK_START
            && !eventLabels.hasOwnProperty('ns_st_ui')
            && willCauseMeasurement(eventType)) {
            // add the seek label value when notifying of a SEEK_START
            // (only in case if it is not overriden by an event specific value)
			eventLabels['ns_st_ui'] = 'seek';
		}

		if (currentState == State.IDLE) {
			if (eventType == StreamingAnalyticsEventType.BUFFER) {
				transitionsForIdle.onBuffer(eventTimestamp, eventLabels);
			} else if (eventType == StreamingAnalyticsEventType.SEEK_START) {
				transitionsForIdle.onSeekStart(eventTimestamp, eventLabels);
			} else if (eventType == StreamingAnalyticsEventType.PLAY) {
				transitionsForIdle.onPlay(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.PLAYBACK_NOT_STARTED) {
			if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForPlaybackNotStarted.onEndOrAdSkip(eventTimestamp, eventLabels);
			} else if (eventType == StreamingAnalyticsEventType.SEEK_START) {
				transitionsForPlaybackNotStarted.onSeekStart(eventTimestamp, eventLabels);
			} else if (eventType == StreamingAnalyticsEventType.PLAY) {
				transitionsForPlaybackNotStarted.onPlay(eventTimestamp, eventLabels);
			} else if (eventType == StreamingAnalyticsEventType.BUFFER) {
				transitionsForPlaybackNotStarted.onBuffer(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.PLAYING) {
			if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForPlaying.onEndOrAdSkip(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER) {
				transitionsForPlaying.onBuffer(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.SEEK_START) {
				transitionsForPlaying.onSeekStart(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PAUSE) {
				transitionsForPlaying.onPause(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.PAUSED) {
			if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForPaused.onEndOrAdSkip(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				transitionsForPaused.onPlay(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER) {
				sharedTransitions.onBufferWhenSeekingOrPaused(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.SEEK_START) {
				sharedTransitions.onSeekStartWhenPausedOrBufferingDuringPause(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.BUFFERING_BEFORE_PLAYBACK) {
			if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForBufferingBeforePlayback.onEndOrAdSkip(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER_STOP) {
				transitionsForBufferingBeforePlayback.onBufferStop(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.SEEK_START) {
				transitionsForBufferingBeforePlayback.onSeekStart(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PAUSE) {
				transitionsForBufferingBeforePlayback.onPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				transitionsForBufferingBeforePlayback.onPlay(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.BUFFERING_DURING_PLAYBACK) {
			if (eventType == StreamingAnalyticsEventType.PAUSE_ON_BUFFERING) {
				transitionsForBufferingDuringPlayback.onPauseOnBuffering(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER_STOP) {
				sharedTransitions.onBufferStopOrOnPlayWhenBufferingDuringPlayback(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForBufferingDuringPlayback.onEndOrAdSkip(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.SEEK_START) {
				transitionsForBufferingDuringPlayback.onSeekStart(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PAUSE) {
				transitionsForBufferingDuringPlayback.onPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				sharedTransitions.onBufferStopOrOnPlayWhenBufferingDuringPlayback(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.BUFFERING_DURING_SEEKING) {
			if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForBufferingDuringSeeking.onEndOrAdSkip(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PAUSE) {
				transitionsForBufferingDuringSeeking.onPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				transitionsForBufferingDuringSeeking.onPlay(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER_STOP) {
				sharedTransitions.onBufferStopWhenBufferingDuringSeekingOrBufferingDuringPause(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.BUFFERING_DURING_PAUSE) {
			if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForBufferingDuringPause.onEndAndSkip(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PAUSE) {
				transitionsForBufferingDuringPause.onPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				transitionsForBufferingDuringPause.onPlay(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.SEEK_START) {
				sharedTransitions.onSeekStartWhenPausedOrBufferingDuringPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER_STOP) {
				sharedTransitions.onBufferStopWhenBufferingDuringSeekingOrBufferingDuringPause(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.SEEKING_BEFORE_PLAYBACK) {
			if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForSeekingBeforePlayback.onEndOrAdSkip(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PAUSE) {
				transitionsForSeekingBeforePlayback.onPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				transitionsForSeekingBeforePlayback.onPlay(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER) {
				sharedTransitions.onBufferWhenSeekingOrPaused(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.SEEKING_DURING_PLAYBACK) {
			if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForSeekingDuringPlayback.onEndOrAdSkip(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				transitionsForSeekingDuringPlayback.onPlay(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER) {
				sharedTransitions.onBufferWhenSeekingOrPaused(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PAUSE) {
				sharedTransitions.onPauseWhenSeekingDuringPlaybackOrSeekingDuringPause(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.SEEKING_DURING_BUFFERING) {
			if (eventType == StreamingAnalyticsEventType.PAUSE) {
				transitionsForSeekingDuringBuffering.onPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER) {
				sharedTransitions.onBufferWhenSeekingOrPaused(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				sharedTransitions.onPlayWhenSeekingDuringBufferingOrSeekingDuringPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				sharedTransitions.onEndOrAdSkipWhenSeekingDuringBufferingOrSeekingDuringPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER_STOP) {
				sharedTransitions.onBufferStopWhenSeekingDuringBufferingOrSeekingDuringPause(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.PAUSED_DURING_BUFFERING) {
			if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				transitionsForPausedDuringBuffering.onEndOrAdSkip(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER_STOP) {
				transitionsForPausedDuringBuffering.onPlayOrOnBufferStop(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.SEEK_START) {
				transitionsForPausedDuringBuffering.onSeekStart(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PAUSE) {
				transitionsForPausedDuringBuffering.onPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				transitionsForPausedDuringBuffering.onPlayOrOnBufferStop(eventTimestamp, eventLabels);
			}
		} else if (currentState == State.SEEKING_DURING_PAUSE) {
			if (eventType == StreamingAnalyticsEventType.BUFFER) {
				sharedTransitions.onBufferWhenSeekingOrPaused(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PLAY) {
				sharedTransitions.onPlayWhenSeekingDuringBufferingOrSeekingDuringPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.PAUSE) {
				sharedTransitions.onPauseWhenSeekingDuringPlaybackOrSeekingDuringPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.END || eventType == StreamingAnalyticsEventType.AD_SKIP) {
				sharedTransitions.onEndOrAdSkipWhenSeekingDuringBufferingOrSeekingDuringPause(eventTimestamp, eventLabels);
			}	else if (eventType == StreamingAnalyticsEventType.BUFFER_STOP) {
				sharedTransitions.onBufferStopWhenSeekingDuringBufferingOrSeekingDuringPause(eventTimestamp, eventLabels);
			}
		}

		if (willCauseMeasurement(eventType)) {
			staSM.getPlaybackSession().setFirstEventSent(true);
		}
	}

	function enableSystemClockJumpsDetection() {
		if(isSystemClockJumpDetectionEnabled) return;
		isSystemClockJumpDetectionEnabled = true;

		systemClockJumpDetector.onSystemClockJump(systemClockJumpListener);
	}

	function disableSystemClockJumpsDetection() {
		systemClockJumpDetector.removeSystemClockJumpListener(systemClockJumpListener);

		isSystemClockJumpDetectionEnabled = false;
	}

	function systemClockJumpListener(isSystemClockJumpToFuture) {
		wasSystemClockJumpToFuture = isSystemClockJumpToFuture;
		systemClockJumpDetected = true;
	}

	function onPageExitListener() {
		var eventLabels = {};
		var eventTimestamp = staUtils.fixEventTime(eventLabels);

        // Notify of an END event
		self.newEvent(StreamingAnalyticsEventType.END, eventTimestamp, eventLabels);
	}
    
	objectUtils.extend(self, {
		getConfiguration: function () {
			return configuration || {};
		},

        /**
         * @return {EventData}
         */
		createLabels: function (eventType, eventLabels, eventTimestamp) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

			var systemClockErrorFlagDetectedDuringHB = false;

            // Special case for HB, they do not execute newEvent or newPseudoEvent core methods.
			if (eventType == StreamingAnalyticsEventType.HEARTBEAT) {
				var previousTrackedTimestamp = !isNaN(lastEventTimestamp) ? lastEventTimestamp : initTimestamp;
				lastEventTimestamp = eventTimestamp;

				if (eventTimestamp < previousTrackedTimestamp || systemClockJumpDetected) {
					systemClockErrorFlagDetectedDuringHB = true;
					systemClockJumpDetected = false;

					if (eventTimestamp < previousTrackedTimestamp) {
                        // Library detected a client-side clock change backwards,
                        // but prior to the timestamp reported for the last event notification
                        // Note that event notifications do not necessarily cause a measurements to be transmitted.
						currentPlaybackSession.addInternalErrorFlag('1');

						staSM.getLogging().infoLog('System clock jump detected', 'to the far past');
					} else if (wasSystemClockJumpToFuture) {
                        // Library detected a client-side clock change forwards.
                        // Note that event notifications do not necessarily cause a measurements to be transmitted.
						currentPlaybackSession.addInternalErrorFlag('3');

						staSM.getLogging().infoLog('System clock jump detected', 'to the future');
					} else {
                        // Library detected a client-side clock change backwards,
                        // but later to the timestamp reported for the last event notification
                        // Note that event notifications do not necessarily cause a measurements to be transmitted.
						currentPlaybackSession.addInternalErrorFlag('2');

						staSM.getLogging().infoLog('System clock jump detected', 'to the near past');
					}

					eventTimestamp = previousTrackedTimestamp;
				}
			}

			var labels = {};

			if(isStandaloneModeEnabled) {
				labels['c2'] = publisherId;
			}

            // set browser settings (if available)
			if (typeof document != _undefined) {
				var d = document;
				labels['c7'] = d.URL;
				labels['c8'] = d.title;
				labels['c9'] = d.referrer;
			}

            // Setting default values for some labels if not already there
			labels['ns_ts'] = +new Date() + '';
			labels['ns_st_ev'] = StreamingAnalyticsEventType.toString(eventType);
			labels['ns_st_mp'] = DEFAULT_PLAYERNAME;
			labels['ns_st_mv'] = STREAMINGANALYTICS_VERSION;
			labels['ns_st_ub'] = '0';
			labels['ns_st_br'] = '0';
			labels['ns_st_pn'] = '1';
			labels['ns_st_tp'] = '0';
			labels['ns_st_it'] = ImplementationType.toString(ImplementationType.SINGLE_CLIP);
			labels['ns_st_sv'] = STREAMINGANALYTICS_VERSION;
			labels['ns_st_smv'] = MODEL_VERSION;
			labels['ns_type'] = 'hidden'; // EventType.HIDDEN
			labels['ns_st_ec'] = staSM.getEventManager().getEventCounter() + '';
			labels['ns_st_ki'] = staSM.getKeepAlive().getInterval() + '';

            // Actually, these blocks of code are only used when a HB happens.
			if (eventLabels['ns_st_po']) {
				labels['ns_st_po'] = eventLabels['ns_st_po'] + '';
			} else if (!currentAsset.isAutoCalculatePositionsEnabled()) {
				labels['ns_st_po'] = latestEventPosition + '';
			} else {
				labels['ns_st_po'] = currentAsset.getExpectedPlaybackPosition(eventTimestamp) + '';
			}

			latestEventPosition = parseInt(labels['ns_st_po']);

            // Add playbackSession labels and asset labels.
			currentPlaybackSession.createLabels(labels, eventTimestamp);
			currentPlaybackSession.getAsset().createLabels(labels, eventTimestamp, eventType == StreamingAnalyticsEventType.HEARTBEAT);

			var customLabels = {};

			// Override with user specified labels.
			objectUtils.extend(customLabels, userSpecifiedPersistentLabels);
			objectUtils.extend(customLabels, currentPlaybackSession.getLabels());
			objectUtils.extend(customLabels, currentPlaybackSession.getAsset().getLabels());
			objectUtils.extend(customLabels, eventLabels);

            // HB only happens during the PLAYING state.
			if (systemClockErrorFlagDetectedDuringHB) {
				currentAsset.setPlaybackTimeOffset(latestEventPosition, lastEventTimestamp);

                // Actual eventTimestamp - the offset already calculated.
				currentPlaybackSession.setPlaybackTimestamp(lastEventTimestamp - parseInt(labels['ns_st_dpt']));
				currentAsset.setPlaybackTimestamp(lastEventTimestamp - parseInt(labels['ns_st_dpt']));
				currentAsset.setElapsedTimestamp(lastEventTimestamp - parseInt(labels['ns_st_det']));
			}

            //EventData object
			return {
				eventType: eventType,
				eventLabels: labels,
				customLabels: customLabels
			};
		},

		newEvent: function (eventType, eventTimestamp, eventLabels, inmediateTransition) {
			self.stopDelayedTransitionTimer();

			var currentState = staSM.getStateMachine().getCurrentState();

			var newState = staSM.getStateMachine().eventTypeToState(eventType);
			if (newState == null || newState == currentState) {
				staSM.getLogging().infoLog('Ignored event:',
                    StreamingAnalyticsEventType.toString(eventType),
                    'during state',
                    staUtils.stateToString(currentState),
                    eventLabels
                );

				return;
			}

			if (self.isThrottlingEnabled()
                && (currentState == State.PLAYING || currentState == State.PAUSED)
                && (newState == State.PLAYING || newState == State.PAUSED)
                && !inmediateTransition) {
				staSM.getLogging().infoLog('Throttled event:',
                    StreamingAnalyticsEventType.toString(eventType),
                    'during state',
                    staUtils.stateToString(currentState),
                    eventLabels,
                    self.getThrottlingDelay(),
                    'ms'
                );

				var delayedTransitionCallback = function (eventType, newState, eventLabels) {
					return function () {
						self.newEvent(eventType, eventTimestamp, eventLabels, true);
					};
				}(eventType, newState, eventLabels);

                // delay the transition to account for throttling scenarios
				delayedTransitionTimer = self.getPlatformAPI().setTimeout(delayedTransitionCallback, self.getThrottlingDelay());

				return;
			}

			if(configuration['systemClockJumpDetection']) {
				if(newState == State.IDLE) {
					disableSystemClockJumpsDetection();
				} else if(currentState == State.IDLE) {
					enableSystemClockJumpsDetection();
				}
			}

            // If leaving an 'IDLE' state
			if(isExitEndEventEnabled && staUtils.isIdleState(currentState) && !staUtils.isIdleState(newState)) {
				handlePageExit.onPageExit(onPageExitListener);

                // If going to an 'IDLE' state.
			} else if(isExitEndEventEnabled && !staUtils.isIdleState(currentState) && staUtils.isIdleState(newState)) {
				handlePageExit.removePageExitListener(onPageExitListener);
			}

			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

			var previousTrackedTimestamp = !isNaN(lastEventTimestamp) ? lastEventTimestamp : initTimestamp;
			lastEventTimestamp = eventTimestamp;
			var systemClockErrorFlagDetected = false;
			if (eventTimestamp < previousTrackedTimestamp || systemClockJumpDetected) {
				systemClockErrorFlagDetected = true;
				systemClockJumpDetected = false;

				if (eventTimestamp < previousTrackedTimestamp) {
                    // Library detected a client-side clock change backwards,
                    // but prior to the timestamp reported for the last event notification
                    // Note that event notifications do not necessarily cause a measurements to be transmitted.
					currentPlaybackSession.addInternalErrorFlag('1');

					staSM.getLogging().infoLog('System clock jump detected', 'to the far past');
				} else if (wasSystemClockJumpToFuture) {
                    // Library detected a client-side clock change forwards.
                    // Note that event notifications do not necessarily cause a measurements to be transmitted.
					currentPlaybackSession.addInternalErrorFlag('3');

					staSM.getLogging().infoLog('System clock jump detected', 'to the future');
				} else {
                    // Library detected a client-side clock change backwards,
                    // but later to the timestamp reported for the last event notification
                    // Note that event notifications do not necessarily cause a measurements to be transmitted.
					currentPlaybackSession.addInternalErrorFlag('2');

					staSM.getLogging().infoLog('System clock jump detected', 'to the near past');
				}

				eventTimestamp = previousTrackedTimestamp;
			}

			if (!eventLabels['ns_st_po']) {
				if (!currentAsset.isAutoCalculatePositionsEnabled()) {
					eventLabels['ns_st_po'] = latestEventPosition + '';
				} else if (staSM.getStateMachine().getCurrentState() == State.IDLE) {
					eventLabels['ns_st_po'] = currentAsset.getPlaybackWindowLength() - currentAsset.getPlaybackWindowOffset() + '';
				} else {
					eventLabels['ns_st_po'] = currentAsset.getExpectedPlaybackPosition(eventTimestamp) + '';
				}
			} else if (staSM.getStateMachine().getCurrentState() == State.IDLE) {
				currentAsset.setPlaybackWindowOffset(currentAsset.getPlaybackWindowLength() - parseInt(eventLabels['ns_st_po']));
			} else {
				currentAsset.setPlaybackWindowOffset(currentAsset.getExpectedWindowOffset(parseInt(eventLabels['ns_st_po']), eventTimestamp));
			}

			var currentPosition = parseInt(eventLabels['ns_st_po']);
			latestEventPosition = currentPosition;

            //Transition logic
			handleTransition(eventType, eventTimestamp, eventLabels);

            // Set internal position to that value
			currentAsset.setPlaybackTimeOffset(currentPosition, eventTimestamp);
			currentAsset.setPreviousPlaybackWindowOffset( currentAsset.getPlaybackWindowOffset() );

            //Calculate the delta
			var delta = 0;
			if (!isNaN(staSM.getStateMachine().getLastStateChangeTimestamp())) {
				delta = eventTimestamp - staSM.getStateMachine().getLastStateChangeTimestamp();
			}

            // Notify the StateMachine
			staSM.getStateMachine().newEvent(eventType, eventTimestamp);

			if (systemClockErrorFlagDetected) {
				currentAsset.setPlaybackTimeOffset(currentPosition, lastEventTimestamp);

				if (newState != State.IDLE
                    && newState != State.PLAYBACK_NOT_STARTED
                    && newState != State.SEEKING_BEFORE_PLAYBACK
                    && newState != State.BUFFERING_BEFORE_PLAYBACK) {
					currentAsset.setElapsedTimestamp(lastEventTimestamp);
				}

				if (newState == State.BUFFERING_BEFORE_PLAYBACK
                    || newState == State.BUFFERING_DURING_PAUSE
                    || newState == State.BUFFERING_DURING_PLAYBACK
                    || newState == State.BUFFERING_DURING_SEEKING
                    || newState == State.PAUSED_DURING_BUFFERING) {
					currentPlaybackSession.setBufferingTimestamp(lastEventTimestamp);
					currentAsset.setBufferingTimestamp(lastEventTimestamp);
				}

				if (newState == State.PLAYING) {
					currentPlaybackSession.setPlaybackTimestamp(lastEventTimestamp);
					currentAsset.setPlaybackTimestamp(lastEventTimestamp);
				}

				if (newState == State.SEEKING_BEFORE_PLAYBACK
                    || newState == State.SEEKING_DURING_BUFFERING
                    || newState == State.SEEKING_DURING_PAUSE
                    || newState == State.SEEKING_DURING_PLAYBACK
                    || newState == State.BUFFERING_DURING_SEEKING
                ) {
					currentAsset.setSeekingTimestamp(lastEventTimestamp);
				}
			}

			staSM.getLogging().log('Transition from',
                staUtils.stateToString(currentState),
                'to',
                staUtils.stateToString(newState),
                'due to event:',
                StreamingAnalyticsEventType.toString(eventType)
            );

            // notify listeners
			for (var i = 0, len = listenerList.length; i < len; i++) {
				listenerList[i](currentState /*old state*/, newState/*new state*/, eventLabels, delta);
			}
		},

		newPseudoEvent: function (eventType, eventTimestamp, eventLabels) {
			var currentState = staSM.getStateMachine().getCurrentState();

            // ignore the LOAD or ENGAGE notifications if they're triggered when the state machine
            // is not in an IDLE state
			if ((eventType == StreamingAnalyticsEventType.LOAD || eventType == StreamingAnalyticsEventType.ENGAGE)
                && currentState != State.IDLE) {
				staSM.getLogging().infoLog('Ignored pseudo-event:',
                    StreamingAnalyticsEventType.toString(eventType),
                    'during state',
                    staUtils.stateToString(currentState),
                    eventLabels
                );
				return;
			}

			if (eventType == StreamingAnalyticsEventType.ERROR && eventLabels['ns_st_er'] == null) {
				eventLabels['ns_st_er'] = CommonConstants.UNKNOWN_VALUE;
			}

			if (eventType == StreamingAnalyticsEventType.TRANSFER && eventLabels['ns_st_rp'] == null) {
				eventLabels['ns_st_rp'] = CommonConstants.UNKNOWN_VALUE;
			}

            // handle pseudo state change events
			var labelKey, previousEntryLabelKey, previousEntryValue, newChangePseudoEventValue,
				isChangePseudoEvent = true, isNewChangePseudoEventValueSame = false;

			switch (eventType) {
				case StreamingAnalyticsEventType.BIT_RATE:
					labelKey = 'ns_st_br';
					previousEntryLabelKey = 'ns_st_pbr';
					break;
				case StreamingAnalyticsEventType.PLAYBACK_RATE:
					labelKey = 'ns_st_rt';
					previousEntryLabelKey = 'ns_st_prt';
					break;
				case StreamingAnalyticsEventType.VOLUME:
					labelKey = 'ns_st_vo';
					previousEntryLabelKey = 'ns_st_pvo';
					break;
				case StreamingAnalyticsEventType.WINDOW_STATE:
					labelKey = 'ns_st_ws';
					previousEntryLabelKey = 'ns_st_pws';
					break;
				case StreamingAnalyticsEventType.AUDIO:
					labelKey = 'ns_st_at';
					previousEntryLabelKey = 'ns_st_pat';
					break;
				case StreamingAnalyticsEventType.VIDEO:
					labelKey = 'ns_st_vt';
					previousEntryLabelKey = 'ns_st_pvt';
					break;
				case StreamingAnalyticsEventType.SUBS:
					labelKey = 'ns_st_tt';
					previousEntryLabelKey = 'ns_st_ptt';
					break;
				case StreamingAnalyticsEventType.CDN:
					labelKey = 'ns_st_cdn';
					previousEntryLabelKey = 'ns_st_pcdn';
					break;
				default:
					isChangePseudoEvent = false;
					break;
			}


			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

			if (isChangePseudoEvent && labelKey in eventLabels) {
				newChangePseudoEventValue = eventLabels[labelKey];

				switch (eventType) {
					case StreamingAnalyticsEventType.BIT_RATE:
					case StreamingAnalyticsEventType.VOLUME:
					case StreamingAnalyticsEventType.WINDOW_STATE:
						if (labelKey in userSpecifiedPersistentLabels) {
							previousEntryValue = userSpecifiedPersistentLabels[labelKey];
							eventLabels[previousEntryLabelKey] = previousEntryValue;

							isNewChangePseudoEventValueSame = newChangePseudoEventValue == previousEntryValue + '';
						}

						userSpecifiedPersistentLabels[labelKey] = eventLabels[labelKey];
						break;
					case StreamingAnalyticsEventType.AUDIO:
					case StreamingAnalyticsEventType.VIDEO:
					case StreamingAnalyticsEventType.SUBS:
					case StreamingAnalyticsEventType.CDN:
						if (currentAsset.hasInternalLabel(labelKey)) {
							previousEntryValue = currentAsset.getInternalLabel(labelKey);
							eventLabels[previousEntryLabelKey] = previousEntryValue;

							isNewChangePseudoEventValueSame = newChangePseudoEventValue == previousEntryValue + '';
						}

						currentAsset.setInternalLabel(labelKey, eventLabels[labelKey]);
						break;
					case StreamingAnalyticsEventType.PLAYBACK_RATE:
						previousEntryValue = currentAsset.getPlaybackRate();
						eventLabels[previousEntryLabelKey] = previousEntryValue + '';

                        // Playback rate has to be saved after measurement labels are calculated.
						break;
				}
			}

            // Pseudo state change events are only send if the current status is not PLAYING or BUFFERING_DURING_PLAYBACK,
            // We consider BUFFERING_DURING_PLAYBACK because we might end up not sending any measurement at all.
            //
            // Also, a measurement is not send if there was no value change.
			if (isChangePseudoEvent
                && currentState != State.PLAYING
                && currentState != State.BUFFERING_DURING_PLAYBACK
                || isChangePseudoEvent && isNewChangePseudoEventValueSame) {

				if (eventType == StreamingAnalyticsEventType.PLAYBACK_RATE) {
					currentAsset.setPlaybackRate(parseInt(eventLabels['ns_st_rt']));
				}

				staSM.getLogging().infoLog('No measurement send for the pseudo-event:',
                    StreamingAnalyticsEventType.toString(eventType),
                    'during state',
                    staUtils.stateToString(currentState),
                    eventLabels
                );

				return;
			}

			var previousTrackedTimestamp = !isNaN(lastEventTimestamp) ? lastEventTimestamp : initTimestamp;
			lastEventTimestamp = eventTimestamp;
			var systemClockErrorFlagDetected = false;
			if (eventTimestamp < previousTrackedTimestamp || systemClockJumpDetected) {
				systemClockErrorFlagDetected = true;
				systemClockJumpDetected = false;

				if (eventTimestamp < previousTrackedTimestamp) {
                    // Library detected a client-side clock change backwards,
                    // but prior to the timestamp reported for the last event notification
                    // Note that event notifications do not necessarily cause a measurements to be transmitted.
					currentPlaybackSession.addInternalErrorFlag('1');

					staSM.getLogging().infoLog('System clock jump detected', 'to the far past');
				} else if (wasSystemClockJumpToFuture) {
                    // Library detected a client-side clock change forwards.
                    // Note that event notifications do not necessarily cause a measurements to be transmitted.
					currentPlaybackSession.addInternalErrorFlag('3');

					staSM.getLogging().infoLog('System clock jump detected', 'to the future');
				} else {
                    // Library detected a client-side clock change backwards,
                    // but later to the timestamp reported for the last event notification
                    // Note that event notifications do not necessarily cause a measurements to be transmitted.
					currentPlaybackSession.addInternalErrorFlag('2');

					staSM.getLogging().infoLog('System clock jump detected', 'to the near past');
				}

				eventTimestamp = previousTrackedTimestamp;
			}

			if (!eventLabels['ns_st_po']) {
				if (!currentAsset.isAutoCalculatePositionsEnabled()) {
					eventLabels['ns_st_po'] = latestEventPosition + '';
				} else {
					eventLabels['ns_st_po'] = currentAsset.getExpectedPlaybackPosition(eventTimestamp) + '';
				}
			} else {
				currentAsset.setPlaybackWindowOffset(currentAsset.getExpectedWindowOffset(parseInt(eventLabels['ns_st_po']), eventTimestamp));
			}

			var currentPosition = parseInt(eventLabels['ns_st_po']);
			latestEventPosition = currentPosition;

            // If a position value is provided, then set internal position to that value
			staSM.getPlaybackSession().getAsset().setPlaybackTimeOffset(currentPosition, eventTimestamp);
			currentAsset.setPreviousPlaybackWindowOffset( currentAsset.getPlaybackWindowOffset());

            // If playback has started
			if (currentState != State.IDLE
                && currentState != State.PLAYBACK_NOT_STARTED
                && currentState != State.SEEKING_BEFORE_PLAYBACK
                && currentState != State.BUFFERING_BEFORE_PLAYBACK) {
                // Update elapsed time; labels ns_st_et, ns_st_det (delta).
				currentAsset.addElapsedTime(eventTimestamp);
				currentAsset.setElapsedTimestamp(eventTimestamp);
			}

            // accumulate playbackSession and asset playback time
			if (currentState == State.PLAYING) {
				currentPlaybackSession.addPlaybackTime(eventTimestamp);
				currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

				currentAsset.addPlaybackTime(eventTimestamp);
				currentAsset.setPlaybackTimestamp(eventTimestamp);

				currentAsset.addAccumulatedPlayback(currentPosition);

                // Update unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
                // Update unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
                // Update longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
                // Update longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
				currentAsset.addInterval(parseInt(eventLabels['ns_st_po']));
				currentAsset.setPlaybackStartPosition(parseInt(eventLabels['ns_st_po']));
			}

			if (currentState == State.BUFFERING_BEFORE_PLAYBACK
                || currentState == State.BUFFERING_DURING_PAUSE
                || currentState == State.BUFFERING_DURING_PLAYBACK
                || currentState == State.BUFFERING_DURING_SEEKING) {
				currentPlaybackSession.addBufferingTime(eventTimestamp);
				currentPlaybackSession.setBufferingTimestamp(eventTimestamp);

				currentAsset.addBufferingTime(eventTimestamp);
				currentAsset.setBufferingTimestamp(eventTimestamp);
			}

			var eventData = self.createLabels(eventType, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

			if (eventType == StreamingAnalyticsEventType.PLAYBACK_RATE) {
				currentAsset.setPlaybackRate(parseInt(eventLabels['ns_st_rt']));
			}

			if (systemClockErrorFlagDetected) {
                //The lastEventTimestamp var is the actual eventTimestamp.
				currentAsset.setPlaybackTimeOffset(currentPosition, lastEventTimestamp);

				if (currentState == State.PLAYING) {
					currentPlaybackSession.setPlaybackTimestamp(lastEventTimestamp);
					currentAsset.setPlaybackTimestamp(lastEventTimestamp);
				}

				if (currentState != State.IDLE
                    && currentState != State.PLAYBACK_NOT_STARTED
                    && currentState != State.SEEKING_BEFORE_PLAYBACK
                    && currentState != State.BUFFERING_BEFORE_PLAYBACK) {
					currentAsset.setElapsedTimestamp(lastEventTimestamp);
				}

				if (currentState == State.BUFFERING_BEFORE_PLAYBACK
                    || currentState == State.BUFFERING_DURING_PAUSE
                    || currentState == State.BUFFERING_DURING_PLAYBACK
                    || currentState == State.BUFFERING_DURING_SEEKING
                    || currentState == State.PAUSED_DURING_BUFFERING) {
					currentPlaybackSession.setBufferingTimestamp(lastEventTimestamp);
					currentAsset.setBufferingTimestamp(lastEventTimestamp);
				}

				if (currentState == State.SEEKING_BEFORE_PLAYBACK
                    || currentState == State.SEEKING_DURING_BUFFERING
                    || currentState == State.SEEKING_DURING_PAUSE
                    || currentState == State.SEEKING_DURING_PLAYBACK
                    || currentState == State.BUFFERING_DURING_SEEKING
                ) {
					currentAsset.setSeekingTimestamp(lastEventTimestamp);
				}
			}
		},

		getState: function () {
			return staSM.getStateMachine().getCurrentState();
		},

		addListener: function (listener) {
			listenerList.push(listener);
		},

		removeListener: function (listener) {
			listenerList.splice(arrayUtils.indexOf(listener, listenerList), 1);
		},

		getLabel: function (name) {
			return userSpecifiedPersistentLabels[name];
		},

		getLabels: function () {
			return userSpecifiedPersistentLabels;
		},

		setLabel: function (name, value) {
			if (value == null) {
				delete userSpecifiedPersistentLabels[name];
			} else {
				userSpecifiedPersistentLabels[name] = value;
			}
		},

		setLabels: function (labelMap) {
			for (var label_name in labelMap) {
				if (labelMap.hasOwnProperty(label_name)) {
					self.setLabel(label_name, labelMap[label_name]);
				}
			}
		},

		getPlatformAPI: function () {
			return staSM.getAppCore().getPlatformAPI();
		},

		getExports: function () {
			return exports;
		},

		isProperlyInitialized: function () {
			var appContext = staSM.getAppCore().getAppContext();
			var salt = staSM.getAppCore().getSalt();
			var liveEndpointURL = staSM.getAppCore().getPixelURL();

			return appContext && liveEndpointURL && salt;
		},

		setThrottlingDelay: function (value) {
			throttlingDelay = value;
		},

		getThrottlingDelay: function () {
			return throttlingDelay;
		},

		isThrottlingEnabled: function () {
			return throttlingEnabled;
		},

		setThrottlingEnabled: function (flag) {
			throttlingEnabled = flag;
		},

		isLoadingTimeSent: function () {
			return loadingTimeSent;
		},

		setLoadingTimeSent: function (flag) {
			loadingTimeSent = flag;
		},

		getLoadTimeOffset: function () {
			return loadTimeOffset;
		},

		setLoadTimeOffset: function (offset) {
			loadTimeOffset = offset;
		},

		getInitTimestamp: function () {
			return initTimestamp;
		},

		setPauseOnBufferingInterval: function (interval) {
			pauseOnBufferingInterval = interval;
		},

		getPauseOnBufferingInterval: function () {
			return pauseOnBufferingInterval;
		},

		isPauseOnBufferingEnabled: function () {
			return pauseOnBufferingEnabled;
		},

		setPauseOnBufferingEnabled: function (flag) {
			pauseOnBufferingEnabled = flag;
		},

		setExitEndEventEnabled: function (flag) {
			if(isExitEndEventEnabled != flag) {

				var currentState = staSM.getStateMachine().getCurrentState();

				if(!flag && !staUtils.isIdleState(currentState)) {
					handlePageExit.removePageExitListener(onPageExitListener);
				} else if (flag && !staUtils.isIdleState(currentState)) {
					handlePageExit.onPageExit(onPageExitListener);
				}
			}

			isExitEndEventEnabled = flag;
		},

		isExitEndEventEnabled: function () {
			return isExitEndEventEnabled;
		},

		startPausedOnBufferingTimer: function (onBufferEventTimestamp, onBufferEventLabels) {
			self.stopPausedOnBufferingTimer();

			pausedOnBufferingTimer = self.getPlatformAPI().setTimeout(function () {
				var eventLabels = {};
				var eventTimestamp = staUtils.fixEventTime(eventLabels);

				var onBufferPosition = parseInt(onBufferEventLabels['ns_st_po']);
				eventLabels['ns_st_po'] = onBufferPosition + '';

				self.newEvent(
                    StreamingAnalyticsEventType.PAUSE_ON_BUFFERING,
                    eventTimestamp,
                    eventLabels);
			}, pauseOnBufferingInterval);
		},

		stopPausedOnBufferingTimer: function () {
			if (pausedOnBufferingTimer != null) {
				self.getPlatformAPI().clearTimeout(pausedOnBufferingTimer);
				pausedOnBufferingTimer = null;
			}
		},

		stopDelayedTransitionTimer: function () {
            // cancel the throttling timer if it is already started
			if (delayedTransitionTimer) {
				self.getPlatformAPI().clearTimeout(delayedTransitionTimer);
				delayedTransitionTimer = null;
			}
		},

		setLiveEndpointURL: function (value) {
			if (value == null || value.length == 0) {
                // ignore value
				return null;
			}

			var decode = decodeURIComponent || unescape;

            // Handle labels, if any
			var questionMarkIdx = value.indexOf('?');
			if (questionMarkIdx >= 0) {
				if (questionMarkIdx < value.length - 1) {
					var labels = value.substring(questionMarkIdx + 1).split('&');
					for (var i = 0, len = labels.length; i < len; i++) {
						var label = labels[i];
						var pair = label.split('=');
						if (pair.length == 2) {
							self.setLabel(pair[0], decode(pair[1]));
						} else if (pair.length == 1) {
							self.setLabel(StreamingAnalyticsConstants.PAGE_NAME_LABEL, decode(pair[0]));
						}
					}
					value = value.substring(0, questionMarkIdx + 1);
				}
			} else {
				value = value + '?';
			}
            // Ok, this a liveEndpointURL
			liveEndpointURL = value;

			return liveEndpointURL;
		},

		getLiveEndpointURL: function () {
			if (liveEndpointURL) {
				return liveEndpointURL;
			} else if (typeof ns_p !== _undefined && typeof ns_p.src === 'string') {
				return (liveEndpointURL = ns_p.src.replace(/&amp;/, '&').replace(/&ns__t=\d+/, ''));
			} else if (typeof ns_pixelUrl === 'string') {
				return (liveEndpointURL = ns_pixelUrl.replace(/&amp;/, '&').replace(/&ns__t=\d+/, ''));
			}

			return null;
		},

		getStaSM: function () {
			return staSM;
		},

		resetPlaybackSession: function (keepLabels) {
			var oldPlaybackSession = staSM.getPlaybackSession();
			staSM.setPlaybackSession(new PlaybackSession(staSM));

			PlaybackSession.resetPlaybackSession(staSM, oldPlaybackSession, keepLabels);
		},

		resetHeartbeat: function () {
			staSM.getHeartbeat().pause();
			var intervals = staSM.getHeartbeat().getIntervals();
			staSM.setHeartbeat(new Heartbeat(staSM));
			staSM.getHeartbeat().setIntervals(intervals);
		},

		getVersion: function () {
			return STREAMINGANALYTICS_VERSION;
		}
	});

	init();
}

module.exports = STACore;

},{"17":17,"18":18,"19":19,"2":2,"20":20,"24":24,"55":55,"58":58,"59":59,"60":60,"61":61,"62":62,"63":63,"65":65,"66":66,"68":68,"69":69,"70":70,"71":71,"72":72,"73":73,"74":74,"75":75,"76":76,"77":77,"78":78,"79":79,"80":80,"81":81,"82":82}],57:[function(require,module,exports){
/* eslint-env browser */

var browserUtils = require(20),
	Constants = require(4),
	_undefined = 'undefined';

/**
 * Mock DOM (if necessary)
 */

var win, d;

if (browserUtils.isBrowser()) {
	win = window;
	d = document;
} else {
    // mock objects
	win = {};
	d = {
		location: {
			href: ''
		},
		title: '',
		URL: '',
		referrer: '',
		cookie: ''
	};
}

function prepareUrl(liveEndpointURL, labels) {
	var u,
		esc = win.encodeURIComponent || escape,
		l = [],
		orderedLabels = Constants.LABELS_ORDER,
		liveEndpointURLSplit = liveEndpointURL.split('?'),
		liveEndpointURLBase = liveEndpointURLSplit[0],
		liveEndpointURLParams = liveEndpointURLSplit[1],
		liveEndpointURLPairs = liveEndpointURLParams.split('&');

    // split labels in liveEndpointURL so that they can be sorted
	for (var index1 = 0, position1 = liveEndpointURLPairs.length; index1 < position1; index1++) {
		var kv = liveEndpointURLPairs[index1].split('='),
			k = unescape(kv[0]),
			v = unescape(kv[1]);
		if (k) labels[k] = v;
	}

    // sort all labels that are defined in orderedLabels
	var seen = {};
	for (var i = 0, n = orderedLabels.length; i < n; i++) {
		var orderedLabel = orderedLabels[i];
		if (labels.hasOwnProperty(orderedLabel)) {
			var orderedLabelValue = labels[orderedLabel];
			if (typeof orderedLabelValue !== _undefined && orderedLabelValue != null) {
				seen[orderedLabel] = true;
				l.push(esc(orderedLabel) + '=' + esc(labels[orderedLabel]));
			}
		}
	}

    // push additional labels to the end
	for (var label in labels) {
		if (labels.hasOwnProperty(label)) {
			if (seen[label]) continue;
			var value = labels[label];
			if (typeof value !== _undefined && value != null) {
				l.push(esc(label) + '=' + esc(labels[label]));
			}
		}
	}

    // build the url
	u = liveEndpointURLBase + '?' + l.join('&');

    // add c7, c8 and c9 if necessary
	u = u
        + (u.indexOf('&c8=') < 0 ? '&c8=' + esc(d.title) : '')
        + (u.indexOf('&c7=') < 0 ? '&c7=' + esc(d.URL) : '')
        + (u.indexOf('&c9=') < 0 ? '&c9=' + esc(d.referrer) : '');

	var urlLengthLimit = browserUtils.browserAcceptsLargeURLs() ? Constants.URL_LENGTH_LIMIT : Constants.RESTRICTED_URL_LENGTH_LIMIT;

    // apply ns_cut if limit exceeded
	if (u.length > urlLengthLimit && u.indexOf('&') > 0) {
		var last = u.substr(0, urlLengthLimit - 8).lastIndexOf('&');

		u = (u.substring(0, last)
        + '&ns_cut='
        + esc(u.substring(last + 1))).substr(0, urlLengthLimit);
	}
	return u;
}

module.exports = prepareUrl;
},{"20":20,"4":4}],58:[function(require,module,exports){
var StreamingAnalyticsEventType = (function () {
	var stringMap = ['play', 'pause', 'pause-on-buffering', 'end', 'buffer', 'buffer-stop', 'keep-alive', 'hb', 'custom', 'load', 'start', 'skstart',
		'adskip', 'cta', 'error', 'trans', 'drmfa', 'drmap', 'drmde', 'bitrt', 'playrt', 'volume', 'window', 'audio',
		'video', 'subs', 'cdn'];

	return {
		PLAY: 0,
		PAUSE: 1,
		PAUSE_ON_BUFFERING: 2,
		END: 3,
		BUFFER: 4,
		BUFFER_STOP: 5,
		KEEPALIVE: 6,
		HEARTBEAT: 7,
		CUSTOM: 8,
		LOAD: 9,
		ENGAGE: 10,
		SEEK_START: 11,
		AD_SKIP: 12,
		CTA: 13,
		ERROR: 14,
		TRANSFER: 15,
		DRM_FAILED: 16,
		DRM_APPROVED: 17,
		DRM_DENIED: 18,
		BIT_RATE: 19,
		PLAYBACK_RATE: 20,
		VOLUME: 21,
		WINDOW_STATE: 22,
		AUDIO: 23,
		VIDEO: 24,
		SUBS: 25,
		CDN: 26,
		toString: function (eventType) {
			return stringMap[eventType];
		}
	};
})();

var State = {
	IDLE: 0,
	PLAYBACK_NOT_STARTED: 1,
	PLAYING: 2,
	PAUSED: 3,
	BUFFERING_BEFORE_PLAYBACK: 4,
	BUFFERING_DURING_PLAYBACK: 5,
	BUFFERING_DURING_SEEKING: 6,
	BUFFERING_DURING_PAUSE: 7,
	SEEKING_BEFORE_PLAYBACK: 8,
	SEEKING_DURING_PLAYBACK: 9,
	SEEKING_DURING_BUFFERING: 10,
	SEEKING_DURING_PAUSE: 11,
	PAUSED_DURING_BUFFERING: 12
};

var ImplementationType = (function () {
	var stringMap = ['c', 's', 'r'];

	return {
		SINGLE_CLIP: 0,
		SEGMENTED: 1,
		REDUCED: 2,
		toString: function (eventType) {
			return stringMap[eventType];
		}
	};
})();

module.exports.StreamingAnalyticsEventType = StreamingAnalyticsEventType;
module.exports.State = State;
module.exports.ImplementationType = ImplementationType;
},{}],59:[function(require,module,exports){
var objectUtils = require(24),
	prepareUrl = require(57),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function EventManager (staSM) {
	var self = this,
		eventCounter,
		measurementSnapshot,
		measurementListeners = [];

	function init() {
		eventCounter = 1;
	}

	function dispatch(dispatchLabels) {
		measurementSnapshot = objectUtils.extend({}, dispatchLabels);

		var liveEndpointURL = staSM.getStaCore().getLiveEndpointURL();

		if (staSM.getStaCore().isProperlyInitialized()) {
			staSM.getAppCore().internalHidden(dispatchLabels, liveEndpointURL);
		} else if (liveEndpointURL) {
			staSM.getStaCore().getPlatformAPI().httpGet(prepareUrl(liveEndpointURL, dispatchLabels));
		}
	}

	objectUtils.extend(this, {
		newEvent: function (eventData) {
			var measurementLabels = objectUtils.extend({}, eventData.eventLabels, eventData.customLabels);

			for (var i = 0; i < measurementListeners.length; ++i) {
				measurementListeners[i](measurementLabels);
			}

			dispatch(measurementLabels);

			if (eventData.eventType != StreamingAnalyticsEventType.HEARTBEAT) {
				self.incrementEventCounter();
			}
		},

		addMeasurementListener: function (onMeasurement) {
			if (typeof onMeasurement != 'function') {
				return;
			}

			measurementListeners.push(onMeasurement);
		},

		removeMeasurementListener: function (onMeasurement) {
			var index = NaN;
			for (var i = 0; i < measurementListeners.length; ++i) {
				if (measurementListeners[i] == onMeasurement) {
					index = i;
					break;
				}
			}

			if (isNaN(index)) {
				return;
			}

			measurementListeners.splice(index, 1);
		},

		getEventCounter: function () {
			return eventCounter;
		},

		incrementEventCounter: function () {
			eventCounter++;
		},

		setEventCounter: function (value) {
			eventCounter = value;
		},

		getMeasurementSnapshot: function () {
			return measurementSnapshot;
		}
	});

	init();
}

module.exports = EventManager;

},{"24":24,"57":57,"58":58}],60:[function(require,module,exports){
var StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType,
	staUtils = require(68),
	objectUtils = require(24),
	DEFAULT_HEARTBEAT_INTERVAL = [ {playingtime: 60000, interval: 10000}, {playingtime: null, interval: 60000} ];

function Heartbeat (staSM) {
	var self = this,
		intervals = DEFAULT_HEARTBEAT_INTERVAL,
		timer,
		nextInterval,
		count;

	function init() {
		nextInterval = 0;
		count = 0;
	}

	function dispatchHeartBeatEvent() {
		count++;

		var labels = {};

        // compute the timestamp of the event
		var eventTimestamp = staUtils.fixEventTime(labels);

		labels['ns_st_hc'] = staSM.getHeartbeat().getCount() + '';

		var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.HEARTBEAT, labels, eventTimestamp);
		staSM.getPlaybackSession().getAsset().updateIndependentLabels(eventData.eventLabels);
		staSM.getEventManager().newEvent(eventData);

		nextInterval = 0;
		self.resume();
	}

	function stop() {
		if (timer != null) {
			staSM.getStaCore().getPlatformAPI().clearTimeout(timer);
			timer = null;
		}
	}

	objectUtils.extend(this, {
		getCount: function () {
			return count;
		},

		setIntervals: function (value) {
			intervals = value;
		},

		getInterval: function (playbackTime) {
			var res = 0;
			if (intervals != null) {
				for (var i = 0; i < intervals.length; i++) {
					var obj = intervals[i];
					var playingTime = obj.playingtime;
                    //if playing time in the interval is null/undefined or current playback Time  is lower
                    // than picked from intervals array
					if (!playingTime || playbackTime < playingTime) {
						res = obj.interval;
						break;
					}
				}
			}
			return res;
		},

		getIntervals: function () {
			return intervals;
		},

		resume: function () {
			stop();

			var interval = self.getInterval(staSM.getPlaybackSession().getAsset().getPlaybackTime() +
                (+new Date() - staSM.getPlaybackSession().getAsset().getPlaybackTimestamp()));

			if (interval > 0) {
                // Schedule the timer
				var delay = nextInterval > 0 ? nextInterval : interval;
				timer = staSM.getStaCore().getPlatformAPI().setTimeout(dispatchHeartBeatEvent, delay);
			}

			nextInterval = 0;
		},

		pause: function () {
			stop();
			var interval = self.getInterval(staSM.getPlaybackSession().getAsset().getPlaybackTime()
                + (+new Date() - staSM.getPlaybackSession().getAsset().getPlaybackTimestamp()));
			nextInterval = interval - ((staSM.getPlaybackSession().getAsset().getPlaybackTime()
                + (+new Date() - staSM.getPlaybackSession().getAsset().getPlaybackTimestamp())) % interval);
		}
	});

	init();
}

module.exports = Heartbeat;
},{"24":24,"58":58,"68":68}],61:[function(require,module,exports){
var StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType,
	objectUtils = require(24),
	staUtils = require(68),

	DEFAULT_KEEP_ALIVE_INTERVAL = 1200000;

function KeepAlive (staSM) {
	var self = this,
		interval = DEFAULT_KEEP_ALIVE_INTERVAL,
		timer;

	function init() {

	}

	function dispatchKeepAlive() {
		var labels = {};

        // compute the timestamp of the event
		var eventTimestamp = staUtils.fixEventTime(labels);

		staSM.getStaCore().newPseudoEvent(StreamingAnalyticsEventType.KEEPALIVE, eventTimestamp, labels);

		self.start();
	}

	function stop() {
		if (timer != null) {
			staSM.getStaCore().getPlatformAPI().clearTimeout(timer);
			timer = null;
		}
	}

	objectUtils.extend(self, {
		start: function () {
			stop();

			timer = staSM.getStaCore().getPlatformAPI().setTimeout(dispatchKeepAlive, interval);
		},
		stop: stop,

		setInterval: function (value) {
			interval = value;
		},

		getInterval: function () {
			return interval;
		}
	});

	init();
}

module.exports = KeepAlive;
},{"24":24,"58":58,"68":68}],62:[function(require,module,exports){
/* eslint-env browser */

var browserUtils = require(20);

var pageExitListeners = [],
	isListening = false;

function onPageExit(listener) {
	pageExitListeners.push(listener);

	if (!isListening) {
		addGlobalListener();
	}
}

function removePageExitListener(listener) {
	for (var i = 0; i<pageExitListeners.length; ++i) {
		if(pageExitListeners[i] == listener) {
			pageExitListeners.splice(i, 1);
			break;
		}
	}

	if(pageExitListeners.length == 0) {
		removeGlobalListener();
	}
}

/**
 * Registers an unique listener to be executed when the page is leaving.
 * */
function addGlobalListener() {
	if (browserUtils.isBrowser()) {
		if (window.addEventListener) { // W3C DOM

            // We specify useCapture argument because otherwise older browser will fail with an error.
			window.addEventListener('unload', handlePageExitGlobal, false);

			isListening = true;
		} else if (window.attachEvent) { // IE DOM
			window.attachEvent('onunload', handlePageExitGlobal);

			isListening = true;
		}
	}
}

/**
 * Removes the unique listener from the page exit event.
 * */
function removeGlobalListener() {
	if (browserUtils.isBrowser()) {
		if (window.removeEventListener) { // W3C DOM
			window.removeEventListener('unload', handlePageExitGlobal, false);

			isListening = false;
		} else if (window.detachEvent) { // IE DOM
			window.detachEvent('onunload', handlePageExitGlobal);

			isListening = false;
		}
	}
}

function handlePageExitGlobal() {
	for(var i = 0; i < pageExitListeners.length; ++i) {
		pageExitListeners[i]();
	}
}

module.exports = {
	onPageExit: onPageExit,
	removePageExitListener: removePageExitListener
};

},{"20":20}],63:[function(require,module,exports){
var objectUtils = require(24),
	Asset = require(54),
	staUtils = require(68),
	generalUtils = require(21),
	HASH_LABELS = require(55).HASH_LABELS,
	State = require(58).State,
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function PlaybackSession(staSM) {
	var self = this,
		asset,
		bufferingTimestamp,
		playbackTime,
		playbackTimestamp,
		internalLabels,
		userSpecifiedLabels,
		playbackSessionStarted,
		assets,
		maxAssetNumber,
		firstEventSent,
		playbackCounter,
		playSequenceCounter,
		pauseEventCounter,
		playbackSequenceCounter,
		accumulatedBufferingTime,
		internalErrorFlags;

	function init() {
		asset = new Asset();

		internalLabels = {};
		internalLabels['ns_st_id'] = +new Date() + '';

		userSpecifiedLabels = {};

		bufferingTimestamp = NaN;
		playbackTime = 0;
		playbackTimestamp = NaN;
		assets = {};
		maxAssetNumber = 0;
		playbackSessionStarted = false;
		firstEventSent = false;
		playbackCounter = 0;
		pauseEventCounter = 0;

		playSequenceCounter = 0;
		playbackSequenceCounter = 1;
		accumulatedBufferingTime = 0;

		internalErrorFlags = [];
	}

	objectUtils.extend(this, {
		resetAsset: function () {
			var oldAsset = asset;
			asset = new Asset();

			Asset.resetAsset(oldAsset, asset);
		},

		hashExists: function (hash) {
			return assets[hash] != null;
		},

		storeHash: function (hash) {
			assets[hash] = {};
		},

		removeHash: function (hash) {
			delete assets[hash];
		},

		storeAssetPlaybackCounters: function () {
            // get the asset hash from the currently set asset
			for (var hash in assets) {
				if (assets.hasOwnProperty(hash) && assets[hash].clipNumber === asset.getClipNumber()) {
                    // store some registers values for the current asset
					objectUtils.extend(assets[hash], {
						segmentPlaybackCounter: asset.getSegmentPlaybackCounter(),
						assetLoadCounter: asset.getAssetLoadCounter(),
						assetPlaybackCounter: asset.getAssetPlaybackCounter(),
						lowestPartNumberPlayed: asset.getLowestPartNumberPlayed(),
						seeking: asset.isSeeking(),
						seekingTimeBeforeEnd: asset.getSeekingTimeBeforeEnd(),
						seekingStartPosition: asset.getSeekStartPosition(),
						segmentPlaybackIntervals: asset.getSegmentPlaybackIntervals(),
						videoTrack: asset.getVideoTrack(),
						audioTrack: asset.getAudioTrack(),
						subtitleTrack: asset.getSubtitleTrack(),
						cdn: asset.getCDN(),
						playSequenceCounter: asset.getPlaySequenceCounter(),
						previousUniquePlaybackInterval: asset.getPreviousUniquePlaybackInterval(),
						previousEventIndependentUniquePlaybackInterval: asset.getPreviousEventIndependentUniquePlaybackInterval(),
						previousLongestPlaybackInterval: asset.getPreviousLongestPlaybackInterval()
					});

					break;
				}
			}
		},

		getStoredAssetRegisters: function (hash) {
			return assets[hash];
		},

		getClipNumber: function (hash) {
			return assets[hash].clipNumber;
		},

		getMaxClipNumber: function () {
			return maxAssetNumber;
		},

		storeClipNumber: function (hash, assetId) {
			assets[hash].clipNumber = assetId;
			if (assetId > maxAssetNumber) {
				maxAssetNumber = assetId;
			}
		},

		setLabels: function (labels) {
			if (labels != null) {
				objectUtils.extend(userSpecifiedLabels, labels);
			}
		},

		getLabels: function () {
			return userSpecifiedLabels;
		},

		setLabel: function (label, value) {
			var map = {};
			map[label] = value;
			self.setLabels(map);
		},

		getLabel: function (label) {
			return userSpecifiedLabels[label];
		},

		getAsset: function () {
			return asset;
		},

		addInternalErrorFlag: function (internalErrorFlag) {
			for (var i=0; i<internalErrorFlags.length; ++i) {
				if (internalErrorFlags[i] == internalErrorFlag) {
					return;
				}
			}

			internalErrorFlags.push(internalErrorFlag);
		},

		createLabels: function (initialLabels, eventTimestamp) {
			var labels = initialLabels;

			var playbackTime = !generalUtils.isEmpty(labels['ns_st_pa']) ? parseInt(labels['ns_st_pa']) : self.getPlaybackTime();
			labels['ns_st_pa'] = playbackTime + (!isNaN(playbackTimestamp) ? eventTimestamp - playbackTimestamp : 0) + '';

			labels['ns_st_pp'] = pauseEventCounter + '';
			labels['ns_st_sp'] = playbackSequenceCounter + '';
			labels['ns_st_bp'] = accumulatedBufferingTime + '';

			if (!firstEventSent) {
				labels['ns_st_pb'] = labels['ns_st_pb'] != null ? labels['ns_st_pb'] : '1';
			}

			if (asset.isPlaybackStarted()) {
				labels['ns_st_ppc'] = playbackCounter + '';
				labels['ns_st_psq'] = playSequenceCounter + '';
			}

			if(internalErrorFlags.length > 0) {
				labels['ns_st_ie'] = (labels['ns_st_ie'] ? labels['ns_st_ie'] + ';' : '' ) + internalErrorFlags.join(';');
			}

			objectUtils.extend(labels, internalLabels);
		},

		incrementPlayCounter: function () {
			playbackSequenceCounter++;
		},

		incrementPauses: function () {
			pauseEventCounter++;
		},

		addPlaybackTime: function (now) {
			if (isNaN(playbackTimestamp)) return;

			var playbackTime = self.getPlaybackTime();
			playbackTime += now - playbackTimestamp;
			self.setPlaybackTime(playbackTime);
			playbackTimestamp = NaN;
		},

		addBufferingTime: function (now) {
			if (isNaN(bufferingTimestamp)) return;

			var bufferingTime = self.getBufferingTime();
			bufferingTime += now - bufferingTimestamp;
			self.setBufferingTime(bufferingTime);
			bufferingTimestamp = NaN;
		},

		getBufferingTime: function () {
			return accumulatedBufferingTime;
		},

		setBufferingTime: function (value) {
			accumulatedBufferingTime = value;
		},

		getPlaybackTime: function () {
			return playbackTime;
		},

		setBufferingTimestamp: function (value) {
			bufferingTimestamp = value;
		},

		getBufferingTimestamp: function () {
			return bufferingTimestamp;
		},

		setPlaybackTime: function (value) {
			playbackTime = value;
		},

		setPlaybackTimestamp: function (value) {
			playbackTimestamp = value;
		},

		getPlaybackTimestamp: function () {
			return playbackTimestamp;
		},

		getPauses: function () {
			return pauseEventCounter;
		},

		setPauses: function (value) {
			pauseEventCounter = value;
		},

		isPlaybackSessionStarted: function () {
			return playbackSessionStarted;
		},

		setPlaybackSessionStarted: function (flag) {
			playbackSessionStarted = flag;
		},

		getPlaybackCounter: function () {
			return playbackCounter;
		},

		incrementPlaybackCounter: function () {
			playbackCounter++;
		},

		setFirstEventSent: function (flag) {
			firstEventSent = flag;
		},

		setPlaySequenceCounter: function (value) {
			playSequenceCounter = value;
		},

		incrementPlaySequenceCounter: function () {
			playSequenceCounter++;
		},

		getPlaybackSessionID: function () {
			return internalLabels['ns_st_id'];
		},

		setAsset: function (labels, isLoop) {
			staSM.getLogging().apiCall('setAsset', labels, isLoop);

			labels = staUtils.jsonObjectToStringDictionary(labels);

			var currentState = staSM.getStateMachine().getCurrentState();
			if (currentState != State.IDLE) {
				staSM.getLogging().infoLog('Ending the current Clip. It was in state:',
                    staUtils.stateToString(currentState)
                );

				var forceEndCurrentAsset = {};
				staSM.getStaCore().newEvent(StreamingAnalyticsEventType.END, staUtils.fixEventTime(forceEndCurrentAsset), forceEndCurrentAsset);
			}

			var hash = '';
			var clipNumber = 0;

            //build a hash by concatenating all of the standard metadata labels along with their values
			if (labels['ns_st_cn'] != null) {
				hash = labels['ns_st_cn'];
			} else {
				for (var i = 0; i < HASH_LABELS.length; i++) {
					if (labels[HASH_LABELS[i]]) {
						hash += HASH_LABELS[i] + ':' + labels[HASH_LABELS[i]] + ';';
					}
				}
			}

			var playbackSession = self;
			var currentAsset = playbackSession.getAsset();

            // if the asset has started playback
			if (currentAsset.isAssetStarted()) {
                // if the current asset hash is not already known to the playbackSession
				if (!playbackSession.hashExists(currentAsset.getHash())) {
					playbackSession.storeHash(currentAsset.getHash());
					playbackSession.storeClipNumber(currentAsset.getHash(), currentAsset.getClipNumber());
				}

                // store the old asset playback counters
				playbackSession.storeAssetPlaybackCounters();

                // if we're presented with a new asset
				if (!playbackSession.hashExists(hash)) {
                    // if the user has provided a clip number then consume it
					if (generalUtils.exists(labels['ns_st_cn'])) {
						clipNumber = parseInt(labels['ns_st_cn']);
					} else {
						clipNumber = playbackSession.getMaxClipNumber() + 1;
					}
				} else {
					clipNumber = playbackSession.getClipNumber(hash);
				}
			} else if (playbackSession.hashExists(hash)) {
                // grab the asset number related to this hash
				clipNumber = playbackSession.getClipNumber(hash);
			} else {
                // grab the current assigned clip number on the asset object
				clipNumber = currentAsset.getClipNumber();
			}

            // reset the asset object
			playbackSession.resetAsset();
			currentAsset = playbackSession.getAsset();

            // store the current hash on the asset object
			currentAsset.setHash(hash);

            // set the clip number on the asset object
			currentAsset.setClipNumber(clipNumber);

            // set the asset labels
			currentAsset.setLabels(labels);

            // Retrieve the asset history
			var storedAssetRegisters = playbackSession.getStoredAssetRegisters(hash);

			if (storedAssetRegisters) {
                // set the registers on the asset object accordingly
				currentAsset.setAssetStarted(true);
				currentAsset.setSegmentPlaybackCounter(storedAssetRegisters.segmentPlaybackCounter);
				currentAsset.setAssetLoadCounter(storedAssetRegisters.assetLoadCounter);
				currentAsset.setAssetPlaybackCounter(storedAssetRegisters.assetPlaybackCounter);
				currentAsset.setLowestPartNumberPlayed(storedAssetRegisters.lowestPartNumberPlayed);
				currentAsset.setSeeking(storedAssetRegisters.seeking);
				currentAsset.setSeekingTimeBeforeEnd(storedAssetRegisters.seekingTimeBeforeEnd);
				currentAsset.setSeekStartPosition(storedAssetRegisters.seekingStartPosition);
				currentAsset.setAssetPlaybackIntervals(storedAssetRegisters.segmentPlaybackIntervals);
				storedAssetRegisters.videoTrack && currentAsset.setVideoTrack(storedAssetRegisters.videoTrack);
				storedAssetRegisters.audioTrack && currentAsset.setAudioTrack(storedAssetRegisters.audioTrack);
				storedAssetRegisters.subtitleTrack && currentAsset.setSubtitleTrack(storedAssetRegisters.subtitleTrack);
				storedAssetRegisters.cdn && currentAsset.setCDN(storedAssetRegisters.cdn);
				currentAsset.setPlaySequenceCounter(storedAssetRegisters.playSequenceCounter);
				currentAsset.setPreviousUniquePlaybackInterval(storedAssetRegisters.previousUniquePlaybackInterval);
				currentAsset.setPreviousEventIndependentUniquePlaybackInterval(storedAssetRegisters.previousEventIndependentUniquePlaybackInterval);
				currentAsset.setPreviousLongestPlaybackInterval(storedAssetRegisters.previousLongestPlaybackInterval);
			}

            // increment the load counter value; label ns_st_sc
			currentAsset.incrementAssetLoadCounter();

			if (currentAsset.isAssetStarted() && isLoop) {
				playbackSession.incrementPlayCounter();
			}

			if (isLoop) {
				playbackSession.setPlaySequenceCounter(0);
				currentAsset.setPlaybackSessionLooping(true);
			}

			if (!generalUtils.exists(labels['ns_st_tp']) && generalUtils.exists(labels['ns_st_ad'])
                && generalUtils.isNotEmpty(labels['ns_st_ad']) && labels['ns_st_ad'] !== '0') {
				currentAsset.setInternalLabel('ns_st_tp', '1');
			}
		}
	});

	init();
}

PlaybackSession.resetPlaybackSession = function (staSM, oldPlaybackSession, keepLabels) {
	var oldAsset = oldPlaybackSession.getAsset();
	var oldPlaybackSessionLabels = oldPlaybackSession.getLabels();

	var initialPlaybackSessionLabels = {};

	for (var i = 0; keepLabels && i < keepLabels.length; i++) {
		if (oldPlaybackSessionLabels.hasOwnProperty(keepLabels[i])) {
			initialPlaybackSessionLabels[keepLabels[i]] = oldPlaybackSessionLabels[keepLabels[i]];
		}
	}

	staSM.getPlaybackSession().setLabels(initialPlaybackSessionLabels);

	Asset.resetAsset(oldAsset, staSM.getPlaybackSession().getAsset(), keepLabels);
};

module.exports = PlaybackSession;
},{"21":21,"24":24,"54":54,"55":55,"58":58,"68":68}],64:[function(require,module,exports){
var ContentType = {
	LongFormOnDemand: '12',
	ShortFormOnDemand: '11',
	Live: '13',
	UserGeneratedLongFormOnDemand: '22',
	UserGeneratedShortFormOnDemand: '21',
	UserGeneratedLive: '23',
	Bumper: '99',
	Other: '00'
};

var AdType = {
	LinearOnDemandPreRoll: '11',
	LinearOnDemandMidRoll: '12',
	LinearOnDemandPostRoll: '13',
	LinearLive: '21',
	BrandedOnDemandPreRoll: '31',
	BrandedOnDemandMidRoll: '32',
	BrandedOnDemandPostRoll: '33',
	BrandedOnDemandContent: '34',
	BrandedOnDemandLive: '35',
	Other: '00'
};

var StreamingAnalytics = require(67),
	State = require(58).State,
	ImplementationType = require(58).ImplementationType,
	HASH_LABELS = require(55).HASH_LABELS,
	generalUtils = require(21),
	objectUtils = require(24),
	Logging = require(18);


var ReducedRequirementsStreamingAnalytics = function (settings) {
	var _lastMetadata = null,
		_advertisementNumber = 0,
		_lastMediaWasContent = false,
		_streamingAnalytics = null,
		MediaContentType = {
			None: 0,
			AudioContent: 1,
			VideoContent: 2
		},
		_lastPlayedContentType = MediaContentType.None,
		rrstaLog = new Logging('TTSTA', (settings || {}).debug);

	function _init() {
		_streamingAnalytics = new StreamingAnalytics(settings);

		_streamingAnalytics.setLabel('ns_st_it', ImplementationType.toString(ImplementationType.REDUCED));
	}

	function isLastMetadataSameAs(metadata) {
		for (var key in HASH_LABELS) {
			if (HASH_LABELS.hasOwnProperty(key)
                && !_isLabelEqualsInBothMaps(HASH_LABELS[key], _lastMetadata, metadata)) {
				return false;
			}
		}
		return true;
	}

	function _isLabelEqualsInBothMaps(label, map1, map2) {
		return !!(generalUtils.exists(label) && generalUtils.exists(map1) && generalUtils.exists(map2)
        && ((map1.hasOwnProperty(label) && map2.hasOwnProperty(label) && map1[label] === map2[label])
        || (!map1.hasOwnProperty(label) && !map2.hasOwnProperty(label))));
	}

	function _sendPlayForNewContent(metadata) {
        // setting asset
		_streamingAnalytics.getPlaybackSession().setAsset(metadata);

		_lastMetadata = metadata;
		_streamingAnalytics.notifyPlay();
	}

	function _handlePlayAdvertisement(metadata) {
        // setting asset
		var assetLabels = metadata || {};
		assetLabels['ns_st_ad'] = '1';
		assetLabels['ns_st_an'] = ++_advertisementNumber + '';
		_streamingAnalytics.getPlaybackSession().setAsset(assetLabels);

		_streamingAnalytics.notifyPlay();
		_lastMediaWasContent = false;
	}

	function _handlePlayContentPart(metadata, contentType) {
		if (_lastPlayedContentType == MediaContentType.None) {
			_lastPlayedContentType = contentType;
		}

		if (_lastMediaWasContent && _lastPlayedContentType == contentType) {
			if (!isLastMetadataSameAs(metadata)) {
				_sendPlayForNewContent(metadata);
			} else {
				_streamingAnalytics.getPlaybackSession().getAsset().setLabels(metadata);
				if (_streamingAnalytics.getState() != State.PLAYING) {
					_streamingAnalytics.notifyPlay();
				}
			}
		} else {
			_sendPlayForNewContent(metadata);
		}

		_lastMediaWasContent = true;
		_lastPlayedContentType = contentType;
	}

	objectUtils.extend(this, {
		playVideoAdvertisement: function (metadata, mediaType) {
			rrstaLog.apiCall('playVideoAdvertisement', metadata, mediaType);

			var labels = {ns_st_ct: 'va'};

			if (mediaType) {
				labels['ns_st_ct'] = 'va' + mediaType;
			} else {
				rrstaLog.warn('Calling \'playVideoAdvertisement\' without specifying the media type as a second parameter.');
			}

			if (mediaType == AdType.LinearLive || mediaType == AdType.BrandedOnDemandLive) {
				labels['ns_st_li'] = '1';
			}

			if (metadata) {
				objectUtils.extend(labels, metadata);
			}

			_handlePlayAdvertisement(labels);
		},

		playAudioAdvertisement: function (metadata, mediaType) {
			rrstaLog.apiCall('playAudioAdvertisement', metadata, mediaType);

			var labels = {ns_st_ct: 'aa'};

			if (mediaType) {
				labels['ns_st_ct'] = 'aa' + mediaType;
			} else {
				rrstaLog.warn('Calling \'playAudioAdvertisement\' without specifying the media type as a second parameter.');
			}

			if (mediaType == AdType.LinearLive || mediaType == AdType.BrandedOnDemandLive) {
				labels['ns_st_li'] = '1';
			}

			if (metadata) {
				objectUtils.extend(labels, metadata);
			}

			_handlePlayAdvertisement(labels);
		},

		playVideoContentPart: function (metadata, mediaType) {
			rrstaLog.apiCall('playVideoContentPart', metadata, mediaType);

			var labels = {ns_st_ct: 'vc'};

			if (mediaType) {
				labels['ns_st_ct'] = 'vc' + mediaType;
			} else {
				rrstaLog.warn('Calling \'playVideoContentPart\' without specifying the media type as a second parameter.');
			}

			if (mediaType == ContentType.Live || mediaType == ContentType.UserGeneratedLive) {
				labels['ns_st_li'] = '1';
			}

			if (metadata) {
				objectUtils.extend(labels, metadata);
			}

			_handlePlayContentPart(labels, MediaContentType.VideoContent);
		},

		playAudioContentPart: function (metadata, mediaType) {
			rrstaLog.apiCall('playAudioContentPart', metadata, mediaType);

			var labels = {ns_st_ct: 'ac'};

			if (mediaType) {
				labels['ns_st_ct'] = 'ac' + mediaType;
			} else {
				rrstaLog.warn('Calling \'playAudioContentPart\' without specifying the media type as a second parameter.');
			}

			if (mediaType == ContentType.Live || mediaType == ContentType.UserGeneratedLive) {
				labels['ns_st_li'] = '1';
			}

			if (metadata) {
				objectUtils.extend(labels, metadata);
			}

			_handlePlayContentPart(labels, MediaContentType.AudioContent);
		},

		stop: function () {
			rrstaLog.apiCall('stop');

			_streamingAnalytics.notifyPause();
		}
	});
	_init();
};

ReducedRequirementsStreamingAnalytics.ContentType = ContentType;
ReducedRequirementsStreamingAnalytics.AdType = AdType;

module.exports = ReducedRequirementsStreamingAnalytics;
},{"18":18,"21":21,"24":24,"55":55,"58":58,"67":67}],65:[function(require,module,exports){
var objectUtils = require(24);

function STASharedManager (staCore) {
	var self = this,
		appCore,
		eventManager,
		stateMachine,
		heartbeat,
		keepAlive,
		playbackSession,
		logging;

	objectUtils.extend(self, {
		getAppCore: function () {
			return appCore;
		},

		getStaCore: function () {
			return staCore;
		},

		getEventManager: function () {
			return eventManager;
		},

		getStateMachine: function () {
			return stateMachine;
		},

		getHeartbeat: function () {
			return heartbeat;
		},

		getKeepAlive: function () {
			return keepAlive;
		},

		getPlaybackSession: function () {
			return playbackSession;
		},

		getLogging: function () {
			return logging;
		},

		setAppCore: function (newAppCore) {
			appCore = newAppCore;
		},
		setKeepAlive: function (newKeepAlive) {
			keepAlive = newKeepAlive;
		},
		setHeartbeat: function (newHeartbeat) {
			heartbeat = newHeartbeat;
		},
		setEventManager: function (newEventManager) {
			eventManager = newEventManager;
		},
		setStateMachine: function (newStateMachine) {
			stateMachine = newStateMachine;
		},
		setPlaybackSession: function (newPlaybackSession) {
			playbackSession = newPlaybackSession;
		},
		setLogging: function (newLogging) {
			logging = newLogging;
		}
	});
}

module.exports = STASharedManager;
},{"24":24}],66:[function(require,module,exports){
var State = require(58).State,
	objectUtils = require(24),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function StateMachine (staCore) {
	var self = this,
		lastStateChangeTimestamp,
		previousState,
		currentState;

	function init() {
		currentState = State.IDLE;
		previousState = null;
		lastStateChangeTimestamp = NaN;
	}

	objectUtils.extend(self, {
		eventTypeToState: function (event) {
			if (currentState == State.IDLE) {
				if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.SEEK_START) {
					return State.SEEKING_BEFORE_PLAYBACK;
				} else if (event == StreamingAnalyticsEventType.BUFFER) {
					return State.BUFFERING_BEFORE_PLAYBACK;
				}
			} else if (currentState == State.PLAYBACK_NOT_STARTED) {
				if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.SEEK_START) {
					return State.SEEKING_BEFORE_PLAYBACK;
				} else if (event == StreamingAnalyticsEventType.BUFFER) {
					return State.BUFFERING_BEFORE_PLAYBACK;
				} else if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				}
			} else if (currentState == State.PLAYING) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.BUFFER) {
					return State.BUFFERING_DURING_PLAYBACK;
				} else if (event == StreamingAnalyticsEventType.PAUSE) {
					return State.PAUSED;
				} else if (event == StreamingAnalyticsEventType.SEEK_START) {
					return State.SEEKING_DURING_PLAYBACK;
				}
			} else if (currentState == State.PAUSED) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.BUFFER) {
					return State.BUFFERING_DURING_PAUSE;
				} else if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.SEEK_START) {
					return State.SEEKING_DURING_PAUSE;
				}
			} else if (currentState == State.BUFFERING_BEFORE_PLAYBACK) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.PAUSE || event == StreamingAnalyticsEventType.BUFFER_STOP) {
					return State.PLAYBACK_NOT_STARTED;
				} else if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.SEEK_START) {
					return State.SEEKING_BEFORE_PLAYBACK;
				}
			} else if (currentState == State.BUFFERING_DURING_PLAYBACK) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.PLAY || event == StreamingAnalyticsEventType.BUFFER_STOP) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.PAUSE_ON_BUFFERING) {
					return State.PAUSED_DURING_BUFFERING;
				} else if (event == StreamingAnalyticsEventType.SEEK_START) {
					return State.SEEKING_DURING_BUFFERING;
				} else if (event == StreamingAnalyticsEventType.PAUSE) {
					return State.PAUSED;
				}
			} else if (currentState == State.BUFFERING_DURING_SEEKING) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.BUFFER_STOP) {
					return State.SEEKING_DURING_PLAYBACK;
				} else if (event == StreamingAnalyticsEventType.PAUSE) {
					return State.PAUSED;
				}
			} else if (currentState == State.BUFFERING_DURING_PAUSE) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.SEEK_START) {
					return State.SEEKING_DURING_PAUSE;
				} else if (event == StreamingAnalyticsEventType.BUFFER_STOP || event == StreamingAnalyticsEventType.PAUSE) {
					return State.PAUSED;
				}
			} else if (currentState == State.SEEKING_BEFORE_PLAYBACK) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.PAUSE) {
					return State.PLAYBACK_NOT_STARTED;
				} else if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.BUFFER) {
					return State.BUFFERING_BEFORE_PLAYBACK;
				}
			} else if (currentState == State.SEEKING_DURING_PLAYBACK) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.PAUSE) {
					return State.PAUSED;
				} else if (event == StreamingAnalyticsEventType.BUFFER) {
					return State.BUFFERING_DURING_SEEKING;
				}
			} else if (currentState == State.SEEKING_DURING_BUFFERING) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.PAUSE || event == StreamingAnalyticsEventType.BUFFER_STOP) {
					return State.PAUSED;
				} else if (event == StreamingAnalyticsEventType.BUFFER) {
					return State.BUFFERING_DURING_SEEKING;
				}
			} else if (currentState == State.SEEKING_DURING_PAUSE) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.PLAY) {
					return State.PLAYING;
				} else if (event == StreamingAnalyticsEventType.PAUSE || event == StreamingAnalyticsEventType.BUFFER_STOP) {
					return State.PAUSED;
				} else if (event == StreamingAnalyticsEventType.BUFFER) {
					return State.BUFFERING_DURING_PAUSE;
				}
			} else if (currentState == State.PAUSED_DURING_BUFFERING) {
				if (event == StreamingAnalyticsEventType.END || event == StreamingAnalyticsEventType.AD_SKIP) {
					return State.IDLE;
				} else if (event == StreamingAnalyticsEventType.SEEK_START) {
					return State.SEEKING_DURING_BUFFERING;
				} else if (event == StreamingAnalyticsEventType.PAUSE) {
					return State.PAUSED;
				} else if (event == StreamingAnalyticsEventType.PLAY || event == StreamingAnalyticsEventType.BUFFER_STOP) {
					return State.PLAYING;
				}
			}

			return null;
		},

		getCurrentState: function () {
			return currentState;
		},

		newEvent: function (newEvent, currentTimestamp) {
			var newState = self.eventTypeToState(newEvent);

			if (currentState == newState) return;

			previousState = currentState;
			currentState = newState;
			lastStateChangeTimestamp = currentTimestamp;
		},

		getPreviousState: function () {
			return previousState;
		},

		getLastStateChangeTimestamp: function () {
			return lastStateChangeTimestamp;
		}
	});

	init();
}

module.exports = StateMachine;
},{"24":24,"58":58}],67:[function(require,module,exports){
var objectUtils = require(24),
	staUtils = require(68),
	STACore = require(56),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType,
	State = require(58).State,
	PlaybackSession = require(63),
	StreamingAnalyticsConstants = require(55),

	notifyMethodNames = {
		notifyPlay: StreamingAnalyticsEventType.PLAY,
		notifyPause: StreamingAnalyticsEventType.PAUSE,
		notifyEnd: StreamingAnalyticsEventType.END,
		notifyBufferStart: StreamingAnalyticsEventType.BUFFER,
		notifyBufferStop: StreamingAnalyticsEventType.BUFFER_STOP,
		notifyLoad: StreamingAnalyticsEventType.LOAD,
		notifyEngage: StreamingAnalyticsEventType.ENGAGE,
		notifySeekStart: StreamingAnalyticsEventType.SEEK_START,
		notifySkipAd: StreamingAnalyticsEventType.AD_SKIP,
		notifyCallToAction: StreamingAnalyticsEventType.CTA,
		notifyError: StreamingAnalyticsEventType.ERROR,
		notifyTransferPlayback: StreamingAnalyticsEventType.TRANSFER,
		notifyDrmFail: StreamingAnalyticsEventType.DRM_FAILED,
		notifyDrmApprove: StreamingAnalyticsEventType.DRM_APPROVED,
		notifyDrmDeny: StreamingAnalyticsEventType.DRM_DENIED,
		notifyCustomEvent: StreamingAnalyticsEventType.CUSTOM
	},
	notifyChangeMethodNames = {
		notifyChangeBitrate: [StreamingAnalyticsEventType.BIT_RATE, 'ns_st_br'],
		notifyChangePlaybackRate: [StreamingAnalyticsEventType.PLAYBACK_RATE, 'ns_st_rt'],
		notifyChangeVolume: [StreamingAnalyticsEventType.VOLUME, 'ns_st_vo'],
		notifyChangeWindowState: [StreamingAnalyticsEventType.WINDOW_STATE, 'ns_st_ws'],
		notifyChangeAudioTrack: [StreamingAnalyticsEventType.AUDIO, 'ns_st_at'],
		notifyChangeVideoTrack: [StreamingAnalyticsEventType.VIDEO, 'ns_st_vt'],
		notifyChangeSubtitleTrack: [StreamingAnalyticsEventType.SUBS, 'ns_st_tt'],
		notifyChangeCdn: [StreamingAnalyticsEventType.CDN, 'ns_st_cdn']
	};

function StreamingAnalytics (configuration) {
	var self = this,
		staCore;

	function init() {
		configuration = objectUtils.extend({}, configuration);

		staCore = new STACore(configuration);

		staCore.getStaSM().getLogging().log('New StreamingAnalytics instance with configuration', configuration);
	}

	function _notify(eventType, position, eventLabels) {
        // if the passed in event type is not known then ignore this function call and return
		if (!StreamingAnalyticsEventType.toString(eventType)) {
			return;
		}

		eventLabels = staUtils.jsonObjectToStringDictionary(eventLabels);

		var eventTimestamp = staUtils.fixEventTime(eventLabels);

		if (!eventLabels['ns_st_po'] && !isNaN(position)) {
			eventLabels['ns_st_po'] = parseInt(position) + '';
		}

		if (eventType == StreamingAnalyticsEventType.PLAY
            || eventType == StreamingAnalyticsEventType.PAUSE
            || eventType == StreamingAnalyticsEventType.BUFFER
            || eventType == StreamingAnalyticsEventType.END
            || eventType == StreamingAnalyticsEventType.SEEK_START
            || eventType == StreamingAnalyticsEventType.AD_SKIP
            || eventType == StreamingAnalyticsEventType.BUFFER_STOP) {
            // the event is recognized by internal state machine
            // hence call the corresponding function in the state machine to execute the necessary transition
			staCore.newEvent(eventType, eventTimestamp, eventLabels);
		} else {
			staCore.newPseudoEvent(eventType, eventTimestamp, eventLabels);
		}
	}

	objectUtils.extend(self, {
		isProperlyInitialized: function () {
			return staCore.isProperlyInitialized();
		},

		reset: function (keepLabels) {
			_notify(StreamingAnalyticsEventType.END);

			var oldStaCore = staCore;
			oldStaCore.getStaSM().getKeepAlive().stop();
			oldStaCore.getStaSM().getHeartbeat().pause();

			staCore = new STACore(oldStaCore.getConfiguration());

			PlaybackSession.resetPlaybackSession(staCore.getStaSM(), oldStaCore.getStaSM().getPlaybackSession(), keepLabels);
		},

		setPauseOnBufferingInterval: function (interval) {
			staCore.setPauseOnBufferingInterval(interval);
		},

		getPauseOnBufferingInterval: function () {
			return staCore.getPauseOnBufferingInterval();
		},

		setKeepAliveInterval: function (interval) {
			staCore.getStaSM().getKeepAlive().setInterval(interval);
		},

		getKeepAliveInterval: function () {
			return staCore.getStaSM().getKeepAlive().getInterval();
		},

		setHeartbeatIntervals: function (intervals) {
			staCore.getStaSM().getHeartbeat().setIntervals(intervals);
		},

		getLabels: function () {
			return staCore.getLabels();
		},

		getState: function () {
			return staCore.getStaSM().getStateMachine().getCurrentState();
		},

		setLabels: function (labelMap) {
			staCore.setLabels(labelMap);
		},

		getLabel: function (name) {
			return staCore.getLabel(name);
		},

		setLabel: function (name, value) {
			staCore.setLabel(name, value);
		},

		getLoadTimeOffset: function () {
			return staCore.getLoadTimeOffset();
		},

		setLoadTimeOffset: function (offset) {
			staCore.setLoadTimeOffset(offset);
		},

		setLiveEndpointURL: function (value) {
			return staCore.setLiveEndpointURL(value);
		},

		getLiveEndpointURL: function () {
			return staCore.getLiveEndpointURL();
		},

		isPauseOnBufferingEnabled: function () {
			return staCore.isPauseOnBufferingEnabled();
		},

		setPauseOnBufferingEnabled: function (flag) {
			staCore.setPauseOnBufferingEnabled(flag);
		},

		isThrottlingEnabled: function () {
			return staCore.isThrottlingEnabled();
		},

		setThrottlingEnabled: function (flag) {
			staCore.setThrottlingEnabled(flag);
		},

		setThrottlingDelay: function (value) {
			staCore.setThrottlingDelay(value);
		},

		getThrottlingDelay: function () {
			return staCore.getThrottlingDelay();
		},

		setPlaybackIntervalMergeTolerance: function (value) {
			staCore.getStaSM().getPlaybackSession().getAsset().setPlaybackIntervalMergeTolerance(value);
		},

		getPlaybackIntervalMergeTolerance: function () {
			return staCore.getStaSM().getPlaybackSession().getAsset().getPlaybackIntervalMergeTolerance();
		},

		createPlaybackSession: function (labels) {
			staCore.getStaSM().getLogging().apiCall('createPlaybackSession', labels);

			labels = staUtils.jsonObjectToStringDictionary(labels);

			var currentState = staCore.getStaSM().getStateMachine().getCurrentState();
			if (currentState != State.IDLE) {
				staCore.getStaSM().getLogging().infoLog('Ending the current Clip. It was in state:',
                    staUtils.stateToString(currentState)
                );

				self.notifyEnd();
			}

            // only reset the playbackSession if it has already started
			if (staCore.getStaSM().getPlaybackSession().isPlaybackSessionStarted()) {
                // reset the playbackSession
				staCore.resetPlaybackSession();
			}

			staCore.getStaSM().getPlaybackSession().setLabels(labels);
		},

		getVersion: function () {
			return staCore.getVersion();
		},

		addListener: function (listener) {
			staCore.addListener(listener);
		},

		removeListener: function (listener) {
			staCore.removeListener(listener);
		},

        /**
         * Adds a listener to every measurement that is about to be send.
         * onMeasurement {Function(labels)} The callback that will be executed when a measurement
         *  is about to be send. The callback must expect a labels object with the labels that
         *  will be send alongside the masurement.
         * */
		addMeasurementListener: function (onMeasurement) {
			staCore.getStaSM().getEventManager().addMeasurementListener(onMeasurement);
		},

        /**
         * Remove a listener of every measurement that is about to be send.
         * onMeasurement {Function} The listener to be removed.
         * */
		removeMeasurementListener: function(onMeasurement) {
			staCore.getStaSM().getEventManager().removeMeasurementListener(onMeasurement);
		},

		getPlaybackSession: function () {
			return staCore.getStaSM().getPlaybackSession();
		},

		setExitEndEventEnabled: function (flag) {
			staCore.setExitEndEventEnabled(!!flag);
		},

		isExitEndEventEnabled: function () {
			return staCore.isExitEndEventEnabled();
		},

		setDvrWindowLength: function (newDvrWindowLength) {
			staCore.getStaSM().getPlaybackSession().getAsset().setPlaybackWindowLength(newDvrWindowLength);
			staCore.getStaSM().getPlaybackSession().getAsset().asLiveStream(true);
		},

		setDvrWindowOffset: function (newDvrWindowOffset) {
			staCore.getStaSM().getPlaybackSession().getAsset().setPlaybackWindowOffset(newDvrWindowOffset);
			staCore.getStaSM().getPlaybackSession().getAsset().asLiveStream(true);
		},

		getPlatformAPI: function () {
			return staCore.getPlatformAPI();
		},

		_getLogHistory: function () {
			return staCore.getStaSM().getLogging().getLogHistory();
		}
	});

	for (var notifyMethodName in notifyMethodNames) {
		(function (fullMethodName, eventType) {
			self[fullMethodName] = function (arg1, arg2) {
				staCore.getStaSM().getLogging().apiCall(fullMethodName, arg1, arg2);

				var eventLabels = {},
					position = NaN;

				if (typeof arg1 == 'object') {
					eventLabels = arg1;
				} else if (typeof arg2 == 'object') {
					eventLabels = arg2;
				}

				if (typeof arg1 == 'number') {
					position = arg1;
				} else if (typeof arg2 == 'number') {
					position = arg2;
				}

				_notify(eventType, position, eventLabels);
			};
		})(notifyMethodName, notifyMethodNames[notifyMethodName]);
	}

	for (var notifyChangeMethodName in notifyChangeMethodNames) {
		(function (fullMethodName, eventType, eventLabel) {
			self[fullMethodName] = function (newValue, arg2, arg3) {
				staCore.getStaSM().getLogging().apiCall(fullMethodName, newValue, arg2, arg3);

				if(newValue == null) return;

				var eventLabels = {},
					position = NaN;

				if (typeof arg2 == 'object') {
					eventLabels = arg2;
				} else if (typeof arg3 == 'object') {
					eventLabels = arg3;
				}

				if (typeof arg2 == 'number') {
					position = arg2;
				} else if (typeof arg3 == 'number') {
					position = arg3;
				}

				eventLabels[eventLabel] = newValue + '';

				_notify(eventType, position, eventLabels);
			};
		})(notifyChangeMethodName,
			notifyChangeMethodNames[notifyChangeMethodName][0],
			notifyChangeMethodNames[notifyChangeMethodName][1]);
	}

	init();
}

StreamingAnalytics.PlayerEvents = StreamingAnalyticsEventType;
StreamingAnalytics.InternalStates = State;
StreamingAnalytics.Constants = StreamingAnalyticsConstants;

module.exports = StreamingAnalytics;

},{"24":24,"55":55,"56":56,"58":58,"63":63,"68":68}],68:[function(require,module,exports){
var cloneObjectUtil = require(23),
	STAState = require(58).State,
	_undefined = 'undefined';

exports.jsonObjectToStringDictionary = function (o) {
	var newDic = {};

	for (var key in o) {
		var value = o[key];
		if (value === null || value === undefined) {
			newDic[key] = value;
		} else {
			newDic[key] = o[key] + '';
		}
	}

	return newDic;
};

exports.getKeys = function (obj, filter) {
	var name,
		result = [];

	for (name in obj) {
		if ((!filter || filter.test(name)) && obj.hasOwnProperty(name)) {
			result[result.length] = name;
		}
	}
	return result;
};

exports.fixEventTime = function (labels) {
	if (labels['ns_ts']) {
		return parseInt(labels['ns_ts']);
	}

	var timestamp = +new Date();

	labels['ns_ts'] = timestamp + '';

	return timestamp;
};

exports.isBrowser = function () {
	return typeof window != _undefined && typeof document != _undefined;
};

exports.addNewPlaybackInterval = function (intervals, startPosition, endPosition, playbackIntervalMergeTolerance) {
    // usually the end position should be higher than the start position because natural playback
    // time progresses forward however just in case sort the start and end positions
	var newInterval = {};

	if (endPosition >= startPosition) {
		newInterval.start = startPosition;
		newInterval.end = endPosition;
	} else {
		return cloneObjectUtil(intervals);
	}

    // if the list of collected intervals is empty then append this new interval and return
	if (intervals.length == 0) {
		intervals.push(newInterval);
		return cloneObjectUtil(intervals);
	}

    // check if the new interval is contained within the list of collected intervals and if so
    // then return
	var i;
	for (i = 0; i < intervals.length; i++) {
		if (newInterval.start >= intervals[i].start && newInterval.end <= intervals[i].end) {
			return cloneObjectUtil(intervals);
		}
	}

    // add the interval to the list of intervals in its correct location
	var insertionPoint;
	var insertionPointFound = false;
	for (insertionPoint = 0; insertionPoint < intervals.length; insertionPoint++) {
		if ((insertionPoint + 1 === intervals.length && newInterval.start >= intervals[insertionPoint].start)
            || (newInterval.start >= intervals[insertionPoint].start && newInterval.start < intervals[insertionPoint + 1].start)) {
			intervals.splice(insertionPoint + 1, 0, newInterval);
			insertionPointFound = true;
			break;
		}
	}

    // if no insertion point found then that means that the interval should be inserted
    // at the beginning of the array
	if (!insertionPointFound) {
		intervals.splice(0, 0, newInterval);
	}

    // resolve overlapping intervals

    // Since the intervals are already sorted based on increasing order of starting time.
    // Push the first interval on to a stack.
	var stack = [intervals[0]];

    // For each interval do the following
	for (i = 1; i < intervals.length; i++) {
        // If the current interval does not overlap with the stack top, push it.
		if (stack[stack.length - 1].end + playbackIntervalMergeTolerance < intervals[i].start) {
			stack.push(intervals[i]);
		} else if (stack[stack.length - 1].end < intervals[i].end) {
            // If the current interval overlaps with stack top and ending time of current interval
            // is more than that of stack top, update stack top with the ending  time of current interval.
			stack[stack.length - 1].end = intervals[i].end;
		}
	}

    // At the end stack contains the merged intervals.
	return cloneObjectUtil(stack);
};

exports.stateToString = function (state) {
	for (var stateName in STAState) {
		if (STAState.hasOwnProperty(stateName) && STAState[stateName] == state)			{
			return stateName;
		}
	}
};
exports.isIdleState = function (state) {
	return state == STAState.IDLE
        || state == STAState.BUFFERING_BEFORE_PLAYBACK
        || state == STAState.SEEKING_BEFORE_PLAYBACK
        || state == STAState.PLAYBACK_NOT_STARTED;
};
},{"23":23,"58":58}],69:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForBufferingBeforePlayback (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onEndOrAdSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimeBeforeEnd(eventTimestamp - currentAsset.getSeekingTimestamp());
				}
			}

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onBufferStop: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal collect seeking time flag.
					currentAsset.setCollectingSeekingTime(false);
				}
			}
		},

		onSeekStart: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is not set, then
				if (!currentAsset.isCollectingSeekingTime()) {
                    // Start accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimestamp(eventTimestamp);

                    // Set internal collect seeking time flag to collect time spent seeking
					currentAsset.setCollectingSeekingTime(true);
				}
			} else { // If internal clip seeking flag is not set, then
                // Increment seek count; labels ns_st_skc, ns_st_dskc (delta)
				currentAsset.incrementSeeks();
			}

            // If internal clip seeking flag is not set, then
			if (!currentAsset.isSeeking()) {
                // Set internal clip seeking flag to indicate seeking has started
				currentAsset.setSeeking(true);

                // Set internal collect seeking time flag to collect time spent seeking
				currentAsset.setCollectingSeekingTime(true);

                // Start accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
				currentAsset.setSeekStartPosition(position);

                // Start accumulating seeking time; labels ns_st_skt, ns_st_dskt (delta)
				currentAsset.setSeekingTimestamp(eventTimestamp);
			}
		},

		onPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}
			}
		},

		onPlay: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}

                // Stop accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
                // Indicate the seeking direction; label ns_st_skd
				currentAsset.addSeekingAmount(position);

                // Unset internal clip seeking flag
				currentAsset.setSeeking(false);
			}

            // Mark playlist playback as started
			currentAsset.setPlaybackStarted(true);

            // Increment the playlist starts counter; label ns_st_ppc
			if (currentAsset.isPlaybackSessionLooping() ||
                currentPlaybackSession.getPlaybackCounter() == 0) {
				currentPlaybackSession.incrementPlaybackCounter();
				currentAsset.setPlaybackSessionLooping(false);
			}

            // Increment playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // Mark clip playback as started
			currentAsset.setPlaybackStarted(true);

            // Increment segment playback counter; label ns_st_spc
			currentAsset.incrementSegmentPlaybackCounter();

            // Increment clip starts; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // if the lowest part number played hasn't been set yet or the current part number is equal or lower
            // than the previously played one
			if (currentAsset.getLowestPartNumberPlayed() == 0 ||
                currentAsset.getPartNumber() <= currentAsset.getLowestPartNumberPlayed() ) {
                // then set the lowest part number value to be equal to the current part number
				currentAsset.setLowestPartNumberPlayed(currentAsset.getPartNumber());

                // increment the asset playback counter value; label ns_st_apc
				currentAsset.incrementAssetPlaybackCounter();

                // reset asset play sequence counter ; label: ns_st_asq
				currentAsset.setPlaySequenceCounter(0);

                // Reset the asset playback counters
				currentAsset.resetAssetPlaybackIntervals();
			}

            // Increment asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // Determine loading time; label ns_st_lt
			if (!staSM.getStaCore().isLoadingTimeSent()) {
                // send add the ns_st_lt label to the list of labels attached to this event
				eventLabels['ns_st_lt'] = (staSM.getStaCore().getLoadTimeOffset() + eventTimestamp - staSM.getStaCore().getInitTimestamp()) + '';
				staSM.getStaCore().setLoadingTimeSent(true);
			}

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}
	});
}

module.exports = TransitionsForBufferingBeforePlayback;

},{"24":24,"26":26,"58":58}],70:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForBufferingDuringPause (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onEndAndSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Reset heartbeat and keep-alive timers
			staSM.getStaCore().resetHeartbeat();
			staSM.getKeepAlive().stop();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset playing time

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);

            // Queue an end measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.END, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

            // If internal clip seeking flag is set
			if (currentAsset.isSeeking()) {
                // If internal collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimeBeforeEnd(eventTimestamp - currentAsset.getSeekingTimestamp());

                    // Unset internal collect seeking time flag.
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Store clip playback counters
			currentPlaybackSession.storeAssetPlaybackCounters();

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);
		},

		onPlay: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Increment playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // Increment asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // Increment clip starts; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}

                // Stop accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
                // Indicate the seeking direction; label ns_st_skd
				currentAsset.addSeekingAmount(position);

                // Unset internal clip seeking flag
				currentAsset.setSeeking(false);
			}

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}
	});
}

module.exports = TransitionsForBufferingDuringPause;

},{"24":24,"26":26,"58":58}],71:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForBufferingDuringPlayback (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onPauseOnBuffering: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop the Pause-on-Buffering timer
			staSM.getStaCore().stopPausedOnBufferingTimer();

            // Update elapsed time; labels ns_st_et, ns_st_det (delta)
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Increment PlaybackSession pause count; label ns_st_pp
			currentPlaybackSession.incrementPauses();

            // Increment Asset pause count; labels ns_st_pc, ns_st_dpc (delta)
			currentAsset.incrementPauses();

            // Queue a pause measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PAUSE, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

            // Start accumulating PlaybackSession buffering time; label ns_st_bp
			currentPlaybackSession.setBufferingTimestamp(eventTimestamp);

            // Start accumulating Asset buffering time; labels ns_st_bt, ns_st_dbt (delta)
			currentAsset.setBufferingTimestamp(eventTimestamp);
		},

		onEndOrAdSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop the Pause-on-Buffering timer
			staSM.getStaCore().stopPausedOnBufferingTimer();

            // Reset heartbeat timer and reset keep-alive timer
			staSM.getStaCore().resetHeartbeat();
			staSM.getKeepAlive().stop();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset playing time

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);

            // Queue an end measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.END, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onSeekStart: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Stop the Pause-on-Buffering timer
			staSM.getStaCore().stopPausedOnBufferingTimer();

            // Pause heartbeat and reset keep-alive timers.
			staSM.getHeartbeat().pause();
			staSM.getKeepAlive().stop();

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Increment seek count; labels ns_st_skc, ns_st_dskc (delta)
			currentAsset.incrementSeeks();

            // Set internal clip seeking flag to indicate seeking has started
			currentAsset.setSeeking(true);

            // Set internal collect seeking time flag to collect time spent seeking
			currentAsset.setCollectingSeekingTime(true);

            // Start accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
			currentAsset.setSeekStartPosition(position);

            // Start accumulating seeking time; labels ns_st_skt, ns_st_dskt (delta)
			currentAsset.setSeekingTimestamp(eventTimestamp);

            // Increment PlaybackSession pause count; label ns_st_pp
			currentPlaybackSession.incrementPauses();

            // Increment Asset pause count; labels ns_st_pc, ns_st_dpc (delta)
			currentAsset.incrementPauses();

            // Queue a pause measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PAUSE, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		},

		onPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop the Pause-on-Buffering timer
			staSM.getStaCore().stopPausedOnBufferingTimer();

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Increment PlaybackSession pause count; label ns_st_pp
			currentPlaybackSession.incrementPauses();

            // Increment Asset pause count; labels ns_st_pc, ns_st_dpc (delta)
			currentAsset.incrementPauses();

            // Queue a pause measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PAUSE, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}
	});
}

module.exports = TransitionsForBufferingDuringPlayback;

},{"24":24,"26":26,"58":58}],72:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForBufferingDuringSeeking (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onEndOrAdSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Reset Heartbeat and keep-alive timers
			staSM.getStaCore().resetHeartbeat();
			staSM.getKeepAlive().stop();

            // Stop the Pause-on-Buffering timer
			staSM.getStaCore().stopPausedOnBufferingTimer();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset playing time

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);

            // Queue an end measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.END, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

            // If internal clip seeking flag is set
			if (currentAsset.isSeeking()) {
                // If internal collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimeBeforeEnd(eventTimestamp - currentAsset.getSeekingTimestamp());

                    // Unset internal collect seeking time flag.
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Store clip playback counters
			currentPlaybackSession.storeAssetPlaybackCounters();

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Increment PlaybackSession pause count; label ns_st_pp
			currentPlaybackSession.incrementPauses();

            // Increment Asset pause count; labels ns_st_pc, ns_st_dpc (delta)
			currentAsset.incrementPauses();

            // If internal clip seeking flag is set
			if (currentAsset.isSeeking()) {
                // If internal collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal collect seeking time flag.
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);
		},

		onPlay: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Increment playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // Increment asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // Increment clip starts; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // If internal clip seeking flag is set
			if (currentAsset.isSeeking()) {
                // If internal collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal collect seeking time flag.
					currentAsset.setCollectingSeekingTime(false);
				}

                // Stop accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
                // Indicate the seeking direction; label ns_st_skd
				currentAsset.addSeekingAmount(position);

                // Unset internal clip seeking flag
				currentAsset.setSeeking(false);
			}

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}
	});
}

module.exports = TransitionsForBufferingDuringSeeking;

},{"24":24,"26":26,"58":58}],73:[function(require,module,exports){
var objectUtils = require(24),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForIdle (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onBuffer: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Start the playlist lifecycle
			currentPlaybackSession.setPlaybackSessionStarted(true);

            // Start the current Asset life cycle
			currentAsset.setAssetStarted(true);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // Recover seeking time when seeking was interrupted with an end
				currentAsset.setSeekingTime(currentAsset.getSeekingTimeBeforeEnd());
			}

            // Start accumulating PlaybackSession buffering time; label ns_st_bp
			currentPlaybackSession.setBufferingTimestamp(eventTimestamp);

            // Start accumulating Asset buffering time; labels ns_st_bt, ns_st_dbt (delta)
			currentAsset.setBufferingTimestamp(eventTimestamp);
		},

		onSeekStart: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Mark playlist as started
			currentPlaybackSession.setPlaybackSessionStarted(true);

            // Start the current Asset life cycle
			currentAsset.setAssetStarted(true);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // Recover seeking time when seeking was interrupted with an end
				currentAsset.setSeekingTime(currentAsset.getSeekingTimeBeforeEnd());
			}

            // Increment seek count; labels ns_st_skc, ns_st_dskc (delta)
			currentAsset.incrementSeeks();

            // Set internal clip seeking flag to indicate seeking has started
			currentAsset.setSeeking(true);

            // Set internal collect seeking time flag to collect time spent seeking
			currentAsset.setCollectingSeekingTime(true);

            // Start accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
			currentAsset.setSeekStartPosition(position);

            // Start accumulating seeking time; labels ns_st_skt, ns_st_dskt (delta)
			currentAsset.setSeekingTimestamp(eventTimestamp);
		},

		onPlay: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Mark playlist as started
			currentPlaybackSession.setPlaybackSessionStarted(true);

            // Start the current Asset life cycle
			currentAsset.setAssetStarted(true);

            // Increment the playlist starts counter; label ns_st_ppc
			if (currentAsset.isPlaybackSessionLooping() ||
                currentPlaybackSession.getPlaybackCounter() == 0) {
				currentPlaybackSession.incrementPlaybackCounter();
				currentAsset.setPlaybackSessionLooping(false);
			}

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // Recover seeking time when seeking was interrupted with an end
				currentAsset.setSeekingTime(currentAsset.getSeekingTimeBeforeEnd());

                // Stop accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
                // Indicate the seeking direction; label ns_st_skd
				currentAsset.addSeekingAmount(position);

                // Unset internal clip seeking flag
				currentAsset.setSeeking(false);
			}

            // Increment playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // Mark clip playback as started
			currentAsset.setPlaybackStarted(true);

            // Increment segment playback counter; label ns_st_spc
			currentAsset.incrementSegmentPlaybackCounter();

            // if the lowest part number played hasn't been set yet or the current part number is equal or lower
            // than the previously played one
			if (currentAsset.getLowestPartNumberPlayed() == 0 ||
                currentAsset.getPartNumber() <= currentAsset.getLowestPartNumberPlayed() ) {
                // then set the lowest part number value to be equal to the current part number
				currentAsset.setLowestPartNumberPlayed(currentAsset.getPartNumber());

                // increment the asset playback counter value; label ns_st_apc
				currentAsset.incrementAssetPlaybackCounter();

                // reset asset play sequence counter ; label: ns_st_asq
				currentAsset.setPlaySequenceCounter(0);

                // Reset the asset playback counters
				currentAsset.resetAssetPlaybackIntervals();
			}

            // Increment asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // Increment segment play sequence counter; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Determine loading time; label ns_st_lt
			if (!staSM.getStaCore().isLoadingTimeSent()) {
                // send add the ns_st_lt label to the list of labels attached to this event
				eventLabels['ns_st_lt'] = (staSM.getStaCore().getLoadTimeOffset() + eventTimestamp - staSM.getStaCore().getInitTimestamp()) + '';
				staSM.getStaCore().setLoadingTimeSent(true);
			}

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}
	});
}

module.exports = TransitionsForIdle;

},{"24":24,"58":58}],74:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForPaused (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onEndOrAdSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Reset heartbeat and keep-alive timer
			staSM.getStaCore().resetHeartbeat();
			staSM.getKeepAlive().stop();

            // Stop accumulating Asset playing time

            // Elapsed time; labels ns_st_et, ns_st_det (delta)
			currentAsset.addElapsedTime(eventTimestamp);

            // Queue a end measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.END, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimeBeforeEnd(eventTimestamp - currentAsset.getSeekingTimestamp());

                    // Unset internal clip seeking flag
					currentAsset.setSeeking(false);
				}
			}

            // Store clip playback counters
			currentPlaybackSession.storeAssetPlaybackCounters();

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onPlay: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Increment playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}

                // Stop accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
                // Indicate the seeking direction; label ns_st_skd
				currentAsset.addSeekingAmount(position);

                // Unset internal clip seeking flag
				currentAsset.setSeeking(false);
			}

            // Increment clip starts; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // Increment asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}
	});
}

module.exports = TransitionsForPaused;

},{"24":24,"26":26,"58":58}],75:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForPausedDuringBuffering (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onEndOrAdSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Reset heartbeat and keep-alive timer
			staSM.getStaCore().resetHeartbeat();
			staSM.getKeepAlive().stop();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset playing time

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimeBeforeEnd(eventTimestamp - currentAsset.getSeekingTimestamp());

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Queue an end measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.END, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onSeekStart: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is not set, then
				if (!currentAsset.isCollectingSeekingTime()) {
                    // Start accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimestamp(eventTimestamp);

                    // Set internal clip collect seeking time flag to collect time spent seeking
					currentAsset.setCollectingSeekingTime(true);
				}
			} else { // If internal clip seeking flag is not set, then
                // Increment seek count; labels ns_st_skc, ns_st_dskc (delta)
				currentAsset.incrementSeeks();
			}

            // If internal clip seeking flag is not set, then
			if (!currentAsset.isSeeking()) {
                // Set internal clip seeking flag to indicate seeking has started
				currentAsset.setSeeking(true);

                // Set internal clip collect seeking time flag to collect time spent seeking
				currentAsset.setCollectingSeekingTime(true);

                // Start accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
				currentAsset.setSeekStartPosition(position);

                // Start accumulating seeking time; labels ns_st_skt, ns_st_dskt (delta)
				currentAsset.setSeekingTimestamp(eventTimestamp);
			}

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);
		},

		onPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);
		},

		onPlayOrOnBufferStop: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Increment clip starts; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}
	});
}

module.exports = TransitionsForPausedDuringBuffering;

},{"24":24,"26":26,"58":58}],76:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForPlaybackNotStarted (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onEndOrAdSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // If internal clip seeking flag is set
			if (currentAsset.isSeeking()) {
                // If internal collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimeBeforeEnd(eventTimestamp - currentAsset.getSeekingTimestamp());

                    // Unset internal collect seeking time flag.
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Store clip playback counters
			currentPlaybackSession.storeAssetPlaybackCounters();

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onSeekStart: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // Start accumulating seeking time; labels ns_st_skt, ns_st_dskt (delta)
				currentAsset.setSeekingTimestamp(eventTimestamp);
			} else { // If internal clip seeking flag is not set, then
                // Increment seek count; labels ns_st_skc, ns_st_dskc (delta)
				currentAsset.incrementSeeks();
			}

            // If internal clip seeking flag is not set, then
			if (!currentAsset.isSeeking()) {
                // Set internal clip seeking flag to indicate seeking has started
				currentAsset.setSeeking(true);

                // Set internal collect seeking time flag to collect time spent seeking
				currentAsset.setCollectingSeekingTime(true);

                // Start accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
				currentAsset.setSeekStartPosition(position);

                // Start accumulating seeking time; labels ns_st_skt, ns_st_dskt (delta)
				currentAsset.setSeekingTimestamp(eventTimestamp);
			}
		},

		onPlay: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // Stop accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
                // Indicate the seeking direction; label ns_st_skd
				currentAsset.addSeekingAmount(position);

                // Unset internal clip seeking flag
				currentAsset.setSeeking(false);
			}

            // Mark playlist playback as started
			currentPlaybackSession.setPlaybackSessionStarted(true);

            // Increment the playlist starts counter; label ns_st_ppc
			if (currentAsset.isPlaybackSessionLooping() ||
                currentPlaybackSession.getPlaybackCounter() == 0) {
				currentPlaybackSession.incrementPlaybackCounter();
				currentAsset.setPlaybackSessionLooping(false);
			}

            // Increment playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // Mark clip playback as started
			currentAsset.setPlaybackStarted(true);

            // Increment segment playback counter; label ns_st_spc
			currentAsset.incrementSegmentPlaybackCounter();

            // If the lowest part number played hasn't been set yet or the current part number is equal or lower
            // than the previously played one
			if (currentAsset.getLowestPartNumberPlayed() == 0 ||
                currentAsset.getPartNumber() <= currentAsset.getLowestPartNumberPlayed() ) {
                // then set the lowest part number value to be equal to the current part number
				currentAsset.setLowestPartNumberPlayed(currentAsset.getPartNumber());

                // increment the asset playback counter value; label ns_st_apc
				currentAsset.incrementAssetPlaybackCounter();

                // reset asset play sequence counter ; label: ns_st_asq
				currentAsset.setPlaySequenceCounter(0);

                // Reset the asset playback counters
				currentAsset.resetAssetPlaybackIntervals();
			}

            // Increment asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // Increment clip starts; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Determine loading time; label ns_st_lt
			if (!staSM.getStaCore().isLoadingTimeSent()) {
                // send add the ns_st_lt label to the list of labels attached to this event
				eventLabels['ns_st_lt'] = (staSM.getStaCore().getLoadTimeOffset() + eventTimestamp - staSM.getStaCore().getInitTimestamp()) + '';
				staSM.getStaCore().setLoadingTimeSent(true);
			}

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		},

		onBuffer: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Start accumulating PlaybackSession buffering time; label ns_st_bp
			currentPlaybackSession.setBufferingTimestamp(eventTimestamp);

            // Start accumulating Asset buffering time; labels ns_st_bt, ns_st_dbt (delta)
			currentAsset.setBufferingTimestamp(eventTimestamp);
		}
	});
}

module.exports = TransitionsForPlaybackNotStarted;

},{"24":24,"26":26,"58":58}],77:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForPlaying (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onEndOrAdSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Reset heartbeat and keep-alive timer
			staSM.getStaCore().resetHeartbeat();
			staSM.getKeepAlive().stop();

            // Stop accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.addPlaybackTime(eventTimestamp);

            // Stop accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.addPlaybackTime(eventTimestamp);

            // Accumulates playback; labels ns_st_ap, ns_st_dap (delta).
			currentAsset.addAccumulatedPlayback(position);

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.addInterval(position);

            // Queue an end measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.END, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onBuffer: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Pause heartbeat and reset keep-alive
			staSM.getHeartbeat().pause();
			staSM.getKeepAlive().stop();

            // Stop accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.addPlaybackTime(eventTimestamp);

            // Stop accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.addPlaybackTime(eventTimestamp);

            // Accumulates playback; labels ns_st_ap, ns_st_dap (delta).
			currentAsset.addAccumulatedPlayback(position);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.addInterval(position);

            // If Pause-on-Buffering is enabled, then start the Pause-on-Buffering timer
			if (staSM.getStaCore().isPauseOnBufferingEnabled()) {
				staSM.getStaCore().startPausedOnBufferingTimer(eventTimestamp, eventLabels);
			}

            // Increment the re-buffering counters; labels ns_st_bc, ns_st_dbc (delta)
			currentAsset.incrementBufferCount();

            // Start accumulating PlaybackSession buffering time; label ns_st_bp
			currentPlaybackSession.setBufferingTimestamp(eventTimestamp);

            // Start accumulating Asset buffering time; labels ns_st_bt, ns_st_dbt (delta)
			currentAsset.setBufferingTimestamp(eventTimestamp);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta)
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);
		},

		onSeekStart: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Pause heartbeat and reset keep-alive timers
			staSM.getHeartbeat().pause();
			staSM.getKeepAlive().stop();

            // Stop accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.addPlaybackTime(eventTimestamp);

            // Stop accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.addPlaybackTime(eventTimestamp);

            // Accumulates playback; labels ns_st_ap, ns_st_dap (delta).
			currentAsset.addAccumulatedPlayback(position);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.addInterval(position);

            // Increment seek count; labels ns_st_skc, ns_st_dskc (delta)
			currentAsset.incrementSeeks();

            // Set internal clip seeking flag to indicate seeking has started
			currentAsset.setSeeking(true);

            // Set internal clip collect seeking time flag to collect time spent seeking
			currentAsset.setCollectingSeekingTime(true);

            // Start accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
			currentAsset.setSeekStartPosition(position);

            // Start accumulating seeking time; labels ns_st_skt, ns_st_dskt (delta)
			currentAsset.setSeekingTimestamp(eventTimestamp);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta)
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Increment PlaybackSession pause count; label ns_st_pp
			currentPlaybackSession.incrementPauses();

            // Increment Asset pause count; labels ns_st_pc, ns_st_dpc (delta)
			currentAsset.incrementPauses();

            // Queue a pause measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PAUSE, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		},

		onPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Pause heartbeat and reset keep-alive timers
			staSM.getHeartbeat().pause();
			staSM.getKeepAlive().stop();

            // Stop accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.addPlaybackTime(eventTimestamp);

            // Stop accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.addPlaybackTime(eventTimestamp);

            // Accumulates playback; labels ns_st_ap, ns_st_dap (delta).
			currentAsset.addAccumulatedPlayback(position);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.addInterval(position);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Increment PlaybackSession pause count; label ns_st_pp
			currentPlaybackSession.incrementPauses();

            // Increment Asset pause count; labels ns_st_pc, ns_st_dpc (delta)
			currentAsset.incrementPauses();

            // Queue a pause measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PAUSE, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}

	});
}

module.exports = TransitionsForPlaying;

},{"24":24,"26":26,"58":58}],78:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForSeekingBeforePlayback (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onEndOrAdSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // If internal clip seeking flag is set
			if (currentAsset.isSeeking()) {
                // If internal collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimeBeforeEnd(eventTimestamp - currentAsset.getSeekingTimestamp());

                    // Unset internal collect seeking time flag.
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Store clip playback counters
			currentPlaybackSession.storeAssetPlaybackCounters();

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // If internal clip seeking flag is set
			if (currentAsset.isSeeking()) {
                // If internal collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal collect seeking time flag.
					currentAsset.setCollectingSeekingTime(false);
				}
			}
		},

		onPlay: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}

                // Stop accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
                // Indicate the seeking direction; label ns_st_skd
				currentAsset.addSeekingAmount(position);

                // Unset internal clip seeking flag
				currentAsset.setSeeking(false);
			}

            // Increment the playlist starts counter; label ns_st_ppc
			if (currentAsset.isPlaybackSessionLooping() ||
                currentPlaybackSession.getPlaybackCounter() == 0) {
				currentPlaybackSession.incrementPlaybackCounter();
				currentAsset.setPlaybackSessionLooping(false);
			}

            // Increment playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // Increment asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // Increment clip starts; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // Mark clip playback as started
			currentAsset.setPlaybackStarted(true);

            // Increment segment playback counter; label ns_st_spc
			currentAsset.incrementSegmentPlaybackCounter();

            // if the lowest part number played hasn't been set yet or the current part number is equal or lower
            // than the previously played one
			if (currentAsset.getLowestPartNumberPlayed() == 0 ||
                currentAsset.getPartNumber() <= currentAsset.getLowestPartNumberPlayed() ) {
                // then set the lowest part number value to be equal to the current part number
				currentAsset.setLowestPartNumberPlayed(currentAsset.getPartNumber());

                // increment the asset playback counter value; label ns_st_apc
				currentAsset.incrementAssetPlaybackCounter();

                // reset asset play sequence counter ; label: ns_st_asq
				currentAsset.setPlaySequenceCounter(0);

                // Reset the asset playback counters
				currentAsset.resetAssetPlaybackIntervals();
			}

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Determine loading time; label ns_st_lt
			if (!staSM.getStaCore().isLoadingTimeSent()) {
                // send add the ns_st_lt label to the list of labels attached to this event
				eventLabels['ns_st_lt'] = (staSM.getStaCore().getLoadTimeOffset() + eventTimestamp - staSM.getStaCore().getInitTimestamp()) + '';
				staSM.getStaCore().setLoadingTimeSent(true);
			}

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}
	});
}

module.exports = TransitionsForSeekingBeforePlayback;

},{"24":24,"26":26,"58":58}],79:[function(require,module,exports){
var objectUtils = require(24);

function TransitionsForSeekingDuringBuffering (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Increment PlaybackSession pause count; label ns_st_pp
			currentPlaybackSession.incrementPauses();

            // Increment Asset pause count; labels ns_st_pc, ns_st_dpc (delta)
			currentAsset.incrementPauses();

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);
		}

	});
}

module.exports = TransitionsForSeekingDuringBuffering;

},{"24":24}],80:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function TransitionsForSeekingDuringPlayback (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onEndOrAdSkip: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Reset heartbeat and keep-alive timers
			staSM.getStaCore().resetHeartbeat();
			staSM.getKeepAlive().stop();

            // Stop accumulating Asset playing time

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);

            // Queue an end measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.END, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimeBeforeEnd(eventTimestamp - currentAsset.getSeekingTimestamp());

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Store clip playback counters
			currentPlaybackSession.storeAssetPlaybackCounters();

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onPlay: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Increment playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // Increment asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // Increment clip starts; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}

                // Stop accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
                // Indicate the seeking direction; label ns_st_skd
				currentAsset.addSeekingAmount(position);

                // Unset internal clip seeking flag
				currentAsset.setSeeking(false);
			}

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Determine loading time; label ns_st_lt
			if (!staSM.getStaCore().isLoadingTimeSent()) {
                // send add the ns_st_lt label to the list of labels attached to this event
				eventLabels['ns_st_lt'] = (staSM.getStaCore().getLoadTimeOffset() + eventTimestamp - staSM.getStaCore().getInitTimestamp()) + '';
				staSM.getStaCore().setLoadingTimeSent(true);
			}

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		}
	});
}

module.exports = TransitionsForSeekingDuringPlayback;

},{"24":24,"26":26,"58":58}],81:[function(require,module,exports){
var objectUtils = require(24),
	objectTypeCasting = require(26),
	StreamingAnalyticsEventType = require(58).StreamingAnalyticsEventType;

function SharedTransitions (staSM) {
	var self = this;

	objectUtils.extend(self, {
		onSeekStartWhenPausedOrBufferingDuringPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is not set, then
				if (!currentAsset.isCollectingSeekingTime()) {
                    // Start accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimestamp(eventTimestamp);

                    // Set internal clip collect seeking time flag to collect time spent seeking
					currentAsset.setCollectingSeekingTime(true);
				}
			} else { // If internal clip seeking flag is not set, then
                // Increment seek count; labels ns_st_skc, ns_st_dskc (delta)
				currentAsset.incrementSeeks();
			}

            // If internal clip seeking flag is not set, then
			if (!currentAsset.isSeeking()) {
                // Set internal clip seeking flag to indicate seeking has started
				currentAsset.setSeeking(true);

                // Set internal clip collect seeking time flag to collect time spent seeking
				currentAsset.setCollectingSeekingTime(true);

                // Start accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
				currentAsset.setSeekStartPosition(position);

                // Start accumulating seeking time; labels ns_st_skt, ns_st_dskt (delta)
				currentAsset.setSeekingTimestamp(eventTimestamp);
			}

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);
		},

		onBufferWhenSeekingOrPaused: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Start accumulating PlaybackSession buffering time; label ns_st_bp
			currentPlaybackSession.setBufferingTimestamp(eventTimestamp);

            // Start accumulating Asset buffering time; labels ns_st_bt, ns_st_dbt (delta)
			currentAsset.setBufferingTimestamp(eventTimestamp);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);
		},

		onPlayWhenSeekingDuringBufferingOrSeekingDuringPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // playlist play sequence event counter; label ns_st_psq
			currentPlaybackSession.incrementPlaySequenceCounter();

            // asset play sequence counter; label ns_st_asq
			currentAsset.incrementPlaySequenceCounter();

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}

                // Stop accumulating seeking amount; labels ns_st_ska, ns_st_dska (delta)
                // Indicate the seeking direction; label ns_st_skd
				currentAsset.addSeekingAmount(position);

                // Unset internal clip seeking flag
				currentAsset.setSeeking(false);
			}

            // Increment clip starts; label ns_st_sq
			currentAsset.incrementPlayCounter();

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();

            // Queue a play measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.PLAY, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);
		},

		onBufferStopWhenBufferingDuringSeekingOrBufferingDuringPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta)
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

		},

		onPauseWhenSeekingDuringPlaybackOrSeekingDuringPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Update elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);
		},

		onEndOrAdSkipWhenSeekingDuringBufferingOrSeekingDuringPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // Reset heartbeat and keep-alive timer
			staSM.getStaCore().resetHeartbeat();
			staSM.getKeepAlive().stop();

            // Stop accumulating Asset playing time

            // Elapsed time; labels ns_st_et, ns_st_det (delta).
			currentAsset.addElapsedTime(eventTimestamp);

            // Queue an end measurement
			var eventData = staSM.getStaCore().createLabels(StreamingAnalyticsEventType.END, eventLabels, eventTimestamp);
			currentAsset.updateDeltaLabels(eventData.eventLabels);
			currentAsset.updateIndependentLabels(eventData.eventLabels);
			staSM.getEventManager().newEvent(eventData);

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.setSeekingTimeBeforeEnd(eventTimestamp - currentAsset.getSeekingTimestamp());

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Store clip playback counters
			currentPlaybackSession.storeAssetPlaybackCounters();

            // End the life cycle of the current Asset and reset current Asset state
			currentAsset.resetAssetLifecycleLabels();
			currentAsset.setPlaybackStarted(false);

            // If this is flagged as a playlist end (by including event-specific
            // label ns_st_pe with a non-empty, non-zero value) then end the current
            // PlaybackSession life cycle and reset current PlaybackSession state
			if (eventLabels.hasOwnProperty('ns_st_pe') && objectTypeCasting.parseBoolean(eventLabels['ns_st_pe'], false)) {
				staSM.getStaCore().resetPlaybackSession();
			}
		},

		onBufferStopWhenSeekingDuringBufferingOrSeekingDuringPause: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset();

            // If internal clip seeking flag is set, then
			if (currentAsset.isSeeking()) {
                // If internal clip collect seeking time flag is set, then
				if (currentAsset.isCollectingSeekingTime()) {
                    // Stop accumulating seeking time: labels ns_st_skt, ns_st_dskt (delta)
					currentAsset.addSeekingTime(eventTimestamp);

                    // Unset internal clip collect seeking time flag
					currentAsset.setCollectingSeekingTime(false);
				}
			}

            // Update elapsed time; labels ns_st_et, ns_st_det (delta)
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

		},

		onBufferStopOrOnPlayWhenBufferingDuringPlayback: function (eventTimestamp, eventLabels) {
			var currentPlaybackSession = staSM.getPlaybackSession(),
				currentAsset = currentPlaybackSession.getAsset(),
				position = parseInt(eventLabels['ns_st_po']);

            // Stop the Pause-on-Buffering timer
			staSM.getStaCore().stopPausedOnBufferingTimer();

            // Stop accumulating PlaybackSession buffering time for ns_st_bp
			currentPlaybackSession.addBufferingTime(eventTimestamp);

            // Stop accumulating Asset buffering time for ns_st_bt, ns_st_dbt (delta)
			currentAsset.addBufferingTime(eventTimestamp);

            // Start accumulating PlaybackSession playing time; label ns_st_pa
			currentPlaybackSession.setPlaybackTimestamp(eventTimestamp);

            // Start accumulating Asset playing time

            // Measured playing time; labels ns_st_pt, ns_st_dpt (delta), ns_st_ipt (event independent-delta).
			currentAsset.setPlaybackTimestamp(eventTimestamp);

            // Unique playback for the current Asset; labels ns_st_upc, ns_st_dupc (delta), ns_st_iupc (event independent- delta).
            // Unique playback for the current asset playback counter of the current Asset; labels ns_st_upa, ns_st_dupa (delta), ns_st_iupa (event independent-delta).
            // Longest playback for the current Asset: labels ns_st_lpc, ns_st_dlpc (delta).
            // Longest playback for the current asset playback counter of the current Asset: labels ns_st_lpa, ns_st_dlpa (delta).
			currentAsset.setPlaybackStartPosition(position);

            // Update elapsed time; labels ns_st_et, ns_st_det (delta)
			currentAsset.addElapsedTime(eventTimestamp);
			currentAsset.setElapsedTimestamp(eventTimestamp);

            // Start heartbeat and keep-alive timers
			staSM.getHeartbeat().resume();
			staSM.getKeepAlive().start();
		}
	});
}

module.exports = SharedTransitions;

},{"24":24,"26":26,"58":58}],82:[function(require,module,exports){
/* eslint-env browser */

var systemClockJumpTimer = null,

	systemClockJumpListeners = [],
	configuredSystemClockJumpInterval,
	configuredSystemClockJumpIntervalError,
	configuredPlatformAPI,

	SYSTEM_CLOCK_JUMP_DETECTION_DEFAULT_INTERVAL = 1000,
	SYSTEM_CLOCK_JUMP_DETECTION_DEFAULT_PRECISION = 1000;

function onSystemClockJump (onSystemClockJump) {
	systemClockJumpListeners.push(onSystemClockJump);

	if(!systemClockJumpTimer) {
		activateSystemClockJumpDetection();
	}
}

function removeSystemClockJumpListener(onSystemClockJump) {
	for(var i = 0; i < systemClockJumpListeners.length; ++i) {
		if(systemClockJumpListeners[i] == onSystemClockJump) {
			systemClockJumpListeners.splice(i, 1);
			break;
		}
	}

	if(!systemClockJumpListeners.length) {
		deactivateSystemClockJumpDetection();
	}
}

// Arguments are optionals.
function configureInterval(newInterval, override) {
	if(override || !configuredSystemClockJumpInterval) {
		configuredSystemClockJumpInterval = newInterval || SYSTEM_CLOCK_JUMP_DETECTION_DEFAULT_INTERVAL;
	}

	if(systemClockJumpTimer && override || !systemClockJumpTimer) {
		deactivateSystemClockJumpDetection();
		activateSystemClockJumpDetection();
	}
}

// Arguments are optionals.
function configureError(newIntervalError, override) {
	configuredSystemClockJumpIntervalError = newIntervalError || SYSTEM_CLOCK_JUMP_DETECTION_DEFAULT_PRECISION;
}

function setPlatformAPI(platformAPI) {
	configuredPlatformAPI = platformAPI;
}

function activateSystemClockJumpDetection() {
	var previousTimestamp = +new Date();

	systemClockJumpTimer = configuredPlatformAPI.setInterval(function () {
		var expectedTimestamp = previousTimestamp + configuredSystemClockJumpInterval,
			actualTimestamp = +new Date(),
			timestampDiff = actualTimestamp - expectedTimestamp;

		previousTimestamp = actualTimestamp;

        // `configuredSystemClockJumpIntervalError` ms precision.
		if (Math.abs(timestampDiff) > configuredSystemClockJumpIntervalError) {
			var toFuture = timestampDiff > 0; /* True if jump to future, false if jump to past*/

			for (var i = 0; i < systemClockJumpListeners.length; ++i) {
				systemClockJumpListeners[i](toFuture);
			}
		}
	}, configuredSystemClockJumpInterval);
}

function deactivateSystemClockJumpDetection() {
	clearInterval(systemClockJumpTimer);
	systemClockJumpTimer = null;
}

module.exports = {
	onSystemClockJump: onSystemClockJump,
	removeSystemClockJumpListener: removeSystemClockJumpListener,
	setPlatformAPI: setPlatformAPI,
	configureInterval: configureInterval,
	configureError: configureError
};

},{}]},{},[16])(16)
});
