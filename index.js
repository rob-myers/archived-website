!function(t){function e(e){for(var r,u,a=e[0],i=e[1],l=e[2],f=0,d=[];f<a.length;f++)u=a[f],o[u]&&d.push(o[u][0]),o[u]=0;for(r in i)Object.prototype.hasOwnProperty.call(i,r)&&(t[r]=i[r]);for(s&&s(e);d.length;)d.shift()();return c.push.apply(c,l||[]),n()}function n(){for(var t,e=0;e<c.length;e++){for(var n=c[e],r=!0,a=1;a<n.length;a++){var i=n[a];0!==o[i]&&(r=!1)}r&&(c.splice(e--,1),t=u(u.s=n[0]))}return t}var r={},o={0:0},c=[];function u(e){if(r[e])return r[e].exports;var n=r[e]={i:e,l:!1,exports:{}};return t[e].call(n.exports,n,n.exports,u),n.l=!0,n.exports}u.m=t,u.c=r,u.d=function(t,e,n){u.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},u.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},u.t=function(t,e){if(1&e&&(t=u(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(u.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var r in t)u.d(n,r,function(e){return t[e]}.bind(null,r));return n},u.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return u.d(e,"a",e),e},u.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},u.p="";var a=window.webpackJsonp=window.webpackJsonp||[],i=a.push.bind(a);a.push=e,a=a.slice();for(var l=0;l<a.length;l++)e(a[l]);var s=i;c.push([35,1]),n()}({35:function(t,e,n){n(36),t.exports=n(58)},38:function(t,e,n){var r=n(39);"string"==typeof r&&(r=[[t.i,r,""]]);var o={hmr:!0,transform:void 0,insertInto:void 0};n(41)(r,o);r.locals&&(t.exports=r.locals)},39:function(t,e,n){(t.exports=n(40)(!1)).push([t.i,"html,body,#root{width:100%;height:100%;margin:0;overflow:hidden}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-button{background-color:#ddd}::-webkit-scrollbar-track{background-color:#efefef}::-webkit-scrollbar-track-piece{background-color:#eee}::-webkit-scrollbar-thumb{height:50px;background-color:#ccc;border-radius:3px}::-webkit-scrollbar-corner{background-color:#fff}::-webkit-resizer{background-color:#999}\n",""])},58:function(t,e,n){"use strict";n.r(e);n(38);var r=n(0),o=n(17),c=n(11),u=n(28),a=n(12),i=n(29),l=n(20),s=n(31),f=function(t){return r.createElement("div",null,"Hello... from react!")},d=n(22),b=n.n(d),p=n(5),g=n.n(p),h=n(15),v=n.n(h);n(19);var m=function(t,e){return{act:function(e){return g()({},e,{key:"sync",type:t})},def:e}},E=function(){return function(t){var e=t.getState,n=t.dispatch;return function(t){return function(r){if("key"in r)switch(r.key){case"sync":return t(r);case"thunk":return r.thunk({state:e(),dispatch:n},r.args)}t(r)}}}};function y(t){return"testNever: ".concat((e=t,JSON.stringify(e,null,"\t"))," not implemented.");var e}var k,T,O={lastPing:null,count:0},j=m("TEST_PING",function(t,e){return v()(t),g()({},e,{lastPing:"".concat(new Date)})}),w=m("TEST_INCREMENT",function(t,e){return v()(t),g()({},e,{count:e.count+1})}),S=m("TEST_DELTA",function(t,e){var n=t.delta;return g()({},e,{count:e.count+n})}),x=m("TEST_DECREMENT",function(t,e){return v()(t),g()({},e,{count:e.count-1})}),P=(k="TEST_THUNK",T=function(t,e){var n=t.state.test;return v()(e),n.lastPing?"Last ping was ".concat(n.lastPing):"No pings seen"},function(t){return{key:"thunk",type:k,thunk:T,args:t}});function _(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:O,e=arguments.length>1?arguments[1]:void 0;switch(e.type){case"TEST_DECREMENT":return x.def(e,t);case"TEST_INCREMENT":return w.def(e,t);case"TEST_DELTA":return S.def(e,t);case"TEST_PING":return j.def(e,t);default:return t||y(e)}}var N,M,R,C=function(t){var e=Object(r.useState)(0),n=b()(e,2),o=n[0],u=n[1],a=Object(r.useState)(""),i=b()(a,2),l=i[0],s=i[1],f=Object(c.d)();Object(r.useEffect)(function(){return console.log("mount"),d(),function(){return console.log("unmount")}},[]),Object(r.useEffect)(function(){return console.log("hot-reload",{count:o}),d(),function(){return console.log("hot-unload",{count:o})}},["hot"]);var d=function(){var t=f(P({}));s(t)};return r.createElement("div",null,r.createElement("div",{style:{display:"flex"}},r.createElement("button",{onClick:function(){return f(j.act({}))}},"ping"),r.createElement("div",null,o),r.createElement("button",{onClick:function(){return u(o+1)}},"+")),r.createElement("div",{style:{display:"flex"}},r.createElement("button",{onClick:d},"update"),l))},D=Object(s.hot)(Object(l.f)(function(t){return r.createElement(l.d,null,r.createElement(l.b,{exact:!0,path:"/",component:f}),r.createElement(l.b,{path:"/test",component:C}),r.createElement(l.a,{to:"/"}))})),I=n(4),L=n(14),A=n(32),H=n(10),J=n(26),z=n(33),G=Object(L.a)(function(t,e){var n=t.count,r=t.lastPing;return{count:n,lastPing:r?"".concat(r):null}},function(t,e){return{count:t.count,lastPing:t.lastPing}},{whitelist:["test"]}),B=Object(H.a)({basename:"https://rob-myers.github.io"}),K={key:"root",storage:A,transforms:[G],blacklist:["router"]},U=Object(L.b)(K,(N=B,Object(I.combineReducers)({router:Object(a.b)(N),test:_})));var W=Object(z.composeWithDevTools)({shouldHotReload:!1,maxAge:50,serialize:{replacer:function(t,e){return e&&e.devToolsRedaction?"Redacted<".concat(e.devToolsRedaction,">"):e},function:!1}})||I.compose;Object(i.setConfig)({logLevel:"debug"});var q,F=document.getElementById("root"),Q=M?{store:M,persistor:R}:(M=Object(I.createStore)(U,q||{},W(Object(I.applyMiddleware)(E(),Object(J.a)(B)))),R=Object(L.c)(M),{store:M,persistor:R}),V=Q.store,X=Q.persistor;o.render(r.createElement(c.a,{store:V,key:"provider"},r.createElement(u.a,{loading:null,persistor:X},r.createElement(a.a,{history:B},r.createElement(D,null)))),F)}});