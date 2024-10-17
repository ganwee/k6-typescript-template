export function objToQueryString(obj: any) {
  if (!obj) return;

  return (
    "?" +
    Object.keys(obj)
      .map(
        (key) => encodeURIComponent(key) + "=" + encodeURIComponent(obj[key])
      )
      .join("&")
  );
}

export function formatObjectToJSON(str: string): string {
  str = str.replace(/'/g, '"');
  // Use a regular expression to match unquoted keys and add double quotes
  return str.replace(/([{,])([a-zA-Z_][a-zA-Z0-9_]*)(:)/g, '$1"$2"$3');
}
