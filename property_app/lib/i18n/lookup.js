/**
 * @param {Record<string, unknown>} dict
 * @param {string} path
 * @param {Record<string, string | number>} [vars]
 * @returns {string | undefined}
 */
export function lookup(dict, path, vars) {
  if (!dict || !path) return undefined;
  const value = path.split(".").reduce((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return acc[key];
  }, dict);
  if (typeof value !== "string") return undefined;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`,
  );
}
