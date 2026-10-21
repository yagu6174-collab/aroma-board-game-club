/**
 * 表单一提交，就把回复数同步到馨香桌游社网站。
 *
 * 把这段脚本挂在 Google 表单上：打开表单 → 扩展程序 → Apps Script，整份粘贴，保存。
 * 不要把密钥写进脚本。密钥放在脚本属性里。
 *
 * 脚本属性（项目设置 → 脚本属性）：
 *   FORM_HOOK_SECRET  与 Vercel 环境变量 FORM_HOOK_SECRET 或 CRON_SECRET 相同
 *   FORM_HOOK_URL     可留空。留空时使用下面的正式站地址
 *
 * 然后在编辑器里运行一次 installSubmitTrigger，按提示授权访问外部网址。
 * 触发器必须是可安装的「提交表单时」触发器。名为 onFormSubmit 的简单触发器不能调用 UrlFetchApp。
 */
var DEFAULT_HOOK_URL = "https://aroma-board-game-club.vercel.app/api/google/hook";

function syncEnrollmentOnSubmit(e) {
  var props = PropertiesService.getScriptProperties();
  var secret = String(props.getProperty("FORM_HOOK_SECRET") || "").replace(/^\s+|\s+$/g, "");
  var url = String(props.getProperty("FORM_HOOK_URL") || DEFAULT_HOOK_URL).replace(/^\s+|\s+$/g, "");
  if (!secret) {
    console.error("FORM_HOOK_SECRET is not set");
    return;
  }
  var formId = "";
  try {
    if (e && e.source && typeof e.source.getId === "function") formId = String(e.source.getId() || "");
  } catch (err) {
    console.error("could not read form id");
  }
  var payload = formId ? { formId: formId } : {};
  var response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  var code = response.getResponseCode();
  if (code >= 200 && code < 300) {
    console.log("enrollment hook ok: " + code);
    return;
  }
  var text = response.getContentText() || "";
  if (text.length > 500) text = text.substring(0, 500);
  console.error("enrollment hook failed: " + code + " " + text);
}

function installSubmitTrigger() {
  var form = FormApp.getActiveForm();
  if (!form) throw new Error("Open this project from the form: Extensions → Apps Script.");
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i += 1) {
    if (triggers[i].getHandlerFunction() === "syncEnrollmentOnSubmit") ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger("syncEnrollmentOnSubmit").forForm(form).onFormSubmit().create();
}
