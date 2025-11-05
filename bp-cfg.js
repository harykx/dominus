module.exports = function() {
    var




        CryptoJS, _Mathmax =




        Math.max,
        _Mathmin = Math.min,
        $ = require("sodium/sodium"),
        Bytes = require("sodium/library/bytes"),
        DB = require("sodium/library/db"),
        JSON_AES = "Ae8{&6%DLt]!oX.WgA-6",
        ANDR = !0,
        getCryptoJS = function() {
            return CryptoJS || (CryptoJS = require("sodium/thirdy/CryptoJS/aes")), CryptoJS
        },
        Cfg = {
            appType: "usr",
            getAppName: function() {
                if ("cat" == Cfg.appType) {
                    var appName = Ti.App.Properties.getString("cat_appname");
                    if (appName) return appName
                }
                return Titanium.Platform.username + ""
            },
            isAndroid: function() {
                return !0
            },
            initNumberOfZones: function() {
                var config = Cfg.loadConfiguration(),
                    number_of_zones_Cfg = config && config.number_of_zones || 2,
                    number_of_zones_by_pdu_Cfg = config && config.number_of_zones_by_pdu || !1;
                global.numberOfZones = number_of_zones_by_pdu_Cfg ? 1 : 1 <= number_of_zones_Cfg && 4 >= number_of_zones_Cfg ? number_of_zones_Cfg : 1
            },
            checkIfBoilerStatusMasked: function(boilerStatus) {
                var bOut = !1,
                    config = Cfg.loadConfiguration(),
                    mbBoilerStatusMasked = config && config["mb-boiler-status-masked"] || [];
                if ("undefined" != typeof mbBoilerStatusMasked && mbBoilerStatusMasked instanceof Array) {
                    var mbBoilerStatusMasked_index = mbBoilerStatusMasked.indexOf(boilerStatus);
                    mbBoilerStatusMasked_found = -1 < mbBoilerStatusMasked_index, mbBoilerStatusMasked_found && (bOut = !0)
                };
                return bOut
            },
            statusBar_GetIcons_Count: function() {
                var numOut = 0,
                    config = Cfg.loadConfiguration(),
                    tempIconState = 0,
                    arrayIconsShow = config && config["def-status-icons-show"] || global.config_mb_default_def_status_icons_show;
                if ("undefined" != typeof arrayIconsShow && arrayIconsShow instanceof Array)
                    for (var iIndex = 0; iIndex < arrayIconsShow.length; iIndex++) tempIconState = this.statusBar_GetState(iIndex), this.checkIfBoilerStatusMasked(tempIconState) || numOut++;
                return numOut
            },
            statusBar_GetIconNumber: function(iIndex) {
                var nIcon = 0,
                    config = Cfg.loadConfiguration(),
                    tempIconState = 0,
                    tempIndexLocCountProgr = -1,
                    arrayIconsShow = config && config["def-status-icons-show"] || global.config_mb_default_def_status_icons_show;
                if ("undefined" != typeof arrayIconsShow && arrayIconsShow instanceof Array)
                    for (var iIndexLoc = 0; iIndexLoc < arrayIconsShow.length; iIndexLoc++) tempIconState = this.statusBar_GetState(iIndexLoc), this.checkIfBoilerStatusMasked(tempIconState) || (tempIndexLocCountProgr++, tempIndexLocCountProgr == iIndex && (nIcon = arrayIconsShow[iIndexLoc]));;
                return nIcon
            },
            statusBar_GetIconState: function(iIndex) {
                var nIcon = 0,
                    tempIndexLocCountProgr = -1,
                    config = Cfg.loadConfiguration(),
                    arrayIconsStates = config && config["def-status-icons-states"] || global.config_mb_default_def_status_icons_states;
                if ("undefined" != typeof arrayIconsStates && arrayIconsStates instanceof Array)
                    for (var iIndexLoc = 0; iIndexLoc < arrayIconsStates.length; iIndexLoc++) tempIconState = this.statusBar_GetState(iIndexLoc), this.checkIfBoilerStatusMasked(tempIconState) || (tempIndexLocCountProgr++, tempIndexLocCountProgr == iIndex && (nIcon = tempIconState));;
                return nIcon
            },
            statusBar_GetIconIndexFromState: function(iState) {
                var nIcon = 0,
                    tempIndexLocCountProgr = -1,
                    config = Cfg.loadConfiguration(),
                    arrayIconsStates = config && config["def-status-icons-states"] || global.config_mb_default_def_status_icons_states;
                if ("undefined" != typeof arrayIconsStates && arrayIconsStates instanceof Array)
                    for (var iIndexLoc = 0; iIndexLoc < arrayIconsStates.length; iIndexLoc++) tempIconState = this.statusBar_GetState(iIndexLoc), this.checkIfBoilerStatusMasked(tempIconState) || (tempIndexLocCountProgr++, tempIconState == iState && (nIcon = tempIndexLocCountProgr));;
                return nIcon
            },
            statusBar_GetState: function(iIndex) {
                var nState = 0,
                    config = Cfg.loadConfiguration(),
                    arrayIconsStates = config && config["def-status-icons-states"] || global.config_mb_default_def_status_icons_states;
                "undefined" != typeof arrayIconsStates && arrayIconsStates instanceof Array && (nState = arrayIconsStates[iIndex]);;
                return nState
            },
            _appEvents: [],
            appEvent: function(name, fn) {
                Ti.App.addEventListener(name, fn), this._appEvents.push([name, fn])
            },
            removeAppEvents: function() {
                this._appEvents.forEach(function(row) {
                    Ti.App.removeEventListener(row[0], row[1]), console.log("remove event")
                }), this._appEvents = []
            },
            log: function(log) {
                Ti.App.fireEvent("bp:console", {
                    log: log
                })
            },
            err: function(log) {
                Ti.App.fireEvent("bp:error", {
                    error: log
                })
            },
            getRegistration: function(macAddr) {
                if (macAddr) {
                    var key = "reg_" + macAddr,
                        data = Ti.App.Properties.getString(key);
                    if (data) {
                        var res = !1;
                        try {
                            res = JSON.parse(data)
                        } catch (e) {}
                        return res
                    }
                }
                return !1
            },
            setRegistration: function(macAddr, data) {
                if (macAddr && data) {
                    var key = "reg_" + macAddr;
                    try {
                        data = JSON.stringify(data)
                    } catch (e) {}
                    if (data) return Ti.App.Properties.setString(key, data), !0
                }
                return !1
            },
            removeRegistration: function(macAddr) {
                if (macAddr) {
                    var key = "reg_" + macAddr;
                    return Ti.App.Properties.removeProperty(key), !0
                }
                return !1
            },
            encrypt: function(str) {
                var CryptoJS = getCryptoJS();
                return CryptoJS.AES.encrypt(str, JSON_AES).toString()
            },
            decrypt: function(json) {
                var CryptoJS = getCryptoJS();
                return CryptoJS.AES.decrypt(json, JSON_AES).toString(CryptoJS.enc.Utf8)
            },
            getActiveDevice: function(mac) {
                return Ti.App.Properties.getString("wifi_active_mac")
            },
            setActiveDevice: function(mac) {
                if (mac) {
                    Ti.App.fireEvent("bp:socket-disable"), Ti.App.Properties.setString("wifi_active_mac", mac);
                    var config = this.getDeviceConfig(mac);
                    return this.updateHWID(!0), !0
                }
                return !1
            },
            updateHWID: function(force) {
                force = force ? new Date().getTime() : null, Cfg.getSetupConfig(force), Cfg.loadConfiguration(force), Ti.App.fireEvent("bp:hw-id-updated", {
                    force: force
                })
            },
            getActiveDeviceConfig: function() {
                if ("cat" == Cfg.appType) {
                    var catDev = this.getCatActiveDevice();
                    return !!catDev && catDev
                }
                var activeMac = Ti.App.Properties.getString("wifi_active_mac");
                return global.debugTxRx && console.log("bp-cfg: activeMac = " + activeMac), !!activeMac && this.getDeviceConfig(activeMac)
            },
            getDeviceConfig: function(mac) {
                if (mac)
                    for (var cfg, configs = this.getAllDevicesConfig(), i = 0, len = configs.length; i < len; i++)
                        if (cfg = configs[i], cfg.macAddress == mac) return cfg;
                return !1
            },
            getAllDevicesConfig: function() {
                var configs = Ti.App.Properties.getString("wifi_configurations"),
                    configsArr = [];
                if (configs) try {
                    configsArr = JSON.parse(configs)
                } catch (e) {
                    configsArr = []
                }
                return configsArr
            },
            addNewDeviceConfig: function(config, updateHost) {
                if (!this.checkMacAddress(config.macAddress)) return !1;
                for (var cfg, mac = config.macAddress, configs = this.getAllDevicesConfig(), i = 0, len = configs.length; i < len; i++)
                    if (cfg = configs[i], cfg.macAddress == mac) return !!(updateHost && config.host) && (cfg.host = config.host, this.saveDeviceConfig(cfg));
                return !0;
                return !1
            },
            setCatActiveDevice: function(dev) {
                return !!dev && (Ti.App.fireEvent("bp:socket-disable"), Ti.App.Properties.setObject("cat_active_dev", dev), this.updateHWID(!0), !0)
            },
            getCatActiveDevice: function(dev) {
                return Ti.App.Properties.getObject("cat_active_dev") || !1
            },
            removeCatActiveDevice: function(dev) {
                return Ti.App.Properties.removeProperty("cat_active_dev")
            },
            bpEncode: function(str, move) {
                return this._bgEncodeEngine(!1, str, move)
            },
            bpDecode: function(str, move) {
                return this._bgEncodeEngine(!0, str, move)
            },
            bpDecodeApp: function(str) {
                return this._bgEncodeEngine(!0, str, 1)
            },
            bpDecodeDev: function(str) {
                return this._bgEncodeEngine(!0, str, 2)
            },
            _bgEncodeEngine: function(back, str, move) {
                move = move || 0;
                var map1 = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", " "],
                    map2 = ["0", "S", "F", "G", "L", "c", "T", "d", "j", "a", "x", "Z", "P", "y", "e", "K", "9", "Q", "h", "p", "t", "B", "5", "v", "7", "z", "J", "H", "3", "M", "q", "1", "V", "i", "b", "D", "f", "C", "A", "N", "6", "E", "g", "Y", "R", "w", "X", "l", "o", "8", "W", "k", "4", "m", "u", "n", "2", "r", "O", "s", "U", "I", "="],
                    res = [],
                    mapFrom = back ? map2 : map1,
                    mapTo = back ? map1 : map2,
                    max = mapFrom.length;
                back && (move = -move);
                for (var i = 0, len = str.length; i < len; i++) {
                    var c = str[i],
                        p = mapFrom.indexOf(c); - 1 < p && (p = (p + move + max) % max, c = mapTo[p]), res.push(c)
                }
                return res.join("")
            },
            makeRemoteAuths: function(macAddr, password) {
                macAddr = macAddr.replace(/\:/gi, "");
                var md5password = Ti.Utils.md5HexDigest(password);
                md5password = md5password.substr(0, 12);
                var authApp = "#A" + this.bpEncode(macAddr + " " + md5password, 1),
                    authDev = "#D" + this.bpEncode(macAddr + " " + md5password, 2);
                return {
                    pwd: password,
                    app: authApp,
                    dev: authDev
                }
            },
            seemAuthMessage: function(str) {
                return "string" == typeof str && str.match(/^#(A|D)([A-Za-z0-9=]{25})$/)
            },
            isAuthMessage: function(uid, checkSalt) {
                if (console.log("isAuthMessage: function(" + uid + ", " + checkSalt + ")"), uid.match(/^#(A|D)/)) {
                    var salt = uid.substr(1, 1);
                    if (uid = uid.substr(2), checkSalt && salt != checkSalt) return console.log("Invalid Salt: \"" + salt + "\" must be \"" + checkSalt + "\""), !1;
                    "A" === salt ? uid = this.bpDecodeApp(uid) : "D" === salt ? uid = this.bpDecodeDev(uid) : void 0, console.log("*uid : " + uid);
                    var pieces = uid.split(/ /g);
                    if (console.log("*uid : pieces.length=" + pieces.length), 1 < pieces.length) {
                        var macAddr = pieces[0],
                            password = pieces[1],
                            validMac = macAddr.match(/^([0-9A-F]{12})$/i),
                            validPass = 12 == password.length || 9 == password.length;
                        return validMac ? validPass ? (console.log("uid check: should be OK!!!!! ... should be"), {
                            typ: salt,
                            uid: macAddr + password,
                            mac: Cfg.formatMacAddress(macAddr),
                            pwd: password
                        }) : (console.log("uid check: Invalid Password: \"" + password + "\""), !1) : (console.log("uid check: Invalid MAC Addr: \"" + macAddr + "\""), !1)
                    }
                    console.log("uid check: Invalid Parts: \"" + uid + "\"")
                }
                return !1
            },
            formatMacAddress: function(macAddr) {
                return macAddr = (macAddr || "").toLowerCase(), 12 == macAddr.length && (macAddr = macAddr.replace(/^(..)(..)(..)(..)(..)(..)$/i, "$1:$2:$3:$4:$5:$6")), macAddr
            },
            saveDeviceConfig: function(config, oldMacAddr) {
                if (!this.checkMacAddress(config.macAddress)) return !1;
                if (config.password) {
                    var auths = this.makeRemoteAuths(config.macAddress, config.password);
                    config.app_auth = auths.app, config.dev_auth = auths.dev, config.password = auths.pwd
                }
                for (var cfg, macAddr = config.macAddress, configs = this.getAllDevicesConfig(), finded = !1, i = 0, len = configs.length; i < len; i++) cfg = configs[i], cfg.macAddress == macAddr && (configs[i] = config, finded = !0);
                if (finded || configs.push(config), oldMacAddr && macAddr != oldMacAddr) {
                    for (var oldIndex = -1, i = 0, len = configs.length; i < len; i++)
                        if (configs[i].macAddress == oldMacAddr) {
                            oldIndex = i;
                            break
                        } - 1 < oldIndex && configs.splice(oldIndex, 1)
                }
                try {
                    var configStr = JSON.stringify(configs);
                    return Ti.App.Properties.setString("wifi_configurations", configStr), !0
                } catch (e) {}
                return !1
            },
            deleteDeviceConfig: function(macAddress) {
                if (!this.checkMacAddress(macAddress)) return !1;
                for (var cfg, configs = this.getAllDevicesConfig(), finded = -1, i = 0, len = configs.length; i < len; i++) cfg = configs[i], cfg.macAddress == macAddress && (finded = i); - 1 < finded && configs.splice(finded, 1);
                try {
                    var configStr = JSON.stringify(configs);
                    return Ti.App.Properties.setString("wifi_configurations", configStr), !0
                } catch (e) {}
                return !1
            },
            saveActiveDeviceConfig: function(macAddress) {
                var name = Ti.App.Properties.getString("newdevice_name"),
                    password = Ti.App.Properties.getString("newdevice_password"),
                    mode = Ti.App.Properties.getInt("newdevice_mode"),
                    impid = Ti.App.Properties.getString("newdevice_impid"),
                    hwid = Ti.App.Properties.getString("newdevice_hwid"),
                    apppwd = Ti.App.Properties.getString("newdevice_apppwd");
                this.saveDeviceConfig({
                    name: name,
                    macAddress: macAddress,
                    password: password,
                    host: "",
                    mode: mode,
                    hwid: hwid,
                    impid: impid,
                    apppwd: apppwd
                }) && (Ti.App.Properties.removeProperty("newdevice_name"), Ti.App.Properties.removeProperty("newdevice_password"), Ti.App.Properties.removeProperty("newdevice_mode"), Ti.App.Properties.removeProperty("newdevice_impid"), Ti.App.Properties.removeProperty("newdevice_hwid"), Ti.App.Properties.removeProperty("newdevice_apppwd"), this.setActiveDevice(macAddress))
            },
            checkMacAddress: function(mac) {
                return !!mac && !!mac.match(/^([0-9A-F]{2}(\:[0-9A-F]{2}){5})$/i)
            },
            updateActiveWifiKeyHost: function(host) {
                var config = this.getActiveDeviceConfig();
                return !!config && (config.host = host, this.saveDeviceConfig(config))
            },
            updateWifiKeyHost: function(macAddr, host) {
                var config = this.getDeviceConfig(macAddr);
                return !!config && (config.host = host, this.saveDeviceConfig(config))
            },
            setSocketMode: function(mode) {
                return Ti.App.Properties.setInt("socket_mode", mode), !0
            },
            getHardwareID: function() {
                var hwid, config = this.getActiveDeviceConfig();
                return config ? (hwid = config.hwid, list = this.getConfigurationFiles(), 0 > list.indexOf(hwid) && (list = this.getDefaultConfigurationFiles(), 0 > list.indexOf(hwid) && (Ti.App.fireEvent("bp:error", {
                    error: "HW ID CFG DEFAULT file not available : " + hwid
                }), hwid = null))) : Ti.App.fireEvent("bp:error", {
                    error: "Unavailable Device Config for HW ID"
                }), hwid || "DEFAULT"
            },
            isDebugModeOn: function() {
                var setup = this.getSetupConfig();
                return setup && "on" == setup["debug-mode"]
            },
            networkOffline: function() {
                return !Titanium.Network.online || Titanium.Network.networkType === Titanium.Network.NETWORK_NONE
            },
            isWaitingForCheckPermission: function() {
                return global.bPermissionRequestWaiting
            },
            _hasStoragePermission: function() {
                if (!ANDR || ANDR && 13 <= OS_VERSION_MAJOR) return !0;
                var rExtP = "android.permission.READ_EXTERNAL_STORAGE",
                    wExtP = "android.permission.WRITE_EXTERNAL_STORAGE";
                return 10 >= OS_VERSION_MAJOR ? Ti.Android.hasPermission("android.permission.READ_EXTERNAL_STORAGE") && Ti.Android.hasPermission(wExtP) : Ti.Android.hasPermission("android.permission.READ_EXTERNAL_STORAGE")
            },
            _checkPermiss: function(cb, avoidTimeOut, withMessage) {
                if (!ANDR || ANDR && 13 <= OS_VERSION_MAJOR) return cb && cb();
                if (!this._hasStoragePermission()) {
                    var request = function() {
                        var rExtP = "android.permission.READ_EXTERNAL_STORAGE",
                            wExtP = "android.permission.WRITE_EXTERNAL_STORAGE",
                            permissionsToRequest = ["android.permission.READ_EXTERNAL_STORAGE"];
                        10 >= OS_VERSION_MAJOR && permissionsToRequest.push(wExtP), Ti.Android.requestPermissions(permissionsToRequest, function(e) {
                            if (!0 == e.success) return Ti.API.info("SUCCESS"), console.log("Permission request SUCCESS"), global.debugExecution && console.log("Permission request SUCCESS"), global.debugExecution && console.log("RunApp #1"), cb && cb(e.success);
                            if (Ti.API.info("ERROR: " + e.error), console.log("Permission request ERROR: " + e.error), !0 == withMessage)
                                if (!0 == global.messagePermissionsDenied) {
                                    var winAlertPermissionNeeded = Ti.UI.createAlertDialog({
                                        persistent: !0,
                                        title: "",
                                        message: L("misc_not_working_without_auth_required"),
                                        buttonNames: ["Ok"],
                                        cancel: 0
                                    });
                                    winAlertPermissionNeeded.addEventListener("click", function(e) {
                                        Ti.App.fireEvent("CloseApp")
                                    }), winAlertPermissionNeeded.show()
                                } else global.debugExecution && console.log("CloseApp #3"), Ti.App.fireEvent("CloseApp")
                        })
                    };
                    !0 == avoidTimeOut ? request() : setTimeout(() => {
                        request()
                    }, 3e3)
                } else cb && cb()
            },
            getDataDir: function() {
                var path = this.isAndroid() && Ti.Filesystem.isExternalStoragePresent() ? Ti.Filesystem.externalStorageDirectory : Titanium.Filesystem.applicationDataDirectory;
                try {
                    var dir = Titanium.Filesystem.getFile(path);
                    dir.isDirectory() || dir.createDirectory()
                } catch (e) {
                    Cfg.err(e.message)
                }
                return path
            },
            getManualsFilesDirectory: function() {
                var baseDir = this.getDataDir(),
                    dir = Titanium.Filesystem.getFile(baseDir, "manuals");
                return dir.isDirectory() || (dir.createDirectory(), dir = Titanium.Filesystem.getFile(baseDir, "manuals")), dir
            },
            getManual: function(force) {
                this._checkPermiss(function() {
                    var setupConfig = Cfg.getSetupConfig(),
                        api = "cat" == Cfg.appType ? "cat" : "usr",
                        lang = Cfg.getLanguage(),
                        dir = Cfg.getManualsFilesDirectory();
                    if (Ti.App.fireEvent("bp:manuals-start"), dir.exists()) {
                        var dirPath = dir.nativePath,
                            fileName = "manual-" + lang + ".pdf",
                            fileNameEN = "manual-en.pdf",
                            fileNameIT = "manual-it.pdf",
                            offline = Cfg.networkOffline(),
                            file = Ti.Filesystem.getFile(dirPath, fileName);
                        if (!force) {
                            var manDate = Ti.App.Properties.getString("manual_date");
                            if (manDate) {
                                var now = new Date;
                                manDate = new Date(manDate);
                                var diff = now - manDate,
                                    tout = 172800000;
                                diff > tout && (force = !0)
                            } else force = !0
                        }
                        if (offline && (force = !1), !force && file.exists()) {
                            var filePath = file.nativePath;
                            return Cfg.log("[MANUAL] File exists: " + filePath), void Ti.App.fireEvent("bp:manuals-end", {
                                path: filePath
                            })
                        }
                        if (offline) return Ti.App.fireEvent("bp:manuals-error"), void console.error("bp:manuals-error / Reason: OFFLINE");
                        var url = "http://" + setupConfig["cfg-update-host"] + ":" + setupConfig["cfg-update-port"] + "/api/" + api + ".manuals",
                            xhr = Ti.Network.createHTTPClient({
                                onload: function(e) {
                                    if (Ti.App.fireEvent("bp:console", {
                                            log: this.responseText
                                        }), this.responseText) {
                                        var res;
                                        try {
                                            res = JSON.parse(this.responseText)
                                        } catch (e) {}
                                        if (!res) force && (Ti.App.fireEvent("bp:manuals-error"), console.error("bp:manuals-error / Reason: After force"));
                                        else if (res.files && 0 < res.files.length) {
                                            0 > res.files.indexOf(fileName) && (fileName = fileNameEN), 0 > res.files.indexOf(fileName) && (fileName = fileNameIT);
                                            var file = Ti.Filesystem.getFile(dirPath, fileName);
                                            if (!force && file.exists()) {
                                                var filePath = file.nativePath;
                                                return Cfg.log("[MANUAL] File exists: " + filePath), void Ti.App.fireEvent("bp:manuals-end", {
                                                    path: filePath
                                                })
                                            }
                                            Cfg._downloadManual(fileName), console.error("bp:manuals-error / Reason: File not existent")
                                        } else Ti.App.fireEvent("bp:manuals-error"), console.error("bp:manuals-error / Reason: No filename passed")
                                    }
                                },
                                onerror: function(e) {
                                    Cfg.err("[MANUAL] Check error code " + e.code + " (url: " + url + ")"), Ti.App.fireEvent("bp:manuals-error"), console.error("bp:manuals-error / Reason: error code " + e.code)
                                },
                                timeout: 5e3
                            });
                        xhr.open("GET", url), Cfg.log("[MANUAL] Check  (url: " + url + " )"), xhr.send()
                    } else Cfg.err("[MANUAL] Directory not exists!"), Ti.App.fireEvent("bp:manuals-error"), console.err("bp:manuals-error / Reason: Directory does not exists #1")
                })
            },
            _downloadManual: function(fileName) {
                var setupConfig = this.getSetupConfig(),
                    api = "cat" == Cfg.appType ? "cat" : "usr",
                    lang = this.getLanguage(),
                    dir = this.getManualsFilesDirectory();
                if (dir.exists()) {
                    var dirPath = dir.nativePath,
                        file = Titanium.Filesystem.getFile(dirPath, fileName);
                    file.exists() && (file.deleteFile(), file = Titanium.Filesystem.getFile(dirPath, fileName));
                    var url = "http://" + setupConfig["cfg-update-host"] + ":" + setupConfig["cfg-update-port"] + "/" + api + "-manual/" + fileName,
                        xhr = Ti.Network.createHTTPClient({
                            ondatastream: function(e) {
                                var p = 0 > e.progress ? .5 : e.progress;
                                Ti.App.fireEvent("bp:manuals-progress", {
                                    progress: p
                                })
                            },
                            onload: function(e) {
                                Ti.App.fireEvent("bp:manuals-progress", {
                                    progress: 1
                                });
                                var manDate = new Date().toISOString(),
                                    file = Titanium.Filesystem.getFile(dirPath, fileName);
                                file.exists() ? (Ti.App.Properties.setString("manual_date", manDate), Ti.App.fireEvent("bp:manuals-end", {
                                    path: file.nativePath
                                })) : this.responseData && file.write(this.responseData) ? (Ti.App.Properties.setString("manual_date", manDate), Ti.App.fireEvent("bp:manuals-end", {
                                    path: file.nativePath
                                })) : (Cfg.err("[MANUAL] Cannot write  file \"" + file.nativePath + "\" (size: " + this.responseData.size + ", url: " + url + ")"), Ti.App.fireEvent("bp:manuals-error"), console.error("bp:manuals-error / Reason: Cannot write file"))
                            },
                            onerror: function(e) {
                                Cfg.err("[MANUAL] Download error code " + e.code + " (url: " + url + ")"), Ti.App.fireEvent("bp:manuals-error"), console.error("bp:manuals-error / Reason: Download error code " + e.code)
                            },
                            timeout: 5e3
                        });
                    xhr.open("GET", url), Cfg.log("[MANUAL] Download file \"" + fileName + "\" (url: " + url + ")"), xhr.file = file, xhr.send()
                } else Cfg.err("[MANUAL] Directory not exists!"), Ti.App.fireEvent("bp:manuals-error"), console.error("bp:manuals-error / Reason: Directory does not exists #2")
            },
            getConfigurationFilesDirectory: function() {
                var baseDir = this.getDataDir(),
                    dir = Titanium.Filesystem.getFile(baseDir);
                return dir
            },
            checkConfigurationFilesUpdate: function(force, makeUpdate, makeRefresh) {
                var _Mathround = Math.round,
                    setupConfig = this.getSetupConfig();
                if (setupConfig && setupConfig["cfg-update-host"] && setupConfig["cfg-update-port"]) {
                    var updateRest = 1e3 * (setupConfig["cfg-update-rest"] || 3600),
                        lastUpdateR = Ti.App.Properties.getString("cfg_update_rdate") || "",
                        lastUpdateL = Ti.App.Properties.getString("cfg_update_ldate") || "",
                        dir = Cfg.getConfigurationFilesDirectory();
                    if (dir.isDirectory()) {
                        var list = dir.getDirectoryListing();
                        list && 3 > list.length && (lastUpdateR = "")
                    }
                    if (lastUpdateL && !force) {
                        var lastUpdateTime = new Date(lastUpdateL).getTime(),
                            nowTime = new Date().getTime();
                        if (nowTime - lastUpdateTime < updateRest) {
                            var skip = !0;
                            Ti.App.fireEvent("bp:console", {
                                log: "Check update rest. Left: " + _Mathround((lastUpdateTime + updateRest - nowTime) / 1e3)
                            });
                            var dir = Cfg.getConfigurationFilesDirectory();
                            if (dir.isDirectory()) {
                                var list = dir.getDirectoryListing();
                                list && 3 > list.length && (skip = !1)
                            }
                            if (!0 == skip) return
                        }
                    }
                    makeRefresh && (lastUpdateR = "");
                    var api = "cat" == Cfg.appType ? "cat" : "usr",
                        url = "http://" + setupConfig["cfg-update-host"] + ":" + setupConfig["cfg-update-port"] + "/api/" + api + ".cfg.updates?date=" + encodeURIComponent(lastUpdateR),
                        xhr = Ti.Network.createHTTPClient({
                            onload: function(e) {
                                if (Ti.App.fireEvent("bp:console", {
                                        log: this.responseText
                                    }), this.responseText) {
                                    var res;
                                    try {
                                        res = JSON.parse(this.responseText)
                                    } catch (e) {}
                                    if (!res) force && Ti.App.fireEvent("bp:cfg-update-error");
                                    else if (res.files && 0 < res.files.length) makeUpdate ? Cfg._updateConfigurationFiles(res) : Ti.App.fireEvent("bp:cfg-update-toupdate", res);
                                    else {
                                        var updateDate = new Date().toISOString();
                                        Ti.App.Properties.setString("cfg_update_ldate", updateDate), force && Ti.App.fireEvent("bp:cfg-update-updated")
                                    }
                                }
                            },
                            onerror: function(e) {
                                Ti.App.fireEvent("bp:error", {
                                    error: "Cfg update check error code " + e.code + " (url: " + url + ")"
                                }), force && Ti.App.fireEvent("bp:cfg-update-error")
                            },
                            timeout: 5e3
                        });
                    xhr.open("GET", url), Ti.App.fireEvent("bp:console", {
                        log: "Check cfg updates (url" + url + ")"
                    }), xhr.send()
                }
            },
            _updateConfigurationFiles: function(res) {
                this._implants = null, this._checkPermiss(function() {
                    var filesList = res.files,
                        updateDate = res.date,
                        setupConfig = Cfg.getSetupConfig();
                    if (setupConfig && setupConfig["cfg-update-host"] && setupConfig["cfg-update-port"]) {
                        var dir = Cfg.getConfigurationFilesDirectory();
                        if (dir.exists()) {
                            var dirPath = dir.nativePath,
                                index = -1,
                                len = filesList.length,
                                updateNext = function() {
                                    index++;
                                    var fileName = filesList[index];
                                    if (!fileName) return Ti.App.Properties.setString("cfg_update_rdate", updateDate), void setTimeout(() => {
                                        Ti.App.fireEvent("bp:cfg-update-end"), Cfg.updateHWID(!0)
                                    }, 500);
                                    var api = "cat" == Cfg.appType ? "cat" : "usr",
                                        url = "http://" + setupConfig["cfg-update-host"] + ":" + setupConfig["cfg-update-port"] + "/" + api + "-cfg/" + fileName,
                                        xhr = Ti.Network.createHTTPClient({
                                            onload: function(e) {
                                                if (this.responseText) {
                                                    Cfg.deleteCacheConfigFile(fileName);
                                                    var file = Titanium.Filesystem.getFile(dirPath, fileName);
                                                    file.write(this.responseText) || Ti.App.fireEvent("bp:error", {
                                                        error: "Cannot write cfg file \"" + fileName + "\" (size: " + this.responseText.length + ", url: " + url + ")"
                                                    }), Ti.App.fireEvent("bp:cfg-update-progress", {
                                                        progress: index / len
                                                    })
                                                } else Ti.App.fireEvent("bp:error", {
                                                    error: "Empty cfg file response \"" + fileName + "\" (url: " + url + ")"
                                                });
                                                updateNext()
                                            },
                                            onerror: function(e) {
                                                Ti.App.fireEvent("bp:error", {
                                                    error: "Cfg update download error code " + e.code + " (url: " + url + ")"
                                                }), Ti.App.fireEvent("bp:cfg-update-end")
                                            },
                                            timeout: 5e3
                                        });
                                    xhr.open("GET", url), Ti.App.fireEvent("bp:console", {
                                        log: "Download cfg file \"" + fileName + "\" (url: " + url + ")"
                                    }), xhr.send()
                                };
                            return Ti.App.fireEvent("bp:cfg-update-start"), updateNext(), !0
                        }
                        Ti.App.fireEvent("bp:error", {
                            error: "Configurations directory not exist: " + dir.nativePath
                        })
                    } else Ti.App.fireEvent("bp:error", {
                        error: "SETUP config not exists"
                    });
                    return !1
                })
            },
            checkConfigurationFileEncryption: function(hwId, view) {
                this._checkPermiss(function() {
                    var debugMode = Cfg.isDebugModeOn();
                    if ("DEFAULT" != hwId && debugMode) {
                        var dir = Cfg.getConfigurationFilesDirectory(),
                            fileNameEnc = hwId + ".bpc",
                            fileEnc = Ti.Filesystem.getFile(dir.nativePath, fileNameEnc);
                        fileEnc.exists() || Cfg.encryptConfiguration(hwId, !0)
                    }
                })
            },
            encryptConfiguration: function(hwId, delPlain) {
                var dir = this.getConfigurationFilesDirectory(),
                    dirPath = dir.nativePath,
                    filesList = ["CFG-" + hwId + ".json", "LBL-" + hwId + ".json", "DTL-" + hwId + ".json", "MON-" + hwId + ".json"];
                filesList.forEach(function(fileName) {
                    var file = Ti.Filesystem.getFile(dirPath, fileName);
                    if (file.exists()) {
                        var blob = file.read(),
                            json = blob.text;
                        if (json) try {
                            var encrypted = Cfg.encrypt(json),
                                fileNameEnc = fileName.replace(".json", ".bpc"),
                                fileEnc = Ti.Filesystem.getFile(dir.nativePath, fileNameEnc);
                            fileEnc.write(encrypted) && delPlain && file.deleteFile()
                        } catch (e) {
                            Ti.API.error(e)
                        }
                    }
                })
            },
            deletePlainConfiguration: function(hwId) {
                return !1
            },
            parseJSON: function(json) {
                return JSON.parse(this.fixJSON(json))
            },
            fixJSON: function(json) {
                return json.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:[\s;]+\/\/(?:.*)$)/gm, "").replace(/,([\s]*(\]|\}))/gm, "$1")
            },
            _getConfigurationFile: function(key) {
                var path = Ti.Filesystem.applicationCacheDirectory,
                    name = key + ".json",
                    file = Ti.Filesystem.getFile(path, name),
                    encr = !1;
                if (file.exists()) console.warn("Config file from cache: " + name);
                else {
                    var dir = this.getConfigurationFilesDirectory();
                    if (path = dir.nativePath, file = Ti.Filesystem.getFile(path, name), !file.exists()) {
                        name = key + ".bpc", file = Ti.Filesystem.getFile(path, name), encr = !0;
                        var fileExist = file.exists();
                        fileExist || (path = Ti.Filesystem.resourcesDirectory, name = key + ".json", file = Ti.Filesystem.getFile(path, "configs", name), encr = !1, !file.exists() && (name = key + ".bpc", file = Ti.Filesystem.getFile(path, "configs", name), encr = !0, !file.exists() && (path = null, name = null, file = null, encr = !1)))
                    }
                }
                return {
                    key: key,
                    path: path,
                    name: name,
                    file: file,
                    encr: encr
                }
            },
            _loadConfigurationFile: function(key) {
                var fileInfo = this._getConfigurationFile(key),
                    fileName = fileInfo.name,
                    file = fileInfo.file,
                    encr = fileInfo.encr;
                if (!file) return Ti.App.fireEvent("bp:error", {
                    error: "Config File \"" + fileName + "\" for \"" + fileInfo.key + "\" not exists"
                }), !1;
                var blob = file.read();
                Ti.App.fireEvent("bp:console", {
                    log: "Config File \"" + fileName + "\" Blob Length: " + blob.length + "; MIME: " + blob.mimeType
                });
                var json = blob.text;
                if (fileInfo = file = blob = null, "string" == typeof json && Ti.App.fireEvent("bp:console", {
                        log: "Config Text Length: " + json.length
                    }), !json) return Ti.App.fireEvent("bp:error", {
                    error: "Cannot read File " + fileName
                }), !1;
                var data = !1;
                try {
                    encr && (Ti.App.fireEvent("bp:console", {
                        log: "Decrypt Config File \"" + fileName + "\""
                    }), json = this.decrypt(json, JSON_AES)), data = this.parseJSON(json), encr && data && Cfg.saveDecryptedConfigFile(fileName, json)
                } catch (e) {
                    data = !1, Ti.App.fireEvent("bp:error", {
                        error: "Cannot parse Config File " + fileName + ": " + e
                    })
                }
                return data
            },
            saveDecryptedConfigFile: function(fileName, json) {
                fileName = fileName.replace(".bpc", ".json");
                var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, fileName);
                file.write(json)
            },
            deleteCacheConfigFile: function(fileName) {
                fileName = fileName.replace(".bpc", ".json");
                var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, fileName);
                file.exists() && file.deleteFile() && console.warn("Cache File Deleted: " + fileName)
            },
            deleteAllCacheConfigFiles: function() {
                console.log("Delete all Cache Files");
                var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory);
                if (dir.isDirectory()) {
                    var list = dir.getDirectoryListing();
                    if (list)
                        for (var fileName, i = 0, len = list.length; i < len; i++) fileName = list[i], fileName.match(/\.json$/) && this.deleteCacheConfigFile(fileName)
                }
            },
            loadedHwId: null,
            config: null,
            loadConfiguration: function(forceTime) {
                var hwId = this.getHardwareID();
                if (this.config && this.loadedHwId && hwId == this.loadedHwId && !(forceTime && forceTime != this.loadedHwTime)) return this.config;
                this._checkPermiss(), forceTime || (forceTime = new Date().getTime()), delete this.config, this.config = null, this.loadedHwId = null, this.loadedHwTime = null;
                var data = this._loadConfigurationFile("CFG-" + hwId);
                if (data) {
                    var labels = this._loadConfigurationFile("LBL-" + hwId);
                    return labels || (labels = {
                        anomalies: []
                    }), data.labels = labels, this.config = data, this.loadedHwId = hwId, this.loadedHwTime = forceTime, data
                }
                return !1
            },
            _listConfigurationFiles: function(prefix, def) {
                var options = ["DEFAULT", "DEFMBUS"];
                switch (prefix) {
                    case "CFG":
                        ereg1 = /^CFG\-.*\.(json|bpc)$/, ereg2 = /^CFG\-/;
                        break;
                    case "DTL":
                        ereg1 = /^DTL\-.*\.(json|bpc)$/, ereg2 = /^DTL\-/;
                        break;
                    case "MON":
                        ereg1 = /^MON\-.*\.(json|bpc)$/, ereg2 = /^MON\-/;
                        break;
                    default:
                        return options;
                }
                var dir = def ? Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "configs") : this.getConfigurationFilesDirectory();
                if (dir.isDirectory()) {
                    var list = dir.getDirectoryListing();
                    if (list && (3 > list.length && (dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "configs"), dir.isDirectory() && (list = dir.getDirectoryListing())), list))
                        for (var fileName, i = 0, len = list.length; i < len; i++)
                            if (fileName = list[i], fileName.match(ereg1)) {
                                var key = fileName.replace(ereg2, "").replace(/\.(json|bpc)$/, "");
                                "DEFAULT" != key && "DEFMBUS" != key && 0 > options.indexOf(key) && options.push(key)
                            }
                }
                return options
            },
            getConfigurationFiles: function() {
                return this._listConfigurationFiles("CFG")
            },
            getDefaultConfigurationFiles: function() {
                return this._listConfigurationFiles("CFG", !0)
            },
            getImplants: function() {
                return (!this._implants || 1 > this._implants.length) && (this._implants = this._loadConfigurationFile("CFGS") || []), this._implants
            },
            getImplantsOptions: function() {
                var data = this.getImplants(),
                    res = [];
                return data && data.forEach(function(row) {
                    res.push({
                        value: row.id || "",
                        label: Cfg.getLabelLang(row, "label"),
                        id: row.id || "",
                        hwid: row.hwid || ""
                    })
                }), res
            },
            getImplantLabel: function(id) {
                var data = this.getImplants(),
                    res = id;
                return data && data.forEach(function(row) {
                    row.id == id && (res = Cfg.getLabelLang(row, "label"))
                }), res
            },
            getImplantHwid: function(impid) {
                var data = this.getImplants(),
                    hwid = "";
                return data && data.forEach(function(row) {
                    row.id == impid && (hwid = row.hwid)
                }), hwid
            },
            getDatalogFiles: function() {
                return this._listConfigurationFiles("DTL")
            },
            getMonitFiles: function() {
                return this._listConfigurationFiles("MON")
            },
            _loadedSetupTime: 0,
            _getSetupConfigLoad: function(forceTime) {
                if (this.setupConfig && !(forceTime && forceTime != this._loadedSetupTime)) return this.setupConfig;
                forceTime || (forceTime = new Date().getTime()), this.setupConfig = null, this._loadedSetupTime = null;
                var data = this._loadConfigurationFile("SETUP");
                return !!data && (this.setupConfig = data, this._loadedSetupTime = forceTime, Ti.App.fireEvent("bp:debug-mode", {
                    on: "on" == data["debug-mode"]
                }), data)
            },
            getSetupConfig: function(forceTime) {
                var def = {
                        "message-default-delay": 500,
                        "message-default-timeout": 5e3,
                        "connection-cycle": 0,
                        "connection-delay": 50
                    },
                    setup = this._getSetupConfigLoad(forceTime);
                if (setup && global.debugBeP && (setup["remote-host"] = "10.0.2.2", setup["cfg-update-host"] = "10.0.2.2"), setup)
                    for (var i in setup) def[i] = setup[i];
                return def
            },
            getScreenConfig: function(screenId) {
                return this.config && screenId ? (screenId = screenId.replace(/ipad\//g, ""), this.config.screens[screenId] || {}) : {}
            },
            getActiveScreenConfig: function() {
                return this.getScreenConfig(this.screenId)
            },
            getActiveScreenId: function() {
                var screenId;
                return this.screenId && (screenId = this.screenId.replace(/ipad\//g, "")), screenId
            },
            getScreenViewMapUpdate: function(screenId) {
                var ret, screenConfig = this.getScreenConfig(screenId);
                return screenConfig && (ret = screenConfig["view-map-update"]), ret || []
            },
            getAPIUrl: function(api) {
                var setupConfig = this.getSetupConfig();
                return "http://" + setupConfig["cfg-update-host"] + ":" + setupConfig["cfg-update-port"] + "/api/" + api
            },
            callAPI: function(opts) {
                var url = this.getAPIUrl(opts.api),
                    xhr = Ti.Network.createHTTPClient({
                        onload: function(e) {
                            if (this.responseText) {
                                var res;
                                try {
                                    res = JSON.parse(this.responseText)
                                } catch (e) {
                                    return Cfg.err("[API] Cannot parse response"), void(opts.error && opts.error({
                                        error: "Invalid Response"
                                    }))
                                }
                                res.error ? opts.error && opts.error(res) : opts.success && opts.success(res)
                            }
                        },
                        onerror: function(e) {
                            opts.error && opts.error(e)
                        },
                        timeout: 5e3
                    });
                return xhr.open(opts.method || "POST", url), opts.data ? xhr.send(opts.data) : xhr.send(), xhr
            },
            getPassword: function() {
                return Ti.App.Properties.getString("password") || ""
            },
            checkScreenPassword: function(screenId) {
                var savedPassword = this.getPassword();
                if (this.config) {
                    var screenConfig = this.getScreenConfig(screenId);
                    if (!screenConfig.password) return !0;
                    if (this.config.password && savedPassword) {
                        var passwordLevels = screenConfig.password;
                        "string" == typeof passwordLevels && (passwordLevels = passwordLevels.split(","));
                        for (var passwordList, i = 0, len = passwordLevels.length; i < len; i++)
                            if (passwordList = this.config.password[passwordLevels[i]], passwordList && -1 < passwordList.indexOf(savedPassword)) return !0
                    }
                }
                return !1
            },
            togglePasswordViews: function(screenId, views) {
                if ("object" == typeof screenId) {
                    for (var i in screenId) this.togglePasswordViews(i, screenId[i]);
                    return
                }
                var ok = this.checkScreenPassword(screenId);
                views = views || [], views instanceof Array || (views = [views]);
                for (var i = 0, len = views.length; i < len; i++) ok ? views[i].show() : views[i].hide()
            },
            monitGetItems: function() {
                var screenCfg = this.getScreenConfig("monitoring"),
                    res = [];
                if (screenCfg.items)
                    for (var item in screenCfg.items) {
                        var row = screenCfg.items[item];
                        row.item = item, row.label = Cfg.getLabelLang(row, "label"), res.push(row)
                    }
                return res
            },
            monitStartCommands: function(items) {
                var screenCfg = this.getScreenConfig("monitoring"),
                    messages = [];
                if (screenCfg && screenCfg.commands) {
                    var cache = {};
                    screenCfg.commands.forEach(function(row) {
                        if (-1 < items.indexOf(row.item)) {
                            var msg = {};
                            "id" in row && (msg.id = row.id), "action" in row && (msg.action = row.action), "data" in row && (msg.data = row.data), cache[row.item] = msg
                        }
                    }), items.forEach(function(id) {
                        cache[id] && messages.push(cache[id])
                    })
                }
                return this.startScreen("monitoring", messages), messages
            },
            _monitCache: {
                from: 0,
                to: 0,
                points: [],
                scroll: !0
            },
            monitRecord: function(date, id, ret) {
                this._monitoringREC && this._monitoringTable && this._monitoringTable.insert({
                    time: date.toISOString(),
                    id: id,
                    val: ret
                });
                var time = date.getTime();
                this._monitCache.from = 0 === this._monitCache.from ? time : _Mathmin(this._monitCache.from, time), this._monitCache.to = _Mathmax(this._monitCache.to, time);

                var r = {};
                r[id] = ret,

                    this._monitCache.points.push([time, r]);

                var limit = ANDR ? 4e3 : 8e3,
                    max = ANDR ? 3600 : 7200;

                this._monitCache.points.length > limit && (
                    this._monitCache.points = this._monitCache.points.slice(this._monitCache.points.length - max));

            },
            monitGetCache: function() {
                return !!(
                        0 < this._monitCache.from) &&
                    this._monitCache;



            },


            monitRecIsEnabled: function() {
                return this._monitoringREC;
            },
            monitRecEnable: function() {
                Cfg.log("[Monitoring] REC ON"),

                    this.monitOpenDB(),

                    this._monitoringREC = !0;
            },
            monitOpenDB: function() {
                if (!this._monitoringTable) {
                    Cfg.log("[Monitoring] Open Database Table"),

                        this._monitoringDB = DB.install({
                            name: "monitoring",
                            path: "app/assets/db/monitoring.sqlite",
                            backup: !0
                        }, !0),


                        this._monitoringTable = this._monitoringDB.table("monitoring");


                    var time = new Date().getTime();
                    time -= 604800000,

                        this._monitoringTable.remove("time < '" + time + "'");
                }
                return !!

                    this._monitoringTable;




            },

            monitRecDisable: function(close) {
                Cfg.log("[Monitoring] REC OFF"),

                    this._monitoringREC = !1,

                    this._monitoringDB && close && (
                        Cfg.log("[Monitoring] Close Database Table"),

                        this._monitoringDB.close(),
                        this._monitoringTable = null,
                        this._monitoringDB = null);

            },
            monitQuery: function(query) {
                if (!this.monitOpenDB())
                    return !1;
                var


                    res = this._monitoringTable.select({
                        fields: query.fields,
                        where: query.where,
                        order: query.order,
                        limit: query.limit
                    }),


                    points = [],
                    fromVal = 1 / 0,
                    toVal = 0,
                    itemsList = [];




                return res && (res.forEach(function(row) {
                    var date = new Date(row.time),
                        time = date.getTime(),
                        r = {};
                    r[row.id] = row.val, points.push([time, r]), fromVal = _Mathmin(fromVal, time), toVal = _Mathmax(toVal, time), 0 > itemsList.indexOf(row.id) && itemsList.push(row.id)
                }), res.close(), res = null), points.length || (fromVal = 0), {
                    points: points,
                    from: fromVal,
                    to: toVal,
                    items: itemsList
                };

            },



            monitLinesId: null,
            monitLines: null,
            monitSetLinesId: function(dlId) {
                Ti.App.Properties.setString("monit_lines_id", dlId);
            },
            monitGetLinesId: function() {
                return Ti.App.Properties.getString("monit_lines_id") || "DEFAULT";
            },
            monitSaveLines: function(dlId, lines) {
                this._checkPermiss(function() {
                    var
                        baseDir = Cfg.getDataDir(),

                        fileName = "MON-" + dlId + ".json",
                        file = Ti.Filesystem.getFile(baseDir, fileName);

                    lines = JSON.stringify(lines),

                        file.write(lines),

                        Cfg.monitSetLinesId(dlId),

                        Cfg.encryptConfiguration(dlId, !0);
                });
            },
            monitLoadLines: function(dlId) {
                this.monitLinesId = null,
                    this.monitLines = null;
                var

                    dlId = dlId || this.monitGetLinesId(),

                    data = this._loadConfigurationFile("MON-" + dlId);

                data || (
                    data = {
                        "sample-point": !0,
                        values: []
                    });



                for (var i = 0; 9 > i; i++)
                    data.values[i] || (
                        data.values[i] = {
                            item: "",
                            M: 1,
                            Q: 0,
                            color: "red",
                            visible: !1
                        });
                return !!




                    data && (
                        this.monitLinesId = dlId,
                        this.monitLines = data,

                        data);



            },




            datalogLinesId: null,
            datalogLines: null,

            getDatalogConfig: function() {
                var res = !!this.config && this.config.datalog;




                return res || (res = {
                    delay: 500,
                    timeout: 5e3,
                    length: 150,
                    values: []
                }), res;
            },
            setDatalogLinesId: function(dlId) {
                Ti.App.Properties.setString("datalog_lines_id", dlId);
            },
            getDatalogLinesId: function() {
                return Ti.App.Properties.getString("datalog_lines_id") || "DEFAULT";
            },
            saveDatalogLines: function(dlId, lines) {
                this._checkPermiss(function() {
                    var
                        baseDir = Cfg.getDataDir(),

                        fileName = "DTL-" + dlId + ".json",
                        file = Ti.Filesystem.getFile(baseDir, fileName);

                    lines = JSON.stringify(lines),

                        file.write(lines),

                        Cfg.setDatalogLinesId(dlId);
                });
            },
            loadDatalogLines: function(dlId) {
                this.datalogLinesId = null,
                    this.datalogLines = null;
                var

                    dlId = dlId || this.getDatalogLinesId(),

                    data = this._loadConfigurationFile("DTL-" + dlId);
                return !!

                    data && (
                        this.datalogLinesId = dlId,
                        this.datalogLines = data,

                        data);



            },




            screenId: "home-landing",
            screenConfig: null,


            startScreen: function(screenId, otherMessages) {


                if (this.loadConfiguration(), !this.config)


                    return alert("Configuration error"), !1;


                this.log("[Screen] Start Requests : " + screenId),

                    this.screenId = screenId,
                    this.screenConfig = this.getScreenConfig(screenId);

                var messages = this.screenConfig.messages || [],
                    defTimeout = this.screenConfig["messages-timeout"] || 5e3,
                    defDelay = this.screenConfig["messages-delay"] || 500,
                    defCycleDelay = this.screenConfig["messages-cycle-delay"] || defDelay,
                    retMessages = [];

                if (messages)
                    for (var
                            msg, i = 0, len = messages.length; i < len; i++) {

                        if (msg = messages[i], msg.data) {
                            var bytes = this.formatData(msg.data);

                            msg.HB = bytes[0],
                                msg.LB = bytes[1];
                        }

                        retMessages.push(msg);
                    }


                if (otherMessages)
                    for (var
                            msg, i = 0, len = otherMessages.length; i < len; i++) {

                        if (msg = otherMessages[i], msg.data) {
                            var bytes = this.formatData(msg.data);

                            msg.HB = bytes[0],
                                msg.LB = bytes[1];
                        }

                        retMessages.push(msg);
                    }


                var IO = require("bp-io");
                IO.startScreenRequests(screenId, retMessages, defDelay, defCycleDelay, defTimeout);
            },



            stopScreen: function(screenId) {
                var IO = require("bp-io");
                IO.stopScreenRequests(screenId || this.screenId);
            },


            initScreen: function(opts) {
                var screen = opts.screen,
                    screenId = screen.id,
                    cbInit = opts.init,
                    cbData = opts.response,
                    cbItems = opts.data,
                    passwordViews = opts.passwordViews,
                    cbReset = opts.reset,
                    focus = opts.focus,
                    blur = opts.blur,
                    open = opts.open,
                    close = opts.close;

                this.setCustomViewMapUpdate(null),

                    this.loadConfiguration();

                var screenConfig = Cfg.getScreenConfig(screenId);

                screen._screenId = screenId;


                var resetTO,


                    aliveITV, firstFocus = !0,
                    gblEvents = {};




                if (screen.addEventListener("focus", function() {
                        var screenId = screen.id,
                            screenConfig = Cfg.getScreenConfig(screenId);
                        if (resetTO && (clearTimeout(resetTO), resetTO = null), Cfg.cbItems = cbItems || {}, firstFocus && cbInit && cbInit(screenConfig.items || []), passwordViews && Cfg.togglePasswordViews(passwordViews), Cfg.startScreen(screenId), screenConfig["auto-connect"]) {
                            Cfg.log("[Cfg] [" + screenId + "] Auto-connect enabled");
                            var IO = require("bp-io");
                            IO.socketEnable()
                        }
                        firstFocus = !1;
                        var aliveCmd = Cfg.findCommandMessage("alive");
                        if (aliveCmd && 0 < aliveCmd.length) {
                            var aliveTimeout = screenConfig["alive-command-timeout"] || 1e4;
                            Cfg.log("[Cfg] Alive Message Start Interval: " + aliveTimeout), aliveITV = setInterval(function() {
                                screen.working || Cfg.sendMessage("alive")
                            }, aliveTimeout)
                        }
                    }), screen.addEventListener("blur", function() {
                        var screenId = screen.id;
                        Cfg.stopScreen(screenId), aliveITV && clearInterval(aliveITV), aliveITV = null;
                        var screenConfig = Cfg.getScreenConfig(screenId),
                            rob = screenConfig["reset-on-blur"];
                        cbReset && rob && ("number" != typeof rob && (rob = 3e4), Cfg.log("[Cfg] [" + screenId + "] Reset-on-blur enabled: " + rob), resetTO && clearTimeout(resetTO), resetTO = setTimeout(cbReset, rob))
                    }), focus && screen.addEventListener("focus", focus), blur && screen.addEventListener("blur", blur), open && screen.addEventListener("open", open), close && screen.addEventListener("close", close), gblEvents["bp:response"] = function(e) {
                        if (screen.id == Cfg.screenId) {
                            var screenId = screen.id,
                                screenConfig = Cfg.getScreenConfig(screenId),
                                msg = e.message,
                                action = msg.action,
                                msgTypeDef = action + "-" + msg.dataId,
                                readMap = screenConfig["view-map-update"] || [],
                                ModBus = require("bp-modbus"),
                                rulesQuery = ModBus.isModBus() ? {
                                    pdu: msg.dataId,
                                    HB: msg.data[0],
                                    LB: msg.data[1],
                                    action: action
                                } : {
                                    id: msg.dataId,
                                    HB: msg.data[0],
                                    LB: msg.data[1],
                                    action: action
                                },
                                rulesList = Cfg.findRulesMulti(readMap, rulesQuery);
                            if (Cfg._viewMapUpdateCust) {
                                var rulesListCust = Cfg.findRulesMulti(Cfg._viewMapUpdateCust, rulesQuery);
                                rulesList = rulesList.concat(rulesListCust)
                            }
                            Cfg._responsesCache[msgTypeDef] = msg, rulesList.forEach(function(rules) {
                                rules && rules.view && rules.view.forEach(function(rule) {
                                    var result = Cfg.getRuleResult(msg, rule),
                                        bypassValue = 3 == result.length ? result[2] : void 0;
                                    cbData && cbData(rule.item, result[0], result[1], msg, rule, bypassValue)
                                })
                            })
                        }
                    }, gblEvents["bp:hw-id-updated"] = function(e) {
                        var screenId = screen.id;
                        Cfg.stopScreen();
                        var screenConfig = Cfg.getScreenConfig(screenId);
                        cbInit && cbInit(screenConfig.items || []), cbReset && cbReset(), passwordViews && Cfg.togglePasswordViews(passwordViews)
                    }, this.cbItems = cbItems || {}, cbInit && cbInit(screenConfig.items || []), cbReset) {
                    cbReset();

                    var resetFn = function(e) {
                        var screenId = screen.id;

                        if ("close" == e.status) {
                            var screenConfig = Cfg.getScreenConfig(screenId);

                            screenConfig["reset-on-disconnect"] &&
                                cbReset();

                        }
                    };

                    gblEvents["bp:socket-status"] = resetFn;
                }

                opts.events &&
                    this.globalEvents(screen, opts.events),


                    this.globalEvents(screen, gblEvents),


                    passwordViews && Cfg.togglePasswordViews(passwordViews);
            },
            setCustomViewMapUpdate: function(list) {
                this._viewMapUpdateCust = list;
            },
            globalEvents: function(screen, events, isIndex) {
                if (!0 != isIndex || 1) {



                    for (var name in events) {
                        var fn = events[name];

                        Cfg.appEvent(name, fn);
                    }

                    screen.addEventListener("close", function() {
                        for (var name in events) {
                            var fn = events[name];

                            Ti.App.removeEventListener(name, fn);
                        }
                    })
                }
            },
            sendCustomMessage: function(write, id, HB, LB, type) {
                var IO = require("bp-io");
                IO.stackMessage([write ? 1 : 0, id, HB, LB, 0, 0, type]);
            },
            findRules: function(list, tpl) {
                for (var i = 0, len = list.length; i < len; i++) {
                    var row = list[i],
                        ok = !0;

                    for (var j in tpl)
                        if (j in row && tpl[j] != row[j]) {
                            ok = !1;
                            break;
                        }


                    if (ok)
                        return row;

                }

                return !1;
            },
            findRulesMulti: function(list, tpl) {
                list = list || [];



                for (var res = [], i = 0, len = list.length; i < len; i++) {
                    var row = list[i],
                        ok = !0;

                    for (var j in tpl)
                        if (j in row && tpl[j] != row[j]) {
                            ok = !1;
                            break;
                        }


                    ok &&
                        res.push(row);

                }

                return res;
            },

            _responsesCache: {},

            getRuleResult: function(msg, rule) {
                var checkOk = !0,
                    checkResult = null;

                if ("check" in rule) {
                    var res = this._ruleCheck(msg, rule.check);

                    checkOk = res[0],
                        checkResult = res[1];
                } else
                if ("check-or" in rule)


                    for (var
                            res, checks = rule["check-or"], i = 0, len = checks.length; i < len && (res = this._ruleCheck(msg, checks[i]),

                            checkOk = res[0],
                            checkResult = res[1], !

                            checkOk); i++);
                else




                if ("check-and" in rule)


                    for (var
                            res, checks = rule["check-and"], i = 0, len = checks.length; i < len && (res = this._ruleCheck(msg, checks[i]),

                            checkOk = res[0],
                            checkResult = res[1], !

                            !checkOk); i++);




                var ret = null,
                    value = [],
                    result = null,
                    bypassValue = null;




                return checkOk ? (value = rule.value || [], ret = "return" in rule ? rule["return"] : null, bypassValue = "bypass-parent-value" in rule ? rule["bypass-parent-value"].value : null, null === ret ? null !== checkResult && (result = checkResult) : result = this.parseData(ret, msg.data)) : (value = rule["else-value"] || [], ret = "else-return" in rule ? rule["else-return"] : null, null !== ret && (result = this.parseData(ret, msg.data))), value instanceof Array || (value = [value]), !0 == bypassValue ? [value, result, bypassValue] : [value, result];
            },
            _ruleCheck: function(msg, check) {
                var checkOk = !1,
                    checkValue = this.parseData(check.data, msg.data),
                    result = null;

                if ("match" in check)
                    if (check.match instanceof Array) {
                        var index = check.match.indexOf(checkValue);

                        checkOk = -1 < index,

                            "match-return" in check && (
                                check["match-return"] instanceof Array ?
                                result = check["match-return"][index] :


                                result = check["match-return"]);


                    } else

                        checkOk = check.match == checkValue,

                        "match-return" in check && (
                            result = check["match-return"]);




                return [checkOk, result];
            },

            parseData: function(instr, bytes) {
                if (!(instr instanceof Array))
                    return instr;




                if (instr = instr.slice(), instr[0] instanceof Array) {


                    for (var res = [], i = 0, len = instr.length; i < len; i++)
                        res.push(this.parseData(instr[i], bytes));


                    return res;
                }

                var data = bytes[bytes.length - 1],
                    type = instr.shift();




                switch ("LB" == type ? (data = bytes[1], type = instr.shift()) : "HB" == type && (data = bytes[0], type = instr.shift()), type) {
                    case "flag8":
                        var bits = Bytes.byteToBits(data).reverse(),
                            tpl = instr.shift();

                        if (tpl) {


                            for (var
                                    pos, res = [], i = 0, len = tpl.length; i < len; i++) pos = parseInt(tpl[i], 10),
                                res.push(bits[pos]);


                            return res.join("");
                        }

                        return bits;

                    case "u8":
                        return data;

                    case "s8":




                        return 128 < data && (data -= 256), data;

                    case "time":
                        var
                            map = parseInt("00011111", 2),
                            hours = bytes[0] & map,
                            minutes = bytes[1];

                        return 60 * hours + minutes;

                    case "tempvalid":



                        if (debugScritte && console.log("Caso tempvalid: " + bytes), 127 === bytes[0] && 255 === bytes[1])
                            return "---";

                        if (255 === bytes[0] && 255 === bytes[1])
                            return "---";

                        var val = Bytes.bytesToInt(bytes);


                        return val = 32768 < val ? val - 65536 : val, val / 10;

                    case "temp":
                        debugScritte &&
                            console.log("Caso temp: " + bytes);

                        var val = Bytes.bytesToInt(bytes);


                        return val = 32768 < val ? val - 65536 : val, val / 10;

                    case "f8.8":
                        return Bytes.fromF88(Bytes.bytesToInt(bytes));

                    case "u16":
                        return Bytes.bytesToInt(bytes);

                    case "u16lsb":
                        var bytesLsb = [bytes[1], bytes[0]];
                        return Bytes.bytesToInt(bytesLsb);

                    case "s16":
                        var val = Bytes.bytesToInt(bytes);

                        return val = 32768 < val ? val - 65536 : val, val;

                    case "datalog":
                        return this.parseDatalog(bytes);
                }


                return null;
            },
            parseDatalog: function(bytes) {




                for (var res = {}, datalogValues = this.config.datalog.values, i = 0, len = datalogValues.length; i < len; i++) {
                    var
                        rule = datalogValues[i],
                        value = this.parseData([rule.type], bytes.slice(rule.start, rule.start + rule.length));

                    res[rule.label] = value;


                }

                return res;
            },

            formatType: function(ret, info) {
                var value = this.getCommandData(info.pop());

                switch (info[0]) {
                    case "flag8":
                        console.log("[1]formatType = flag8");
                        var
                            bits = Bytes.byteToBits(ret).reverse(),

                            map = info[1];

                        value = value.toString();

                        for (var i = 0, len = map.length; i < len; i++) {
                            var
                                pos = parseInt(map[i], 10),
                                val = parseInt(value[i], 10);

                            bits[pos] = !0 === val || "1" === val || 1 === val ? 1 : 0;
                        }

                        bits = bits.reverse(),

                            ret = Bytes.bitsToByte(bits);

                        break;
                    case "u8":
                        console.log("[1]formatType = u8"),
                            ret = value;

                        break;
                    case "s8":
                        console.log("[1]formatType = s8"),
                            ret = value,

                            0 > value && (
                                ret = 256 + value);
                }




                return ret;
            },


            formatData: function(data) {
                var _Mathfloor =




                    Math.floor,
                    HB = 0,
                    LB = 0;
                if (data)
                    for (var info, i = 0, len = data.length; i < len; i++) switch (info = data[i], info[0]) {
                        case "HB":
                            console.log("[0]formatData = HB"), HB = this.formatType(HB, info.slice(1));
                            break;
                        case "LB":
                            console.log("[0]formatData = LB"), LB = this.formatType(LB, info.slice(1));
                            break;
                        case "time":
                            console.log("[0]formatData = time");
                            var value = this.getCommandData(info[1]),
                                hours = _Mathfloor(value / 60),
                                minutes = value % 60;

                            HB = hours,
                                LB = minutes;

                            break;
                        case "tempvalid":
                        case "temp":
                            console.log("[0]formatData = temp");
                            var value = this.getCommandData(info[1]);

                            value *= 10;

                            var bytes = Bytes.intToBytes(value);

                            if (0 > info[1]) {
                                var bits = Bytes.byteToBits(bytes[0]);
                                bits[0] = 1,

                                    bytes[0] = Bytes.bitsToByte(bits);
                            }

                            HB = bytes[0],
                                LB = bytes[1];

                            break;
                        case "f8.8":
                            console.log("[0]formatData = f8.8");
                            var value = this.getCommandData(info[1]),
                                f88 = Bytes.toF88(value),
                                bytes = Bytes.intToBytes(f88);

                            HB = bytes[0],
                                LB = bytes[1];

                            break;
                        case "u16":
                            console.log("[0]formatData = u16");
                            var
                                value = this.getCommandData(info[1]),

                                bytes = Bytes.intToBytes(value);

                            HB = bytes[0],
                                LB = bytes[1];

                            break;
                        case "u16lsb":
                            console.log("[0]formatData = u16lsb");
                            var
                                value = this.getCommandData(info[1]),

                                bytes = Bytes.intToBytes(value);

                            HB = bytes[1],
                                LB = bytes[0];

                            break;
                        case "s16":
                            console.log("[0]formatData = s16");
                            var
                                value = this.formatType(0, info.slice(1)),

                                bytes = Bytes.intToBytes(value);

                            if (0 > info[1]) {
                                var bits = Bytes.byteToBits(bytes[0]);
                                bits[0] = 1,

                                    bytes[0] = Bytes.bitsToByte(bits);
                            }

                            HB = bytes[0],
                                LB = bytes[1];
                    }




                return [HB, LB];
            },


            getCommandData: function(item) {
                var type = typeof item;

                if ("number" == type || !isNaN(parseFloat(item, 10)))
                    return "string" == type ? parseFloat(item, 10) : item;


                var rules;

                "object" == type && (
                    rules = item,
                    item = rules.value);
                var


                    res = 0,

                    dataFn = this.cbItems ? this.cbItems[item] || this.cbItems["default"] : null;

                if (dataFn && "function" == typeof dataFn && (
                        res = dataFn(item),

                        rules &&
                        rules.match)) {
                    var pos = rules.match.indexOf(res);

                    rules["match-load"] && (
                        res = rules["match-load"][pos]);

                }



                return res || 0;
            },

            findCommandMessage: function(type) {
                if (!this.screenConfig)




                    return Ti.App.fireEvent("bp:error", {
                        error: "Screen configuration error"
                    }), !1;


                var rulesList = this.findRulesMulti(this.screenConfig.commands || [], {
                    item: type
                });


                return rulesList;
            },


            sendMessage: function(type) {
                var rulesList = this.findCommandMessage(type);

                if (!rulesList || 1 > rulesList.length)


                    return Cfg.log("[Command] No one rule finded for \"" + type + "\""), !1;

                console.log("[Command] Rule for \"" + type + "\" found. OK.");


                for (var
                        config, i = 0, len = rulesList.length; i < len; i++)

                    if (config = rulesList[i], config) {
                        var
                            IO = require("bp-io"),
                            data = this.formatData(config.data),

                            action = "write" == config.action ? 1 : 0,
                            msgId = "pdu" in config ? config.pdu : config.id,
                            commandType = type + "|" + msgId + "|" + data[0] + "|" + data[1];

                        Cfg.log("[Command] Type: " + commandType),
                            console.log("i=" + i + " / [Command] Type: " + commandType),
                            console.log("=> IO.stackMessage([action, msgId, data[0], data[1], 0, 0, commandType]): [" + action + ", " + msgId + ", " + data[0] + ", " + data[1] + ", " + 0 + ", " + 0 + ", " + commandType + "]"),
                            IO.stackMessage([action, msgId, data[0], data[1], 0, 0, commandType]);
                    } else

                        return !1;



                return !0;
            },



            getLanguage: function() {
                var lang = Titanium.Locale.currentLanguage;

                return (lang || "en").toLowerCase().substr(0, 2);
            },

            getLabelsConfig: function(force) {
                var labels;




                return this.config && (labels = this.config.labels), labels || (labels = {
                    anomalies: []
                }), labels;
            },
            getLabelLang: function(info, name) {
                var lang = Titanium.Locale.currentLanguage;



                return name = name || "label", info[name + "-" + lang] || info[name] || info[name + "-en"] || "";
            },
            findLabels: function(group, id) {
                id = (id || "0") + "";

                var info;

                try {
                    var labels = this.getLabelsConfig(),
                        list = labels[group];

                    info = this.findRules(list, {
                        "fault-code": id
                    }) || this.findRules(list, {
                        "fault-code": "default"
                    });
                } catch (e) {}

                return info;
            },
            getLabel: function(group, id, num) {
                var info = this.findLabels(group, id),
                    label = "",
                    color = null,
                    value = [];

                if (info) {
                    var key = "comment" == num || "action" == num ? num : "text" + num;

                    label = ("anomalies" == group && 1 == num ? this.formatAnomalyCode(id, "", " ") : "") + this.getLabelLang(info, key),
                        color = info["color" + num] || info.color,
                        value = info.value;
                }

                return {
                    label: label,
                    color: color,
                    value: value
                };

            },
            setLabelView: function(view, group, id, num, prefix, suffix) {
                id = (id || "0") + "";

                var res = this.getLabel(group, id, num) || "";
                return !!

                    res && (
                        prefix = prefix || "",
                        suffix = suffix || "",

                        view.text = 0 < res.label.length ? prefix + res.label + suffix : "",

                        res.color && (
                            view.color = res.color),


                        res);



            },
            formatAnomalyCode: function(id, pre, aft, alt) {
                return 0 < id ? (pre || "") + "E " + ("000" + id).substr(-3) + (aft || "") : alt || "";
            }
        };




    return Cfg;
}();