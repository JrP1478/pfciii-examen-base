// Deliberately unsafe, non-executable fixtures for the SAST rules. No credentials.
declare const input: string
declare const node: HTMLElement
declare const password: string

// ruleid: no-dynamic-code-execution
eval(input)
// ruleid: no-dynamic-code-execution
new Function(input)
// ok: no-dynamic-code-execution
JSON.parse(input)

// ruleid: no-raw-html-injection
node.innerHTML = input
// ruleid: no-raw-html-injection
const unsafeView = <div dangerouslySetInnerHTML={{ __html: input }} />
// ok: no-raw-html-injection
const safeView = <div>{input}</div>

// ruleid: no-admin-key-in-browser-env
const unsafeKeyReference = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
// ok: no-admin-key-in-browser-env
const safeKeyReference = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// ruleid: no-sensitive-console-data
console.log(password)
// ok: no-sensitive-console-data
console.log('Operation completed')
