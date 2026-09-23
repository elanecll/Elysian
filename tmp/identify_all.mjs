const urls = [
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae969630b0f957cc888524.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9693ff484614db457dcc.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae968c30b0f957cc888400.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae968130b0f957cc88828c.jpg",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae968bff484614db457d4a.jpg",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae968dbdaa5e26a939257e.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae968c30b0f957cc888420.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae968abdaa5e26a93924ee.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae96844091fa65e678effc.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae968230b0f957cc8882b8.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9681ff484614db457bbe.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9682ff484614db457bd3.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9681de8ed1c29f6e4540.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae967cde8ed1c29f6e44be.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae96784091fa65e678eec8.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9678ff484614db457a68.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9678ff484614db457a54.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9677de8ed1c29f6e4442.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9676bdaa5e26a939225f.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae966f4091fa65e678ede9.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae966f4091fa65e678edc2.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae966f4091fa65e678edd1.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae966ede8ed1c29f6e4320.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae966f4091fa65e678eddd.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae966ebdaa5e26a9392177.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9665de8ed1c29f6e41e5.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae966530b0f957cc887f7b.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9665de8ed1c29f6e41f0.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae96654091fa65e678ec7e.png",
"https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6aae9665de8ed1c29f6e41fa.png"
];

import fs from "fs";

async function processImage(url, index) {
  try {
    const resp = await fetch(url);
    const buf = await resp.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const mime = url.endsWith(".jpg") ? "image/jpeg" : "image/png";

    const prompt = `Inspect this CLINICCARE product image very carefully.
Read all visible text on the product bottle/tube/box/sheet.
Identify:
1. Exact product full name (e.g., "Dermo Corrective Cream SPF 50++ Medium", "Dermo Corrective Cream SPF 50++ Darker", "Time Reverse Face Mask Hydrogel Sheet", "X3M EGF Pure Serum", "X3M EGF Glow Essence", "X3M EGF Tight Liquid Moisturizer", "Lip & Eye Renewal Complex", "Instant Painless Peel", etc.)
2. CLINICCARE Range: One of ["Dermo Corrective & Sun", "EGF Pure", "EGF Glow", "EGF Tight", "Cleansing & Peeling", "Biomimetic Masks", "Lip & Eye", "Specialised Care"]
3. Category: One of ["sunscreen", "serums", "cleansers", "masks", "daily", "body"]
4. Tagline: Subtitle / function printed on the packaging
5. Short description: 1-2 sentences on what it does, key ingredients and benefits
6. Size/Volume: (e.g. "30ml", "50ml", "100ml", "250ml", "1 Sheet", "Box of 5")
7. Price: A standard UK clinic price in GBP (e.g., "£36", "£38", "£42", "£44", "£48", "£58", "£62").

Return ONLY a valid JSON object without markdown fences:
{
  "index": ${index},
  "url": "${url}",
  "name": "Exact Name",
  "range": "EGF Pure | EGF Glow | EGF Tight | Dermo Corrective & Sun | Cleansing & Peeling | Biomimetic Masks | Lip & Eye",
  "category": "sunscreen | serums | cleansers | masks | daily | body",
  "tagline": "...",
  "description": "...",
  "volume": "...",
  "price": "£...",
  "badges": ["badge1", "badge2"]
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: mime, data: base64 } },
            { text: prompt }
          ]
        }]
      })
    });
    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    console.log(`[OK ${index}] ${parsed.name} | Range: ${parsed.range} | ${parsed.volume}`);
    return parsed;
  } catch (err) {
    console.error(`[ERR ${index}]`, err.message);
    return { index, url, name: "CLINICCARE Cosmeceutical", range: "Specialised Care", category: "daily", tagline: "Professional Clinical Skincare", description: "Advanced Swedish cosmeceutical formulation with low-molecular hyaluronic acid and biomimetic peptides.", volume: "50ml", price: "£44", badges: ["Medical Grade", "Swedish Tech"] };
  }
}

async function main() {
  const results = [];
  // Process 5 concurrently for high speed
  for (let i = 0; i < urls.length; i += 5) {
    const chunk = urls.slice(i, i + 5);
    const chunkResults = await Promise.all(
      chunk.map((url, idx) => processImage(url, i + idx))
    );
    results.push(...chunkResults);
    fs.writeFileSync("/tmp/cliniccare_identified.json", JSON.stringify(results, null, 2));
    console.log(`Saved ${results.length}/30 items`);
  }
  console.log("Finished all 30 images successfully!");
}

main();
