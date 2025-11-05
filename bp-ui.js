module.exports = function() {
    var _Mathround =




        Math.round,
        _Mathmax = Math.max,
        _Mathmin = Math.min,
        $sod = require("sodium/sodium"),
        eh = require("sodium/library/event-handlers"),
        Cfg = require("bp-cfg"),
        ANDR = !0,
        screenWidth = _Mathmin(Ti.Platform.displayCaps.platformWidth, Ti.Platform.displayCaps.platformHeight),
        screenHeight = _Mathmax(Ti.Platform.displayCaps.platformWidth, Ti.Platform.displayCaps.platformHeight),
        dpiRatio = 160 / Ti.Platform.displayCaps.dpi;
    ANDR && (screenWidth = _Mathround(screenWidth * dpiRatio),
        screenHeight = _Mathround(screenHeight * dpiRatio));


    var UI = {
        android: function() {
            return !0;
        },
        language: function() {
            return Titanium.Locale.currentLanguage;
        },
        screenWidth: function() {


            return console.warn("screenWidth", screenWidth), screenWidth;
        },
        screenHeight: function() {
            return screenHeight;
        },

        formatNumber: function(t, dec) {
            return $sod.N.format(t, dec || 0, ".", "");
        },
        formatTemp: function(t, dec) {
            return $sod.N.format(t, dec || 0, ".", "") + "\xB0";
        },
        formatPress: function(t, dec) {
            return $sod.N.format(t, dec || 0, ".", "") + " bar";
        },
        formatTime: function(sec) {
            return $sod.D.formatDaySeconds(sec, "H:i");
        },
        formatTime2: function(sec) {
            return $sod.D.formatDaySeconds(sec, "H") + "h " + $sod.D.formatDaySeconds(sec, "i") + "m";
        },
        ext: function(o1) {
            o1 = o1 || {};

            for (var
                    o2, j = 1, len = arguments.length; j < len; j++)

                if (o2 = arguments[j], o2)
                    for (var i in o2)
                        o2[i] && o2[i].constructor && o2[i].constructor === Object ? (
                            o1[i] = o1[i] || {},

                            arguments.callee(o1[i], o2[i])) :


                        o1[i] = o2[i];




            return o1;
        },
        isValue: function(value, check) {
            return (
                value instanceof Array ?
                -1 < value.indexOf(check) :


                value == check);
        },
        touch: function(view, optsA, optsN) {




            if (optsA && view.addEventListener("touchstart", function(e) {
                    "function" == typeof optsA ? optsA.call(view, arguments) : view.applyProperties(optsA)
                }), optsN) {
                var atEnd = function(e) {
                    "function" == typeof optsN ?
                        optsN.call(view, arguments) :


                        view.applyProperties(optsN);

                };

                view.addEventListener("touchend", atEnd),
                    view.addEventListener("touchcancel", atEnd);
            }
        },
        goBack: function(to) {
            Ti.App.fireEvent("closeScreen", {
                to: to
            });

        },
        showManual: function(page, force) {
            Ti.App.fireEvent("showManual", {
                force: force,
                page: page
            });

        },

        createFieldRow: function(opts) {
            var
                margin = UI.margin(),

                attrs = {
                    left: margin,
                    right: margin,
                    top: UI.calcp(10, 20),
                    height: Ti.UI.SIZE,
                    layout: "horizontal",
                    clipMode: ANDR ? null : Titanium.UI.iOS.CLIP_MODE_DISABLED
                };


            UI.ext(attrs, opts.attrs);
            var

                viewCnt = Ti.UI.createView(attrs),


                lblAttrs = {
                    top: 0,
                    width: UI.calcp("100%", 244),
                    height: UI.calcp(24, 32, Ti.UI.SIZE),
                    textAlign: "left",
                    text: opts.text || "",
                    font: {
                        fontSize: 16
                    }
                };



            UI.ext(lblAttrs, UI.labelAttrs, opts.labelAttrs);

            var viewLabel = Ti.UI.createLabel(lblAttrs);
            viewCnt.add(viewLabel);
            var

                fieldAttrs = {
                    left: UI.calcp(0, 32),
                    width: UI.calcp(opts.help ? 214 : 260, 244),
                    height: UI.calcp(32, 32, Ti.UI.SIZE),
                    paddingLeft: 12,
                    paddingRight: 12,
                    autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
                    autocorrect: !1,
                    value: "",
                    backgroundImage: "/field.png",
                    color: "#000000",
                    font: {
                        fontSize: 16
                    }
                },



                isSelect = "datetime" == opts.type || "select" == opts.type || opts.options;

            isSelect && (
                    fieldAttrs.editable = !1,
                    fieldAttrs.color = "#666666",
                    fieldAttrs.font = {
                        fontSize: 13
                    },


                    ANDR && (
                        fieldAttrs.height = UI.calcp(32, 32),
                        fieldAttrs.backgroundImage = "/select-bg.png")),



                UI.ext(fieldAttrs, opts.fieldAttrs);

            var picker,
                viewField;

            if ("datetime" == opts.type) {
                var FormPicker = require("sodium/class/FormPicker");

                picker = new FormPicker({
                    type: "datetime",
                    attrs: fieldAttrs,
                    into: viewCnt
                });

            } else




            {
                if (ANDR && isSelect)
                    fieldAttrs.textAlign = "center",

                    viewField = Ti.UI.createLabel(fieldAttrs);
                else

                {
                    var $ = Alloy.Globals.index;
                    viewField = $.UI.create("TextField", {
                            classes: "field_input field_input_select",
                            backgroundColor: "transparent",
                            includeFontPadding: !1,
                            autocapitalization: !1,
                            autocorrect: !1,
                            hintTextColor: "#999999",
                            borderStyle: Ti.UI.INPUT_BORDERSTYLE_NONE,
                            padding: {
                                top: 0,
                                bottom: 0,
                                left: 0,
                                right: 0
                            }
                        }),


                        viewField.applyProperties(fieldAttrs);
                }


                viewCnt.add(viewField),

                    opts.click &&
                    viewField.addEventListener("click", opts.click),


                    opts.submit &&
                    viewField.addEventListener("return", opts.submit);

            }


            if (isSelect && !ANDR) {
                var selectArr = Ti.UI.createView({
                    width: 16,
                    height: 9,
                    right: 14,
                    top: 13,
                    backgroundImage: "/select-arr.png"
                });


                (viewField || picker.view).add(selectArr);
            }




            if (fieldAttrs.passwordMask) {
                var viewShowPwd = Ti.UI.createImageView({
                    image: "/pwd_eye.png",
                    width: 32,
                    height: 32,
                    zIndex: 2,
                    left: -72
                });

                UI.isTablet() && (
                        viewShowPwd.left = -96), !1,




                    viewCnt.add(viewShowPwd),

                    UI.touch(viewShowPwd, function() {
                        viewShowPwd.opacity = .5,
                            viewField.passwordMask = !1;

                    }, function() {
                        viewShowPwd.opacity = 1,
                            viewField.passwordMask = !0;

                    });
            }

            var viewHelp;

            if (opts.help) {
                var helpAttrs = {
                    left: UI.calcp(10, 32),
                    top: -2,
                    zIndex: 20,
                    width: 36,
                    height: 36,
                    clipMode: ANDR ? null : Titanium.UI.iOS.CLIP_MODE_DISABLED
                };


                UI.ext(helpAttrs, opts.helpAttrs);

                var viewHelp = Ti.UI.createView(helpAttrs);
                viewCnt.add(viewHelp);

                var viewHelpBox = Ti.UI.createView({
                    right: -20,
                    top: 18,
                    width: 433,
                    height: 84,
                    backgroundImage: "/help-box.png"
                });

                viewHelp.add(viewHelpBox),
                    viewHelpBox.hide(),
                    viewHelpBox.addEventListener("click", function() {
                        viewCnt.zIndex = 1,
                            viewHelpBox.hide();
                    });

                var viewHelpText = Ti.UI.createLabel({
                    left: 10,
                    right: 10,
                    top: 25,
                    bottom: 10,
                    font: {
                        fontSize: 13
                    },

                    color: "#FFFFFF",
                    textAlign: "center",
                    text: opts.help
                });

                viewHelpBox.add(viewHelpText);

                var viewHelpIcon = Ti.UI.createView({
                    left: 0,
                    top: 0,
                    width: 36,
                    height: 36,
                    backgroundImage: "/help-icon.png"
                });

                viewHelp.add(viewHelpIcon),
                    viewHelpIcon.addEventListener("click", function() {
                        viewHelpBox.visible ? (
                            viewCnt.zIndex = 1,
                            viewHelpBox.hide()) : (


                            viewCnt.zIndex = 20,
                            viewHelpBox.show());

                    });
            }

            var viewInfo;

            if (opts.info) {
                var lblInfo = {
                    left: UI.calcp(0, 268),
                    right: 0,
                    height: Ti.UI.SIZE,
                    textAlign: "left",
                    text: opts.info,
                    font: {
                        fontSize: 13
                    },

                    color: UI.textcolor
                };


                UI.smartphone() && (
                        lblInfo.width = "100%"),


                    UI.ext(lblInfo, opts.infoAttrs);

                var viewInfo = Ti.UI.createLabel(lblInfo);
                viewCnt.add(viewInfo);
            }




            return opts.into && opts.into.add(viewCnt), {
                viewCnt: viewCnt,
                viewLabel: viewLabel,
                viewInfo: viewInfo,
                viewField: viewField,
                picker: picker,
                options: opts.options,
                getValue: function() {
                    return (
                        this.picker ?
                        this.picker.value() :


                        viewField.__value || viewField.value);
                },
                setValue: function(val) {
                    return (
                        this.picker ?
                        this.picker.value(val) : void(


                            this.options && (
                                viewField.__value = val,

                                this.options.forEach(function(row) {
                                    "string" != typeof row &&
                                        row.label && row.value == val && (
                                            val = row.label);


                                })),


                            viewField.value = val,
                            viewField.text = val));
                },
                blur: function() {
                    this.picker ?
                        this.picker.blur() :


                        this.viewField.blur();

                }
            };

        },

        scanQRFromCamera: function(view) {
            var
                qrreader = require("com.acktie.mobile.ios.qr"),

                qrCodeWindow = Titanium.UI.createWindow({
                    navBarHidden: !0,
                    exitOnClose: !1,
                    backgroundColor: "black",
                    width: "100%",
                    height: "100%"
                }),


                qrCodeView = qrreader.createQRCodeView({
                    backgroundColor: "black",
                    width: "100%",
                    height: "90%",
                    top: 0,
                    left: 0,
                    success: function(e) {
                        null != e && null != e.data && (
                            Titanium.Media.vibrate(),

                            view.value = e.data,

                            closeQRreader());

                    },
                    cancel: function() {

                    }
                }),


                closeButton = Titanium.UI.createButton({
                    title: "close",
                    bottom: 0,
                    left: 0
                }),

                lightToggle = Ti.UI.createSwitch({
                    value: !1,
                    bottom: 0,
                    right: 0
                }),


                closeQRreader = function() {
                    qrCodeView.stop(),
                        qrCodeWindow.close();
                };

            closeButton.addEventListener("click", closeQRreader),

                lightToggle.addEventListener("change", function(event) {
                    event.value ?
                        qrCodeView.turnLightOn() :


                        qrCodeView.turnLightOff();

                }),

                qrCodeWindow.add(qrCodeView),
                qrCodeWindow.add(closeButton),
                qrCodeWindow.add(lightToggle),

                qrCodeWindow.open({
                    modal: !0
                });

        },

        createOffset: function(opts) {
            var
                defAttrs = ["top", "left", "bottom", "right", "width", "height"],
                cntAttrs = {
                    width: Ti.UI.SIZE,
                    height: Ti.UI.SIZE
                };


            defAttrs.forEach(function(key) {
                key in opts && (
                    cntAttrs[key] = opts[key]);

            });

            var viewCnt = Ti.UI.createView(cntAttrs);




            return opts.into && opts.into.add(viewCnt), viewCnt;
        },

        fixDpi: function(val) {
            return _Mathround(val * dpiRatio);
        },
        screenWidth: function() {
            return screenWidth;
        },
        isTablet: function() {
            var isTablet = 2 < Titanium.Platform.Android.physicalSizeCategory;

            return isTablet;
        },
        smartphone: function() {
            return !this.isTablet();
        },
        calcp: function(sp, tb, an) {
            if (ANDR && an)
                return an;


            if (this.smartphone())
                return sp;


            if (ANDR) {
                var tba = _Mathround(tb * (this.screenWidth() / 768));




                return sp, tba;
            }

            return tb;
        },
        margin: function() {
            return UI.calcp(30, 90);
        },

        inputReturnBlur: function(input) {
            input.addEventListener("return", function() {
                input.blur();
            });
        },
        inputBlur: function(input) {
            input.blur && "function" == typeof input.blur &&
                input.blur();

        },

        textcolor: "#4C4C4C",
        color1: "#EF4123",
        color1_10: "rgba(239, 65, 35, 0.1)",
        color1_25: "rgba(239, 65, 35, 0.25)",
        color1_50: "rgba(239, 65, 35, 0.5)",
        color2: "#00A4D7"
    };




    return UI.loadingBgColor = "#E6FFFFFF", UI.loadingBgColor2 = "#80FFFFFF", UI.shadowColor = "#4D000000", UI.labelAttrs = {
        color: UI.textcolor,
        font: {
            fontFamily: "HelveticaNeue-Light"
        },
        shadowColor: UI.shadowColor,
        shadowOffset: {
            x: 0,
            y: 1
        }
    }, UI.ItemsCollection = function(opts) {
        this._uid = 0, this.items = {}
    }, UI.ItemsCollection.prototype = {
        add: function(item) {
            return item instanceof UI.Item || (item = UI.createItem(item)), item.id || (this._uid++, item.id = "item" + this._uid), this.items[item.id] = item, item
        },
        setInit: function(id, init) {
            var item = this.items[id];
            item && item.setInit(init)
        },
        setResponse: function(id, val, ret, bypassValue) {
            var item = this.items[id];
            item && item.setResponse(val, ret, bypassValue)
        },
        setReturn: function(id, ret) {
            var item = this.items[id];
            item && item.setReturn(ret)
        },
        setReturnSet: function(id, ret) {
            var item = this.items[id];
            item && item.setReturnSet(ret)
        },
        getReturn: function(id) {
            var item = this.items[id];
            return item ? item.getReturn() : null
        },
        getReturnSet: function(id) {
            var item = this.items[id];
            return item ? item.getReturnSet() : null
        },
        resetAll: function() {
            for (var i in this.items) this.items[i].reset()
        },
        setValue: function(id, value) {
            var item = this.items[id];
            item && item.setValue(value)
        },
        setItemsValue: function(items, value) {
            for (var i = 0, len = items.length; i < len; i++) {
                var id = items[i],
                    item = this.items[id];
                item && item.setValue(value)
            }
        }
    }, UI.createItemsCollection = function(opts) {
        return new UI.ItemsCollection(opts)
    }, UI.Item = function(opts) {
        var that = this;
        this.type = opts.type, this.icon = opts.icon || "default", this.level = opts.level || !1, this.blinkoffVisible = opts.blinkoffVisible, this.setInit(opts.init);
        var defAttrs = ["top", "left", "bottom", "right", "width", "height", "zIndex"],
            cntAttrs = {};
        switch (defAttrs.forEach(function(key) {
                key in opts && (cntAttrs[key] = opts[key])
            }), this.type) {
            case "proxy":
                break;
            case "output":
                var size = UI.calcp(80, 90),
                    attrs = {
                        width: Ti.UI.SIZE,
                        height: size
                    };
                UI.ext(attrs, cntAttrs), UI.ext(attrs, opts.attrs), this.viewCnt = Ti.UI.createView(attrs), this.viewButton = Ti.UI.createView({
                    left: "r" == opts.align ? null : 0,
                    right: "r" == opts.align ? 0 : null,
                    top: 0,
                    width: size,
                    height: size,
                    backgroundImage: "/button-bg-d.png"
                }), this.viewCnt.add(this.viewButton), this.viewButtonForm = Ti.UI.createView({
                    left: 0,
                    top: 0,
                    width: size,
                    height: size,
                    backgroundImage: "/button-bg-f.png"
                }), this.viewButton.add(this.viewButtonForm), this.viewStatus = Ti.UI.createView({
                    left: 0,
                    top: 0,
                    width: size,
                    height: size,
                    backgroundImage: "/button-ledm-r.png"
                }), this.viewStatus.hide(), this.viewButton.add(this.viewStatus), this.viewBlinkLed = Ti.UI.createView({
                    left: 0,
                    top: 0,
                    width: size,
                    height: size,
                    backgroundImage: "/button-ledm-y.png"
                }), this.viewBlinkLed.hide(), this.viewButton.add(this.viewBlinkLed), this.viewBlink = this.viewBlinkLed, this.viewIcon = Ti.UI.createView({
                    width: 56,
                    height: 56,
                    backgroundImage: this.getIconUrl()
                }), this.viewButton.add(this.viewIcon), opts.level && (this.viewLevel = Ti.UI.createView({
                    left: 0,
                    bottom: 0,
                    width: size,
                    height: size
                }), this.viewButton.add(this.viewLevel)), opts.noReturn || (this.viewReturn = Ti.UI.createLabel({
                    left: "r" == opts.align ? null : size + 10,
                    right: "r" == opts.align ? size + 10 : null,
                    top: UI.calcp(null, 12),
                    width: Ti.UI.SIZE,
                    text: "",
                    color: UI.textcolor,
                    font: {
                        fontFamily: "HelveticaNeue-UltraLight",
                        fontSize: UI.calcp(28, 40)
                    },
                    shadowColor: UI.shadowColor,
                    shadowOffset: {
                        x: 0,
                        y: 1
                    }
                }), this.viewCnt.add(this.viewReturn)), "text" in opts && (this.viewLabel = Ti.UI.createLabel({
                    left: "r" == opts.align ? null : size + 10,
                    right: "r" == opts.align ? size + 10 : null,
                    bottom: UI.calcp(6, 12),
                    height: UI.calcp(null, 20, Ti.UI.SIZE),
                    width: Ti.UI.SIZE,
                    text: opts.text || "",
                    color: UI.textcolor,
                    font: {
                        fontFamily: "HelveticaNeue-Light",
                        fontSize: UI.calcp(14, 16)
                    },
                    shadowColor: UI.shadowColor,
                    shadowOffset: {
                        x: 0,
                        y: 1
                    }
                }), this.viewCnt.add(this.viewLabel)), "function" == typeof opts.click && (this.viewSet = Ti.UI.createView({
                    right: 2,
                    bottom: 2,
                    width: 32,
                    height: 32,
                    backgroundImage: "/button-set-n.png"
                }), this.viewButton.add(this.viewSet), this.viewSet.addEventListener("click", function(e) {
                    opts.click.call(that, e)
                }), UI.touch(this.viewSet, {
                    backgroundImage: "/button-set-a.png"
                }, {
                    backgroundImage: "/button-set-n.png"
                }));
                break;
            case "incrementer":
                var attrs = {
                    width: Ti.UI.SIZE,
                    width: 260,
                    height: 160
                };
                UI.ext(attrs, cntAttrs), UI.ext(attrs, opts.attrs), this.viewCnt = Ti.UI.createView(attrs), this.viewLabel = Ti.UI.createLabel({
                    top: 0,
                    width: Ti.UI.SIZE,
                    text: opts.text || "",
                    color: UI.textcolor,
                    font: {
                        fontFamily: "HelveticaNeue-Light",
                        fontSize: 16
                    },
                    textAlign: "center",
                    shadowColor: UI.shadowColor,
                    shadowOffset: {
                        x: 0,
                        y: 1
                    }
                }), this.viewCnt.add(this.viewLabel), this.viewReturn = Ti.UI.createLabel({
                    width: Ti.UI.SIZE,
                    text: "",
                    color: UI.textcolor,
                    font: {
                        fontFamily: "HelveticaNeue-UltraLight",
                        fontSize: 40
                    },
                    shadowColor: UI.shadowColor,
                    shadowOffset: {
                        x: 0,
                        y: 1
                    }
                }), this.viewCnt.add(this.viewReturn);
                var FormIncrementer = require("sodium/class/FormIncrementer");
                this.incrementer = new FormIncrementer({
                    min: this.min || 0,
                    max: this.max || 100,
                    step: this.step || 1,
                    handlerOnly: !0,
                    update: function() {
                        that.setReturn(this.value())
                    },
                    check: this.check
                }), this.viewPrev = Ti.UI.createView({
                    left: 0,
                    width: 44,
                    height: 44,
                    backgroundImage: "/button-min-a.png"
                }), this.viewCnt.add(this.viewPrev), UI.touch(this.viewPrev, function() {
                    that.viewPrev.backgroundImage = "/button-min-n.png", global.debugTxRx && console.log("Decremento"), that.incrementer.value(that.getReturn(), !0), that.incrementer.startDecrement()
                }, function() {
                    that.viewPrev.backgroundImage = "/button-min-a.png", that.incrementer.stop()
                }), this.viewNext = Ti.UI.createView({
                    right: 0,
                    width: 44,
                    height: 44,
                    backgroundImage: "/button-set-a.png"
                }), this.viewCnt.add(this.viewNext), UI.touch(this.viewNext, function() {
                    that.viewNext.backgroundImage = "/button-set-n.png", global.debugTxRx && console.log("Incremento"), that.incrementer.value(that.getReturn(), !0), that.incrementer.startIncrement()
                }, function() {
                    that.viewNext.backgroundImage = "/button-set-a.png", that.incrementer.stop()
                }), "function" == typeof opts.confirm && (this.viewSet = Ti.UI.createView({
                    left: "60%",
                    bottom: 0,
                    width: 38,
                    height: 38,
                    backgroundImage: "/button-chk-a.png"
                }), this.viewCnt.add(this.viewSet), this.viewSet.addEventListener("click", function(e) {
                    opts.confirm.call(that, e)
                }), UI.touch(this.viewSet, {
                    backgroundImage: "/button-chk-n.png"
                }, {
                    backgroundImage: "/button-chk-a.png"
                })), "function" == typeof opts.cancel && (this.viewSet = Ti.UI.createView({
                    right: "60%",
                    bottom: 0,
                    width: 38,
                    height: 38,
                    backgroundImage: "/button-del-n.png"
                }), this.viewCnt.add(this.viewSet), this.viewSet.addEventListener("click", function(e) {
                    opts.cancel.call(that, e)
                }), UI.touch(this.viewSet, {
                    backgroundImage: "/button-del-a.png"
                }, {
                    backgroundImage: "/button-del-n.png"
                }));
                break;
            case "hr":
                var margin = UI.margin();
                if (ANDR) var attrs = {
                    left: margin,
                    right: margin,
                    height: 1,
                    backgroundColor: "#CCCCCC"
                };
                else var attrs = {
                    left: margin,
                    right: margin,
                    height: 4,
                    backgroundImage: "/hr.png"
                };
                UI.ext(attrs, cntAttrs), UI.ext(attrs, opts.attrs), this.viewCnt = Ti.UI.createView(attrs);
                break;
            case "hr-v":
                if (ANDR) var attrs = {
                    width: 1,
                    height: 40,
                    backgroundColor: "#CCCCCC"
                };
                else var attrs = {
                    width: 4,
                    height: 40,
                    backgroundImage: "/hr-v.png"
                };
                UI.ext(attrs, cntAttrs), UI.ext(attrs, opts.attrs), this.viewCnt = Ti.UI.createView(attrs);
                break;
            case "help":
                var availLangs = ["it", "en"],
                    lang = (Ti.Locale.currentLanguage || "").split(/[-_]/).shift().toLowerCase();
                0 > availLangs.indexOf(lang) && (lang = "en");
                var attrs = {
                    url: "app/assets/wizard/" + opts.help + "-" + lang + ".html",
                    backgroundColor: "transparent"
                };
                UI.ext(attrs, cntAttrs), UI.ext(attrs, opts.attrs), this.viewCnt = Ti.UI.createWebView(attrs), attrs.height || (this.viewCnt.height = 0, this.viewCnt.addEventListener("load", function() {
                    var h = this.evalJS("Math.max(document.height, document.body.offsetHeight)");
                    this.height = h
                }));
                break;
            case "label":
                var labelAttrs = {
                    text: opts.text || "",
                    height: Ti.UI.SIZE
                };
                UI.ext(labelAttrs, cntAttrs, UI.labelAttrs, opts.attrs, opts.labelAttrs), this.viewLabel = Ti.UI.createLabel(labelAttrs), this.viewCnt = this.viewLabel;
                break;
            case "title":
                var labelAttrs = {},
                    locAttrs = {
                        text: opts.text || "",
                        height: Ti.UI.SIZE,
                        font: {
                            fontFamily: "HelveticaNeue-UltraLight",
                            fontSize: UI.calcp(64, 64)
                        }
                    };
                UI.ext(labelAttrs, cntAttrs), UI.ext(labelAttrs, UI.labelAttrs), UI.ext(labelAttrs, locAttrs), UI.ext(labelAttrs, opts.labelAttrs), this.viewLabel = Ti.UI.createLabel(labelAttrs), this.viewCnt = this.viewLabel;
                break;
            case "status":
                var attrs = {
                    height: Ti.UI.SIZE,
                    layout: "vertical"
                };
                UI.ext(attrs, cntAttrs), UI.ext(attrs, opts.attrs), this.viewCnt = Ti.UI.createView(attrs), this.viewLabel1 = Ti.UI.createLabel({
                    top: 0,
                    width: Ti.UI.SIZE,
                    height: Ti.UI.SIZE,
                    text: opts.text1 || "",
                    textAlign: "center",
                    font: {
                        fontSize: UI.calcp(18, 20)
                    }
                }), this.viewLabel2 = Ti.UI.createLabel({
                    top: 0,
                    width: Ti.UI.SIZE,
                    height: Ti.UI.SIZE,
                    text: opts.text2 || "",
                    textAlign: "center",
                    font: {
                        fontSize: UI.calcp(14, 16)
                    }
                }), this.viewCnt.add(this.viewLabel1), this.viewCnt.add(this.viewLabel2), this.viewBlink = this.viewLabel1, this.blinkoffVisible = !0;
                break;
            case "button":
                var attrs = {
                    width: Ti.UI.SIZE,
                    height: "c" == opts.align ? 72 : 48
                };
                if (UI.ext(attrs, cntAttrs), UI.ext(attrs, opts.attrs), this.viewCnt = Ti.UI.createView(attrs), this.viewButton = Ti.UI.createView({
                        left: "r" == opts.align || "c" == opts.align ? null : 0,
                        right: "r" == opts.align && "c" != opts.align ? 0 : null,
                        top: 0,
                        width: 48,
                        height: 48,
                        backgroundImage: "/button-bg-d.png"
                    }), this.viewCnt.add(this.viewButton), this.viewStatus = Ti.UI.createView({
                        left: 0,
                        top: 0,
                        width: 48,
                        height: 48,
                        backgroundImage: "/button-led-r.png"
                    }), this.viewStatus.hide(), this.viewButton.add(this.viewStatus), this.viewBlinkLed = Ti.UI.createView({
                        left: 0,
                        top: 0,
                        width: 48,
                        height: 48,
                        backgroundImage: "/button-led-y.png"
                    }), this.viewBlinkLed.hide(), this.viewButton.add(this.viewBlinkLed), this.viewBlink = this.viewBlinkLed, this.viewButtonForm = Ti.UI.createView({
                        left: 0,
                        top: 0,
                        width: 48,
                        height: 48,
                        backgroundImage: "/button-bg-n.png"
                    }), this.viewButton.add(this.viewButtonForm), this.viewIcon = Ti.UI.createView({
                        width: 32,
                        height: 32,
                        backgroundImage: this.getIconUrl()
                    }), this.viewButton.add(this.viewIcon), opts.level && (this.viewLevel = Ti.UI.createView({
                        left: 0,
                        bottom: 0,
                        width: 48,
                        height: 48
                    }), this.viewButton.add(this.viewLevel)), "text" in opts) {
                    var labelAttrs = {
                        left: "r" == opts.align || "c" == opts.align ? null : 58,
                        right: "r" == opts.align && "c" != opts.align ? 58 : null,
                        bottom: "c" == opts.align ? 0 : null,
                        width: Ti.UI.SIZE,
                        text: opts.text || "",
                        textAlign: "r" == opts.align ? "right" : "c" == opts.align ? "center" : "left",
                        font: {
                            fontSize: UI.calcp(14, 16)
                        }
                    };
                    UI.ext(labelAttrs, UI.labelAttrs), UI.ext(labelAttrs, opts.labelAttrs), this.viewLabel = Ti.UI.createLabel(labelAttrs), this.viewCnt.add(this.viewLabel)
                }
                "function" == typeof opts.click && this.viewCnt.addEventListener("click", function(e) {
                    opts.click.call(that, e)
                }), "function" == typeof opts.longpress && this.viewCnt.addEventListener("longpress", function(e) {
                    opts.longpress.call(that, e)
                }), UI.touch(this.viewCnt, function() {
                    that.viewButtonForm.backgroundImage = "/button-bg-a.png"
                }, function() {
                    that.viewButtonForm.backgroundImage = "/button-bg-n.png"
                });
                break;
            case "iconbutton":
            case "backbutton":
            case "helpbutton":
                var attrs = {
                    width: 32,
                    height: 32
                };
                "backbutton" == this.type && (attrs.width = 48, attrs.height = 48, attrs.left = UI.calcp(0, 24), attrs.top = UI.calcp(0, 8), attrs.zIndex = 30, this.icon = "back"), "helpbutton" == this.type && (attrs.width = 48, attrs.height = 48, attrs.right = UI.calcp(0, 24), attrs.top = UI.calcp(0, 8), attrs.zIndex = 30, this.icon = "help"), attrs.backgroundImage = this.getIconUrl(), UI.ext(attrs, cntAttrs), UI.ext(attrs, opts.attrs), this.viewCnt = Ti.UI.createView(attrs), this.viewIcon = this.viewCnt, "backbutton" == this.type ? this.viewCnt.addEventListener("click", function(e) {
                    opts.click ? opts.click && opts.click.call(this, e) : UI.goBack()
                }) : "helpbutton" == this.type ? (this.viewCnt.addEventListener("click", function(e) {
                    opts.click ? opts.click && opts.click.call(this, e) : UI.showManual(opts.page)
                }), this.viewCnt.addEventListener("longpress", function(e) {
                    opts.longpress ? opts.longpress && opts.longpress.call(this, e) : UI.showManual(opts.page, !0)
                })) : "function" == typeof opts.click && this.viewCnt.addEventListener("click", opts.click), UI.touch(this.viewCnt, {
                    opacity: .5
                }, {
                    opacity: 1
                });
                break;
            case "loading":
                var attrs = {
                    width: "100%",
                    height: "100%",
                    zIndex: 300
                };
                UI.ext(attrs, cntAttrs), UI.ext(attrs, opts.attrs), this.viewCnt = Ti.UI.createView(attrs), this.viewCnt.addEventListener("longpress", function() {
                    that.hide()
                });
                var bgAttrs = {
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: "/popup-bg.png",
                    opacity: .8
                };
                UI.ext(attrs, opts.bgAttrs), this.viewBg = Ti.UI.createView(bgAttrs), this.viewCnt.add(this.viewBg);
                var labelAttrs = {
                    width: Ti.UI.SIZE,
                    text: opts.text || "",
                    font: {
                        fontSize: 20
                    }
                };
                UI.ext(labelAttrs, UI.labelAttrs), UI.ext(labelAttrs, opts.labelAttrs), this.viewLabel = Ti.UI.createLabel(labelAttrs), this.viewCnt.add(this.viewLabel), this.viewCnt.hide();
        }
        opts.build && opts.build.call(this, cntAttrs), opts.into && this.viewCnt && opts.into.add(this.viewCnt), this.id = opts.id, this._onresponse = opts.onresponse, this._oninit = opts.oninit, this._formatter = opts.formatter, this._blinkON = !1, this._blinkIV = !1, this._blinkMS = opts.blinkMS || 500, this.setInit(opts.init), this.setReturn("---")
    }, UI.Item.prototype = {
        animate: function(ani) {
            this.viewCnt && this.viewCnt.animate(ani)
        },
        show: function() {
            this.viewCnt && this.viewCnt.show(), this.viewCnt2 && this.viewCnt2.show()
        },
        hide: function() {
            this.viewCnt && this.viewCnt.hide(), this.viewCnt2 && this.viewCnt2.hide()
        },
        setText: function(text) {
            this.text = text || "", this.viewText && (this.viewText.text = this.text)
        },
        setIcon: function(icon) {
            this.icon = icon || "default", this.viewIcon && (this.viewIcon.backgroundImage = this.getIconUrl())
        },
        getFileExtension: function(filename) {
            var path = require("path"),
                ext = path.extname(filename || "").split(".");
            return ext[ext.length - 1]
        },
        getIconUrl: function() {
            return "" === this.getFileExtension(this.icon) ? (console.log("%%%%% Request of ICON no ext: /icon-" + this.icon + ".png %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"), "/icon-" + this.icon + ".png") : (console.log("%%%%% Request of ICON with ext: /icon-" + this.icon + " %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"), "/icon-" + this.icon)
        },
        setLabel: function(txt) {
            this.viewLabel && (this.viewLabel.text = txt || "")
        },
        getFormat: function() {
            return {
                format: this._format,
                decimal: this._decimal,
                prefix: this._prefix,
                suffix: this._suffix
            }
        },
        setInit: function(init) {
            init = init || {}, "return" in init || (init["return"] = "---"), "value" in init || (init.value = ["blinkoff", "off"]), init.M = init.M || 1, init.min = init.min || 0, init.max = init.max || 100, init.step = init.step || 1, init.format = init.format || "number", init.decimal = init.decimal || 0, init.prefix = init.prefix || "", init.suffix = init.suffix || "", init.check = init.check || "", this._init = init, this.M = init.M, this.min = init.min, this.max = init.max, this.step = init.step, this._format = init.format, this._decimal = init.decimal, this._prefix = init.prefix, this._suffix = init.suffix, this._check = init.check, this.incrementer && (this.incrementer.min = this.min, this.incrementer.max = this.max, this.incrementer.step = this.step), this._oninit && this._oninit(this._init)
        },
        getInit: function() {
            return this._init
        },
        reset: function() {
            this._init && (this.setValue(this._init.value), this.setReturn(this._init["return"]))
        },
        updateLevel: function() {
            var _Mathsqrt = Math.sqrt;
            if (this.viewLevel) {
                var ret = "number" == typeof this._return ? this._return : 0;
                ret /= this.M, ret = _Mathmax(this.min, _Mathmin(this.max, ret));
                var range = this.max - this.min,
                    value = ret - this.min,
                    log = value / range;
                if ("log" == this.level) var log = _Mathsqrt(value) / _Mathsqrt(range);
                var h = _Mathround(8 * log);
                this.viewLevel.backgroundImage = "/level-" + h + ".png"
            }
        },
        setReturn: function(ret, mod) {
            if (this.modifing && !mod) return !1;
            var type = typeof ret;
            if ("number" == type || "string" == type) {
                "number" == type && (ret *= this.M), this._return = ret, this._returnSet = ret;
                var retF = this.format();
                if (this.viewReturn && (this.viewReturn.text = retF), this.viewLabel1) {
                    var info = Cfg.setLabelView(this.viewLabel1, "anomalies", ret, "1");
                    Cfg.setLabelView(this.viewLabel2, "anomalies", ret, "2"), info && info.value ? this.setValue(info.value) : this.setValue(["on", "blinkoff"])
                }
                this.updateLevel()
            }
        },
        getReturn: function() {
            if ("number" == typeof this._return) {
                var ret = this._return;
                return ret /= this.M, ret
            }
            return null
        },
        setReturnSet: function(ret) {
            var type = typeof ret;
            "number" == type && (ret *= this.M, this._returnSet = ret)
        },
        getReturnSet: function() {
            if ("number" == typeof this._returnSet) {
                var ret = this._returnSet / this.M;
                return ret
            }
            return null
        },
        setResponse: function(val, ret, bypassValue) {
            this._bypassValue = bypassValue, this.setValue(val), this.setReturn(ret), this._onresponse && this._onresponse.call(this, val, ret)
        },
        format: function() {
            var ret = "",
                type = typeof this._return;
            if ("string" == type) ret = this._return;
            else switch (this._format) {
                case "time":
                    ret = this._prefix + UI.formatTime(this._return) + this._suffix;
                    break;
                case "time-m":
                    ret = this._prefix + UI.formatTime(60 * this._return) + this._suffix;
                    break;
                case "time2":
                    ret = this._prefix + UI.formatTime2(this._return) + this._suffix;
                    break;
                default:
                    ret = this._prefix + UI.formatNumber(this._return, this._decimal) + this._suffix;
            }
            if (this._formatter && (ret = this._formatter(this._return, ret, this._bypassValue)), "_check" in this && (check = this._check, check.match instanceof Array)) {
                var index = check.match.indexOf(this._return);
                checkOk = -1 < index, checkOk ? (global.debugTxRx && console.log("index found = " + index), "match-return" in check && (result = check["match-return"] instanceof Array ? check["match-return"][index] : check["match-return"], ret = result)) : ret = this._return
            }
            return ret
        },
        setValue: function(value) {
            value instanceof Array || (value = [value]);
            for (var fn, i = 0, len = value.length; i < len; i++) fn = "value_" + value[i], "function" == typeof this[fn] && this[fn]()
        },
        setStatusColor: function(color) {
            if (this.viewStatus) {
                var avail = ["r", "b", "y", "g"]; - 1 < avail.indexOf(color) && (this.viewStatus.backgroundImage = "/button-led-" + color + ".png")
            }
        },
        blink: function(on, ms) {
            if (!this.viewBlink || this._blinkIV) return !1;
            on = !!on, ms = ms || 250, on ? this.viewBlink.hide() : this.viewBlink.show();
            var that = this;
            setTimeout(function() {
                on ? that.viewBlink.show() : that.viewBlink.hide()
            }, ms)
        },
        value_on: function() {
            this.viewStatus && this.viewStatus.show()
        },
        value_off: function() {
            this.viewStatus && this.viewStatus.hide()
        },
        value_blinkon: function() {
            if (!this.viewBlink || this._blinkIV) return !1;
            var that = this;
            this._blinkON = !1, this._blinkIV = setInterval(function() {
                that._blinkON = !that._blinkON, that._blinkON ? that.viewBlink.show() : that.viewBlink.hide()
            }, this._blinkMS)
        },
        value_blinkoff: function() {
            if (this.viewBlink && this._blinkIV) {
                clearInterval(this._blinkIV), this._blinkON = !1, this._blinkIV = null;
                var that = this;
                setTimeout(function() {
                    that.blinkoffVisible ? that.viewBlink.show() : that.viewBlink.hide()
                }, 100)
            }
        },
        value_enabled: function() {
            this.viewCnt && this.viewCnt.show(), this.viewCnt2 && this.viewCnt2.show()
        },
        value_disabled: function() {
            this.viewCnt && this.viewCnt.hide(), this.viewCnt2 && this.viewCnt2.hide()
        },
        value_setenabled: function() {
            this.viewSet && this.viewSet.show()
        },
        value_setdisabled: function() {
            this.viewSet && this.viewSet.hide()
        }
    }, UI.createItem = function(opts) {
        return new UI.Item(opts)
    }, UI.Popup = function(opts) {
        opts = opts || {};
        var that = this;
        this.viewPopup = Ti.UI.createView({
            left: 0,
            top: 0,
            zIndex: 300,
            width: "100%",
            height: "100%"
        }), this.viewPopup.hide(), opts.into.add(this.viewPopup), this.viewBackground = Ti.UI.createView({
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundImage: "/popup-bg.png"
        }), opts.bgCancel && this.viewBackground.addEventListener("click", function() {
            that.fireEvent("cancel")
        }), this.viewPopup.add(this.viewBackground);
        var hasFoot = opts.cancel || opts.confirm,
            footBottom = UI.calcp(30, 64);
        this.viewCnt = Ti.UI.createView({
            left: 0,
            right: 0,
            top: 0,
            bottom: hasFoot ? footBottom + 48 : 0
        }), this.viewPopup.add(this.viewCnt), hasFoot && (this.viewFoot = Ti.UI.createView({
            bottom: footBottom,
            width: Ti.UI.SIZE,
            height: Ti.UI.SIZE,
            layout: "horizontal"
        }), this.viewPopup.add(this.viewFoot), opts.cancel && (this.itemCancel = UI.createItem({
            into: this.viewFoot,
            type: "button",
            text: opts.cancelLabel || L("generic_cancel"),
            left: 0,
            width: Ti.UI.SIZE,
            click: function() {
                that.fireEvent("cancel")
            }
        })), opts.confirm && (this.itemSave = UI.createItem({
            into: this.viewFoot,
            type: "button",
            text: opts.confirmLabel || L("generic_confirm"),
            left: opts.cancel ? 20 : 0,
            width: Ti.UI.SIZE,
            click: function() {
                that.fireEvent("confirm")
            }
        }))), this.addEventListener(eh.detectEvents(opts)), opts.init && opts.init.call(this, this.viewCnt)
    }, UI.Popup.prototype = {
        confirm: function() {
            this.fireEvent("confirm")
        },
        destroy: function() {
            this.viewPopup && $sod.Memory.release(this.viewPopup)
        },
        hide: function() {
            var that = this,
                viewPopup = this.viewPopup,
                ani = Ti.UI.createAnimation({
                    opacity: 0
                });
            ani.addEventListener("complete", function() {
                viewPopup.hide(), that.fireEvent("hide")
            }), this.viewPopup.animate(ani)
        },
        show: function() {
            this.fireEvent("show"), this.viewPopup.opacity = 0, this.viewPopup.show();
            var ani = Ti.UI.createAnimation({
                opacity: 1
            });
            this.viewPopup.animate(ani)
        },
        add: function(view) {
            this.viewCnt.add(view)
        }
    }, eh.addEventHandlers(UI.Popup), UI.createPopup = function(opts) {
        return new UI.Popup(opts)
    }, UI.Scroller = function(opts) {
        var that = this;
        this.views = opts.views, this.pagingList = [], this.pagingLabels = opts.labels || [];
        var attrs = UI.ext({}, opts.attrs);
        this.viewCnt = Ti.UI.createView(attrs), opts.into.add(this.viewCnt);
        var scrollerAttrs = UI.ext({
            top: 0,
            bottom: 40,
            width: "100%",
            showPagingControl: !1,
            scrollingEnabled: !1,
            views: this.views
        }, opts.scrollerAttrs);
        this.viewScroller = Ti.UI.createScrollableView(scrollerAttrs), this.viewCnt.add(this.viewScroller), this.viewScroller.addEventListener("scrollend", function(e) {
            that.pagingList.forEach(function(view, i) {
                i == e.currentPage ? (view.opacity = 1, that.viewPagingLabel.text = that.pagingLabels[i] || "") : view.opacity = .5
            }), 0 == e.currentPage ? that.viewPagingPrev.hide() : that.viewPagingPrev.show(), e.currentPage == that.views.length - 1 ? that.viewPagingNext.hide() : that.viewPagingNext.show()
        });
        var pagingAttrs = UI.ext({
            bottom: 0,
            left: UI.margin(),
            right: UI.margin(),
            height: 40
        }, opts.pagingAttrs);
        this.viewPaging = Ti.UI.createView(pagingAttrs), this.viewCnt.add(this.viewPaging), this.viewPaging.addEventListener("swipe", function(e) {
            switch (e.direction) {
                case "left":
                    that.next();
                    break;
                case "right":
                    that.prev();
            }
        }), this.viewPagingCnt = Ti.UI.createView({
            width: Ti.UI.SIZE,
            height: 16,
            bottom: 0,
            layout: "horizontal"
        }), this.viewPaging.add(this.viewPagingCnt), this.viewPagingLabel = Ti.UI.createLabel({
            width: Ti.UI.SIZE,
            height: 26,
            top: 0,
            textAlign: "center",
            color: UI.color1,
            font: {
                fontSize: 15
            },
            text: this.pagingLabels[0] || ""
        }), this.viewPaging.add(this.viewPagingLabel), this.viewPagingPrev = Ti.UI.createImageView({
            width: 40,
            height: 40,
            image: "/icon-prev.png",
            left: 0
        }), this.viewPaging.add(this.viewPagingPrev), this.viewPagingPrev.hide(), UI.touch(this.viewPagingPrev, {
            opacity: .5
        }, {
            opacity: 1
        }), this.viewPagingPrev.addEventListener("click", function() {
            that.prev()
        }), this.viewPagingNext = Ti.UI.createImageView({
            width: 40,
            height: 40,
            image: "/icon-next.png",
            right: 0
        }), this.viewPaging.add(this.viewPagingNext), UI.touch(this.viewPagingNext, {
            opacity: .5
        }, {
            opacity: 1
        }), this.viewPagingNext.addEventListener("click", function() {
            that.next()
        });
        var dotAttrs = UI.ext({
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: UI.color1
        }, opts.dotAttrs);
        this.views.forEach(function(view, i) {
            dotAttrs.left = 0 < i ? dotAttrs.width / 2 : 0, dotAttrs.opacity = 0 < i ? .5 : 1;
            var pagingItem = Ti.UI.createView(dotAttrs);
            that.viewPagingCnt.add(pagingItem), pagingItem.addEventListener("click", function(e) {
                that.viewScroller.scrollToView(view)
            }), view.addEventListener("swipe", function(e) {
                switch (e.direction) {
                    case "left":
                        that.next();
                        break;
                    case "right":
                        that.prev();
                }
            }), that.pagingList.push(pagingItem)
        }), this.addEventListener(eh.detectEvents(opts))
    }, UI.Scroller.prototype = {
        to: function(page) {
            this.viewScroller.scrollToView(page)
        },
        next: function() {
            this.viewScroller.moveNext()
        },
        prev: function() {
            this.viewScroller.movePrevious()
        }
    }, eh.addEventHandlers(UI.Scroller), UI.createScroller = function(opts) {
        return new UI.Scroller(opts)
    }, UI.Screen = function(opts) {
        this.id = opts.screenId || opts.__controllerPath, this._init = opts.init || function() {}, this.items = UI.createItemsCollection(), this.addEventListener(eh.detectEvents(opts))
    }, UI.Screen.prototype = {
        setId: function(id) {
            console.warn("screen setId", id), this.id = id
        },
        changeId: function(id) {
            this.is != id && (this.fireEvent("blur"), this.setId(id), this.items.resetAll(), this.fireEvent("focus"))
        },
        setZone: function(zone) {
            this.id = this.id.replace(/-[0-9]+$/, "") + (zone ? "-" + zone : "")
        },
        add: function(view) {
            this.viewCnt.add(view)
        },
        focus: function(e) {
            this.fireEvent("focus", e)
        },
        blur: function(e) {
            this.fireEvent("blur", e)
        },
        show: function() {
            this.viewCnt.show()
        },
        hide: function() {
            this.viewCnt.hide()
        },
        attrs: function(attrs) {
            this.viewCnt.applyProperties(attrs)
        },
        init: function(viewCnt, data) {
            (null === data || "undefined" == typeof data) && (data = {}), data.zone && this.setZone(data.zone);
            var screenId = this.id;
            return this.viewCnt = Ti.UI.createView({
                width: "100%",
                height: "100%"
            }), this.viewCnt.addEventListener("touchstart", function() {
                Ti.App.fireEvent("bp:screen-touch", {
                    screen: screenId
                })
            }), this.viewCnt.hide(), viewCnt.add(this.viewCnt), this._init.call(this, data, this.viewCnt, this.items), this.fireEvent("open", {
                data: data
            }), Ti.App.fireEvent("bp:console", {
                log: "[UI] Screen Init \"" + this.id + "\""
            }), this
        },
        close: function(e) {
            this.viewCnt.parent && this.viewCnt.parent.remove(this.viewCnt), this.fireEvent("close"), Ti.App.fireEvent("bp:console", {
                log: "[UI] Screen Close \"" + this.id + "\""
            })
        }
    }, eh.addEventHandlers(UI.Screen), UI.createScreen = function(opts) {
        return new UI.Screen(opts)
    }, UI.share = function(opts) {
        if (!0) {
            var intentType = null,
                intent = Ti.Android.createIntent({
                    action: Ti.Android.ACTION_SEND
                });
            opts.title && intent.putExtra(Ti.Android.EXTRA_TEXT, opts.title), opts.image ? (intent.type = "image/*", intent.putExtraUri(Ti.Android.EXTRA_STREAM, opts.image)) : (intent.type = "text/plain", intent.addCategory(Ti.Android.CATEGORY_DEFAULT)), Ti.Android.currentActivity.startActivity(Ti.Android.createIntentChooser(intent, opts.label || "Share"))
        } else {
            var Social = require("dk.napp.social");
            Social.isActivityViewSupported() && (1 ? Social.activityView({
                text: opts.title,
                url: opts.url,
                image: opts.image,
                emailIsHTML: !1,
                subject: opts.title
            }) : Social.activityPopover({
                text: opts.title,
                url: opts.url,
                view: opts.view,
                image: opts.image,
                emailIsHTML: !1,
                subject: opts.title
            }))
        }
    }, UI;

}();