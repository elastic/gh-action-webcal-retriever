(()=>{var __webpack_modules__={396:module=>{module.exports=eval("require")("@actions/core")},184:module=>{module.exports=eval("require")("node-ical")}};var __webpack_module_cache__={};function __nccwpck_require__(e){var _=__webpack_module_cache__[e];if(_!==undefined){return _.exports}var r=__webpack_module_cache__[e]={exports:{}};var t=true;try{__webpack_modules__[e](r,r.exports,__nccwpck_require__);t=false}finally{if(t)delete __webpack_module_cache__[e]}return r.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var __webpack_exports__={};(()=>{"use strict";const e=__nccwpck_require__(396);const _=__nccwpck_require__(184);const main=async()=>{const r=e.getInput("webcal_url");const t=await _.async.fromURL(r);const a=Object.entries(t).map((([e,_])=>_)).find((e=>{const _=Date.parse(e.start);const r=Date.parse(e.end);const t=Date.now();return _<=t&&t<=r}))?.attendee;if(!a){throw Error("Could not find attendee for today!")}e.setOutput("person_id",a)};main().catch((_=>e.setFailed(_.message)))})();module.exports=__webpack_exports__})();