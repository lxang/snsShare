/**
 * Created by byran on 2016/5/24.
 * http://github.com/lxang
 */

var getVersion = function (c) {
    var a = c.split("."), b = parseFloat(a[0] + "." + a[1]);
    return b;
}
var getUrlParam = function (t) {
    t = t || location.search.slice(1);
    var e, n, i, a = [], o = {}, r = decodeURIComponent;
    for (a = t.split("&"),
             e = a.length; e--;)
        n = a[e],
            i = n.split("="),
            o[r(i[0])] = r(i[1]);
    return o;
}

var convertToURLParam = $ && $.param || function (obj) {
        return "";
    };

/**
 *  load js script
 *  @param {string} url - the script src url
 *  @param {function} [callback] - callback after script loaded
 *  @param {string} [charset] - script file encode type
 * */
var getScript = function (url, callback, charset) {
    var s = document.createElement("script");
    charset = charset || "utf-8";
    s.type = "text/javascript";
    s.charset = charset;
    s.onload = s.onreadystatechange = function () {
        typeof(callback) === "function" && callback();
        s.onload = s.onreadystatechange = null;
        document.body.removeChild(s);
    };
    s.src = url;
    document.body.appendChild(s);
};

var ua = window.navigator.userAgent.toLowerCase(),
    WxUA = /micromessenger/gi.test(ua),
    mqqUA = /mobile.*qq/gi.test(ua),
    qqbUA = /mqqbrowser/gi.test(ua),
    ucbUA = /ucbrowser/gi.test(ua),
    uaCheck = {
        //是否安卓平台
        isFromAndroid: /android/gi.test(ua),
        //是否IOS平台
        isFromIos: /iphone|ipod|ios/gi.test(ua),
        //微信
        isFromWx: WxUA,
        //手Q
        isFromQQ: !WxUA && mqqUA,
        //QQ浏览器， 手Q和微信的浏览可能也会被识别为QQBrowser
        isFromQQBrowser: !WxUA && !mqqUA && qqbUA,
        //UC浏览器
        isFromUC: ucbUA,
        //QQ浏览器版本号
        getQQBrowserVersion: function () {
            return getVersion(ua.split("mqqbrowser/")[1]);
        },
        //UC浏览器版本号
        getUCVersion: function () {
            return getVersion(ua.split("ucbrowser/")[1]);
        }
    },
//第三方中转器跳转转参数标志
    relayflag = "srrelay=",
//支持分享类型， key值是浏览器平台， value是调用参数词
    supportType = {
        sinaWeibo: {"ucIOS": 'kSinaWeibo', "ucAndroid": 'SinaWeibo', "qqBrowser": 11, "mqq": "weibowap"},
        weixin: {"ucIOS": 'kWeixin', "ucAndroid": 'WechatFriends', "qqBrowser": 1, "mqq": 2},
        weixinFriend: {"ucIOS": 'kWeixinFriend', "ucAndroid": 'WechatTimeline', "qqBrowser": '8', "mqq": 3},
        QQ: {"ucIOS": 'kQQ', "ucAndroid": 'QQ', "qqBrowser": '4', "mqq": 0},
        QZone: {"ucIOS": 'kQZone', "ucAndroid": 'QZone', "qqBrowser": '3', "mqq": 1},
        More: {"ucIOS": '', "ucAndroid": '', "qqBrowser": '', "mqq": "menu"},
        QRCode: {"ucIOS": '', "ucAndroid": '', "qqBrowser": '', "mqq": "menu"}
    },
//默认分享card描述属性
    defaultDesc = {
        title: document.title || "",
        description: document.title || "",
        img: '',
        url: location.href,
        img_title: document.title || ""
    };

/**
 * A function for share link to chinese sns on mobile
 *
 * @param {string} type - one of this values sinaWeibo/weixin/weixinFriend/QQ/QZone/More/QRCode
 * @param {object} Desc - the description of share card
 * @param {string} Desc.title - the title of share card
 * @param {string} [Desc.description] - the description of share card
 * @param {string} [Desc.img] - the image url of share card // UC下分享不支持自定义图片
 * @param {string} Desc.url - the share url of card
 * @param {string} [Desc.img_title] - the title of share card img
 * @param {string} [Desc.from] - the share origin of share card
 * @param {string} [Desc.redirURL] - the redirect url of  other App call
 * */
function sharePageToApp(type, Desc) {
    var appType = typeof type === "string" && supportType[type];
    if (!appType) {
        alert("不好意思， 这个操作类型不支持！");
        return;
    }
    Desc = Desc || {};
    //第三方APP跳转的URL， 默认是本页面
    var redirUrl = Desc.redirURL || location.href;

    var _desc = {
        title: Desc.title || defaultDesc.title,
        description: Desc.description || defaultDesc.description,
        img: Desc.img || defaultDesc.img,
        url: Desc.url || defaultDesc.url,
        img_title: Desc.img_title || defaultDesc.img_title,
        from: Desc.from || defaultDesc.from
    };

    //不同调用方式的个性化传参
    var desc_params = {};

    //显示二维码DOM
    if (type === "QRCode") {
        generateQr(_desc.url);
        return false;
    }

    switch (true) {
        case (uaCheck.isFromQQ) :
        {
            appType = appType["mqq"];
            //以web方式分享微博
            if (appType === "weibowap") {
                return shareWebWeiBo(_desc);
            }
            desc_params = {
                title: _desc.title,
                desc: _desc.description,
                share_type: appType,//微信好友2,QQ空间1,QQ好友0,微信朋友圈3
                share_url: _desc.url,
                image_url: _desc.img
            };

            mqqShareApiUseable(function () {
                appType === "menu" ? mqq.ui.showShareMenu() : mqq.ui.shareMessage(desc_params, function (result) {
                    //分享到微信和朋友圈在手Q5.4之后开始支持回调
                    if (result && result.retCode === 0) {
                        //用户点击了发送
                    }else{
                        //没有点击发送
                    }
                });
            });
            break;
        }
        case (uaCheck.isFromWx) :
        {
            if (type === "sinaWeibo") {
                shareWebWeiBo(_desc);
            } else {
                //提示使用微信自带的分享功能， 否则需要微信JS-SDK分享权限
                showUseWXShare();
            }
            break;
        }
        case (uaCheck.isFromQQBrowser) :
        {
            //调用QQ Browser js API
            //notice: 这里需要先加载js, 注意手Q和微信的webview ua会带上QQ browser
            //更多时不传to_app， 但需要传其他参数， 否则部分Android机会分享无响应
            appType = appType['qqBrowser'];
            desc_params = appType === "" ? {
                url: _desc.url,
                title: _desc.title,
                description: _desc.description,
                img_url: _desc.img
            } : {
                url: _desc.url,
                title: _desc.title,
                description: _desc.description,
                img_url: _desc.img,
                img_title: _desc.img_title,
                to_app: appType,//微信好友1,腾讯微博2,QQ空间3,QQ好友4,生成二维码7,微信朋友圈8,啾啾分享9,复制网址10,分享到微博11,创意分享13
                cus_txt: "请输入此时此刻想要分享的内容"
            };

            //这里是为什么忘了
            if (type == "weixin") {
                desc_params.title = _desc.description;
                desc_params.description = _desc.title;
            }

            if (typeof(browser) !== "undefined") {
                if (typeof(browser.app) !== "undefined") {
                    browser.app.share(desc_params);
                }
            } else if (typeof(window.qb) != "undefined" && typeof(window.qb.share) !== "undefined") {
                window.qb.share(desc_params);
            } else {
                //版本太低了， 引导更新
                location.href = "http://mdc.html5.qq.com/d/directdown.jsp?channel_id=10349";
            }
            break;
        }
        case (uaCheck.isFromUC) :
        {
            //调用UC native js API
            appType = uaCheck.isFromIos ? appType["ucIOS"] : appType["ucAndroid"];

            if (typeof ucweb !== "undefined") {
                //调用android ucweb提供的分享对象
                if (type === "QZone") {
                    alert("UC浏览器不支持我们呼起QQ空间， 请使用浏览器自带的分享按钮");
                    appType = "";

                    //或者可以用wap登录分享
                    //shareWebQzone(_desc);return;
                }
                ucweb.startRequest("shell.page_share", [_desc.title, _desc.description, _desc.url, appType, "", "(@" + _desc.from + ")", ""]);
            } else if (typeof ucbrowser !== "undefined") {
                //调用IOS ucbrowser提供的分享对象
                ucbrowser.web_share(_desc.title, _desc.description, _desc.url, appType, "", "(@" + _desc.from + ")", "");
            }

            break;
        }
        default :
        {
            /**
             * 其他浏览器: 尝试呼起QQ浏览器， 并调用它的分享功能
             * wenwen.sogou.com域下， 参数qq=1 则改用手Q作为中转跳转
             * */
            switch (type) {
                case "More" :
                {
                    showShareMenu(Desc);
                    break;
                }
                case "sinaWeibo" :
                {
                    shareWebWeiBo(_desc);
                    break;
                }
                case "QQZone" :
                {
                    shareWebQzone(_desc);
                    break;
                }
                default  :
                {
                    Desc.url = encodeURIComponent(Desc.url);
                    if (Desc.img) {
                        Desc.img = encodeURIComponent(Desc.img);
                    }
                    relayOnThirdApp({
                        url: _desc.url,
                        testUrl: redirUrl + (redirUrl.indexOf("?") > -1 ? "&" : "?") + relayflag + type + "&srdesc=" + encodeURIComponent(convertToURLParam(Desc)),
                        onFail: function (info) {
                            generateQr(_desc.url, info);
                        },
                        onSucc: undefined
                    });
                }
            }
        }
    }
}


/**
 * A function of Qzone share use wap
 * @param {object} card - the description of share card
 * @param {sting} card.title - the title of share card
 * @param {string} card.description - the description of share card
 * @param {string} card.img - the image url of share card
 * @param {string} card.url - the share url of card
 * @param {string} card.img_title - the title of share card img
 * @param {string} card.from - the share origin of share card
 * */
function shareWebQzone(card) {
    var url = card.url, description = card.description.substring(0, 200);

    var params = [
        "title=" + encodeURIComponent(card.title),
        "desc=" + encodeURIComponent(description),
        "imageUrl=" + card.img,
        "summary=" + encodeURIComponent(description),
        "url=" + encodeURIComponent(url),
        //"successUrl="+ url,
        //"failUrl="+ url,
        //"callbackUrl="+ url,
        "referer=" + encodeURIComponent(url)
    ].join("&");
    //location.href = "http://openmobile.qq.com/api/check2?page=qzshare.html&loginpage=loginindex.html&logintype=qzone" + "&" + params;
    location.href = "http://qzs.qzone.qq.com/open/connect/widget/mobile/qzshare/index.html?loginpage=loginindex.html&logintype=qzone&page=qzshare.html" + "&" + params;
}

/**
 * 未实现
 * A function of sina weibo share use wap
 * @param {object} card - the description of share card
 * @param {string} card.title - the title of share card
 * @param {string} card.description - the description of share card
 * @param {string} card.img - the image url of share card
 * @param {string} card.url - the share url of card
 * @param {string} card.img_title - the title of share card img
 * @param {string} card.from - the share origin of share card
 * */
/**
 * 未实现 wap中登录时， 用fiddler转发会失败
 * A function of sina weibo share use wap
 * @param {object} card - the description of share card
 * @param {string} card.title - the title of share card
 * @param {string} card.description - the description of share card
 * @param {string} card.img - the image url of share card
 * @param {string} card.url - the share url of card
 * @param {string} card.img_title - the title of share card img
 * @param {string} card.from - the share origin of share card
 *
 * 接口文档
 * http://jssdk.sinaapp.com/widget/share.php
 * */
function shareWebWeiBo(card) {
    var param = {
        url: encodeURIComponent(card.url || location.href),
        title: encodeURIComponent(card.title || document.title),
        pic: card.img && encodeURIComponent(card.img),
        searchPic: card.searchPic,
        language: "zh_cn",
        appkey: card.appkey,
        width: undefined,
        height: undefined,
        count: undefined,
        type: undefined,
        size: "middle"
    };

    var arr = [];
    for (var p in param) {
        if (param.hasOwnProperty(p) && typeof param[p] !== "undefined") {
            arr.push(p + "=" + param[p]);
        }
    }

    var _u = 'http://v.t.sina.com.cn/share/share.php?' + arr.join("&");
    if (typeof mqq !== "undefined" && typeof mqq.ui !== "undefined") {
        mqq.ui.openUrl({
            "url": _u,
            "target": 1,
            "style": 1
        });
    } else {
        //window.open(_u);
        location.replace(_u);
    }
}

/**
 * 更多按钮， 展示分享菜单
 * */
function showShareMenu(Desc) {
    if (uaCheck.isFromWx) {
        showUseWXShare();
    } else {
        var html = ' <div id="share_items_tpl" class="popup_wrap">' +
            '<div class="ymask"></div>' +
            '<div class="zz_share">' +
            '    <ul>' +
            '    <li data-type="QQ" class="confirm share_item">' +
            '        <i class="qq"></i>' +
            '        <span>QQ</span>' +
            '    </li>' +
            '    <li data-type="QZone" class="confirm share_item">' +
            '       <i class="kongjian"></i>' +
            '       <span>空间</span>' +
            '    </li>' +
            '        <li data-type="weixin" class="confirm share_item">' +
            '            <i class="weixin"></i>' +
            '            <span>微信</span>' +
            '        </li>' +
            '        <li data-type="sinaWeibo" class="confirm share_item">' +
            '            <i class="weibo"></i>' +
            '            <span>微博</span>' +
            '        </li>' +
            '    </ul>' +
            '    <a href="javascript:;" class="zzs_cancel cancel">取消</a>' +
            '</div>' +
            '</div>';
        $(document.body).append(html);
        $("#share_items_tpl .ymask").on("touchstart touchmove", function (e) {
            e.stopPropagation();
            $("#share_items_tpl").remove();
            return false;
        }).on("tap", function () {
            $("#share_items_tpl").remove();
        });
        $("#share_items_tpl").on("tap", ".share_item, .cancel", function (e) {
            var $self = $(this);
            e.stopPropagation();
            $("#share_items_tpl").remove();
            if ($self.hasClass("share_item")) {
                sharePageToApp($self.attr("data-type"), Desc);
            }
        });
    }
}

/**
 * 引导用户使用微信自带的分享功能
 * */
function showUseWXShare(html) {
    html = html || '<div id="useWXShare" class="popup_wrap">' +
        '<div class="ymask"></div>' +
        '<div class="zz_de_share"></div>' +
        '<a class="zz_zhidao confirm"></a>' +
        '</div>';
    $(document.body).append(html);

    $("#useWXShare .ymask").on("touchstart touchmove", function (e) {
        e.stopPropagation();
        $("#useWXShare").remove();
        return false;
    }).on("tap", function () {
        $("#useWXShare").remove();
    });

    $("#useWXShare").on("click tap", ".confirm", function (e) {
        $("#useWXShare").remove();
    });
}

/**
 * show qr code according of url
 * 这里会生成DOM并插入document
 * @param {string} url
 * @param {string} [info]
 * */
var generateQr = function (url, info) {
    $("#share_items_tpl").remove();

    var QrImgUrl = "/wapi/qun/qrcode/?url=" + encodeURIComponent(url);

    var html = '<div id="guideUserShare" class="wx_share">' +
        '<a id="btnCancelQr" href="javascript:;" class="close"></a>' +
        '<h1>可以用下面两种方式分享：</h1>' +
        '<h2>方式1：复制链接发送</h2>' +
        '<p class="fs1">' + url + '</p>' +
        '<h2>方式2：二维码方式</h2>' +
        '<p class="fs2">长按二维码保存，发送给好友或到朋友圈</p>' +
        '<img src="' + QrImgUrl + '" alt="" class="ewm">' +
        '</div>';

    $(document.body).append(html);

    $("#btnCancelQr").on("click tap", function () {
        $("#guideUserShare").remove();
    });

};

/**
 * 替换默认的二维码面板函数
 * @param {function} fun
 */
function customQrHTML(fun) {
    generateQr = fun;
}

var timer;
/**
 * 使用中继器（手Q或QQ浏览器）中转打开对应链接， 并触发分享功能
 * @notice hide show 事件监听， 依赖page-visibility.js
 *
 * @params {object} options
 * @params {object} options.testUrl 中转器要打开的链接
 * @params {object} options.onSucc 打开中转器成功回调
 * @params {object} options.onFail 打开中转器失败回调
 * 备忘：中转器打开失败是不是可以使用剪贴板功能
 * */
function relayOnThirdApp(options) {
    require("./../page-visibility");

    options = options || {};

    var href = options.testUrl || location.href,
        succCallBack = options.onSucc,
        failCallBack = options.onFail,
        ua = navigator.userAgent,
        IOS_platform = ua.match(/iphone\s*os\s*\d/gi),
        IOSVersion = IOS_platform && parseInt(IOS_platform[0].split(" ")[2]) || 0,
        useQQb = "mttbrowser://url=" + href.replace(/http:\/\//gi, ""),
        useMobileQQ = false;

    /**
     * qq.com域下支持， 呼起QQ打开链接， 触发分享
     * 注意sogou.com和其他域不支持
     * */
    if (href.indexOf("wenwen.sogou.com") > -1 || href.indexOf("zhinan.sogou.com") > -1) {
        href = href.replace("wenwen.sogou.com", "wenwen.qq.com");
        useQQb = 'mqqapi://forward/url?src_type=internal&version=1&url_prefix=' + btoa(href);
        useMobileQQ = true;
    }

    var pageVisiblityChangeHandler = function () {
        clearTimeout(timer);
        clear(true, "success");
    };

    var clear = function (openSuccess, info) {
        !!openSuccess ? succCallBack && succCallBack() : failCallBack && failCallBack(info);
        $(document).off('hide', pageVisiblityChangeHandler);
        $(document).off('show', pageVisiblityChangeHandler);
        if (!frame) {
            return;
        }

        parentNode.removeChild(frame);
        frame = null;
    };

    if ($.zepto || $.jQuery) {
        $(document).off('hide', pageVisiblityChangeHandler);
        $(document).off('show', pageVisiblityChangeHandler);
        $(document).on('hide', pageVisiblityChangeHandler)
    }

    if (useMobileQQ || IOSVersion > 8) {
        location.href = useQQb;
    } else {
        var frame = document.createElement("iframe"), parentNode = document.body;
        frame.src = useQQb;
        frame.id = "qbInstallValidator_" + Date.now();
        frame.style.display = "none";
        parentNode.appendChild(frame);
    }

    var markTime = Date.now();
    //pageVisiblityChangeHandler生效则唤起成功， 否则判定为失败
    clearTimeout(timer);
    timer = setTimeout(function () {
        //APP页面切换之后， 导致计时器暂停， 因此若时间大于延时时间就是切换成功， 验证无效
        Math.abs(Date.now() - markTime);
        clear(false, "fail");
    }, 3000);

    //timer  = setTimeout(openResult, 1000);
}

/**
 * 加载对应平台的JS-API
 * @param [callback]
 * */
function isLoadQQBrowswerApi(callback) {
    var qApiSrc = {
        lower: "http://3gimg.qq.com/html5/js/qb.js",
        higher: "http://jsapi.qq.com/get?api=app.share"
    }
    var b = (uaCheck.getQQBrowserVersion() < 5.4) ? qApiSrc.lower : qApiSrc.higher;
    if (uaCheck.isFromQQBrowser && typeof browser === "undefined" && typeof qb === "undefined") {
        getScript(b, callback);
    } else {
        (browser || qb) && callback && callback();
    }
}
/**
 *
 * @param [callback]
 * mqq-api方法仅可用于qq.com域下页面或向腾讯申请了权限的域名页面
 */
function mqqShareApiUseable(callback) {
    var mqqApiSrc = 'http://pub.idqqimg.com/qqmobile/qqapi.js?_bid=152&rnd=' + Date.now();
    if(!uaCheck.isFromQQ || !uaCheck.isFromQQBrowser){
        alert("mqq-api的调用方式不适合你");
    }

    if(typeof mqq !== "undefined"){
        callback();
    }else{
        getScript(mqqApiSrc, callback);
    }
}

/**
 * 这里涉及desc参数传递的问题， 只能通过URL来传递， 但字符受限
 * 作为中转器平台， 打开后调用对应的分享接口
 * 否则加载对应的JS-API
 * */

var urlparams = getUrlParam(), otherBrowserCall = urlparams["srrelay"], srdesc = decodeURIComponent(urlparams["srdesc"]);
var desc = srdesc ? getUrlParam(srdesc) : {};
if (otherBrowserCall) {
    //如果是中继器跳转，则需要删掉srrelay标志， 否则用location.href作为分享链接会误调分享接口
    desc.url = decodeURIComponent(desc.url) || location.href.replace(relayflag + otherBrowserCall, "");
    desc.img = desc.img && decodeURIComponent(desc.img);
}

if (uaCheck.isFromQQ) {
    otherBrowserCall ? mqqShareApiUseable(function () {
        sharePageToApp(otherBrowserCall, desc);
    }) : mqqShareApiUseable();
} else if (uaCheck.isFromQQBrowser) {
    otherBrowserCall ? isLoadQQBrowswerApi(function () {
        sharePageToApp(otherBrowserCall, desc);
    }) : isLoadQQBrowswerApi();
}