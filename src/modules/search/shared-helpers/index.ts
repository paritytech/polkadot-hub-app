// [#Ran-dom Tag_123]
export const TAG_ELEMENTS_REGEXP = /\[\#([\w\d\s\-_\/\.]+)\]/g

export const useTagSyntax = (tagName: string): string => `[#${tagName}]`

export const findTags = <T extends { name: string; altNames: string[] }>(
  tags: T[],
  query: string,
  ignoreNames: string[] = []
): T[] => {
  const q = query.toLowerCase().trim()
  // run `filter` if only query is more than 2 characters length
  return q.length > 2
    ? tags
        .filter(
          (x) => x.name.toLowerCase().includes(q) || x.altNames.includes(q)
        )
        .filter((x) => !ignoreNames.includes(x.name))
    : []
}
