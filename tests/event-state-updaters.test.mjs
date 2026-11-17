import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import ts from "typescript"

// 실제 JSX 핸들러를 실행해 이벤트 종료 후 지연 갱신과 연속 입력을 검증한다.
function loadHandler(file, attribute, expression, setter) {
  const filename = path.join(import.meta.dirname, "..", file)
  const source = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const handlers = []
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attributes = node.attributes.properties.filter(ts.isJsxAttribute)
      const match = attributes.find(
        (item) => item.name.getText(source) === attribute &&
          item.initializer?.getText(source) === expression
      )
      if (match) {
        const change = attributes.find((item) => item.name.getText(source) === "onChange")
        assert.ok(change?.initializer && ts.isJsxExpression(change.initializer))
        handlers.push(change.initializer.expression.getText(source))
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(handlers.length, 1)
  const compiled = ts.transpile(`const handler = ${handlers[0]}`, {
    target: ts.ScriptTarget.ES2020,
  })
  return new Function(setter, "setReferenceErrors", "setMessage", `${compiled}; return handler`)
}

for (const field of ["code", "name", "description", "decaf"]) {
  test(`${field}: 이벤트 종료 후에도 입력값과 최신 상태를 보존한다`, () => {
    const checkbox = field === "decaf"
    const createHandler = checkbox
      ? loadHandler("src/app/home-taste-finder.tsx", "checked", "{taste.decaf}", "setTaste")
      : loadHandler("src/app/admin/coffee-catalog/coffee-catalog-admin-view.tsx", "id", `"reference-${field}"`, "setReferenceDraft")
    const queue = []
    const errorQueue = []
    const messages = []
    const handler = createHandler(
      (updater) => queue.push(updater),
      (updater) => errorQueue.push(updater),
      (message) => messages.push(message)
    )
    const inputs = checkbox ? [true, false, true, false] : ["원두", "", "붙여넣기 값", "연속 변경"]
    for (const value of inputs) {
      const event = { currentTarget: { [checkbox ? "checked" : "value"]: value } }
      handler(event)
      event.currentTarget = null
    }
    let state = { unrelated: "최신 상태", [field]: checkbox ? false : "이전 값" }
    assert.equal(queue.length, inputs.length)
    queue.forEach((updater, index) => {
      const before = { ...state }
      const next = updater(state)
      assert.deepEqual(state, before)
      assert.deepEqual(next, { ...state, [field]: inputs[index] })
      assert.deepEqual(updater(state), next)
      state = { ...next, unrelated: `갱신 ${index}` }
    })
    if (!checkbox) {
      assert.deepEqual(messages, inputs.map(() => null))
      assert.equal(errorQueue.length, inputs.length)
      for (const updater of errorQueue) {
        const errors = { [field]: "수정 전 오류", unrelated: "다른 입력 오류" }
        assert.deepEqual(updater(errors), { [field]: undefined, unrelated: "다른 입력 오류" })
        assert.equal(errors[field], "수정 전 오류")
      }
    }
  })
}
