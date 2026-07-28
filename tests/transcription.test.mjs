import assert from "node:assert/strict";
import test from "node:test";
import OpenCC from "opencc-js/t2cn";

test("normalizes Traditional Chinese Whisper output to Simplified Chinese", () => {
  const traditionalToSimplified = OpenCC.Converter({ from: "t", to: "cn" });
  const source = "6月18日項目周會參會人員包括產品經理李明、測試工程師趙強和運營陳曉。";

  assert.equal(
    traditionalToSimplified(source),
    "6月18日项目周会参会人员包括产品经理李明、测试工程师赵强和运营陈晓。",
  );
});
