import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { default: worker } = await import("../src/index.js");

const src = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const APEX = "https://waltontourism.org";
const DASH = /[\u2012\u2013\u2014\u2015]|&mdash;|&ndash;/;

function mailbox() {
  const sent = [];
  return {
    sent,
    EMAIL: {
      async send(message) {
        sent.push(message);
      },
    },
  };
}

function get(path, base = APEX) {
  return worker.fetch(new Request(base + path), mailbox());
}

function post(path, fields, env = mailbox(), base = APEX, ctx) {
  return worker.fetch(new Request(base + path, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  }), env, ctx);
}

test("PREVIEW is the single indexing switch and launch copy is present", () => {
  assert.equal(src.split("const PREVIEW = false").length - 1, 1);
  assert.equal(src.includes("const PREVIEW = true"), false);
  assert.ok(src.includes('return "index, follow"'));
  assert.ok(src.includes("Disallow: /login"));
  assert.ok(src.includes("Disallow: /received"));
  assert.ok(src.includes("marc@whpinc.com"));
  assert.ok(src.includes("hello@waltontourism.org"));
  assert.equal(src.includes("2911studio.com"), false);
  assert.ok(src.includes("Walton County Tourism Network"));
});

test("homepage renders the network, priorities, and is indexable", async () => {
  const res = await get("/");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-robots-tag"), null);
  assert.match(res.headers.get("content-type"), /text\/html/);
  const html = await res.text();
  assert.match(html, /<title>Walton County Tourism Network<\/title>/);
  assert.match(html, /A Unified Voice for Walton County's Tourism Economy\./);
  assert.match(html, /class="hero-logo">\s*<p class="hero-tagline">Advocating for Walton County's Tourism Industry\. Protecting Your Interests\.<\/p>\s*<img /);
  assert.match(html, /class="hero-note">We advocate and lobby on the issues that affect tourism in Walton County\.<\/p>/);
  assert.equal(html.includes("Free membership, subject to administrator approval."), false);
  assert.match(html, /Join the Network/);
  assert.match(html, /Explore Our Priorities/);
  assert.match(html, /we push back/);
  assert.match(html, /independent of both/);
  assert.match(html, /Gulf of America/);
  assert.equal(html.includes("Gulf of Mexico"), false);
  assert.match(html, /To unite and represent Walton County businesses that depend on tourism/);
  for (const num of ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]) {
    assert.ok(html.includes(`>${num}<`), num);
  }
  assert.match(html, /Tourism Development Tax Accountability/);
  assert.match(html, /Restaurants &amp; Bars/);
  assert.match(html, /Tourism Support Services/);
  assert.match(html, /Members only/);
  assert.equal(html.includes("Tourism tax spending"), false);
  assert.match(html, /Current Issues/);
  assert.equal(html.includes("Submit Your Feedback"), false);
  assert.equal(html.includes("Layout sample"), false);
  assert.equal(html.includes("Membership is not limited"), false);
  assert.equal(html.includes("News and events"), false);
  assert.equal(html.includes("Business directory"), false);
  assert.match(html, /member discussion area/);
  assert.match(html, /email alerts when tourism items appear on county agendas/);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/waltontourism\.org\/">/);
  assert.match(html, /property="og:url" content="https:\/\/waltontourism\.org\/"/);
  assert.equal(html.includes("waltonbuildersnetwork.org"), false);
  assert.match(html, /class="nav-login" href="https:\/\/waltonleaders\.org\/login\/tourism">Login<\/a>/);
  assert.match(html, /class="button" href="https:\/\/waltonleaders\.org\/login\/tourism">Sign in<\/a>/);
  assert.equal(html.split("waltonleaders.org").length - 1, 2);
  assert.equal(html.includes("googletagmanager"), true);
  assert.match(html, /fbq\('init', '1770263524034778'\);/);
  assert.match(html, /fbq\('track', 'PageView'\);/);
  assert.match(html, /https:\/\/connect\.facebook\.net\/en_US\/fbevents\.js/);
  assert.match(html, /https:\/\/www\.facebook\.com\/tr\?id=1770263524034778&ev=PageView&noscript=1/);
  assert.equal(DASH.test(html), false);
  assert.match(html, /name="company_fax"/);
  assert.match(html, /href="https:\/\/www\.facebook\.com\/groups\/waltontourism"/);
});

test("join, login, and thank-you pages render without dashes or a pixel", async () => {
  const indexable = ["/join"];
  const noindexPages = ["/received", "/received?for=join"];
  for (const path of [...indexable, ...noindexPages]) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.equal(res.headers.get("x-robots-tag"), null, path);
    const html = await res.text();
    assert.equal(DASH.test(html), false, path);
    assert.equal(html.includes("Gulf of Mexico"), false, path);
    assert.equal(html.includes("googletagmanager"), true, path);
    const leadPage = path === "/received?for=join";
    assert.equal(html.includes("fbevents"), leadPage, path);
    assert.equal(html.includes("fbq('track', 'Lead');"), leadPage, path);
    assert.equal(html.includes("facebook.com/tr"), leadPage, path);
    assert.match(html, /https:\/\/waltontourism\.org/, path);
    assert.equal(html.includes("waltonbuildersnetwork.org"), false, path);
    const robots = indexable.includes(path) ? "index, follow" : "noindex, nofollow";
    assert.match(html, new RegExp(`<meta name="robots" content="${robots}">`), path);
  }
  const join = await (await get("/join")).text();
  assert.match(join, /Request membership/);
  assert.equal(join.includes("Advocating for Walton County"), false);
  assert.equal(join.includes("We advocate and lobby"), false);
  assert.match(join, /Membership is free\. Tell us who you are/);
  assert.match(join, /push back/);
  assert.match(join, /name="years_in_walton"/);
  assert.match(join, /name="industry"/);
  assert.match(join, /Industry or type of tourism business/);
  assert.match(join, /name="company_fax"/);
  for (const path of ["/login", "/login?notice=1", "/login.html"]) {
    const login = await get(path);
    assert.equal(login.status, 302, path);
    assert.equal(login.headers.get("location"), "https://waltonleaders.org/login/tourism", path);
  }
  const thanks = await (await get("/received?for=join")).text();
  assert.match(thanks, /Thank you for your application\./);
  const contactThanks = await (await get("/received")).text();
  assert.match(contactThanks, /Thank you for getting in touch\./);
});

test("login rejects an empty attempt and shows the notice for any complete attempt", async () => {
  const bad = await post("/login", { email: "not-an-email", password: "secret" });
  assert.equal(bad.status, 400);
  assert.match(await bad.text(), /Please enter your email and password\./);

  const ok = await post("/login", { email: "owner@example.com", password: "anything" });
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get("location"), APEX + "/login?notice=1");
});

test("contact validation, honeypot, and mail", async () => {
  const env = mailbox();
  const bad = await post("/contact", { name: "Ada", email: "ada@example.com", message: "   " }, env);
  assert.equal(bad.status, 400);
  assert.equal(env.sent.length, 0);
  assert.match(await bad.text(), /Please fill in your name, a valid email, and a message\./);

  const honey = mailbox();
  const skipped = await post("/contact", {
    name: "Ada",
    email: "ada@example.com",
    message: "Hello",
    company_fax: "spam",
  }, honey);
  assert.equal(skipped.status, 303);
  assert.equal(skipped.headers.get("location"), APEX + "/received?for=contact");
  assert.equal(honey.sent.length, 0);

  const good = mailbox();
  const sent = await post("/contact", {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "We need a voice on the parking item.",
  }, good);
  assert.equal(sent.status, 303);
  assert.equal(sent.headers.get("location"), APEX + "/received?for=contact");
  assert.equal(good.sent.length, 1);
  const mail = good.sent[0];
  assert.equal(mail.from, "hello@waltontourism.org");
  assert.equal(mail.to, "marc@whpinc.com");
  assert.match(mail.raw, /From: Walton County Tourism Network <hello@waltontourism\.org>/);
  assert.match(mail.raw, /Reply-To: ada@example\.com/);
  assert.match(mail.raw, /Subject: Tourism Network contact/);
  assert.match(mail.raw, /Ada Lovelace/);
  assert.match(mail.raw, /parking item/);
});

test("join validation, honeypot, mail, and send failure", async () => {
  const incomplete = mailbox();
  const bad = await post("/join", {
    name: "Ada",
    email: "ada@example.com",
    phone: "850-555-0100",
    company: "Gulf Cafe",
    role: "Owner",
    years_in_walton: "12 years",
  }, incomplete);
  assert.equal(bad.status, 400);
  assert.equal(incomplete.sent.length, 0);
  assert.match(await bad.text(), /Please fill in all required fields with a valid email\./);

  const honey = mailbox();
  const skipped = await post("/join", {
    name: "Ada",
    email: "ada@example.com",
    phone: "850-555-0100",
    company: "Gulf Cafe",
    role: "Owner",
    industry: "Restaurant",
    years_in_walton: "12 years",
    company_fax: "filled",
  }, honey);
  assert.equal(skipped.status, 303);
  assert.equal(skipped.headers.get("location"), APEX + "/received?for=join");
  assert.equal(honey.sent.length, 0);

  const good = mailbox();
  const sent = await post("/join", {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "850-555-0100",
    company: "Gulf Cafe",
    role: "Owner",
    industry: "Restaurant",
    years_in_walton: "12 years",
    website: "",
    about: "I want a group that will push back when fees land on restaurants.",
  }, good);
  assert.equal(sent.status, 303);
  assert.equal(good.sent.length, 1);
  const raw = good.sent[0].raw;
  assert.match(raw, /Subject: Tourism Network membership application/);
  assert.match(raw, /Industry or type of tourism business: Restaurant/);
  assert.match(raw, /How long in Walton County: 12 years/);
  assert.match(raw, /Business website: \(not provided\)/);
  assert.match(raw, /push back when fees/);
  assert.equal(raw.includes("company_fax"), false);

  const broken = {
    EMAIL: {
      async send() {
        throw new Error("mailbox down");
      },
    },
  };
  const failed = await post("/contact", {
    name: "Ada",
    email: "ada@example.com",
    message: "Hello",
  }, broken);
  assert.equal(failed.status, 200);
  const failHtml = await failed.text();
  assert.match(failHtml, /We could not send that just now\./);
  assert.equal(DASH.test(failHtml), false);
});

test("robots.txt allows crawling and the sitemap uses the apex", async () => {
  const robots = await get("/robots.txt");
  assert.equal(robots.status, 200);
  assert.equal(robots.headers.get("x-robots-tag"), null);
  const body = await robots.text();
  assert.match(body, /User-agent: \*\nAllow: \/\n/);
  assert.match(body, /Disallow: \/login\n/);
  assert.match(body, /Disallow: \/received\n/);
  assert.match(body, /Sitemap: https:\/\/waltontourism\.org\/sitemap\.xml/);
  assert.equal(body.includes("Disallow: /\n"), false);

  const map = await get("/sitemap.xml");
  assert.equal(map.status, 200);
  const xml = await map.text();
  assert.match(xml, /<loc>https:\/\/waltontourism\.org\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/waltontourism\.org\/join<\/loc>/);
  assert.equal(xml.includes("waltonbuildersnetwork.org"), false);
});


test("the homepage CSP allows the Meta Pixel and includes GA4", async () => {
  const res = await get("/");
  const csp = res.headers.get("content-security-policy");
  assert.match(csp, /script-src[^;]*https:\/\/connect\.facebook\.net/);
  assert.match(csp, /connect-src[^;]*https:\/\/connect\.facebook\.net/);
  assert.match(csp, /img-src[^;]*https:\/\/www\.facebook\.com/);
  assert.match(csp, /connect-src[^;]*https:\/\/www\.facebook\.com/);
  assert.equal(csp.includes("googletagmanager"), true);
  assert.equal(csp.includes("google-analytics"), true);
});

test("www, http, and trailing slashes redirect to the apex", async () => {
  const both = await worker.fetch(new Request("http://www.waltontourism.org/join/"), mailbox());
  assert.equal(both.status, 301);
  assert.equal(both.headers.get("location"), APEX + "/join");

  const insecure = await worker.fetch(new Request("http://waltontourism.org/"), mailbox());
  assert.equal(insecure.status, 301);
  assert.equal(insecure.headers.get("location"), APEX + "/");

  const slash = await worker.fetch(new Request(APEX + "/login/"), mailbox());
  assert.equal(slash.status, 301);
  assert.equal(slash.headers.get("location"), APEX + "/login");

  const local = await worker.fetch(new Request("http://127.0.0.1:43123/"), mailbox());
  assert.equal(local.status, 200);

  const localSlash = await worker.fetch(new Request("http://127.0.0.1:43123/join/"), mailbox());
  assert.equal(localSlash.status, 301);
  assert.equal(localSlash.headers.get("location"), "http://127.0.0.1:43123/join");
});

test("logo, favicon, and apple touch icon are served from the worker", async () => {
  const logo = await get("/assets/walton-county-tourism-network-logo.webp");
  assert.equal(logo.status, 200);
  assert.equal(logo.headers.get("content-type"), "image/webp");
  const logoBytes = new Uint8Array(await logo.arrayBuffer());
  assert.ok(logoBytes.length > 1000);
  assert.equal(String.fromCharCode(...logoBytes.slice(0, 4)), "RIFF");

  const favicon = await get("/favicon.png");
  assert.equal(favicon.headers.get("content-type"), "image/png");
  const faviconBytes = new Uint8Array(await favicon.arrayBuffer());
  assert.equal(faviconBytes[0], 0x89);
  assert.equal(faviconBytes[1], 0x50);

  const apple = await get("/apple-touch-icon.png");
  assert.equal(apple.status, 200);
  assert.equal(apple.headers.get("content-type"), "image/png");
  assert.ok((await apple.arrayBuffer()).byteLength > 1000);
});

test("unknown paths 404 and other methods are rejected", async () => {
  const missing = await get("/members");
  assert.equal(missing.status, 404);
  const denied = await worker.fetch(new Request(APEX + "/join", { method: "PUT" }), mailbox());
  assert.equal(denied.status, 405);
});

test("every page header keeps Login visible and the other links behind a menu button", async () => {
  for (const path of ["/", "/join", "/received"]) {
    const html = await (await get(path)).text();
    assert.match(html, /<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav-menu">/, path);
    assert.match(html, /id="site-nav-menu"/, path);
    assert.match(html, /class="nav-login" href="https:\/\/waltonleaders\.org\/login\/tourism">Login<\/a>/, path);
    assert.match(html, /href="\/join">Join the mission<\/a>/, path);
    assert.match(html, /id="site-nav-menu" class="nav-menu">\s*<a href="(?:\/)?#about">About<\/a>\s*<a href="(?:\/)?#issues">Issues<\/a>/, path);
    assert.equal(html.includes("onclick="), false, path);
    assert.equal(html.includes("onkeydown="), false, path);
    assert.equal(html.includes("onkeyup="), false, path);
    assert.match(html, /button\.addEventListener\("click"/, path);
    assert.equal(DASH.test(html), false, path);
  }
});

function hubEnv(extra = {}) {
  return Object.assign(mailbox(), {
    HUB_URL: "https://waltonleaders.org/api/hub/applications",
    HUB_INGEST_KEY: "test-hub-key",
  }, extra);
}

function trackCtx() {
  const jobs = [];
  return {
    jobs,
    waitUntil(promise) {
      jobs.push(promise);
    },
  };
}

const JOIN_FIELDS = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "850-555-0100",
  company: "Gulf Cafe",
  role: "Owner",
  industry: "Restaurant",
  years_in_walton: "12 years",
  website: "",
  about: "I want a group that will push back when fees land on restaurants.",
  company_fax: "",
};

test("a valid join is emailed and forwarded to the hub", async () => {
  const calls = [];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const original = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    calls.push({ input, init });
    return gate.then(() => new Response(null, { status: 204 }));
  };
  try {
    const env = hubEnv();
    const ctx = trackCtx();
    const sent = await post("/join", JOIN_FIELDS, env, APEX, ctx);
    assert.equal(sent.status, 303);
    assert.equal(sent.headers.get("location"), APEX + "/received?for=join");
    assert.equal(env.sent.length, 1);
    assert.match(env.sent[0].raw, /Subject: Tourism Network membership application/);
    assert.match(env.sent[0].raw, /To: marc@whpinc.com/);
    assert.equal(env.sent[0].raw.includes("company_fax"), false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].input, "https://waltonleaders.org/api/hub/applications");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(calls[0].init.headers["X-Hub-Key"], "test-hub-key");
    assert.equal(calls[0].init.headers["Content-Type"], "application/json");
    assert.ok(calls[0].init.signal instanceof AbortSignal);
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.network, "tourism");
    assert.equal(body.name, "Ada Lovelace");
    assert.equal(body.email, "ada@example.com");
    assert.equal(body.source_url, APEX + "/join");
    assert.match(body.submitted_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.deepEqual(body.fields, JOIN_FIELDS);
    release();
    await Promise.all(ctx.jobs);
  } finally {
    release();
    globalThis.fetch = original;
  }
});

test("contact stays email only and a hub failure still accepts the join", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response("no", { status: 502 });
  };
  try {
    const contactEnv = hubEnv();
    const contactCtx = trackCtx();
    const contact = await post("/contact", {
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello from the footer.",
    }, contactEnv, APEX, contactCtx);
    assert.equal(contact.status, 303);
    assert.equal(contact.headers.get("location"), APEX + "/received?for=contact");
    assert.equal(contactEnv.sent.length, 1);
    assert.match(contactEnv.sent[0].raw, /Subject: Tourism Network contact/);
    await Promise.all(contactCtx.jobs);
    assert.equal(calls.length, 0);

    const failedEnv = hubEnv();
    const failedCtx = trackCtx();
    const failed = await post("/join", JOIN_FIELDS, failedEnv, APEX, failedCtx);
    assert.equal(failed.status, 303);
    assert.equal(failedEnv.sent.length, 1);
    assert.match(failedEnv.sent[0].raw, /Subject: Tourism Network membership application/);
    await Promise.all(failedCtx.jobs);
    assert.equal(calls.length, 1);
    const ctx = trackCtx();
    const env = hubEnv();
    globalThis.fetch = async () => {
      calls.push("throw");
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    };
    const timedOut = await post("/join", JOIN_FIELDS, env, APEX, ctx);
    assert.equal(timedOut.status, 303);
    assert.equal(env.sent.length, 1);
    await Promise.all(ctx.jobs);

    const missing = hubEnv({ HUB_INGEST_KEY: "" });
    const missingCtx = trackCtx();
    const before = calls.length;
    const skipped = await post("/join", JOIN_FIELDS, missing, APEX, missingCtx);
    assert.equal(skipped.status, 303);
    assert.equal(missing.sent.length, 1);
    await Promise.all(missingCtx.jobs);
    assert.equal(calls.length, before);

    const broken = hubEnv({
      EMAIL: {
        async send() {
          throw new Error("mailbox down");
        },
      },
    });
    const brokenCtx = trackCtx();
    const beforeBroken = calls.length;
    const mailFailed = await post("/join", JOIN_FIELDS, broken, APEX, brokenCtx);
    assert.equal(mailFailed.status, 200);
    assert.match(await mailFailed.text(), /We could not send that just now\./);
    await Promise.all(brokenCtx.jobs);
    assert.equal(calls.length, beforeBroken);
    assert.equal(brokenCtx.jobs.length, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("wrangler publishes HUB_URL and leaves observability in place", () => {
  const toml = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");
  assert.match(toml, /\[observability\]\nenabled = true\n\n\[observability\.logs\]\nhead_sampling_rate = 1\n\n\[observability\.traces\]\nenabled = true\nhead_sampling_rate = 1\n/);
  assert.match(toml, /\[vars\]\nHUB_URL = "https:\/\/waltonleaders\.org\/api\/hub\/applications"\n/);
  assert.match(toml, /\[\[send_email\]\]\nname = "EMAIL"\ndestination_address = "marc@whpinc.com"\nallowed_sender_addresses = \["hello@waltontourism.org"\]\n/);
  assert.equal(toml.includes("2911studio.com"), false);
  assert.equal(toml.includes("HUB_INGEST_KEY ="), false);
  assert.equal(toml.includes("[[routes]]"), false);
  assert.equal(toml.includes("\nroute "), false);
  assert.equal(toml.includes("const PREVIEW"), false);
});

test("styles.css is loaded from the pinned builders commit", async () => {
  const res = await get("/styles.css");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/css/);
  const css = await res.text();
  assert.match(css, /Cormorant Garamond/);
  assert.match(css, /#001840/);
  assert.equal(res.headers.get("x-robots-tag"), null);
});
