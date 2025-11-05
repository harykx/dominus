module.exports = function() {
    var _Mathround =




        Math.round;

    function CalBar(opts) {
        var that = this;
        if (this.cal = opts.cal || 0, this.viewCnt = Ti.UI.createView({
                left: UI.margin(),
                right: UI.margin(),
                height: 80,
                top: opts.top || null
            }), this.viewLabel = Ti.UI.createLabel({
                left: 0,
                top: 0,
                height: 36,
                font: {
                    fontSize: 20
                },
                color: UI.textcolor,
                text: opts.label
            }), this.viewCnt.add(this.viewLabel), opts.calButton) {
            var weekdayKey = "weekday-" + opts.day + "-cal";
            this.weekdayKey = weekdayKey, this.viewBtn = Ti.UI.createView({
                right: 0,
                top: 0,
                width: 150,
                height: 36,
                backgroundImage: "/modbus/btn-cal.png"
            }), this.viewCnt.add(this.viewBtn), this.viewBtnLabel = Ti.UI.createLabel({
                left: 10,
                height: 36,
                font: {
                    fontSize: 16
                },
                color: "#FFFFFF",
                shadowOffset: {
                    x: 0,
                    y: -1
                },
                shadowColor: UI.textcolor
            }), this.viewBtn.add(this.viewBtnLabel);
            var viewBtn = this.viewBtn,
                viewBtnLabel = this.viewBtnLabel;
            this.item = opts.items.add({
                id: weekdayKey,
                build: function() {
                    this.viewReturn = viewBtnLabel
                },
                formatter: function(ret, form) {
                    return ModBus.refreshBarRanges(that, ret), 0 < ret ? form : "---"
                }
            }), UI.touch(this.viewBtn, {
                opacity: .5
            }, {
                opacity: 1
            }), this.viewBtn.addEventListener("click", function() {
                for (var options = [], values = [], selected = -1, i = 1; 4 >= i; i++) options.push("Cal " + i), values.push(i);
                options.push(L("generic_cancel")), values.push(-1);
                var dialog = Ti.UI.createOptionDialog({
                    destructive: options.length - 1,
                    options: options,
                    selectedIndex: selected,
                    title: L("mb_select_calendar")
                });
                dialog.addEventListener("click", function(e) {
                    if (-1 < e.index && e.index < options.length - 1) {
                        var lbl = options[e.index],
                            val = values[e.index];
                        viewBtnLabel.text = lbl, opts.items.setReturnSet(weekdayKey, val), ModBus.sendWriteDayCal(opts.day), ModBus.refreshBarRanges(that, val)
                    }
                }), dialog.show({
                    view: viewBtn
                })
            })
        }
        UI.smartphone() ? (this.viewBarWrp = Ti.UI.createView({
            bottom: 0,
            width: "100%",
            height: 36
        }), this.viewCnt.add(this.viewBarWrp), this.viewBarScroll = Ti.UI.createScrollView({
            width: "100%",
            height: 36,
            scrollingEnabled: !0,
            scrollType: "horizontal",
            showHorizontalScrollIndicator: !0,
            showVerticalScrollIndicator: !1,
            verticalBounce: !1,
            backgroundColor: "#EBE8E8",
            color: "#000000",
            tintColor: "#000000"
        }), this.viewBarWrp.add(this.viewBarScroll), this.viewBarCnt = Ti.UI.createView({
            bottom: 6,
            width: 640,
            height: 30
        }), this.viewBarScroll.add(this.viewBarCnt), this.viewBarFadeL = Ti.UI.createView({
            top: 0,
            left: 0,
            width: 10,
            height: "100%",
            touchEnabled: !1,
            backgroundGradient: {
                colors: ["#EBE8E8", "#00EBE8E8"],
                startPoint: {
                    x: 0,
                    y: 0
                },
                endPoint: {
                    x: "100%",
                    y: 0
                }
            }
        }), this.viewBarWrp.add(this.viewBarFadeL), this.viewBarFadeR = Ti.UI.createView({
            top: 0,
            right: 0,
            width: 10,
            height: "100%",
            touchEnabled: !1,
            backgroundGradient: {
                colors: ["#00EBE8E8", "#EBE8E8"],
                startPoint: {
                    x: 0,
                    y: 0
                },
                endPoint: {
                    x: "100%",
                    y: 0
                }
            }
        }), this.viewBarWrp.add(this.viewBarFadeR)) : (this.viewBarCnt = Ti.UI.createView({
            bottom: 0,
            width: "100%",
            height: 30
        }), this.viewCnt.add(this.viewBarCnt)), this.viewBar = Ti.UI.createView({
            bottom: 20,
            width: "100%",
            height: 10,
            backgroundColor: "#9D9D9D"
        }), this.viewBarCnt.add(this.viewBar), this.intervals = [];
        for (var space = 100 / 24, i = 0; 24 >= i; i++)
            if (0 != i && 24 != i) {
                var left = _Mathround(space * i),

                    line = Ti.UI.createView({
                        width: 1,
                        height: 5,
                        bottom: 15,
                        left: left + "%",
                        backgroundColor: "#9D9D9D"
                    });

                this.viewBarCnt.add(line);
            }


        for (var i = 0; 24 >= i; i++)
            if (0 < i % 2) {
                var
                    left = _Mathround(space * i) - 3,

                    line = Ti.UI.createLabel({
                        width: "6%",
                        height: 15,
                        bottom: 0,
                        left: left + "%",
                        color: "#9D9D9D",
                        font: {
                            fontSize: 11,
                            fontWeight: "bold"
                        },

                        text: ("0" + i).substr(-2) + ":00",
                        textAlign: "center"
                    });

                this.viewBarCnt.add(line);
            }


        this.disableBar(),

            opts.into &&
            opts.into.add(this.viewCnt);

    }
    var Bytes = require("sodium/library/bytes"),
        Cfg = require("bp-cfg"),
        UI = require("bp-ui"),
        IO = require("bp-io");
    console.log("IO@modbus_1 = " + IO);
    var ModBus = {
        debugBuffer: function(lbl, buff) {
            for (var log = [], i = 0, len = buff.length; i < len; i++) log.push(i + ":" + ("0" + buff[i].toString(16)).substr(-2));
            console.warn("[Buffer]", lbl, {
                length: buff.length,
                bytes: log.join(" ")
            })
        },
        isModBus: function() {
            var config = Cfg.loadConfiguration(),
                isModBus = !!(config && config.modbus);
            return isModBus
        },
        buildMessage: function(type, pdu, HB, LB) {
            pdu = pdu || 0, HB = HB || 0, LB = LB || 0;
            var buffPDU = Ti.createBuffer({
                    byteOrder: Ti.Codec.BIG_ENDIAN,
                    type: Ti.Codec.TYPE_SHORT,
                    value: pdu
                }),
                msg = [buffPDU[0], buffPDU[1], HB, LB],
                numOn = Bytes.countBytesOnBits(msg) + (1 == type ? 1 : 0),
                p = 0 == numOn % 2 ? 0 : 1,
                typeByte = parseInt(p + (1 == type ? "0010000" : "0000000"), 2);
            msg.unshift(typeByte);
            var IO = require("bp-io"),
                crc = IO.calcCRCBytes(msg),
                buff = Ti.createBuffer({
                    length: 7
                });
            return buff[0] = typeByte, buff[1] = buffPDU[0], buff[2] = buffPDU[1], buff[3] = HB, buff[4] = LB, buff[5] = crc[0], buff[6] = crc[1], buff
        },
        readMessage: function(buff) {
            this.debugBuffer("[ModBus] <<< Response", buff);
            for (var bytes = [], buffString = "", i = 0, len = buff.length; i < len; i++) bytes[i] = buff[i], buffString += buff[i].toString() + " ";
            global.debugTxRxData && (console.log("Data received (MODBUS): " + buffString + "   Len: " + buff.length), Ti.App.fireEvent("ShowLogVisivo", {
                text: buffString
            }));
            var dataId = Ti.Codec.decodeNumber({
                    source: buff,
                    position: 1,
                    type: Ti.Codec.TYPE_SHORT,
                    byteOrder: Ti.Codec.BIG_ENDIAN
                }),
                IO = require("bp-io"),
                res = {
                    bytes: bytes,
                    type: IO.getMessageType(bytes[0]),
                    dataId: dataId,
                    data: [bytes[3], bytes[4]]
                },
                messageCRC = [bytes[5], bytes[6]],
                checkCRC = IO.calcCRCBytes(bytes, !0),
                bitsNum = Bytes.countBytesOnBits(bytes.slice(0, 5));
            return res.validCRC = checkCRC[0] == messageCRC[0] && checkCRC[1] == messageCRC[1], res.validBits = 0 == bitsNum % 2, res.validType = "100" == res.type || "101" == res.type || "000" == res.type || "001" == res.type, res.write = "001" == res.type || "101" == res.type, res.action = IO.getMessageTypeAction(res.type), res.valid = res.validCRC && res.validBits, global.debugTxRxData && (res.valid ? console.log("Data received (MODBUS): PDU " + res.dataId + " ===>   " + bytes[3] + " / " + bytes[4] + "  ==> " + (256 * bytes[3] + bytes[4])) : console.error("Data received (MODBUS): PDU " + res.dataId + " ===>   " + bytes[3] + " / " + bytes[4] + "  <<< ERR")), res.valid || console.error("[ModBus] Check: ", {
                PDU: dataId,
                CRC: res.validCRC + " (" + checkCRC[0].toString(16) + ", " + checkCRC[1].toString(16) + ")",
                Bits: +res.validBits,
                Type: +res.validType + " (" + res.action + ")"
            }), res
        },
        calBars: [],
        createCalBar: function(opts) {
            var bar = new CalBar(opts);
            return this.calBars.push(bar), bar
        },
        calendarsData: [
            [],
            [],
            [],
            []
        ],
        getCalendarRange: function(cal, f) {
            return this.calendarsData[cal - 1][f - 1] || (this.calendarsData[cal - 1][f - 1] = {
                on: 0,
                off: 0
            }), this.calendarsData[cal - 1][f - 1]
        },
        updateCalBarRange: function(cal, f, type, val) {
            var range = this.getCalendarRange(cal, f);
            range[type] = val, this.calBars.forEach(function(bar) {
                bar.cal == cal && bar.setRange(f, range)
            })
        },
        refreshBarRanges: function(bar, cal) {
            bar.cal = cal, 0 < cal && bar.setRanges(this.calendarsData[cal - 1])
        },
        getCalendarsConfig: function() {
            var config = Cfg.loadConfiguration();
            return config && config.calendars ? config.calendars : {}
        },
        getCalConfigKey: function(cal, fase, type) {
            return "cal" + cal + "-f" + fase + "-" + type
        },
        getCalConfig: function(cal, fase, type) {
            var key = this.getCalConfigKey(cal, fase, type),
                calendars = this.getCalendarsConfig();
            return calendars[key] || !1
        },
        sendReadActiveCalendar: function() {
            var day = (7 + new Date().getDay() - 1) % 7 + 1;
            Cfg.sendMessage("weekday-" + day + "-cal")
        },
        sendReadCalendar: function(calNum) {
            var calendars = this.getCalendarsConfig(),
                viewMapUpdate = [];
            for (var key in calendars)
                if (parseInt(key[3], 10) == calNum) {
                    var cal = calendars[key],
                        item = key.replace(/^[^-]+-/, "");
                    viewMapUpdate.push({
                        pdu: cal.pdu,
                        action: "read",
                        view: [{
                            item: item,
                            return: ["time"]
                        }]
                    })
                } for (var key in Cfg.setCustomViewMapUpdate(viewMapUpdate), calendars)
                if (parseInt(key[3], 10) == calNum) {
                    var cal = calendars[key];
                    Cfg.sendCustomMessage(!1, cal.pdu, 0, 0, key)
                }
        },
        sendReadCalendars: function(day) {
            var calendars = this.getCalendarsConfig(),
                viewMapUpdate = [];
            for (var key in calendars) {
                var cal = calendars[key];
                viewMapUpdate.push({
                    pdu: cal.pdu,
                    action: "read",
                    view: [{
                        item: key,
                        return: ["time"]
                    }]
                })
            }
            for (var key in Cfg.setCustomViewMapUpdate(viewMapUpdate), calendars) {
                var cal = calendars[key];
                Cfg.sendCustomMessage(!1, cal.pdu, 0, 0, key)
            }
        },
        sendWriteDayCal: function(day) {
            Cfg.sendMessage("weekday-" + day + "-cal")
        },
        sendWriteCalPhase: function(cal, fase, type, value) {
            var config = this.getCalConfig(cal, fase, type);
            if (config) {
                value = this.parseTime(value);
                var write = !0,
                    msgId = config.pdu,
                    commandType = this.getCalConfigKey(cal, fase, type),
                    data = Cfg.formatData([
                        ["time", value]
                    ]);
                return Cfg.log("[Cal Command] Type: " + commandType + " - Value: " + value + " - Data: " + data[0].toString(16) + " : " + data[1].toString(16)), Cfg.sendCustomMessage(!0, msgId, data[0], data[1], commandType), !0
            }
            return !1
        },
        parseTime: function(time) {
            if (time instanceof Date) return 60 * time.getHours() + time.getMinutes();
            if ("number" == typeof time) return time;
            if ("string" == typeof time) {
                var parts = time.split(":");
                return 60 * parseInt(parts[0], 10) + parseInt(parts[1], 10)
            }
            return 0
        }
    };




    return CalBar.prototype = {
        disableBar: function() {
            this.viewBarCnt.opacity = .3
        },
        enableBar: function() {
            this.viewBarCnt.opacity = 1
        },
        removeAllRanges: function() {
            this.intervals.forEach(function(range) {
                range.view.parent.remove(range.view)
            }), this.intervals = []
        },
        setRange: function(pos, newRange) {
            var actRange = this.intervals[pos];
            if (!newRange || !("on" in newRange) || !("off" in newRange)) return !1;
            if (!(actRange && actRange.on == newRange.on && actRange.off == newRange.off)) {
                var hsize = 100 / 24,
                    range = {};
                range.on = ModBus.parseTime(newRange.on || 0), range.off = ModBus.parseTime(newRange.off || 0);
                var width = (range.off - range.on) / 60 * hsize;
                width = _Mathround(width);
                var left = range.on / 60 * hsize;
                if (left = _Mathround(left), actRange) var view = actRange.view;
                else {
                    var view = Ti.UI.createView({
                        width: width + "%",
                        top: 0,
                        left: left + "%",
                        backgroundColor: "#EE401C"
                    });
                    this.viewBar.add(view)
                }
                0 < width ? view.applyProperties({
                    left: left + "%",
                    width: width + "%",
                    visible: !0
                }) : view.applyProperties({
                    visible: !1
                }), range.view = view, this.intervals[pos] = range, this.enableBar()
            }
        },
        setRanges: function(list) {
            if (this.removeAllRanges(), void 0 !== list && null !== list)
                for (var i = 0; 4 > i; i++) this.setRange(i, list[i])
        }
    }, ModBus;

}();