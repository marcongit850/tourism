const mockUrl = new URL("./email-mock.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:email") {
    return { url: mockUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
