import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderMarkdown, renderWhyArticleBody } from "../src/index.js";

const { default: worker } = await import("../src/index.js");

const src = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const APEX = "https://waltontourism.org";
const DASH = /[\u2012\u2013\u2014\u2015]|&mdash;|&ndash;/;
const TITLE = "Your Tourism Business Could Be Affected by a Decision You Never Knew Was Being Made.";
const DOCUMENT_TITLE = TITLE + " · Walton County Tourism Network";
const DESCRIPTION = "You work hard to keep visitors coming to Walton County. But who's paying attention to the local government decisions that could affect your business?";

const HOME_PARAGRAPHS = [
  "WHY WE EXIST",
  "You're managing employees, handling guest requests, maintaining properties, and keeping your business competitive. Meanwhile, local government continues considering rules, fees, and spending decisions that could affect your livelihood.",
  "Often, the people most affected don't learn about proposed changes until the public discussion is nearly over.",
  "That's why Walton County Tourism Network exists.",
];

const ARTICLE_PARAGRAPHS = [
  DESCRIPTION,
  "Whether you own a vacation rental, manage properties, operate a restaurant, run a hotel, or provide services to visitors, your days are already full.",
  "You're managing employees, handling guest requests, maintaining properties, paying expenses, and keeping your business competitive.",
  "You probably don't spend your evenings reviewing county agendas or reading proposed ordinances.",
  "But those proposals can have real consequences.",
  "New vacation rental restrictions. Higher registration fees. Changes to occupancy rules. Parking regulations. Beach access policies. Additional business requirements. Decisions about how tourism-related tax revenues are spent.",
  "Each decision can affect operating costs, property rights, guest experiences, and the long-term health of Walton County's visitor economy.",
  "And often, the people most affected don't learn about proposed changes until the public discussion is nearly over.",
  "That's the problem.",
  "Tourism businesses are busy serving the very economy that supports thousands of local jobs. They can't realistically monitor every government proposal while managing the daily demands of their businesses.",
  "Meanwhile, even relatively small regulatory changes can accumulate into substantial costs and restrictions over time.",
  "That's why Walton County Tourism Network exists.",
  "We're building a network dedicated to keeping tourism-related businesses informed, increasing awareness of proposed policies, and ensuring that those who depend on our visitor economy have opportunities to participate in decisions affecting their future.",
  "We believe responsible tourism and thriving local communities can coexist. We also believe regulations should be fair, government spending should be transparent, and the rights of property owners and businesses deserve consideration.",
  "Not every proposed regulation is harmful. But every significant proposal deserves scrutiny, open discussion, and input from the people it affects.",
  "You shouldn't find out about a new restriction when it's already too late to have your voice heard.",
  "Our goal is simple: Help make sure you know what's coming before the decisions are final.",
  "Because protecting Walton County's tourism economy starts with knowing what's happening in Walton County.",
  "Walton County Tourism Network",
  "Connect. Advocate. Thrive.",
];

function get(path) {
  return worker.fetch(new Request(APEX + path), { EMAIL: { async send() {} } });
}

function sliceBetween(html, startMark, endMark) {
  const start = html.indexOf(startMark);
  assert.notEqual(start, -1, startMark);
  const end = html.indexOf(endMark, start);
  assert.notEqual(end, -1, endMark);
  return html.slice(start, end);
}

function paragraphs(html) {
  return [...html.matchAll(/<p(?: class="[^"]*")?>([\s\S]*?)<\/p>/g)].map((match) =>
    match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

test("homepage places Why We Exist after the hero and before the about section", async () => {
  const html = await (await get("/")).text();
  const hero = html.indexOf('class="container hero"');
  const section = html.indexOf('<section class="why-exist" id="why-we-exist" aria-labelledby="why-exist-heading">');
  const purpose = html.indexOf('<section class="purpose" id="about">');
  assert.ok(hero < section && section < purpose);
  assert.equal(html.indexOf('class="why-exist"'), html.lastIndexOf('class="why-exist"'));
  const block = sliceBetween(html, '<section class="why-exist"', '<section class="purpose"');
  assert.equal(block.includes('class="eyebrow">WHY WE EXIST</p>'), true);
  assert.match(block, /<h2 id="why-exist-heading">Your Tourism Business Could Be Affected by a Decision You Never Knew Was Being Made\.<\/h2>/);
  assert.deepEqual(paragraphs(block), HOME_PARAGRAPHS);
  assert.match(block, /<p><strong>That's why Walton County Tourism Network exists\.<\/strong><\/p>/);
  assert.equal(block.includes("That's why Walton County Tourism exists."), false);
  assert.match(block, /<a class="button" href="\/why-we-exist">Learn Why We Exist <span aria-hidden="true">→<\/span><\/a>/);
  assert.equal(DASH.test(block), false);
});

test("why we exist is a public article with the site chrome, meta tags, and exact copy", async () => {
  const page = await (await get("/why-we-exist")).text();
  const join = await (await get("/join")).text();
  assert.equal(sliceBetween(page, "<header", "</header>"), sliceBetween(join, "<header", "</header>"));
  assert.equal(
    page.slice(page.lastIndexOf("<footer"), page.indexOf("</footer>", page.lastIndexOf("<footer")) + "</footer>".length),
    join.slice(join.lastIndexOf("<footer"), join.indexOf("</footer>", join.lastIndexOf("<footer")) + "</footer>".length)
  );
  assert.match(page, /<a class="skip-link" href="#why-we-exist">/);
  assert.match(page, /<title>Your Tourism Business Could Be Affected by a Decision You Never Knew Was Being Made\. · Walton County Tourism Network<\/title>/);
  assert.match(page, /<meta name="description" content="You work hard to keep visitors coming to Walton County\. But who's paying attention to the local government decisions that could affect your business\?">/);
  assert.match(page, /<meta name="robots" content="index, follow">/);
  assert.match(page, /<link rel="canonical" href="https:\/\/waltontourism\.org\/why-we-exist">/);
  assert.match(page, /<meta property="og:type" content="website">/);
  assert.match(page, /<meta property="og:site_name" content="Walton County Tourism Network">/);
  assert.match(page, /<meta property="og:title" content="Your Tourism Business Could Be Affected by a Decision You Never Knew Was Being Made\. · Walton County Tourism Network">/);
  assert.match(page, /<meta property="og:description" content="You work hard to keep visitors coming to Walton County\. But who's paying attention to the local government decisions that could affect your business\?">/);
  assert.match(page, /<meta property="og:url" content="https:\/\/waltontourism\.org\/why-we-exist">/);
  assert.match(page, /<meta property="og:image" content="https:\/\/waltontourism\.org\/assets\/walton-county-tourism-network-og\.jpg">/);
  assert.match(page, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(page, /<meta name="twitter:title" content="Your Tourism Business Could Be Affected by a Decision You Never Knew Was Being Made\. · Walton County Tourism Network">/);
  assert.match(page, /<meta name="twitter:description" content="You work hard to keep visitors coming to Walton County\. But who's paying attention to the local government decisions that could affect your business\?">/);
  assert.match(page, /<meta name="twitter:image" content="https:\/\/waltontourism\.org\/assets\/walton-county-tourism-network-og\.jpg">/);
  assert.equal(page.split("<h1>").length - 1, 1);
  assert.match(page, /<h1>Your Tourism Business Could Be Affected by a Decision You Never Knew Was Being Made\.<\/h1>/);
  const article = renderWhyArticleBody();
  assert.deepEqual(paragraphs(article), ARTICLE_PARAGRAPHS);
  assert.equal(DOCUMENT_TITLE, TITLE + " · Walton County Tourism Network");
  assert.equal(DESCRIPTION, ARTICLE_PARAGRAPHS[0]);
  assert.match(article, /<p><strong>You work hard to keep visitors coming to Walton County\. But who's paying attention to the local government decisions that could affect your business\?<\/strong><\/p>/);
  assert.match(article, /<p><strong>That's the problem\.<\/strong><\/p>/);
  assert.match(article, /<p><strong>That's why Walton County Tourism Network exists\.<\/strong><\/p>/);
  assert.equal(article.includes("That's why Walton County Tourism exists."), false);
  assert.match(article, /<p><strong>You shouldn't find out about a new restriction when it's already too late to have your voice heard\.<\/strong><\/p>/);
  assert.match(article, /<p><em>Connect\. Advocate\. Thrive\.<\/em><\/p>/);
  assert.match(article, /<p><strong><a href="https:\/\/waltontourism\.org\/">Walton County Tourism Network<\/a><\/strong><\/p>/);
  assert.equal(article.split("https://waltontourism.org/").length - 1, 1);
  assert.match(page, /<a class="button" href="\/join">Join the Network<\/a>/);
  assert.equal(page.includes("fbevents"), false);
  assert.equal(page.includes("fbq"), false);
  assert.equal(page.includes("googletagmanager"), true);
  assert.equal(DASH.test(page), false);
  assert.equal(DASH.test(article), false);
});

test("article rendering escapes html", () => {
  const html = renderMarkdown('See <script>alert(1)</script> & "quotes"\n');
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&amp;/);
  assert.match(html, /&quot;quotes&quot;/);
  const linked = renderWhyArticleBody("**Walton County Tourism Network**\n\n<script>alert(1)</script>");
  assert.equal(linked.includes("<script>"), false);
  assert.match(linked, /<p><strong><a href="https:\/\/waltontourism\.org\/">Walton County Tourism Network<\/a><\/strong><\/p>/);
});

test("the public route, sitemap, and content security policy include the article", async () => {
  assert.match(src, /if \(path === "\/why-we-exist" \|\| path === "\/why-we-exist\.html"\) return html\(head \? null : whyWeExistPage\(\)\);/);
  assert.equal(src.split("Content-Security-Policy").length - 1, 1);

  const join = await get("/join");
  const response = await get("/why-we-exist");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("content-security-policy"), join.headers.get("content-security-policy"));
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
  assert.equal(response.headers.get("content-security-policy").includes("waltontourism.org"), false);
  const html = await response.text();
  assert.match(html, /<h1>Your Tourism Business Could Be Affected by a Decision You Never Knew Was Being Made\.<\/h1>/);
  assert.match(html, /href="https:\/\/waltontourism\.org\/"/);
  assert.match(html, /<a class="button" href="\/join">Join the Network<\/a>/);

  const alias = await get("/why-we-exist.html");
  assert.equal(alias.status, 200);
  assert.match(await alias.text(), /<h1>Your Tourism Business Could Be Affected by a Decision You Never Knew Was Being Made\.<\/h1>/);

  const head = await worker.fetch(new Request(APEX + "/why-we-exist", { method: "HEAD" }), { EMAIL: { async send() {} } });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("content-security-policy"), response.headers.get("content-security-policy"));

  const slash = await get("/why-we-exist/");
  assert.equal(slash.status, 301);
  assert.equal(slash.headers.get("location"), APEX + "/why-we-exist");

  const sitemap = await get("/sitemap.xml");
  const xml = await sitemap.text();
  assert.match(xml, /<loc>https:\/\/waltontourism\.org\/why-we-exist<\/loc>/);
  assert.match(xml, /<loc>https:\/\/waltontourism\.org\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/waltontourism\.org\/join<\/loc>/);
});
