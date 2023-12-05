import mustache from 'mustache'

const template = `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuration Error</title>
  <link rel="stylesheet" href="/css/index.css">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#f9f9f9">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
<body class="bg-red-stripes">
  <div class="max-w-[700px] mx-auto px-2 pt-10">
    <div class="rounded-sm p-5 bg-white border-4 border-red-500">
      <h1 class="mb-5 text-xl font-bold text-red-500">{{title}}</h1>
      <p class="mb-5">{{subtitle}}</p>
      {{#body}}
        <code class="block p-4 border border-gray-200 rounded whitespace-pre bg-gray-50 overflow-x-scroll">{{body}}</code>
      {{/body}}
    </div>
  </div>
</body>
</html>
`.trim()

export function errorPageTemplate(opts: {
  title?: string
  subtitle: string
  body?: string
}): string {
  return mustache.render(template, {
    title: opts.title || 'Configuration Error',
    subtitle: opts.subtitle,
    body: opts.body || null,
  })
}
