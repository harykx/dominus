var bp_io_module = function() {
    var
        Bytes = require("sodium/library/bytes"),
        DB = require("sodium/library/db"),
        Cfg = require("bp-cfg"),
        CAT = require("bp-cat"),
        ModBus = require("bp-modbus"),
        ANDR = !0,




        IO = {


            buildMessage: function(type, dataId, HB, LB) {
                if (ModBus.isModBus())
                    return ModBus.buildMessage(type, dataId, HB, LB);


                dataId = dataId || 0,
                    HB = HB || 0,
                    LB = LB || 0;
                var

                    msg = [dataId, HB, LB],
                    numOn = Bytes.countBytesOnBits(msg) + (1 == type ? 1 : 0),
                    p = 0 == numOn % 2 ? 0 : 1,
                    typeByte = parseInt(p + (1 == type ? "0010000" : "0000000"), 2);

                msg.unshift(typeByte);
                var

                    crc = IO.calcCRCBytes(msg),

                    buff = Ti.createBuffer({
                        length: 6
                    });




                return buff[0] = msg[0], buff[1] = msg[1], buff[2] = msg[2], buff[3] = msg[3], buff[4] = crc[0], buff[5] = crc[1], buff;
            },


            readMessage: function(buff) {
                if (ModBus.isModBus())
                    return ModBus.readMessage(buff);


                if (151 == this._waitingResponseId)
                    return this.readDatalog(buff);




                for (var bytes = [], buffString = "", i = 0, len = buff.length; i < len; i++)
                    bytes[i] = buff[i],
                    buffString += buff[i].toString() + " ";

                global.debugTxRx &&
                    console.log("Data received (OT): " + buffString + "   Len: " + buff.length);
                var



                    res = {
                        bytes: bytes,
                        type: IO.getMessageType(bytes[0]),
                        dataId: bytes[1],
                        data: [bytes[2], bytes[3]]
                    },



                    messageCRC = [bytes[4], bytes[5]],
                    checkCRC = IO.calcCRCBytes(bytes, !0),
                    bitsNum = Bytes.countBytesOnBits(bytes.slice(0, 4));




                return res.validCRC = checkCRC[0] == messageCRC[0] && checkCRC[1] == messageCRC[1], res.validBits = 0 == bitsNum % 2, res.validType = "100" == res.type || "101" == res.type || "000" == res.type || "001" == res.type, res.write = "001" == res.type || "101" == res.type, res.action = this.getMessageTypeAction(res.type), res.valid = res.validCRC && res.validBits, res.valid || console.error("[IO] Check: CRC " + res.validCRC + ", Bits " + res.validBits + ", Type " + res.validType), res;
            },
            readDatalog: function(msg) {
                var
                    datalogLen = Cfg.config.datalog.length + 4,
                    bytes = Bytes.stringToBytes(msg),

                    res = {
                        bytes: bytes,
                        type: "100",
                        dataId: 151,
                        data: bytes.slice(2, datalogLen - 2)
                    },


                    messageCRC = bytes.slice(datalogLen - 2),
                    checkCRC = IO.calcDatalogCRCBytes(bytes, datalogLen, !0);




                if (res.validCRC = checkCRC[0] == messageCRC[0] && checkCRC[1] == messageCRC[1], res.validBits = !0, res.validType = !0, res.write = !1, res.valid = res.validCRC && res.validBits && res.validType, res.valid) {
                    var
                        value = Cfg.parseDatalog(res.data),
                        valueFiltered = this.filterDatalogLines(value),
                        time = new Date().getTime();

                    Ti.App.fireEvent("bp:datalog-point", {
                            timestamp: time,
                            point: valueFiltered
                        }),


                        this._datalogRec && (
                            this._datalogTableLog &&
                            this._datalogTableLog.insert({
                                time: time,
                                points: JSON.stringify(value)
                            }),



                            this._datalogTableTemp &&
                            this._datalogTableTemp.insert({
                                time: time,
                                points: JSON.stringify(valueFiltered)
                            })),




                        value = valueFiltered = time = null;
                }




                return !res.valid && Cfg.isDebugModeOn() && this.logCRCError(res), res;
            },


            getMessageType: function(type) {
                var
                    bits = Bytes.byteToBits(type),
                    part = bits.slice(1, 4);

                return part.join("");
            },
            getMessageTypeAction: function(type) {
                return (

                    "000" === type ? "read" :
                    "001" === type ? "write" :
                    "010" === type ? "reserved" :
                    "011" === type ? "reserved" :
                    "100" === type ? "read" :
                    "101" === type ? "write" :
                    "110" === type ? "invalid" :
                    "111" === type ? "unknown" :


                    "unknown");
            },


            logCRCError: function(res) {
                var
                    log =
                    new Date().getTime() + "," + (
                        res.validCRC ? "1" : "0") + "," + (
                        res.validType ? "1" : "0") + "," + (
                        res.validBits ? "1" : "0") + "," +
                    Bytes.bytesToHex(res.bytes, " ") + "\n",

                    file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "crc-errors.log.csv");

                file.write(log, !0);
            },


            calcCRCBytes: function(msg, hasCRC) {
                var crcTemp = this.calcCRC(msg, hasCRC);

                return Bytes.intToBytes(crcTemp, 2);
            },
            calcCRC: function(msg, hasCRC) {
                var count = msg.length - (hasCRC ? 2 : 0);


                msg = msg.slice(0, count);
                for (


                    var poly = 4129,
                        crc = 65535,
                        j = 0;


                    0 <= --count;)




                    for (var c = msg[j++], i = 0; 8 > i; i++)

                        (1 & crc) == (1 & c) ?



                        crc >>= 1 : crc = crc >> 1 ^ poly,


                        c >>= 1;



                return crc;
            },


            calcDatalogCRCBytes: function(msg, datalogLen, hasCRC) {
                var crcTemp = this.calcDatalogCRC(msg, datalogLen, hasCRC);

                return Bytes.intToBytes(crcTemp, 2);
            },
            calcDatalogCRC: function(msg, datalogLen, hasCRC) {
                var count = datalogLen - (hasCRC ? 2 : 0);

                msg = msg.slice(2, count),

                    count -= 2;
                for (


                    var




                        c, poly = 32773, crcLog = 0, j = 0; 0 <= --count;) {
                    c = msg[j++],

                        crcLog ^= c << 8;


                    for (var i = 0; 8 > i; i++)

                        32768 & crcLog ?
                        crcLog = crcLog << 1 ^ poly :


                        crcLog <<= 1;


                }

                return crcLog;
            },




            networkOffline: function() {
                return !Titanium.Network.online || Titanium.Network.networkType === Titanium.Network.NETWORK_NONE;
            },

            network3G: function() {
                return Titanium.Network.networkType == Titanium.Network.NETWORK_MOBILE;
            },


            socketIsOpened: function() {
                var socket = this._socket;

                return socket && (socket.state == Titanium.Network.Socket.CONNECTED || socket.state == Titanium.Network.Socket.LISTENING);
            },


            socketIsInitialized: function() {
                var socket = this._socket;

                return socket && socket.state == Titanium.Network.Socket.INITIALIZED;
            },


            socketIsClosed: function() {
                return !this.socketIsOpened() && !this.socketIsInitialized();
            },


            socketIsReady: function() {
                return this.socketIsOpened() && this._socketReady;
            },


            socketIsEnabled: function() {
                return this._socketEnabled;
            },


            socketEnable: function() {
                Ti.App.fireEvent("bp:socket-enabled", {
                        enabled: !0
                    }),


                    this._socketEnabled = !0,
                    this.resetConnectionCycle(),
                    this.socketOpen(),

                    Cfg.log("[Socket] Enabled");
            },


            socketDisable: function() {
                Ti.App.fireEvent("bp:socket-enabled", {
                        enabled: !1
                    }),


                    this._socketEnabled = !1,
                    this.resetConnectionCycle(),
                    this.socketClose(),

                    this._reconnectTO && clearTimeout(this._reconnectTO),

                    Cfg.log("[Socket] Disabled");
            },

            setSocketStatus: function(status, name) {
                Ti.App.fireEvent("bp:socket-status", {
                    status: status,
                    name: name
                });

            },


            _socketEnabled: !1,


            _socketReady: !1,

            _socketRemoteMode: !1,
            _socketRemoteReady: !1,
            _socketDeviceConfig: null,


            _requestsStack: [],


            _eF: function() {},

            resetConnectionCycle: function() {
                this._socketConnectionCycleCounter = 0,
                    this._socketConnectionCycleRemote = !1;
            },

            socketRestartCycle: function() {
                this.socketClose(),

                    this.resetConnectionCycle(),

                    this.socketOpen();
            },

            socketRetry: function(delay) {
                var globalConfig = Cfg.getSetupConfig() || {},
                    cycleDelay = globalConfig["connection-cycle-delay"] || 3e3;
                return (

                    this._reconnectTO && clearTimeout(this._reconnectTO),
                    this._reconnectTO = null, !!

                    this.socketIsEnabled() && void(



                        this._reconnectTO = setTimeout(function() {
                            IO.socketOpen();

                        }, cycleDelay)));
            },


            socketOpen: function(onOpen) {
                if (!this.socketIsEnabled())
                    return !1;


                if (this.socketIsOpened() || this.socketIsInitialized())
                    return !0;


                if (this.networkOffline())




                    return Cfg.err("[Comm] Network not available"), IO.setSocketStatus("offline"), !1;



                var globalConfig = Cfg.getSetupConfig() || {};


                this._socketMessagesCycleCounter = 0;

                var port = globalConfig["connection-port"] || globalConfig["wifikey-port"] || 2e3,

                    remoteHost = globalConfig["remote-host"],
                    remotePort = globalConfig["remote-port"],
                    remoteMode = !1,

                    timeout = globalConfig["connection-timeout"] || 1e4,
                    connectionDelay = globalConfig["connection-delay"] || 50;

                console.log("remoteHost: " + remoteHost);
                var deviceConfig = Cfg.getActiveDeviceConfig();

                if (!deviceConfig)




                    return Cfg.err("[Comm] Connection not configured!"), alert(L("app_device_config_empty")), this.socketDisable(), !1;


                var host = deviceConfig.host,
                    remoteAuth = deviceConfig.app_auth,
                    socketMode = deviceConfig.mode || 0;




                if (global.debugSocket && (console.log("bp-io.js: host = " + host), console.log("bp-io.js: remoteAuth = " + remoteAuth), console.log("bp-io.js: socketMode = " + socketMode)), this._socketConnectionCycleCounter == globalConfig["connection-cycle-times"] && (this._socketConnectionCycleCounter = 0, this._socketConnectionCycleRemote = !this._socketConnectionCycleRemote), remoteHost && remotePort && remoteAuth && (2 == socketMode || 0 == socketMode && (this.network3G() || this._socketConnectionCycleRemote || !host)) ? (remoteMode = !0, global.debugSocket && console.log("remoteMode = " + remoteMode)) : global.debugSocket && console.log("remoteMode = " + remoteMode), remoteMode && (host = remoteHost, port = remotePort, console.log("Imposto il <remoteMode>:" + host + " : " + port)), !host || !port) {
                    Cfg.err("[Comm] Host or port not configured : " + host + ":" + port),
                        global.debugSocket &&
                        console.log("[Comm] Host or port not configured : " + host + ":" + port);;



                    return this.socketDisable(), !1;
                }

                this._socketTO && clearTimeout(this._socketTO),

                    this._socketTO = null,
                    this._socketDeviceConfig = deviceConfig,
                    this._socketRemoteMode = remoteMode,
                    this._socketRemoteReady = !1,
                    this._socketConnectionCycleCounter++,


                    Ti.App.fireEvent("bp:console", {
                        log: "[Comm] Try connection to: " + host + ":" + port + " - mode: " + socketMode + " - remote: " + remoteMode
                    }),


                    this._socket = Ti.Network.Socket.createTCP({
                        host: host,
                        port: port,
                        timeout: timeout,
                        connected: function(e) {

                            Ti.Stream.pump(e.socket, IO._readCallback, 1024, !0),


                                IO.setSocketStatus("open"),


                                setTimeout(function() {




                                    if (IO._socketReady = !0, !IO._socketRemoteMode)




                                        IO.setSocketStatus("ready");
                                    else if (IO.setSocketStatus("wait"), IO._socket) {
                                        var buffer = Ti.createBuffer({
                                            type: Ti.Codec.CHARSET_UTF8,
                                            value: remoteAuth
                                        });
                                        Ti.Stream.write(IO._socket, buffer, IO._eF)
                                    }


                                    var execution = function() {

                                        IO.startUseUpdate(),


                                            onOpen ? (
                                                onOpen(),
                                                onOpen = null) :



                                            IO.nextRequest();

                                    };


                                    if (remoteMode) {
                                        var checkRemoteReady = function() {
                                            IO._socketRemoteReady ?
                                                execution() :

                                                IO._socketReady &&
                                                setTimeout(checkRemoteReady, connectionDelay);

                                        };

                                        checkRemoteReady();
                                    } else

                                        execution();



                                }, connectionDelay);
                        },
                        error: function(e) {




                            Cfg.err("[Comm] " + e.error),

                                IO.socketClose();
                        }
                    }),


                    IO.setSocketStatus("connect"),

                    this._socket.connect();
            },


            _readCallback: function(e) {


                if (IO.socketTimeout(), -1 != e.bytesProcessed)




                    try {
                        if (e.buffer) {

                            var receivedString = e.buffer.toString();


                            if ("**READY**" == receivedString)




                                return IO._socketRemoteReady = !0, Ti.App.fireEvent("bp:console", {
                                    log: "[Comm] Remote Server is ready"
                                }), void IO.setSocketStatus("ready");



                            var m = receivedString ? receivedString.match(/\*\*END\:([^:]*)(\:(.*?))?\*\*$/mi) : null;

                            if (m) {
                                Ti.App.fireEvent("bp:console", {
                                    log: "[Comm] Remote Server END: " + receivedString
                                });
                                var

                                    reason = m[1] || "",
                                    details = m[3] || "";



                                switch (IO.socketClose(), reason) {
                                    case "INVALID_AUTH":




                                        return Ti.App.fireEvent("bp:console", {
                                            log: "[Comm] Invalid Remote Auth String"
                                        }), alert(L("app_invalid_auth")), void IO.socketDisable();

                                        break;
                                    case "IN_USE":

                                        IO.setSocketStatus("inuse", details || L("app_remote_inuse_unknown"));
                                }




                                return;
                            }


                            if (IO._socketRemoteMode && !IO._socketRemoteReady)




                                return Ti.App.fireEvent("bp:console", {
                                    log: "[Comm] Remote Socket: Server message before **READY**"
                                }), void IO.socketClose();
                            var




                                seemAuth = Cfg.seemAuthMessage(receivedString),
                                isOpenMessage = receivedString ? receivedString.match(/\*HELLO\*/i) || seemAuth : null;

                            if (isOpenMessage) {
                                if (seemAuth) {
                                    var devCfg = IO._socketDeviceConfig;

                                    0 > receivedString.indexOf(devCfg.dev_auth) ? (
                                            Cfg.log("[Comm] Invalid Local Auth String"),

                                            IO.socketClose()) :


                                        Cfg.log("[Comm] Local Auth String OK");

                                }
                            } else




                            if (e.buffer && 0 < e.buffer.length) {
                                var msg = IO.readMessage(e.buffer);

                                msg.valid ?
                                    IO.handleResponse(msg) : (


                                        Ti.App.fireEvent("bp:error", {
                                            error: "[Comm] Invalid Response Message: " + Bytes.bytesToHex(msg.bytes, " ") + " , CRC=" + msg.validCRC + ", Parity=" + msg.validBits + ", Type=" + msg.validType,
                                            message: msg
                                        }),


                                        IO.discardResponse(msg));

                            } else

                                Ti.App.fireEvent("bp:error", {
                                    error: "[Comm] Parse Error"
                                });



                        } else

                            Ti.App.fireEvent("bp:error", {
                                error: "[Comm] Read callback called with no buffer!"
                            });


                    }
                catch (ex) {
                    Ti.App.fireEvent("bp:error", {
                        error: "[Comm] Read Error: " + ex.message
                    });

                }
            },


            socketClose: function() {




                if (this._socketTO && clearTimeout(this._socketTO), this.stopUseUpdate(), this._socketReady = !1, this._socketDeviceConfig = null, this.stopRequests(), this._socket)
                    try {
                        this._socket.close();
                    }
                catch (e) {}




                return this._socket = null, IO.setSocketStatus("close"), IO.socketRetry(), !1;
            },
            socketTimeout: function() {


                if (this._socketTO && clearTimeout(this._socketTO), this._socket) {
                    var
                        globalConfig = Cfg.getSetupConfig() || {},

                        timeout = globalConfig["connection-silent-timeout"] || 3e4;

                    this._socketTO = setTimeout(function() {
                        Cfg.log("[Comm] Silent Socket Timeout: " + timeout),

                            IO.socketClose();

                    }, timeout);
                }
            },


            request: function(bytes) {
                this._waitingMessage = bytes;




                for (var buff = this.buildMessage(bytes[0], bytes[1], bytes[2], bytes[3]), buffString = "", i = 0; i < buff.length; i++)
                    buffString += buff[i].toString() + " ";;
                7 === buff.length ?

                    global.debugTxRx &&
                    console.log("Data sent: " + buffString + "   Len: " + buff.length + "   PDU=" + (256 * buff[1] + buff[2]) + " / HB=" + buff[3] + " / LB=" + buff[4]) :

                    6 === buff.length ?

                    global.debugTxRx &&
                    console.log("Data sent: " + buffString + "   Len: " + buff.length + "   ID=" + buff[1] + " / HB=" + buff[2] + " / LB=" + buff[3]) :



                    global.debugTxRx &&
                    console.log("Data sent: " + buffString + "   Len: " + buff.length),



                    this.socketSend(buff);
            },




            socketSend: function(buff) {
                if (this.socketIsOpened() && this._socketReady) {




                    if (global.debugTxRx) {

                        for (var buffString = "", i = 0, len = buff.length; i < len; i++)

                            buffString += buff[i].toString() + " ";

                        console.log("**** socketSend: " + buffString);
                    }
                    Ti.Stream.write(this._socket, buff, IO._eF);
                } else
                if (this.socketIsInitialized());
                else;




            },




            _screenId: "",
            _messagePos: -1,
            _messages: [],
            _messagesLength: 0,
            _stack: [],
            _waitingResponseWrite: !1,
            _waitingResponseId: -1,
            _requestTO: null,
            _requesting: !1,
            _defDelay: 500,
            _defTimeout: 5e3,
            _datalog: !1,
            _datalogRec: !1,
            _datalogToggle: !1,
            _datalogTemp: null,
            _datalogLog: null,
            _datalogTableTemp: null,
            _datalogTableLog: null,
            _datalogActiveLines: [],

            _socketConnectionCycleCounter: 0,
            _socketConnectionCycleRemote: !1,
            _socketMessagesCycleCounter: 0,




            initDatalogTable: function() {


                if (Ti.API.info("Datalog: Init Table"), !this._datalogTableTemp) {
                    this._datalogTemp = DB.install({
                            name: "datalogTemp",
                            path: "/db/datalogTemp.sqlite",
                            backup: !0
                        }, !0),


                        this._datalogTableTemp = this._datalogTemp.table("datalog");


                    var time = new Date().getTime();
                    time -= 1036800000,

                        this._datalogTableTemp.remove("time < '" + time + "'");
                }

                if (!this._datalogTableLog) {
                    this._datalogLog = DB.install({
                            name: "datalogLog",
                            path: "/db/datalogLog.sqlite",
                            backup: !0
                        }, !0),


                        this._datalogTableLog = this._datalogLog.table("datalog");


                    var time = new Date().getTime();
                    time -= 604800000,

                        this._datalogTableLog.remove("time < '" + time + "'");
                }

                return !0;
            },


            enableDatalog: function(rec) {
                Ti.App.fireEvent("bp:console", {
                        log: "[Datalog] ON"
                    }),

                    this._datalog = !0,
                    this._datalogToggle = !0,
                    this._datalogRec = this._datalogRec || !!rec,

                    rec &&
                    this.initDatalogTable();

            },

            disableDatalog: function() {
                Ti.App.fireEvent("bp:console", {
                        log: "[Datalog] OFF"
                    }),

                    this._datalog = !1,
                    this._datalogToggle = !1,

                    this.disableDatalogRec();
            },

            enableDatalogRec: function() {
                Ti.App.fireEvent("bp:console", {
                        log: "[Datalog] REC ON"
                    }),

                    this.enableDatalog(!0);
            },

            disableDatalogRec: function() {
                Ti.App.fireEvent("bp:console", {
                        log: "[Datalog] REC OFF"
                    }),

                    this._datalogRec = !1,

                    this._datalogLog && (
                        this._datalogLog.close(),
                        this._datalogTableLog = null,
                        this._datalogLog = null),


                    this._datalogTemp && (
                        this._datalogTemp.close(),
                        this._datalogTableTemp = null,
                        this._datalogTemp = null);

            },

            filterDatalogLines: function(row) {
                var res = {};




                return this._datalogActiveLines.forEach(function(label) {
                    label in row && (res[label] = row[label])
                }), res;
            },


            stackMessage: function(message) {
                if (!message instanceof Array) {
                    var
                        globalConfig = Cfg.getSetupConfig(),

                        type = "write" == message.action || 1 == message.type ? 1 : 0,
                        id = message.id || -1,
                        HB = message.HB || 0,
                        LB = message.LB || 0,
                        delay = message.delay || this._defDelay || globalConfig["message-default-delay"] || 500,
                        timeout = message.timeout || this._defTimeout || globalConfig["message-default-timeout"] || 5e3,
                        type = message.type || "";

                    message = [type, id, HB, LB, delay, timeout, type];
                }


                var overwrited = !1;

                if (message[6])
                    for (var i = 0, len = this._stack.length; i < len; i++)
                        if (this._stack[i][6] == message[6]) {
                            this._stack[i] = message,

                                overwrited = !0;

                            break;
                        }



                overwrited ||
                    this._stack.push(message),




                    this._datalog ||
                    this.nextRequest(!0);

            },




            startScreenRequests: function(screenId, messages, defDelay, defCycleDelay, defTimeout) {




                if (this.stopScreenRequests(this._screenId), this._screenId = screenId, this._defDelay = defDelay, this._defCycleDelay = defCycleDelay, this._defTimeout = defTimeout, !screenId || !messages)
                    return !1;
                var


                    globalConfig = Cfg.getSetupConfig(),
                    res = [];

                messages.forEach(function(message) {
                        var type = "write" == message.action ? 1 : 0,
                            id = "pdu" in message ? message.pdu : message.id,
                            HB = message.HB || 0,
                            LB = message.LB || 0,
                            delay = message.delay,
                            timeout = message.timeout;

                        res.push([type, id, HB, LB, delay, timeout]);
                    }),

                    this._messages = res,
                    this._messagesLength = res.length,
                    this._messagePos = -1,


                    this.nextRequest();
            },
            stopScreenRequests: function(screenId) {

                this._screenId == screenId && (
                    this.stopRequests(),
                    this._messagePos = -1);

            },

            stopRequests: function() {
                clearTimeout(this._requestTO),

                    this._waitingResponseType = 0,
                    this._waitingResponseId = -1,
                    this._requesting = !1;
            },

            _messagesPause: !1,
            pauseRequests: function() {
                Ti.App.fireEvent("bp:console", {
                        log: "[Comm] Messages Pause"
                    }),

                    this._messagesPause = !0;
            },
            restartRequests: function() {
                Ti.App.fireEvent("bp:console", {
                        log: "[Comm] Messages Restart"
                    }),

                    this._messagesPause = !1;
            },

            nextRequest: function(force) {


                if (!(-1 < IO._waitingResponseId)) {




                    if (this._requestTO && clearTimeout(this._requestTO), this._requestTO = null, !IO.socketIsReady())




                        return IO.socketIsEnabled() && IO.socketOpen(), !1;


                    if (this._messagesPause)




                        return Ti.App.fireEvent("bp:console", {
                            log: "[Comm] Messages Delayed for Pause"
                        }), void(this._requestTO = setTimeout(function() {
                            IO.nextRequest()
                        }, 1e3));


                    var msg,
                        isCycleRestart = !1;




                    if (this._datalogToggle = !this._datalogToggle, this._datalog && (this._datalogToggle || 1 > this._stack.length && 1 > this._messagesLength)) {
                        var datalogConfig = Cfg.getDatalogConfig();

                        msg = [0, datalogConfig.id || 151, 255, 255, datalogConfig.delay, datalogConfig.timeout];
                    } else

                        0 < this._stack.length ?
                        msg = this._stack.shift() :


                        0 < this._messagesLength && (
                            this._messagePos == this._messagesLength - 1 && (
                                isCycleRestart = !0),


                            this._messagePos = (this._messagePos + 1) % this._messagesLength,

                            msg = this._messages[this._messagePos]);


                    if (!(msg instanceof Array))


                        return void Ti.App.fireEvent("bp:console", {
                            log: "[Comm] End with no one message available"
                        });


                    if (isCycleRestart && !force) {
                        var restartDelay = IO._defCycleDelay || IO._defDelay || globalConfig["message-default-delay"] || 500;




                        return void(this._requestTO = setTimeout(function() {
                            IO._messagePos = -1, global.debugTxRxData && console.log("======================================"), IO.nextRequest(!0)
                        }, restartDelay));
                    }

                    this._requesting = !0,
                        this._waitingResponseWrite = msg[0],
                        this._waitingResponseId = msg[1];
                    var

                        globalConfig = Cfg.getSetupConfig(),

                        msgDelay = msg[4] || IO._defDelay || globalConfig["message-default-delay"] || 500,
                        msgTimeout = msg[5] || IO._defTimeout || globalConfig["message-default-timeout"] || 5e3;




                    return this._requestTO = setTimeout(function() {
                        var sendRequest = function() {
                            Ti.App.fireEvent("bp:response-status", {
                                status: "wait",
                                id: msg[1]
                            }), IO.request(msg), IO._requestTO = setTimeout(function() {
                                IO._waitingResponseId = -1, Ti.App.fireEvent("bp:response-status", {
                                    status: "lost",
                                    id: msg[1]
                                }), IO.nextRequest()
                            }, msgTimeout)
                        };
                        return IO.socketIsReady() ? void sendRequest() : (IO.socketIsEnabled() ? IO.socketOpen(sendRequest) : IO._messagePos = -1, !1)
                    }, msgDelay), !0
                }
            },

            discardResponse: function(msg) {


                this.nextRequest();
            },

            handleResponse: function(msg) {

                if (this._waitingResponseWrite == msg.write && this._waitingResponseId == msg.dataId) {
                    this._waitingResponseId = -1,

                        Ti.App.fireEvent("bp:response-status", {
                            status: "ok",
                            id: msg.dataId,
                            request: this._waitingMessage,
                            response: msg
                        }),


                        Ti.App.fireEvent("bp:response", {
                            message: msg
                        });


                    var globalConfig = Cfg.getSetupConfig();


                    0 < globalConfig["connection-cycle"] && (
                            this._socketMessagesCycleCounter++,

                            this._socketMessagesCycleCounter == globalConfig["connection-cycle"] &&
                            this.socketClose()),



                        this.nextRequest();
                } else

                    this._waitingResponseId = -1;

            },




            _apCheckSocket: null,
            _apCheckTimeout: 1e4,
            _apCheckOpen: !1,

            stopAPCheck: function() {


                if (this._cancelApCheckAutoclose(), this._apCheckSocket)
                    try {
                        this._apCheckSocket.close();
                    }
                catch (e) {}


                this._apCheckOpen = !1,
                    this._apCheckSocket = null,

                    this.socketDisable();
            },
            _setApCheckAutoclose: function(msg) {
                this._cancelApCheckAutoclose();

                var time = 1e4;

                this._apCheckAutocloseTO = setTimeout(function() {
                    Cfg.err("[AP Check] Socket closed for response timeout"),

                        Ti.App.fireEvent("bp:response-status", {
                            status: "lost"
                        }),


                        IO._apCheckEnd("response-timeout");

                }, 10000);
            },

            _cancelApCheckAutoclose: function() {
                this._apCheckAutocloseTO && clearTimeout(this._apCheckAutocloseTO);
            },

            _apCheckEnd: function(reason, result) {
                if ("bad-response" == reason && IO._apCheckSocket && IO._apCheckOpen) {
                    var buffer = Ti.createBuffer({
                        type: Ti.Codec.CHARSET_UTF8,
                        value: "exit\r\n"
                    });


                    Ti.Stream.write(IO._apCheckSocket, buffer, IO._eF);
                }


                this.stopAPCheck(),

                    Ti.App.fireEvent("bp:ap-check-end", {
                        reason: reason,
                        result: !!result,
                        macAddr: IO._apCheckMacAddr
                    }),


                    IO._apCheckMacAddr = null;
            },


            startAPCheck: function() {
                if (ANDR && this.networkOffline())




                    return Cfg.err("[AP Check] Network not available"), Ti.App.fireEvent("bp:wifi-config-end", {
                        reason: "network-error",
                        error: "Offline"
                    }), !0 === global.debugConfigProgress && console.log("CONFIG::startAPCheck::ERROR:: Network OFFLINE - Exit Config"), !1;

                !0 === global.debugConfigProgress &&
                    console.log("CONFIG::STATE:: Go_On");
                var


                    globalConfig = Cfg.getSetupConfig() || {},

                    host = globalConfig["wifikey-host"],
                    port = globalConfig["wifikey-port"],
                    macPrefix = (globalConfig["wifikey-mac-prefix"] || "").toLowerCase(),
                    deviceId = globalConfig["wifikey-device-id"] || globalConfig["udp-device-id"] || "BP_WiFiKey";


                IO._apCheckTimeout = globalConfig["wifikey-timeout"] || 1e4,
                    IO._apCheckConnDelay = globalConfig["wifikey-connection-delay"] || 50,
                    IO._apCheckDelay = globalConfig["wifikey-delay"] || 500,
                    IO._apCheckOpen = !1,
                    IO._apCheckMacAddr = null,




                    IO.stopAPCheck();

                var apCheckResult = !1,
                    lastMessage = "";

                IO._actCheckIndex = -1;
                var



                    tempBuffer, listLen = 5,

                    apCheckNextMessage = function() {
                        var message,
                            end = !1;




                        switch (tempBuffer = Ti.createBuffer({
                                length: 0
                            }), IO._actCheckIndex++, !0 === global.debugConfigProgress && console.log("CONFIG::INDEX:: " + IO._actCheckIndex), IO._actCheckIndex) {
                            case 0:
                                message = "$$$";
                                break;
                            case 1:
                                message = "get mac";
                                break;
                            case 2:
                                message = "show deviceid";
                                break;
                            case 3:
                                message = "scan";
                                break;
                            case 4:
                                message = "exit",
                                    end = !0;
                        }


                        !0 === global.debugConfigProgress && (
                                console.log("CONFIG::MESSAGE:: " + message),
                                !0 === end &&
                                console.log("CONFIG::END:: end===true")),




                            setTimeout(function() {
                                var fn = IO._eF;




                                if (end && (fn = function() {
                                        setTimeout(function() {
                                            Ti.App.fireEvent("bp:response-status", {
                                                status: "ok"
                                            }), IO._apCheckEnd("end", !0)
                                        }, IO._apCheckDelay)
                                    }), Ti.App.fireEvent("bp:response-status", {
                                        status: "wait",
                                        id: message
                                    }), !0 === global.debugConfigProgress && console.log("CONFIG::MESSSAGE::SENT:: " + IO._actCheckIndex), lastMessage = message, IO._apCheckSocket && (IO._apCheckSocket.state == Titanium.Network.Socket.CONNECTED || IO._apCheckSocket.state == Titanium.Network.Socket.LISTENING)) {
                                    var buffer = Ti.createBuffer({
                                        type: Ti.Codec.CHARSET_UTF8,
                                        value: message + "\r\n"
                                    });


                                    Ti.Stream.write(IO._apCheckSocket, buffer, fn),

                                        Ti.App.fireEvent("bp:ap-check-progress", {
                                            index: IO._actCheckIndex,
                                            total: 5,
                                            progress: IO._actCheckIndex / 5
                                        });

                                }

                                IO._setApCheckAutoclose(message);

                            }, IO._apCheckDelay),

                            !0 === global.debugConfigProgress &&
                            console.log("CONFIG::MESSSAGE::AFTER_SENT:: " + IO._actCheckIndex);



                    },

                    apCheckReadCallback = function(e) {

                        if (e.buffer) {




                            tempBuffer || (

                                    tempBuffer = Ti.createBuffer({
                                        length: 0
                                    })),




                                tempBuffer.append(e.buffer);

                            var receivedString = tempBuffer.toString();

                            if (-1 == e.bytesProcessed)


                                return void Cfg.err("[AP Check] Error/End?  \"" + receivedString + "\"");


                            if (!IO._apCheckOpen)


                                return void Ti.App.fireEvent("bp:console", {
                                    log: "[AP Check] Non avviato. \"" + receivedString + "\""
                                });


                            if (receivedString.match(/^\s*"?HELLO/i))


                                return void Ti.App.fireEvent("bp:console", {
                                    log: "[AP Check] Salto. \"" + receivedString + "\""
                                });


                            Ti.App.fireEvent("bp:console", {
                                log: "[AP Check] Analizzo. \"" + receivedString + "\""
                            });

                            try {

                                if (e.buffer) {

                                    var isEcho = function() {
                                        var echo = -1 < receivedString.indexOf(lastMessage) || -1 < lastMessage.indexOf(receivedString);




                                        return echo && Ti.App.fireEvent("bp:console", {
                                            log: "[AP Check] Echo?"
                                        }), echo;
                                    };




                                    switch (Ti.App.fireEvent("bp:response-status", {
                                            status: "ok"
                                        }), !0 === global.debugConfigProgress && console.log("CONFIG::RX: " + receivedString), lastMessage) {
                                        case "$$$":




                                            return void(-1 < receivedString.indexOf("CMD") ? apCheckNextMessage() : !isEcho() && IO._apCheckEnd("bad-response"));

                                            break;
                                        case "get mac":

                                            var m = receivedString.match(/Mac Addr=([0-9A-F]{2}(\:[0-9A-F]{2}){5})/mi);

                                            if (m) {
                                                var macAddress = m[1].toLowerCase();

                                                IO._apCheckMacAddr = macAddress,

                                                    apCheckNextMessage();




                                            } else
                                                isEcho() ||
                                                IO._apCheckEnd("bad-response");


                                            return;

                                            break;
                                        case "scan":

                                            var m = receivedString.match(/SCAN:([^]*)END/mi);

                                            if (m) {
                                                var
                                                    str = m[1],
                                                    rows = str.split("\n"),
                                                    list = [];

                                                rows.forEach(function(row) {


                                                    if (row = row.trim(), row.match(/^[0-9]+(,[^,]+)+/)) {
                                                        var
                                                            parts = row.split(","),

                                                            res = {
                                                                index: parts[0],
                                                                channel: parts[1],
                                                                rssi: parts[2],
                                                                security: parts[3],
                                                                capabilities: parts[4],
                                                                wpa: parts[5],
                                                                wps: parts[6],
                                                                macAddr: parts[7],
                                                                ssid: parts[8]
                                                            };


                                                        list.push(res);
                                                    }
                                                });

                                                var res = {
                                                    list: list,
                                                    time: new Date().getTime()
                                                };


                                                res = JSON.stringify(res),

                                                    Ti.App.Properties.setString("wifi_scan", res),

                                                    apCheckNextMessage();
                                            } else
                                            if (receivedString.match(/SCAN:/mi));
                                            else




                                                receivedString.match(/<.+>/mi) ?
                                                Cfg.log("[AP Check] Skip version response") :

                                                isEcho() ||
                                                IO._apCheckEnd("bad-response");


                                            return;

                                            break;
                                        case "show deviceid":

                                            var deviceIdOk = -1 < receivedString.indexOf(deviceId);




                                            return void(deviceIdOk ? apCheckNextMessage() : !isEcho() && IO._apCheckEnd("bad-response"));

                                            break;
                                        case "exit":

                                            return;
                                    }




                                    Cfg.err("[AP Check] Invalid wifi config response: \"" + receivedString + "\"");
                                } else

                                    Cfg.err("[AP Check] Read callback called with no buffer!");

                            } catch (ex) {
                                Cfg.err("[AP Check] Read Error: " + ex.message);
                            }

                            Ti.App.fireEvent("bp:response-status", {
                                    status: "lost"
                                }),


                                Ti.App.fireEvent("bp:wifi-config-end", {
                                    reason: "response-error",
                                    error: "Step " + IO._actCheckIndex
                                }),


                                IO._apCheckEnd("bad-response")
                        }
                    };

                Ti.App.fireEvent("bp:console", {
                        log: "[AP Check] Check AP on: " + host + ":" + port + ", timeout: " + IO._apCheckTimeout
                    }),


                    this._apCheckSocket = Ti.Network.Socket.createTCP({
                        host: host,
                        port: port,
                        timeout: IO._apCheckTimeout,
                        connected: function(e) {
                            !0 === global.debugConfigProgress &&
                                console.log("CONFIG::STATE:: Socket Connected"),

                                Ti.App.fireEvent("bp:console", {
                                    log: "[AP Check] Socket Ready"
                                }),


                                Ti.Stream.pump(e.socket, apCheckReadCallback, 1024, !0),



                                setTimeout(function() {
                                    IO._apCheckOpen = !0,


                                        !0 === global.debugConfigProgress &&
                                        console.log("CONFIG::STATE:: Wait before sending messages..."),

                                        apCheckNextMessage();


                                }, IO._apCheckConnDelay);
                        },
                        error: function(e) {
                            return (
                                !0 === global.debugConfigProgress &&
                                console.log("CONFIG::STATE:: Socket [host: " + host + ", port: " + port + "] Error: " + e.error),

                                IO._apCheckOpen ? void(




                                    Cfg.err("[Ap Check] " + e.error),

                                    IO.stopAPCheck(),

                                    Ti.App.fireEvent("bp:ap-check-end", {
                                        reason: "socket-error",
                                        error: "Step " + IO._actCheckIndex + ": " + (e.error || "")
                                    })) : void("exit" !== lastMessage && (alert(L("setup_wizard_check_error")), Ti.App.fireEvent("bp:ap-check-end", {
                                    reason: "socket-error",
                                    error: "Step " + IO._actCheckIndex + ": " + (e.error || "")
                                }))));

                        }
                    }),




                    !0 === global.debugConfigProgress &&
                    console.log("CONFIG::STATE:: Socket Connect"),


                    this._apCheckSocket.connect();
            },




            _wifiConfigSocket: null,
            _wifiConfigMessages: [],
            _wifiConfigOpen: !1,
            _wifiConfigSkip: !0,
            _wifiConfigIndex: 0,
            _wifiConfigLastMsg: "",
            _wifiConfigTimeout: 5e3,


            wifiConfig: function() {
                if (ANDR && this.networkOffline())




                    return Cfg.err("[WiFi Config] Network not available"), Ti.App.fireEvent("bp:wifi-config-end", {
                        reason: "network-error",
                        error: "Offline"
                    }), !0 === global.debugConfigProgress && console.log("CONFIG::wifiConfig::ERROR:: Network OFFLINE - Exit Config"), !1;
                var



                    globalConfig = Cfg.getSetupConfig() || {},

                    host = globalConfig["wifikey-host"],
                    port = globalConfig["wifikey-port"],
                    password = Ti.App.Properties.getString("newdevice_password");
                return (




                    IO._wifiConfigMessages = globalConfig["wifikey-messages"],
                    IO._wifiConfigTimeout = globalConfig["wifikey-timeout"] || 5e3,
                    IO._wifiConfigConnDelay = globalConfig["wifikey-connection-delay"] || 50,
                    IO._wifiConfigDelay = globalConfig["wifikey-delay"] || 500,

                    password ?




                    IO._wifiConfigMessages && !(1 > IO._wifiConfigMessages.length) && host && port ? void(




                        IO.socketDisable(),
                        IO._wifiConfigSocketClose(),


                        IO._wifiConfigSkip = !0,
                        IO._wifiConfigMacAddress = "",
                        IO._wifiConfigRemoteAuth = "",
                        IO._wifiConfigOpen = !1,
                        IO._wifiConfigIndex = 0,

                        Ti.App.fireEvent("bp:console", {
                            log: "[WiFi Config] Connecting to " + host + ":" + port
                        }),


                        this._wifiConfigSocket = Ti.Network.Socket.createTCP({
                            host: host,
                            port: port,
                            timeout: IO._wifiConfigTimeout,
                            connected: function(e) {
                                Ti.App.fireEvent("bp:console", {
                                        log: "[WiFi Config] Socket Ready"
                                    }),


                                    Ti.Stream.pump(e.socket, IO._wifiConfigReadCallback, 1024, !0),


                                    setTimeout(function() {

                                        IO._wifiConfigNextMessage();


                                    }, IO._wifiConfigConnDelay);
                            },
                            error: function(e) {
                                IO._wifiConfigOpen && (



                                    Cfg.err("[WiFi Config] " + e.error),

                                    IO._wifiConfigSocketClose(),

                                    Ti.App.fireEvent("bp:wifi-config-end", {
                                        reason: "socket-error",
                                        error: "Step " + IO._wifiConfigIndex + ": " + (e.error || "")
                                    }));

                            }
                        }),


                        this._wifiConfigSocket.connect()) : (Cfg.err("[WiFi Config] Host, port or messages not configured!"), Ti.App.fireEvent("bp:wifi-config-end", {
                        reason: "config-error",
                        error: "Empty Data 2"
                    }), !1) : (Cfg.err("[WiFi Config] Auth password not configured!"), Ti.App.fireEvent("bp:wifi-config-end", {
                        reason: "config-error",
                        error: "Empty Data 1"
                    }), !1));
            },


            _wifiConfigNextMessage: function() {
                var
                    actIndex = IO._wifiConfigIndex,


                    messageInfo = IO._wifiConfigMessages[actIndex];

                if (messageInfo) {
                    var MAC_ADDR = IO._wifiConfigMacAddress,
                        REMOTE_ID = IO._wifiConfigRemoteAuth,
                        NEW_SSID = Ti.App.Properties.getString("wifi_ssid") || "",
                        NEW_PSW = Ti.App.Properties.getString("wifi_psw") || "",
                        NEW_AUTH = (Ti.App.Properties.getString("wifi_auth") || "") + "",


                        message = messageInfo[0];


                    message = message.replace("{REMOTE_ID}", REMOTE_ID.replace(/\s/g, "$")),
                        message = message.replace("{NEW_SSID}", NEW_SSID.replace(/\s/g, "$")),
                        message = message.replace("{NEW_PSW}", NEW_PSW.replace(/\s/g, "$")),
                        message = message.replace("{NEW_AUTH}", NEW_AUTH.replace(/\s/g, "$")),

                        setTimeout(function() {
                            var fn = IO._eF;




                            if (actIndex == IO._wifiConfigMessages.length - 1 && (fn = function() {
                                    setTimeout(function() {
                                        MAC_ADDR && (Cfg.saveActiveDeviceConfig(MAC_ADDR), IO._wifiConfigMacAddress = IO._wifiConfigRemoteAuth = ""), Ti.App.fireEvent("bp:response-status", {
                                            status: "ok"
                                        }), IO._cancelWifiConfigAutoclose(), IO._wifiConfigSocketClose(), IO.socketDisable(), Ti.App.fireEvent("bp:wifi-config-end", {
                                            reason: "end",
                                            macAddr: MAC_ADDR
                                        })
                                    }, 1e3)
                                }), Ti.App.fireEvent("bp:response-status", {
                                    status: "wait",
                                    id: message
                                }), IO._wifiConfigLastMsg = message, IO._wifiConfigOpen = !0, IO._wifiConfigSocket && (IO._wifiConfigSocket.state == Titanium.Network.Socket.CONNECTED || IO._wifiConfigSocket.state == Titanium.Network.Socket.LISTENING)) {
                                message += "\r\n",

                                    Ti.App.fireEvent("bp:console", {
                                        log: "[WiFi Config] Sending: \"" + message + "\""
                                    }),


                                    console.log("Wifi configuration step " + actIndex.toString() + ": " + message);

                                var buffer = Ti.createBuffer({
                                    type: Ti.Codec.CHARSET_UTF8,
                                    value: message
                                });


                                Ti.Stream.write(IO._wifiConfigSocket, buffer, fn);

                                var listLen = IO._wifiConfigMessages.length;

                                Ti.App.fireEvent("bp:wifi-config-progress", {
                                    index: actIndex,
                                    total: listLen,
                                    progress: actIndex / listLen
                                });

                            }

                        }, IO._wifiConfigDelay);
                }

                actIndex < IO._wifiConfigMessages.length - 1 &&
                    IO._wifiConfigAutoclose();

            },
            _wifiConfigSocketClose: function() {
                if (this._wifiConfigSocket)
                    try {
                        this._wifiConfigSocket.close();
                    }
                catch (e) {}


                this._wifiConfigSocket = null,
                    this._wifiConfigOpen = !1,

                    this.socketDisable();
            },
            _wifiConfigAutocloseTO: null,


            _wifiConfigAutoclose: function() {
                this._cancelWifiConfigAutoclose(),

                    this._wifiConfigAutocloseTO = setTimeout(function() {
                        Cfg.err("[WiFi Config] Socket closed for response timeout"),

                            IO._wifiConfigSocketClose(),

                            Ti.App.fireEvent("bp:response-status", {
                                status: "lost"
                            }),


                            Ti.App.fireEvent("bp:wifi-config-end", {
                                reason: "response-timeout",
                                error: "Step " + IO._wifiConfigIndex
                            });


                    }, IO._wifiConfigTimeout);
            },
            _cancelWifiConfigAutoclose: function() {
                this._wifiConfigAutocloseTO && clearTimeout(this._wifiConfigAutocloseTO);
            },
            _wifiConfigReadCallback: function(e) {
                var receivedString = e.buffer ? e.buffer.toString() : "";



                if (receivedString = receivedString || "", -1 == e.bytesProcessed)


                    return void Cfg.err("[WiFi Config] Error/End?  \"" + receivedString + "\"");


                if (!IO._wifiConfigOpen)


                    return void Cfg.err("[WiFi Config] Non avviato. \"" + receivedString + "\"");




                if (receivedString.match(/^\s*"?HELLO/i))


                    return void Ti.App.fireEvent("bp:console", {
                        log: "[WiFi Config] Salto. \"" + receivedString + "\""
                    });


                Ti.App.fireEvent("bp:console", {
                    log: "[WiFi Config] Received: \"" + receivedString + "\""
                });

                try {

                    if (e.buffer) {

                        var messageInfo = IO._wifiConfigMessages[IO._wifiConfigIndex];

                        if (messageInfo) {
                            var
                                messageRequest = messageInfo[0],
                                messageResponse = messageInfo[1];


                            if (!messageResponse || receivedString.match(new RegExp(messageResponse, "gmi"))) {
                                var resposeOK = !0;


                                if (messageRequest.match(/get mac/i)) {
                                    var m = receivedString.match(/Mac Addr=([0-9A-F]{2}(\:[0-9A-F]{2}){5})/mi);

                                    if (m) {
                                        var
                                            macAddress = m[1],
                                            password = Ti.App.Properties.getString("newdevice_password"),

                                            auths = Cfg.makeRemoteAuths(macAddress, password);

                                        IO._wifiConfigMacAddress = macAddress,
                                            IO._wifiConfigRemoteAuth = auths.dev;
                                    }
                                }




                                return Ti.App.fireEvent("bp:response-status", {
                                    status: "ok"
                                }), IO._wifiConfigIndex++, void(IO._wifiConfigIndex < IO._wifiConfigMessages.length && IO._wifiConfigNextMessage());
                            }


                            if (-1 < receivedString.indexOf(IO._wifiConfigLastMsg) || -1 < IO._wifiConfigLastMsg.indexOf(receivedString))


                                return void Ti.App.fireEvent("bp:console", {
                                    log: "[WiFi Config] Echo?"
                                });



                            if (0 < IO._wifiConfigIndex) {
                                var buffer = Ti.createBuffer({
                                    type: Ti.Codec.CHARSET_UTF8,
                                    value: "exit\r\n"
                                });


                                Ti.Stream.write(IO._wifiConfigSocket, buffer, IO._eF);
                            }

                        }

                        Ti.App.fireEvent("bp:error", {
                            error: "[WiFi Config] Invalid wifi config response: \"" + receivedString + "\""
                        });

                    } else

                        Ti.App.fireEvent("bp:error", {
                            error: "[WiFi Config] Read callback called with no buffer!"
                        });


                } catch (ex) {
                    Ti.App.fireEvent("bp:error", {
                        error: "[WiFi Config] Read Error: " + ex.message
                    });

                }

                IO._cancelWifiConfigAutoclose(),
                    IO._wifiConfigSocketClose(),

                    Ti.App.fireEvent("bp:response-status", {
                        status: "lost"
                    }),


                    Ti.App.fireEvent("bp:wifi-config-end", {
                        reason: "response-error",
                        error: "Step " + IO._wifiConfigIndex
                    });

            },

            stopWifiConfig: function() {
                this._wifiConfigSocketClose();
            },




            _udpSocket: null,
            _udpTimeout: null,
            toggleUDP: function() {
                this._udpSocket ?
                    this.stopUDP() :


                    this.startUDP();

            },
            startUDP: function() {
                if (this._udpSocket)




                    return this.stopUDP(), void setTimeout(function() {
                        IO.startUDP()
                    }, 500);


                if (this.networkOffline())




                    return void Ti.App.fireEvent("bp:udp-scan-end", {
                        error: "no-connection"
                    });
                var


                    globalConfig = Cfg.getSetupConfig() || {},
                    broadcastPort = globalConfig["udp-broadcast-port"] || 55555,
                    udpTimeout = globalConfig["udp-broadcast-timeout"] || 1e4,

                    macPos = globalConfig["udp-mac-position"] || 0,
                    checkDeviceId = globalConfig["udp-device-id"] || "no-id-defined",
                    deviceIdPos = globalConfig["udp-device-id-position"] || 60,
                    deviceIdLen = globalConfig["udp-device-id-length"] || 32,
                    rssiPos = globalConfig["udp-rssi-position"] || 7,
                    timeout = globalConfig["udp-check-timeout"] || 100,
                    port = globalConfig["wifikey-port"] || 2e3,

                    devicesList = [],
                    devicesListMac = {},
                    checkedHosts = {},




                    readCallbackUDP = function(e, rssi) {
                        -1 == e.bytesProcessed;




                        try {
                            if (e.buffer) {
                                var host = e.source.host;

                                checkedHosts[host] = !0;

                                var receivedString = e.buffer.toString();

                                if (receivedString) {

                                    console.log("bp-io.js : 2366 | readCallbackUDP() : " + receivedString);


                                    var isAuth = Cfg.isAuthMessage(receivedString, "D");


                                    if (isAuth) {
                                        Cfg.log("[UDP] Valid auth \"" + receivedString + "\"");
                                        var


                                            macAddr = isAuth.mac,


                                            deviceData = {
                                                mac: macAddr,
                                                host: host,
                                                rssi: rssi
                                            };


                                        devicesList.push(deviceData),


                                            devicesListMac[macAddr] ||
                                            Cfg.addNewDeviceConfig({
                                                macAddress: macAddr,
                                                host: host,
                                                rssi: rssi
                                            }, !0),



                                            devicesListMac[macAddr] = {
                                                host: host,
                                                rssi: rssi
                                            },


                                            Ti.App.fireEvent("bp:udp-update", {
                                                length: devicesList.length,
                                                list: devicesList,
                                                mac: macAddr,
                                                host: host,
                                                rssi: rssi,
                                                macsList: devicesListMac
                                            }),


                                            Ti.App.fireEvent("bp:response-status", {
                                                id: devicesList.length,
                                                status: "ok"
                                            });

                                    } else

                                        Cfg.log("[UDP] no auth: \"" + receivedString + "\"");

                                }
                            } else

                                Cfg.err("Read callback called with no buffer!");

                        } catch (ex) {
                            Ti.App.fireEvent("bp:error", {
                                error: "[UDP] Read Error: " + ex.message
                            });

                        }
                    },




                    UDP = require("ti.udp");

                this._udpSocket = UDP.createSocket(),

                    this._udpSocket.addEventListener("started", function(evt) {
                        Ti.App.fireEvent("bp:udp-started"),
                            global.debugUDPBroadcast &&
                            console.log("[UDP_Broadcast] Started...");

                    }),




                    this._udpSocket.addEventListener("data", function(e) {
                        var _StringfromCharCode =




                            String.fromCharCode;
                        if (92 > e.bytesData.length) return Ti.App.fireEvent("bp:error", {
                            error: "[UDP] Invalid length"
                        }), void(global.debugUDPBroadcast && console.log("[UDP_Broadcast] Invalid length: " + e.bytesData.length));
                        var host = e.address.split(":").shift();
                        host = host.replace("/", ""), Ti.App.fireEvent("bp:console", {
                            log: "[UDP] Message from " + host + ""
                        }), global.debugUDPBroadcast && console.log("[UDP_Broadcast] Message from " + host + "");
                        for (var deviceIdArr = [], i = 0; i < deviceIdLen; i++) deviceIdArr.push(_StringfromCharCode(e.bytesData[deviceIdPos + i]));
                        var


                            deviceId = deviceIdArr.join(""),


                            deviceIdOk = -1 < deviceId.indexOf(checkDeviceId);

                        if (deviceIdOk) {
                            if (checkedHosts[host] && (
                                    Ti.App.fireEvent("bp:console", {
                                        log: "[UDP] " + host + " already checked"
                                    }),
                                    global.debugUDPBroadcast &&
                                    console.log("[UDP_Broadcast] " + host + " already checked"),


                                    !global.debugUDPBroadcast))
                                return;




                            var rssi = e.bytesData[rssiPos];




                            if (Ti.App.fireEvent("bp:console", {
                                    log: "[UDP] TCP connection to " + host + " : " + port
                                }), global.debugUDPBroadcast && console.log("[UDP_Broadcast] TCP connection to " + host + " : " + port), global.debugUDPBroadcast) {

                                for (var buffString = "", i = 0, len = e.bytesData.length; i < len; i++)
                                    buffString += e.bytesData[i].toString(16) + " ";

                                Ti.App.fireEvent("ShowLogVisivo", {
                                        text: "UDP/OK: ID=" + deviceId + " / Host:port=" + host + ":" + port + " / LenData=" + e.bytesData.length + " / -" + rssi.toString() + " dBm / Data: " + buffString
                                    }),
                                    console.log("UDP/OK: ID= / Host:port=" + host + ":" + port + " / LenData=" + e.bytesData.length + " / -" + rssi.toString() + " dBm / Data: " + buffString);
                            }
                            var


                                socket, retries = 0,

                                closeSocket = function(retry) {


                                    try {
                                        socket && socket.close();
                                    } catch (e) {

                                    }

                                    socket = null,

                                        retry && 3 > retries && !checkedHosts[host] &&
                                        setTimeout(tryCheck, 1e3);

                                },



                                tryCheck = function() {
                                    retries++,

                                    socket = Ti.Network.Socket.createTCP({
                                            host: host,
                                            port: port,
                                            timeout: timeout,
                                            connected: function(e) {

                                                Ti.App.fireEvent("bp:console", {
                                                        log: "[UDP] Socket opened: " + host + " : " + port
                                                    }),
                                                    global.debugUDPBroadcast &&
                                                    console.log("[UDP_Broadcast] Socket opened: " + host + " : " + port),



                                                    Ti.Stream.pump(e.socket, function(e) {
                                                        readCallbackUDP(e, rssi);

                                                    }, 1024, !0),

                                                    setTimeout(function() {
                                                        closeSocket(!0);

                                                    }, 4 * timeout);
                                            },
                                            error: function(e) {
                                                Cfg.err("[UDP] " + e.error),
                                                    global.debugUDPBroadcast &&
                                                    console.log("[UDP_Broadcast] Error \"\"" + e.error + "\""),


                                                    closeSocket(!0);
                                            }
                                        }),


                                        socket.connect();
                                };

                            tryCheck();
                        } else


                        if (Cfg.err("[UDP] invalid device ID"), global.debugUDPBroadcast) {
                            console.log("[UDP_Broadcast] invalid device ID (" + deviceId + ")");

                            for (var buffString = "", i = 0, len = e.bytesData.length; i < len; i++)
                                buffString += e.bytesData[i].toString(16) + " ";

                            Ti.App.fireEvent("ShowLogVisivo", {
                                    text: "UDP/INVALID: ID=" + deviceId + " / Data: " + buffString
                                }),
                                console.log("UDP/INVALID: ID=" + deviceId + " / Data: " + buffString);
                        }


                    }),


                    this._udpSocket.addEventListener("error", function(evt) {
                        global.debugUDPBroadcast && (
                            console.log("[UDP_Broadcast] Error..."),
                            console.log(evt));




                    }),

                    this._udpSocket.start({
                        port: broadcastPort
                    }),


                    this.setStopUDPTimeout(udpTimeout),

                    Ti.App.fireEvent("bp:console", {
                        log: "[UDP] Start"
                    }),
                    global.debugUDPBroadcast &&
                    console.log("[UDP_Broadcast] Start.... 2642"),


                    this.startLanScan();
            },
            setStopUDPTimeout: function(time) {
                this._udpTimeout = setTimeout(function() {
                    IO.stopUDP(),
                        global.debugUDPBroadcast &&
                        console.log("[UDP_Broadcast] Timed out...");


                }, time || 1e4);
            },
            stopUDP: function() {


                if ((this.stopLanScan(), !global.alwaysListenUDPBroadcast) &&


                    this._udpSocket) {
                    try {
                        this._udpSocket.stop();
                    } catch (e) {}

                    this._udpTimeout && clearTimeout(this._udpTimeout),

                        this._udpSocket = null,
                        this._udpTimeout = null,

                        Ti.App.fireEvent("bp:udp-stopped");
                }
            },




            _useUpdateIV: null,

            startUseUpdate: function(reset) {
                this.stopUseUpdate();
                var

                    globalConfig = Cfg.getSetupConfig() || {},

                    interval = globalConfig["use-update-interval"] || 5e3;

                this._useUpdateIV = setInterval(function() {
                    IO.updateUseToServer();

                }, interval);
            },
            stopUseUpdate: function() {
                this._useUpdateIV && clearInterval(this._useUpdateIV),
                    this._useUpdateIV = null,

                    this.closeUseUpdate();
            },


            _useUpdateSocket: null,
            _useUpdateTO: null,

            updateUseToServer: function(reset) {
                if (this._useUpdateSocket)


                    return void Ti.App.fireEvent("bp:console", {
                        log: "[Use Update] Already execution. End"
                    });



                if (!IO._socketReady)


                    return Ti.App.fireEvent("bp:console", {
                        log: "[Use Update] Not in use"
                    }), !1;


                var deviceConfig = this._socketDeviceConfig;


                if (!deviceConfig)




                    return Ti.App.fireEvent("bp:error", {
                        error: "[Use Update] Active device config not available"
                    }), !1;
                var



                    globalConfig = Cfg.getSetupConfig() || {},

                    remoteHost = globalConfig["remote-host"],
                    remotePort = globalConfig["use-update-port"],

                    timeout = globalConfig["connection-timeout"] || 1e4,
                    connectionDelay = globalConfig["connection-delay"] || 50;




                if (global.debugConnessione && console.log("Modalit\xE0 connessione richiesta: " + Cfg.getActiveDeviceConfig().mode), !remoteHost || !remotePort)




                    return Ti.App.fireEvent("bp:error", {
                        error: "[Use Update] Remote host or port not configured!"
                    }), !1;



                var readCallback = function(e) {
                    if (-1 != e.bytesProcessed)




                        try {
                            if (e.buffer && 0 < e.buffer.length) {
                                var
                                    receivedString = e.buffer.toString(),


                                    m = receivedString.match(/^\*\*UPDATE_OK/i);


                                m ||



                                    Ti.App.fireEvent("bp:error", {
                                        error: "[Use Update] Bad result: \"" + receivedString + "\" Length: " + e.buffer.length
                                    }),



                                    IO.closeUseUpdate();
                            } else

                                Ti.App.fireEvent("bp:error", {
                                    error: "[Use Update] Empty Buffer"
                                });


                        }
                    catch (ex) {
                        Ti.App.fireEvent("bp:error", {
                            error: "[Use Update] Read Error: " + ex.message
                        });

                    }
                };


                Ti.App.fireEvent("bp:console", {
                        log: "[Use Update] Connecting: " + remoteHost + " : " + remotePort
                    }),



                    this._useUpdateSocket = Ti.Network.Socket.createTCP({
                        host: remoteHost,
                        port: remotePort,
                        timeout: timeout,
                        connected: function(e) {

                            IO._useUpdateTO && clearTimeout(IO._useUpdateTO),
                                IO._useUpdateTO = null,




                                Ti.Stream.pump(e.socket, readCallback, 1024, !0),


                                setTimeout(function() {
                                    if (!IO._useUpdateSocket)




                                        return void Ti.App.fireEvent("bp:error", {
                                            error: "[Use Update] Socket not available"
                                        });


                                    if (!IO._socketReady)




                                        return Ti.App.fireEvent("bp:console", {
                                            log: "[Use Update] No longer in use. End"
                                        }), void IO.closeUseUpdate();


                                    var appName = Cfg.getAppName();

                                    appName = appName.replace(/\*/gi, "");

                                    var useMsg = (IO._socketRemoteMode ? "**USE_REMOTE:" : "**USE_LOCAL:") + appName + "** " + deviceConfig.app_auth;
                                    global.debugUpdateServer &&
                                        console.log("_useUpdateSocket: " + useMsg);




                                    var buffer = Ti.createBuffer({
                                        type: Ti.Codec.CHARSET_UTF8,
                                        value: useMsg
                                    });


                                    Ti.Stream.write(IO._useUpdateSocket, buffer, IO._eF);


                                }, connectionDelay);
                        },
                        error: function(e) {
                            Ti.App.fireEvent("bp:error", {
                                    error: "[Use Update] (" + e.errorCode + "): " + e.error
                                }),


                                IO.closeUseUpdate();
                        }
                    }),

                    global.debugUpdateServer &&
                    console.log("updateUseToServer: INIZIO tentativo verso " + remoteHost + " : " + remotePort + " [ " + timeout + " ]"),

                    this._useUpdateSocket.connect(),
                    global.debugUpdateServer &&
                    console.log("updateUseToServer: FINE tentativo verso " + remoteHost + " : " + remotePort + " [ " + timeout + " ]"),

                    IO._useUpdateTO = setTimeout(function() {
                        IO.closeUseUpdate();

                    }, 5e3);
            },
            closeUseUpdate: function() {




                if (IO._useUpdateTO && clearTimeout(IO._useUpdateTO), IO._useUpdateTO = null, !!this._useUpdateSocket) {




                    try {
                        this._useUpdateSocket && this._useUpdateSocket.close();
                    } catch (e) {}

                    this._useUpdateSocket = null,

                        Ti.App.fireEvent("bp:console", {
                            log: "[Use Update] Close Socket"
                        })
                }
            },




            _remoteCheckSocket: null,
            _remoteCheckTime: 0,
            _remoteCheckTO: null,
            _remoteChecked: {},
            startRemoteCheck: function(reset) {
                var
                    nowTime = new Date().getTime() / 1e3,
                    timeDiff = nowTime - IO._remoteCheckTime;




                if (reset && (this._remoteChecked = {}, this.stopRemoteCheck()), this._remoteCheckSocket)


                    return void Ti.App.fireEvent("bp:console", {
                        log: "[Remote Check] Already executing. End"
                    });




                IO._remoteCheckTime = nowTime;
                var


                    allConfigs = Cfg.getAllDevicesConfig() || [],
                    configs = [],
                    configsMac = [];




                if (allConfigs.forEach(function(cfg) {
                        !(cfg.macAddress in IO._remoteChecked) && cfg.password && (configs.push(cfg), configsMac.push(cfg.macAddress))
                    }), Ti.App.fireEvent("bp:console", {
                        log: "[Remote Check] N. " + configsMac.length + ": " + configsMac.join(", ")
                    }), 1 > configs.length)


                    return void Ti.App.fireEvent("bp:console", {
                        log: "[Remote Check] Empty List End"
                    });
                var



                    globalConfig = Cfg.getSetupConfig() || {},

                    remoteHost = globalConfig["remote-host"],
                    remotePort = globalConfig["remote-port"],
                    timeout = globalConfig["connection-timeout"] || 1e4,
                    connectionDelay = globalConfig["connection-delay"] || 50;

                if (!remoteHost || !remotePort)




                    return Ti.App.fireEvent("bp:error", {
                        error: "[Remote Check] Remote host or port not configured!"
                    }), !1;
                var




                    timeoutTO, readCallback = function(e) {
                        if (-1 != e.bytesProcessed) try {
                            if (e.buffer) {
                                var receivedString = e.buffer.toString(),
                                    m = receivedString.match(/^\*\*CHECK\:([0-9A-F]{2}(\:[0-9A-F]{2}){5})\:(ON|OFF|IN_USE)(\:(.*))?\*\*/i);
                                if (Cfg.log("[Remote Check] Use check response: " + receivedString), m) {
                                    var macAddr = m[1],
                                        result = m[3],
                                        details = m[5] || L("app_remote_inuse_unknown");
                                    IO._remoteChecked[macAddr] = {
                                        result: result,
                                        name: details
                                    }, Ti.App.fireEvent("bp:remote-check-update", {
                                        mac: macAddr,
                                        macsOnline: IO._remoteChecked
                                    }), Ti.App.fireEvent("bp:response-status", {
                                        id: "",
                                        status: "ok"
                                    })
                                }
                                setTimeout(checkNext, 500)
                            } else Ti.App.fireEvent("bp:error", {
                                error: "[Remote Check] Empty Buffer"
                            })
                        } catch (ex) {
                            Ti.App.fireEvent("bp:error", {
                                error: "[Remote Check] Read Error: " + ex.message
                            })
                        }
                    },
                    listPos = 0,

                    checkNext = function() {




                        if (IO._remoteCheckTO && clearTimeout(IO._remoteCheckTO), IO._remoteCheckTO = null, !IO._remoteCheckSocket)




                            return Ti.App.fireEvent("bp:error", {
                                error: "[Remote Check] Socket not available"
                            }), void IO.stopRemoteCheck();


                        var keyConfig = configs[listPos];


                        if (!keyConfig)




                            return Ti.App.fireEvent("bp:console", {
                                log: "[Remote Check] List End"
                            }), void IO.stopRemoteCheck();



                        listPos++,

                        IO._remoteChecked[keyConfig.macAddress] = !1;

                        var checkMsg = "**CHECK** " + keyConfig.app_auth;

                        Ti.App.fireEvent("bp:console", {
                            log: "[Remote Check] Send msg: " + checkMsg
                        });




                        var buffer = Ti.createBuffer({
                            type: Ti.Codec.CHARSET_UTF8,
                            value: checkMsg
                        });


                        Ti.Stream.write(IO._remoteCheckSocket, buffer, IO._eF),

                            IO._remoteCheckTO = setTimeout(function() {
                                Ti.App.fireEvent("bp:error", {
                                        error: "[Remote Check] Response timeout, try next"
                                    }),


                                    checkNext();

                            }, 5e3);
                    };

                Ti.App.fireEvent("bp:remote-check-started"),

                    Ti.App.fireEvent("bp:console", {
                        log: "[Remote Check] Try connection to: " + remoteHost + ":" + remotePort + " - timeout: " + timeout
                    }),


                    this._remoteCheckSocket = Ti.Network.Socket.createTCP({
                        host: remoteHost,
                        port: remotePort,
                        timeout: timeout,
                        connected: function(e) {

                            Ti.App.fireEvent("bp:console", {
                                    log: "[Remote Check] " + remoteHost + ": Socket opened!"
                                }),


                                Ti.Stream.pump(e.socket, readCallback, 1024, !0),


                                setTimeout(function() {
                                    checkNext();


                                }, connectionDelay);
                        },
                        error: function(e) {
                            Ti.App.fireEvent("bp:error", {
                                    error: "[Remote Check] (" + e.errorCode + "): " + e.error
                                }),


                                IO.stopRemoteCheck();
                        }
                    }),


                    this._remoteCheckSocket.connect();
            },
            stopRemoteCheck: function() {

                IO._remoteCheckTO && clearTimeout(IO._remoteCheckTO),
                    IO._remoteCheckTO = null;


                try {
                    this._remoteCheckSocket && this._remoteCheckSocket.close();
                } catch (e) {}

                this._remoteCheckSocket = null,

                    this.socketDisable(),

                    Ti.App.fireEvent("bp:remote-check-stopped");
            },




            startRemoteCheckCAT: function(macs, reset) {
                var
                    nowTime = new Date().getTime() / 1e3,
                    timeDiff = nowTime - IO._remoteCheckTime;




                if (reset && (this._remoteChecked = {}, this.stopRemoteCheckCAT()), this._remoteCheckSocket)


                    return void Ti.App.fireEvent("bp:console", {
                        log: "[CAT Remote Check] Already executing. End"
                    });




                if (IO._remoteCheckTime = nowTime, Ti.App.fireEvent("bp:console", {
                        log: "[CAT Remote Check] N. " + macs.length + ": " + macs.join(", ")
                    }), 1 > macs.length)


                    return void Ti.App.fireEvent("bp:console", {
                        log: "[CAT Remote Check] Empty List End"
                    });
                var



                    globalConfig = Cfg.getSetupConfig() || {},

                    remoteHost = globalConfig["remote-host"],
                    remotePort = globalConfig["remote-port"],
                    timeout = globalConfig["connection-timeout"] || 1e4,
                    connectionDelay = globalConfig["connection-delay"] || 50;

                if (!remoteHost || !remotePort)




                    return Ti.App.fireEvent("bp:error", {
                        error: "[CAT Remote Check] Remote host or port not configured!"
                    }), !1;
                var




                    timeoutTO, readCallback = function(e) {
                        if (-1 != e.bytesProcessed) try {
                            if (e.buffer) {
                                var receivedString = e.buffer.toString(),
                                    m = receivedString.match(/^\*\*CHECK\:([0-9A-F]{2}(\:[0-9A-F]{2}){5})\:(ON|OFF|IN_USE)(\:(.*))?\*\*/i);
                                if (Cfg.log("[CAT Remote Check] Use check response: " + receivedString), m) {
                                    var macAddr = m[1],
                                        result = m[3],
                                        details = m[5] || L("app_remote_inuse_unknown");
                                    IO._remoteChecked[macAddr] = {
                                        result: result,
                                        name: details
                                    }, Ti.App.fireEvent("bp:cat-remote-check-update", {
                                        mac: macAddr,
                                        macsOnline: IO._remoteChecked
                                    }), Ti.App.fireEvent("bp:response-status", {
                                        id: "",
                                        status: "ok"
                                    })
                                }
                                setTimeout(checkNext, 500)
                            } else Ti.App.fireEvent("bp:error", {
                                error: "[CAT Remote Check] Empty Buffer"
                            })
                        } catch (ex) {
                            Ti.App.fireEvent("bp:error", {
                                error: "[CAT Remote Check] Read Error: " + ex.message
                            })
                        }
                    },
                    listPos = 0,


                    checkNext = function() {




                        if (IO._remoteCheckTO && clearTimeout(IO._remoteCheckTO), IO._remoteCheckTO = null, !IO._remoteCheckSocket)




                            return Ti.App.fireEvent("bp:error", {
                                error: "[CAT Remote Check] Socket not available"
                            }), void IO.stopRemoteCheckCAT();


                        var macAddr = macs[listPos];


                        if (!macAddr)




                            return Ti.App.fireEvent("bp:console", {
                                log: "[CAT Remote Check] List End"
                            }), void IO.stopRemoteCheckCAT();



                        listPos++,

                        IO._remoteChecked[macAddr] = !1;
                        var

                            catAuth = CAT.getMacAuth(macAddr),

                            checkMsg = "**CHECK** " + catAuth;

                        Ti.App.fireEvent("bp:console", {
                            log: "[CAT Remote Check] Send msg: " + checkMsg
                        });




                        var buffer = Ti.createBuffer({
                            type: Ti.Codec.CHARSET_UTF8,
                            value: checkMsg
                        });


                        Ti.Stream.write(IO._remoteCheckSocket, buffer, IO._eF),

                            IO._remoteCheckTO = setTimeout(function() {
                                Ti.App.fireEvent("bp:error", {
                                        error: "[CAT Remote Check] Response timeout, try next"
                                    }),


                                    checkNext();

                            }, 5e3);
                    };

                Ti.App.fireEvent("bp:cat-remote-check-started"),

                    Ti.App.fireEvent("bp:console", {
                        log: "[CAT Remote Check] Try connection to: " + remoteHost + ":" + remotePort + " - timeout: " + timeout
                    }),


                    this._remoteCheckSocket = Ti.Network.Socket.createTCP({
                        host: remoteHost,
                        port: remotePort,
                        timeout: timeout,
                        connected: function(e) {

                            Ti.App.fireEvent("bp:console", {
                                    log: "[CAT Remote Check] " + remoteHost + ": Socket opened!"
                                }),


                                Ti.Stream.pump(e.socket, readCallback, 1024, !0),




                                setTimeout(function() {


                                    checkNext();


                                }, connectionDelay);
                        },
                        error: function(e) {
                            Ti.App.fireEvent("bp:error", {
                                    error: "[CAT Remote Check] (" + e.errorCode + "): " + e.error
                                }),


                                IO.stopRemoteCheckCAT();
                        }
                    }),


                    this._remoteCheckSocket.connect();
            },
            stopRemoteCheckCAT: function() {

                IO._remoteCheckTO && clearTimeout(IO._remoteCheckTO),
                    IO._remoteCheckTO = null;


                try {
                    this._remoteCheckSocket && this._remoteCheckSocket.close();
                } catch (e) {}

                this._remoteCheckSocket = null,

                    this.socketDisable(),

                    Ti.App.fireEvent("bp:cat-remote-check-stopped");
            },

            stopAll: function() {
                IO.socketDisable(),
                    IO.stopUDP(),
                    IO.stopAPCheck(),
                    IO.stopWifiConfig(),
                    IO.stopUseUpdate();
            },




            _lanScanRestartSocket: !1,

            _lanScanRunning: !1,
            stopLanScan: function() {
                IO._lanScanRunning = !1;
            },

            startLanScan: function() {
                if (this.networkOffline())


                    return Cfg.err("[SCAN] Network not available"), !1;


                if (this.network3G())


                    return Cfg.err("[SCAN] Network not in LAN"), !1;


                this.stopLanScan();

                var configs = Cfg.getAllDevicesConfig();

                if (1 > configs.length)


                    return Cfg.err("[SCAN] No saved Devices"), !1;
                var


                    debug = Cfg.isDebugModeOn(),
                    globalConfig = Cfg.getSetupConfig() || {},
                    deviceHost = Ti.Platform.address;

                if (!deviceHost || !deviceHost.match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/))




                    return void Ti.App.fireEvent("bp:lan-scan-end", {
                        error: "no-ip-range"
                    });



                var hostGroup = deviceHost.split(".");
                hostGroup.pop(),
                    hostGroup = hostGroup.join(".");
                var



                    list = [],
                    actRange = 0,
                    complete = !1,

                    port = globalConfig["connection-port"] || globalConfig["wifikey-port"] || 2e3,
                    timeout = globalConfig["lan-scan-timeout"] || 100,

                    devicesList = [],
                    devicesListMac = {},
                    checkedHosts = {},

                    readCallbackUDP = function(e, rssi) {
                        if (-1 != e.bytesProcessed)




                            try {
                                if (e.buffer) {
                                    var host = e.source.host;

                                    checkedHosts[host] = !0;

                                    var receivedString = e.buffer.toString();

                                    if (receivedString) {
                                        console.log("bp-io.js : 3438 | readCallbackUDP() : " + receivedString);


                                        var isAuth = Cfg.isAuthMessage(receivedString, "D");




                                        if (console.log("bp-io.js : 3443 | POST-Cfg.isAuthMessage : " + isAuth), isAuth) {
                                            console.log("[SCAN] Valid auth \"" + receivedString + "\" / " + host),
                                                Cfg.log("[SCAN] Valid auth \"" + receivedString + "\" / " + host);
                                            var


                                                macAddr = isAuth.mac,

                                                deviceData = {
                                                    mac: macAddr,
                                                    host: host,
                                                    rssi: rssi
                                                };


                                            global.debugUDPBroadcast,



                                                devicesList.push(deviceData),

                                                devicesListMac[macAddr] = {
                                                    host: host,
                                                    rssi: rssi
                                                },


                                                Ti.App.fireEvent("bp:udp-update", {
                                                    length: devicesList.length,
                                                    list: devicesList,
                                                    mac: macAddr,
                                                    host: host,
                                                    rssi: rssi,
                                                    macsList: devicesListMac
                                                });

                                        } else

                                            console.log("[SCAN] no auth: \"" + receivedString + "\""),
                                            Cfg.log("[SCAN] no auth: \"" + receivedString + "\"");

                                    }
                                } else

                                    Cfg.err("Read callback called with no buffer!");

                            }
                        catch (ex) {
                            Ti.App.fireEvent("bp:error", {
                                error: "[SCAN] Read Error: " + ex.message
                            });

                        }
                    },

                    nextIP = function() {
                        if (IO._lanScanRunning == actSess) {



                            if (255 <= actRange)




                                return void(complete || (complete = !0, setTimeout(function() {
                                    IO._lanScanRestartSocket = !1
                                }, 500)));


                            actRange++;


                            var host = hostGroup + "." + actRange;


                            if (host != deviceHost || debug) {
                                Ti.API.info(host + " : " + port),
                                    console.log("LAN/Provo IP : " + host + " : " + port + "[" + timeout + "]");
                                var

                                    closeSocket = function() {

                                        try {
                                            socket && socket.close();
                                        } catch (e) {

                                        }

                                        socket = null,

                                            nextIP();
                                    },


                                    socket = Ti.Network.Socket.createTCP({
                                        host: host,
                                        port: port,
                                        timeout: timeout,
                                        connected: function(e) {

                                            Ti.App.fireEvent("bp:console", {
                                                    log: "[SCAN] Socket opened: " + host + " : " + port
                                                }),
                                                console.log("[SCAN] Socket opened: " + host + " : " + port),


                                                Ti.Stream.pump(e.socket, function(e) {
                                                    readCallbackUDP(e, null);

                                                }, 1024, !0),

                                                setTimeout(function() {
                                                    console.log("setTimeout: " + host + " : " + port),
                                                        closeSocket(!0);

                                                }, 4 * timeout);
                                        },
                                        error: function(e) {

                                            console.error("Error (" + e.errorCode + "): " + e.error),
                                                socket = null,
                                                nextIP();
                                        }
                                    });


                                socket.connect();

                            } else


                                nextIP()
                        }

                    },



                    actSess = Math.random();

                IO._lanScanRunning = actSess;



                for (var reqNum = 5, i = 0; i < reqNum; i++)
                    setTimeout(function() {
                        nextIP();
                    }, 50 * i);

            }
        };




    return IO.init = function(opts) {
        Cfg.appEvent("bp:wifi-config", function(e) {
            IO.wifiConfig()
        }), Cfg.appEvent("bp:ap-check-start", function(e) {
            IO.startAPCheck()
        }), Cfg.appEvent("bp:ap-check-stop", function(e) {
            IO.stopAPCheck()
        }), Cfg.appEvent("bp:udp-toggle", function(e) {
            IO.toggleUDP()
        }), Cfg.appEvent("bp:udp-start", function(e) {
            IO.startUDP()
        }), Cfg.appEvent("bp:udp-stop", function(e) {
            IO.stopUDP()
        }), Cfg.appEvent("bp:remote-check-start", function(e) {
            IO.startRemoteCheck(e.reset), global.debugUDPBroadcast && Ti.App.fireEvent("ShowLogVisivo", {
                text: "Spazzolata..."
            });;
        }), Cfg.appEvent("bp:remote-check-stop", function(e) {
            IO.stopRemoteCheck()
        }), Cfg.appEvent("bp:cat-remote-check-start", function(e) {
            IO.startRemoteCheckCAT(e.macs, e.reset)
        }), Cfg.appEvent("bp:cat-remote-check-stop", function(e) {
            IO.stopRemoteCheckCAT()
        }), Cfg.appEvent("bp:socket-disable", function(e) {
            IO.socketDisable()
        }), Cfg.appEvent("bp:message", function(e) {
            e.message && IO.stackMessage(e.message)
        }), Cfg.appEvent("bp:message-now", function(e) {
            e.message && IO.request(e.message)
        }), Cfg.appEvent("bp:datalog-lines", function(e) {
            IO._datalogActiveLines = [], e.lines.values.forEach(function(line) {
                line.visible && IO._datalogActiveLines.push(line.label)
            })
        }), Cfg.appEvent("bp:datalog-enable", function(e) {
            IO.enableDatalog(e.rec)
        }), Cfg.appEvent("bp:datalog-disable", function(e) {
            IO.disableDatalog()
        }), Cfg.appEvent("bp:datalog-enable-rec", function(e) {
            IO.enableDatalogRec()
        }), Cfg.appEvent("bp:datalog-disable-rec", function(e) {
            IO.disableDatalogRec()
        }), Cfg.appEvent("bp:datalog-check", function(e) {
            Ti.App.fireEvent("bp:datalog-status", {
                active: IO._datalog,
                rec: IO._datalogRec
            })
        }), Cfg.appEvent("bp:datalog-query", function(e) {
            if (!IO.initDatalogTable()) return !1;
            IO.pauseRequests();
            var res = IO._datalogTableTemp.select({
                    fields: e.fields,
                    where: e.where,
                    order: e.order,
                    limit: e.limit
                }),
                points = !1,
                fromVal = 0,
                toVal = 0,
                time = 0;
            res && (points = [], fromVal = 1 / 0, toVal = 0, res.forEach(function(row) {
                var _Mathmax = Math.max,
                    _Mathmin = Math.min;
                time = parseInt(row.time, 10), points.push([time, row.points ? JSON.parse(row.points) : null]), fromVal = _Mathmin(fromVal, time), toVal = _Mathmax(toVal, time)
            }), res.close(), res = null, !points.length && (fromVal = 0)), Ti.App.fireEvent("bp:datalog-query-result", {
                action: e.action,
                points: points,
                from: fromVal,
                to: toVal
            }), IO.restartRequests()
        });
        var stopAllTO, allStopped = !1;
        Cfg.appEvent("resume", function(e) {
            if (stopAllTO && clearTimeout(stopAllTO), stopAllTO = null, allStopped) {
                console.log("Resume: restart connection"), allStopped = !1;
                var forceTime = new Date().getTime();
                Cfg.getSetupConfig(forceTime), Cfg.loadConfiguration(forceTime);
                var cfg = Cfg.getActiveScreenConfig();
                cfg["auto-connect"] && IO.socketEnable()
            } else console.log("Resume: restart not required")
        }), Cfg.appEvent("paused", function(e) {
            stopAllTO = setTimeout(function() {
                allStopped = !0, console.log("======> Event: PAUSE =========="), console.log("Paused: STOP ALL"), IO.stopAll()
            }, 2e4)
        })
    }, IO;
}();
module.exports = bp_io_module;