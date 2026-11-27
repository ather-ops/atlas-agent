import { test, expect, type Page, type Route } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const navigate = (p: Page, name: string) =>
  p.locator('.main-nav').getByRole('link', { name, exact: true }).click()
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Quick start' })).toBeVisible()
})

test('empty workspace, searchable prompt library and honest integration states', async ({
  page: p,
}) => {
  await expect(p.getByRole('heading', { name: 'How can I help you today?' })).toBeVisible()
  await expect(p.getByText('Starter chats', { exact: true })).toBeVisible()
  await p.getByRole('button', { name: 'Workspace overview' }).click()
  await expect(p.getByText(/No conversations yet/)).toBeVisible()
  await expect(p.locator('.stat strong')).toHaveText(['0', '0', '0', '0'])
  await expect(p.getByText('No automation runs yet.')).toBeVisible()
  await p.keyboard.press('Escape')
  await p.getByRole('button', { name: 'Gmail', exact: true }).click()
  const dialog = p.getByRole('dialog')
  await expect(dialog.getByText('Coming soon', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Connect', exact: true })).toHaveCount(0)
  await p.keyboard.press('Escape')
  await p.getByRole('button', { name: 'Available', exact: true }).click()
  await expect(p.locator('.connection-card')).toHaveCount(2)
  await p.locator('.connection-card').filter({ hasText: 'Tavily' }).click()
  await expect(dialog.locator('input[type=password]')).toBeVisible()
  await p.keyboard.press('Escape')
  await p.keyboard.press('Control+k')
  await p.getByRole('textbox', { name: 'Search workspace' }).fill('Notion')
  await p.getByRole('textbox', { name: 'Search workspace' }).press('Enter')
  await expect(dialog.getByRole('heading', { name: 'Notion' })).toBeVisible()
  await p.keyboard.press('Escape')
  await navigate(p, 'Overview')
  await p.getByRole('button', { name: 'Prompt library' }).click()
  await p.getByRole('button', { name: 'Tools', exact: true }).click()
  await p.getByRole('button', { name: /Check the time/ }).click()
  await expect(p.getByRole('textbox', { name: 'Message Atlas' })).toHaveValue('What time is it?')
})

test('overview to real streamed tool, history, regenerate, copy and delete', async ({
  page: p,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await p.getByRole('textbox', { name: 'Ask Atlas anything' }).fill('Calculate (27 + 15) * 2')
  await p.getByRole('button', { name: 'Start conversation', exact: true }).click()
  await expect(p).toHaveURL(/\/chat\/[a-z0-9-]+$/)
  await expect(p.locator('.markdown strong')).toHaveText('84')
  await p.reload()
  await expect(p.locator('.markdown strong')).toHaveText('84')
  await p.getByRole('button', { name: 'Regenerate response' }).click()
  await expect(p.locator('.markdown strong')).toHaveText('84')
  await expect(p.locator('.message.user')).toHaveCount(1)
  await p.getByRole('button', { name: 'Copy response' }).click()
  await expect.poll(() => p.evaluate(() => navigator.clipboard.readText())).toContain('84')
  const downloadEvent = p.waitForEvent('download')
  await p.getByRole('button', { name: 'Export chat' }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toMatch(/^atlas-chat-.*\.md$/)
  const content = await readFile((await download.path())!, 'utf8')
  expect(content).toContain('## You\n\nCalculate (27 + 15) * 2')
  expect(content).toContain('**84**')
  await p.getByRole('button', { name: 'Conversation history', exact: true }).click()
  await p.getByRole('button', { name: /^Delete Calculate/ }).click()
  await p.getByRole('button', { name: 'Confirm delete' }).click()
  await expect(p.getByRole('heading', { name: 'Where shall we begin?' })).toBeVisible()
})

test('file approvals and bounded text attachments', async ({ page: p }) => {
  await navigate(p, 'Chat')
  const input = p.getByRole('textbox', { name: 'Message Atlas' })
  await input.fill('Write personal.txt: An approved note.')
  await input.press('Enter')
  await p.getByRole('button', { name: 'Approve creation' }).click()
  await expect(p.getByText('Approved · File created')).toBeVisible()
  await input.fill('read personal.txt')
  await input.press('Enter')
  await expect(
    p.locator('.markdown p').getByText('An approved note.', { exact: true }),
  ).toBeVisible()
  await p.locator('input[type=file]').setInputFiles({
    name: 'notes.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('One two three\nFour five'),
  })
  await input.fill('Analyze my notes')
  await input.press('Enter')
  await expect(p.getByText(/contains 5 words across 2 lines/)).toBeVisible()
})

test('manual workflow runs, pauses, resumes and persists history', async ({ page: p }) => {
  await navigate(p, 'Automations')
  await p.getByRole('button', { name: /Quick calculation.*Calculate the same/ }).click()
  await p.getByLabel('Workflow name', { exact: true }).fill('Weekly arithmetic')
  await p.getByLabel('Expression', { exact: true }).fill('19 * 2')
  await p.getByRole('button', { name: 'Create workflow', exact: true }).click()
  await p.getByRole('button', { name: 'Run now' }).click()
  await expect(p.getByText('19 * 2 = 38', { exact: true })).toBeVisible()
  await p.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect(p.getByRole('button', { name: 'Run now' })).toBeDisabled()
  await p.getByRole('button', { name: 'Resume', exact: true }).click()
  await expect(p.getByRole('button', { name: 'Run now' })).toBeEnabled()
  await p.reload()
  await expect(p.getByText('19 * 2 = 38', { exact: true })).toBeVisible()
  await p.keyboard.press('Escape')
  await navigate(p, 'Overview')
  await p.getByRole('button', { name: 'Workspace overview' }).click()
  await expect(
    p.locator('.stat').filter({ hasText: 'Workflow runs' }).locator('strong'),
  ).toHaveText('1')
  await expect(p.locator('.summary-run')).toContainText('Weekly arithmetic')
  await expect(p.locator('.summary-run')).toContainText('complete')
})

test('profile, color mode and privacy preferences survive reload', async ({ page: p }) => {
  await navigate(p, 'Settings')
  await p.getByLabel('Display name', { exact: true }).fill('Ada')
  await p.getByRole('button', { name: 'dark', exact: true }).click()
  await p.getByRole('button', { name: 'Save changes' }).click()
  await expect(p.locator('html')).toHaveAttribute('data-theme', 'dark')
  await p.getByRole('button', { name: 'Privacy & security', exact: true }).click()
  await p.getByRole('switch', { name: 'Allow external tools' }).click()
  await p.getByRole('button', { name: 'Save changes' }).click()
  await expect(p.getByText('Preferences are up to date.')).toBeVisible()
  await navigate(p, 'Overview')
  await expect(p.locator('.studio-greeting .hello-line')).toContainText('Ada')
  await p.reload()
  await expect(p.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(p.locator('.studio-greeting .hello-line')).toContainText('Ada')
  await p.getByRole('button', { name: 'Web search' }).click()
  await expect(p.getByText(/External tools are disabled in Settings/)).toBeVisible()
  await p.getByRole('button', { name: 'Toggle color theme' }).click()
  await expect(p.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('all five pages fit a mobile viewport with working navigation', async ({ page: p }) => {
  await p.setViewportSize({ width: 390, height: 844 })
  for (const name of ['Chat', 'Automations', 'Integrations', 'Settings', 'Overview']) {
    await p.getByRole('button', { name: 'Open navigation' }).click()
    await navigate(p, name)
    await expect(p).toHaveTitle(name + ' · Atlas Workspace')
    await expect(p.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(
      await p.evaluate(() => {
        const main = document.querySelector('main')!
        return (
          main.scrollWidth <= main.clientWidth && document.documentElement.scrollWidth <= innerWidth
        )
      }),
    ).toBe(true)
  }
  await p.getByRole('textbox', { name: 'Ask Atlas anything' }).fill('Calculate 3 * 7')
  await p.getByRole('button', { name: 'Start conversation' }).click()
  await expect(p).toHaveURL(/\/chat\/[a-z0-9-]+$/)
  await p.setViewportSize({ width: 844, height: 390 })
  await expect(p.getByRole('log', { name: 'Conversation messages' })).toContainText('21')
  expect(await p.locator('.chat-scroll').evaluate((e) => e.clientHeight)).toBeGreaterThan(80)
  await expect(p.getByRole('button', { name: 'Send message' })).toBeInViewport()
})

test('Markdown files render highlighted, copyable code without a model key', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const headers = { 'X-Atlas-Request': '1' }
  const request = async (message: string) => {
    const response = await page.request.post('/api/v1/chat', { headers, data: { message } })
    expect(response.ok()).toBe(true)
    return (await response.text())
      .split('\n')
      .filter((s) => s.startsWith('data: '))
      .map((s) => JSON.parse(s.slice(6)))
  }
  const proposal = (await request('Write example.md: ```python\nprint(42)\n```')).find(
    (s) => s.type === 'approval',
  )
  expect(
    (
      await page.request.post('/api/v1/actions/' + proposal.id, {
        headers,
        data: { approve: true },
      })
    ).ok(),
  ).toBe(true)
  const turn = await request('Read example.md')
  await page.goto('/chat/' + turn[0].conversation_id)
  await expect(page.locator('.code-block code.hljs')).toContainText('print(42)')
  await page.locator('.code-block').getByRole('button', { name: 'Copy', exact: true }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('print(42)')
})

test('suggestions edit the draft; attaching from the welcome screen sends real bounded text', async ({
  page: p,
}) => {
  const input = p.getByRole('textbox', { name: 'Ask Atlas anything' })
  await p.getByRole('button', { name: /Analyze a file/ }).click()
  await expect(input).toHaveValue(/Analyze the attached document/)
  await input.press('Shift+Enter')
  await expect(input).toHaveValue(/\n$/)
  await expect(p).toHaveURL(/\/$/)
  const file = p.locator('input[type=file]')
  await file.setInputFiles({
    name: 'oversized.txt',
    mimeType: 'text/plain',
    buffer: Buffer.alloc(32001, 65),
  })
  await expect(p.getByRole('status')).toContainText('32 KB')
  await file.setInputFiles({
    name: 'studio.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('Sun moon stars\nPeach sky'),
  })
  await expect(p.locator('.file-chip')).toHaveText('studio.md')
  await expect(p.getByRole('button', { name: 'Web search' })).toBeDisabled()
  await input.press('Enter')
  await expect(p).toHaveURL(/\/chat\/[a-z0-9-]+$/)
  await expect(p.locator('.markdown')).toContainText('contains 5 words across 2 lines')
  await p.goBack()
  await expect(p.getByRole('heading', { name: 'How can I help you today?' })).toBeVisible()
  await expect(p.getByRole('textbox', { name: 'Ask Atlas anything' })).toBeEmpty()
  await p.getByRole('button', { name: 'Shuffle' }).click()
  await expect(p.getByRole('button', { name: /Create a script/ })).toBeVisible()
  await p.getByRole('button', { name: 'Shuffle' }).click()
  await p.getByRole('button', { name: /Try a calculation/ }).click()
  await expect(input).toHaveValue('Calculate (48 + 12) * 3')
  await p.getByRole('button', { name: 'Workspace overview' }).click()
  await expect(
    p.locator('.stat').filter({ hasText: 'Conversations' }).locator('strong'),
  ).toHaveText('1')
  await p.locator('.summary-thread').click()
  await expect(p.locator('.markdown')).toContainText('contains 5 words across 2 lines')
})

test('agent and search controls reflect real settings; rail and keyboard shortcuts work', async ({
  page: p,
}) => {
  await p.getByRole('button', { name: 'Collapse sidebar' }).click()
  await p.reload()
  await expect(p.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()
  await p.getByRole('button', { name: 'Expand sidebar' }).click()
  await p.getByRole('button', { name: 'Web search' }).click()
  const dlg = p.getByRole('dialog')
  await expect(dlg.getByRole('heading', { name: 'Tavily' })).toBeVisible()
  await expect(dlg.getByText('Available to configure')).toBeVisible()
  await p.keyboard.press('Escape')
  await expect(p.getByRole('button', { name: 'Web search' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await p.getByRole('button', { name: 'Agent mode' }).click()
  await dlg.getByRole('button', { name: /Local tools only/ }).click()
  await expect(p.getByRole('button', { name: 'Local mode' })).toBeVisible()
  await p.reload()
  await p.getByRole('button', { name: 'Atlas Assistant controls' }).click()
  await expect(dlg.getByRole('button', { name: /Local tools only/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await dlg.getByRole('button', { name: 'Model settings' }).click()
  await expect(p.getByRole('combobox', { name: 'Provider', exact: true })).toHaveValue('local')
  await p.getByRole('button', { name: 'Keyboard shortcuts' }).click()
  await expect(dlg.getByText('Insert a new line')).toBeVisible()
  await p.keyboard.press('Escape')
  await p.keyboard.press('Control+j')
  await expect(p.getByRole('heading', { name: 'Where shall we begin?' })).toBeVisible()
  await expect(p.getByRole('textbox', { name: 'Message Atlas' })).toBeEmpty()
})

test('greeting and profile use only the current workspace’s chosen name', async ({
  page: p,
  browser,
}) => {
  const hello = p.locator('.hello-line')
  await expect(hello).toHaveText('Welcome to Atlas')
  await p.getByRole('link', { name: 'Add your name' }).click()
  const name = p.getByRole('textbox', { name: 'Display name' })
  await expect(name).toBeEmpty()
  await expect(name).toBeFocused()
  await name.fill('  Noor Ali  ')
  await p.getByRole('button', { name: 'Save changes' }).click()
  await expect(name).toHaveValue('Noor Ali')
  await navigate(p, 'Chat')
  await expect(hello).toHaveText('Hello, Noor Ali')
  await p.reload()
  await expect(hello).toHaveText('Hello, Noor Ali')
  await expect(p.locator('.profile-name strong')).toHaveText('Noor Ali')
  const other = await browser.newContext()
  try {
    const separate = await other.newPage()
    await separate.goto(new URL('/', p.url()).href)
    await expect(separate.locator('.hello-line')).toHaveText('Welcome to Atlas')
    await expect(separate.locator('.profile-name strong')).toHaveText('Your profile')
  } finally {
    await other.close()
  }
  await navigate(p, 'Settings')
  await name.fill('')
  await p.getByRole('button', { name: 'Save changes' }).click()
  await expect(p.getByText('Preferences are up to date.')).toBeVisible()
  await navigate(p, 'Overview')
  await expect(hello).toHaveText('Welcome to Atlas')
})

// Pause a browser request before transport so even an instant calculator turn
// is observable. Successful turns still run on the real API; no answer is mocked.
async function holdChat(page: Page, action: () => Promise<unknown>) {
  let capture!: (route: Route) => void
  const intercepted = new Promise<Route>((resolve) => {
    capture = resolve
  })
  await page.route('**/api/v1/chat', (route) => capture(route), { times: 1 })
  await action()
  return intercepted
}

test('reply edge follows send, regenerate, error and stop; reduced motion is static', async ({
  page: p,
}) => {
  const pane = p.locator('.main-shell')
  const edge = () =>
    pane.evaluate((el) => {
      const s = getComputedStyle(el, '::after')
      return {
        content: s.content,
        animation: s.animationName,
        paint: s.backgroundImage,
        pointer: s.pointerEvents,
      }
    })
  const idle = () => expect.poll(async () => (await edge()).content).toBe('none')
  const input = p.getByRole('textbox', { name: 'Ask Atlas anything' })
  await input.fill('Calculate 6 * 7')
  await idle()
  const send = await holdChat(p, () => input.press('Enter'))
  await expect(p.getByRole('log')).toHaveAttribute('aria-busy', 'true')
  await expect.poll(async () => (await edge()).animation).toBe('atlas-answer-edge')
  expect((await edge()).paint).toContain('linear-gradient')
  expect((await edge()).pointer).toBe('none')
  await send.continue()
  await expect(p).toHaveURL(/\/chat\/[a-z0-9-]+$/)
  await expect(p.locator('.markdown strong')).toHaveText('42')
  await idle()
  await p.emulateMedia({ reducedMotion: 'reduce' })
  const regen = await holdChat(p, () =>
    p.getByRole('button', { name: 'Regenerate response' }).click(),
  )
  await expect.poll(async () => (await edge()).paint).toContain('linear-gradient')
  expect((await edge()).animation).toBe('none')
  await regen.abort('failed')
  await expect(p.getByText('Response interrupted')).toBeVisible()
  await idle()
  const next = p.getByRole('textbox', { name: 'Message Atlas' })
  await next.fill('What time is it?')
  const pending = await holdChat(p, () => next.press('Enter'))
  await expect(p.getByRole('log')).toHaveAttribute('aria-busy', 'true')
  await p.getByRole('button', { name: 'Stop generation' }).click()
  await pending.abort('aborted')
  await expect(p.getByRole('log')).toHaveAttribute('aria-busy', 'false')
  await idle()
})
