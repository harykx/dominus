module.exports = function() {
    var
        $ = require("sodium/sodium"),
        Cfg = require("bp-cfg"),

        CAT = {
            logged: function() {
                var login = this.getLoginSession();

                return login && login.valid;
            },
            login: function(opts) {
                var login = opts.login;
                return (

                    login ? void




                    Cfg.callAPI({
                        api: "cat.login",
                        data: login,
                        success: function(res) {
                            res.idlogin ? (

                                CAT.setLoginSession(
                                    login.username,
                                    login.password,
                                    res.idlogin,
                                    res.name),


                                opts.success && opts.success(res)) : (



                                opts.error && opts.error({
                                    error: "Invalid Response"
                                }),


                                this.removeActiveDevice());

                        },
                        error: opts.error
                    }) : (opts.error && opts.error({
                        error: "Empty Data"
                    }), !1));

            },
            logout: function() {
                Ti.App.Properties.removeProperty("cat_login"),

                    Ti.App.fireEvent("showScreenAsStack", {
                        id: "cat-login"
                    }),


                    Ti.App.fireEvent("bp:cat-logout"),

                    this.removeActiveDevice();
            },
            setLoginSession: function(username, password, idlogin, name) {
                if (username && password && idlogin) {
                    var login = {
                        username: username,
                        password: password,
                        idlogin: idlogin,
                        name: name,
                        time: new Date().getTime()
                    };


                    try {
                        login = JSON.stringify(login);
                    } catch (e) {


                        return Cfg.err("[CAT API] Cannot save CAT login session: " + e.message), !1;
                    }

                    Ti.App.Properties.setString("cat_login", login);


                    var appName = name + " (" + username + ")";



                    return Ti.App.Properties.setString("cat_appname", appName), !0;
                }




                return Cfg.err("[CAT API] Empty login session data"), !1;
            },
            getLoginSession: function() {
                var login = Ti.App.Properties.getString("cat_login");

                if (login) {
                    try {
                        login = JSON.parse(login);
                    } catch (e) {


                        return Cfg.err("[CAT API] Cannot parse CAT login session: " + e.message), !1;
                    }
                    var

                        nowDate = new Date().toISOString().split("T").shift(),
                        loginDate = new Date(login.time || 0).toISOString().split("T").shift();




                    return login.valid = nowDate == loginDate, login.valid || (Cfg.log("[CAT API] CAT login session daily expired"), this.removeActiveDevice()), login;
                }



                return this.removeActiveDevice(), !1;
            },
            addLoginSession: function(res) {
                var login = this.getLoginSession();




                return login && (res.username = login.username, res.idlogin = login.idlogin), res;
            },
            searchDevices: function(opts) {
                var search = opts.search;
                return (

                    search ? void(




                        this.saveLatestSearch(search),

                        search = this.addLoginSession(search),

                        Cfg.callAPI({
                            api: "cat.devices.search",
                            data: search,
                            success: function(res) {
                                res instanceof Array ?

                                    opts.success && opts.success(res) :



                                    opts.error && opts.error({
                                        error: "Invalid Response"
                                    });


                            },
                            error: opts.error
                        })) : (opts.error && opts.error({
                        error: "Empty Data"
                    }), !1));

            },
            getLatestSearch: function() {
                var

                    res, search = Ti.App.Properties.getString("cat_search");

                if (search)

                    try {
                        res = JSON.parse(search);
                    }
                catch (e) {
                    Cfg.err("[CAT API] Cannot parse CAT search: " + e.message),

                        res = null;
                }


                if (res) {
                    var empty = !0;

                    for (var k in res)

                        res[k] && (

                            empty = !1);



                    empty && (

                        res = null);

                }



                return res = res || {
                    _empty: !0
                }, res;
            },
            saveLatestSearch: function(search) {
                if (search) {
                    try {
                        search = JSON.stringify(search);
                    } catch (e) {


                        return Cfg.err("[CAT API] Cannot save CAT search: " + e.message), !1;
                    }



                    return Ti.App.Properties.setString("cat_search", search), !0;
                }




                return Cfg.err("[CAT API] Empty search data"), !1;
            },


            getMacAuth: function(mac) {
                var login = this.getLoginSession();
                return (

                    login && mac ?

                    "#C" + Cfg.bpEncode(mac.replace(/:/gi, "") + " " + login.username + " " + login.idlogin + " " + login.password, 3) :


                    "#C");
            },
            setActiveDevice: function(dev) {
                var login = this.getLoginSession();




                return login && (dev.macAddress = dev.dev_mac, dev.impid = dev.imp_type, dev.hwid = Cfg.getImplantHwid(dev.imp_type), dev.mode = 2, dev.app_auth = this.getMacAuth(dev.dev_mac)), Cfg.setCatActiveDevice(dev);
            },
            getActiveDevice: function(dev) {
                return Ti.App.Properties.getObject("cat_active_dev") || !1;
            },
            removeActiveDevice: function(dev) {
                return Ti.App.Properties.removeProperty("cat_active_dev");
            }
        };


    return CAT;
}();