export function parseStringListParam(searchParams: URLSearchParams, name: string) {
  const values = searchParams
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}
