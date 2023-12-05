import { marked } from 'marked'

marked.setOptions({
  headerIds: false,
})

marked.use({
  renderer: {
    code(code) {
      return `<pre class="text-red-500 bg-red-50 px-2 rounded font-mono mt-2 overflow-y-scroll">${code}</pre>`
    },
    heading(text, level) {
      let cn = 'font-bold '
      switch (level) {
        case 1:
          cn += 'font-extra text-lg mb-5 mt-8 leading-8'
          break
        case 2:
          cn += 'font-extra text-base leading-5 mb-5 mt-8 '
          break
        default:
          cn += 'font-bold mb-2 mt-4'
          break
      }
      return `<h${level} class="${cn}">${text}</h${level}>`
    },
    paragraph(text) {
      return `<p class="text-base mt-2">${text}</p>`
    },
    image(href, title, text) {
      return `<p class="mt-2"><img src="${href}" class="block w-full rounded-tiny" alt="${
        text || ''
      }" title="${title || ''}"></p>`
    },
    codespan(code) {
      return `<code class="text-red-500 bg-red-50 p-1 rounded font-mono">${code}</code>`
    },
    link(href, _title, text) {
      return `<a href="${href}" target="_blank" class="text-purple-400 hover:text-purple-600 focus-visible:ring-purple-100 focus-visible:ring-2 underline">${text}</a>`
    },
    hr() {
      return `<hr class="bg-applied-separator mt-4">`
    },
    blockquote(quote) {
      return `<blockquote class="pl-3 border-l-2 border-gray-300">${quote}</blockquote>`
    },
    list(body, ordered) {
      const tag = ordered ? 'ol' : 'ul'
      const cn = ordered ? 'list-decimal' : 'list-disc'
      return `<${tag} class="${cn} pl-4">${body}</${tag}>`
    },
    // TODO: support tables
    table() {
      return ``
    },
    // tablerow(content) {},
    // tablecell(content, flags) {},
  },
})

export const renderMarkdown = (markdownString: string): string =>
  marked.parse(markdownString)

export const renderInlineMarkdown = (markdownString: string): string =>
  marked.parseInline(markdownString)
