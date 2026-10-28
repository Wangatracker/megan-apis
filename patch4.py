import shutil, sys
p = "schema.ts"
raw = open(p, encoding="utf-8").read()
s = raw.replace("\r\n", "\n")
if "nightNsfwEndpoints" in s:
    sys.exit("Already patched")
A1 = "export const allEndpoints: ApiEndpoint[] = ["
A2 = "  ...nightEndpoints,\n"
for a in (A1, A2):
    if s.count(a) != 1:
        sys.exit("Anchor problem, nothing changed: " + repr(a))
block = '''const nightNsfwEndpoints: ApiEndpoint[] = NIGHT_NSFW.map((t) =>
  nE(`/api/v2/night/nsfw/${t}`, "GET", `Random ${t} image (18+). Requires adult=true.`, [nAdult], "adult-images", 30)
);

'''
s = s.replace(A1, block + A1, 1)
s = s.replace(A2, A2 + "  ...nightNsfwEndpoints,\n", 1)
if "\r\n" in raw:
    s = s.replace("\n", "\r\n")
shutil.copy2(p, p + ".bak4")
open(p, "w", encoding="utf-8").write(s)
print("Patched (backup: schema.ts.bak4)")
