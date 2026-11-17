import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

// 실제 클라이언트를 격리 실행해 외부 API 호출 없이 토큰 갱신 계약을 검증한다.
function createClient(respond, initial = { accessToken: "old-access", refreshToken: "old-refresh" }) {
  let tokens = initial
  const events = []
  const storage = {
    getStoredAccessToken: () => tokens?.accessToken ?? null,
    getStoredRefreshToken: () => tokens?.refreshToken ?? null,
    setStoredAuthTokens: (next) => { tokens = next },
    clearStoredAuthTokens: () => { tokens = null },
  }
  const cache = new Map()
  function load(name) {
    if (name === "./auth-token-storage") return storage
    if (cache.has(name)) return cache.get(name)
    const filename = path.join(import.meta.dirname, "../src/lib/api", `${name.replace("./", "")}.ts`)
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText
    const exports = {}
    vm.runInNewContext(source, {
      exports, require: load, process: { env: {} }, URL, Headers, Blob, ArrayBuffer,
      URLSearchParams, FormData, DOMException,
      fetch: (url, options) => respond(new URL(url), options),
      window: { dispatchEvent: (event) => events.push(event.type) },
      CustomEvent: class { constructor(type) { this.type = type } },
    }, { filename })
    cache.set(name, exports)
    return exports
  }
  return { ...load("./client"), tokens: () => tokens, events }
}

function response(status, data = null) {
  return Response.json({ status, message: status === 200 ? "성공" : "검증용 실패", data, errors: null }, { status })
}

for (const failure of ["500", "offline", "403"]) {
  test(`인증 갱신 ${failure}: 기존 토큰을 보존하고 다음 요청에서 다시 시도한다`, async () => {
    let recover = false
    let refreshes = 0
    const client = createClient((url, options) => {
      if (url.pathname.endsWith("/reissue")) {
        refreshes += 1
        if (!recover) {
          if (failure === "offline") throw new TypeError("연결 끊김")
          return response(Number(failure))
        }
        return response(200, { accessToken: "new-access", refreshToken: "new-refresh" })
      }
      return options.headers.get("Authorization") === "Bearer new-access"
        ? response(200, { ok: true }) : response(401)
    })
    await assert.rejects(client.apiRequest("/protected"), error => {
      assert.equal(error.kind, failure === "offline" ? "NETWORK_ERROR" : failure === "403" ? "FORBIDDEN" : "HTTP_ERROR")
      return true
    })
    assert.equal(client.tokens().accessToken, "old-access")
    assert.deepEqual(client.events, [])
    recover = true
    assert.equal((await client.apiRequest("/protected")).ok, true)
    assert.equal(client.tokens().accessToken, "new-access")
    assert.equal(refreshes, 2)
  })
}

test("갱신 토큰 만료: 토큰을 지우고 인증 만료를 알린다", async () => {
  const client = createClient(() => response(401))
  await assert.rejects(client.apiRequest("/protected"), error => error.kind === "UNAUTHORIZED")
  assert.equal(client.tokens(), null)
  assert.deepEqual(client.events, [client.AUTH_EXPIRED_EVENT])
})

test("갱신 토큰 없음: 만료 처리하며 갱신 API를 호출하지 않는다", async () => {
  let calls = 0
  const client = createClient(() => { calls += 1; return response(401) }, { accessToken: "old-access" })
  await assert.rejects(client.apiRequest("/protected"), error => error.kind === "UNAUTHORIZED")
  assert.equal(calls, 1)
  assert.equal(client.tokens(), null)
})

for (const status of [401, 500]) {
  test(`갱신 후 원래 요청 ${status}: ${status === 401 ? "인증 만료" : "갱신한 토큰 보존"}`, async () => {
    let first = true
    const client = createClient(url => {
      if (url.pathname.endsWith("/reissue")) return response(200, { accessToken: "new-access", refreshToken: "new-refresh" })
      const next = first ? 401 : status
      first = false
      return response(next)
    })
    await assert.rejects(client.apiRequest("/protected"), error => error.kind === (status === 401 ? "UNAUTHORIZED" : "HTTP_ERROR"))
    assert.equal(client.tokens()?.accessToken ?? null, status === 401 ? null : "new-access")
    assert.deepEqual(client.events, status === 401 ? [client.AUTH_EXPIRED_EVENT] : [])
  })
}

test("여러 요청의 동시 401: 갱신 한 번 후 각각 정상 재요청한다", async () => {
  let refreshes = 0
  let completeRefresh
  const client = createClient((url, options) => {
    if (url.pathname.endsWith("/reissue")) {
      refreshes += 1
      return new Promise(resolve => { completeRefresh = () => resolve(response(200, { accessToken: "new-access", refreshToken: "new-refresh" })) })
    }
    return response(options.headers.get("Authorization") === "Bearer new-access" ? 200 : 401, url.pathname)
  })
  const requests = [client.apiRequest("/one"), client.apiRequest("/two")]
  while (!completeRefresh) await new Promise(resolve => setImmediate(resolve))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(refreshes, 1)
  completeRefresh()
  assert.deepEqual(await Promise.all(requests), ["/one", "/two"])
})

test("공개 조회 401: 갱신·토큰 삭제 없이 조회 오류를 반환한다", async () => {
  let calls = 0
  const client = createClient(() => { calls += 1; return response(401) })
  await assert.rejects(client.apiRequest("/public", { auth: false }), error => error.kind === "UNAUTHORIZED")
  assert.equal(calls, 1)
  assert.equal(client.tokens().accessToken, "old-access")
  assert.deepEqual(client.events, [])
})
