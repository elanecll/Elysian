import fs from "fs";

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

async function main() {
  const parts = [];
  
  parts.push({
    text: `You are an expert aesthetic cosmeceutical specialist.
I am providing images of 30 CLINICCARE skincare products numbered from 0 to 29.
For each image, examine the label and packaging carefully.

For each numbered image from 0 to 29, output EXACTLY ONE line in this format:
IMAGE_INDEX | Full Product Name | Range Name | Category | Size/Volume | Suggested UK Price | Tagline or Key Function | Detailed Description

Ranges should be one of:
- "EGF Pure" (for blemish, acne-prone, oily, irritated skin)
- "EGF Glow" (for brightening, dullness, hyperpigmentation, uneven tone)
- "EGF Tight" or "EGF Refresh" (for firming, lifting, wrinkles, anti-ageing)
- "Dermo Corrective & Sun" (SPF CC creams, Sun Shield SPF30)
- "Cleansing & Peeling" (Foaming cleanser, painless peel, concentrated cleansing foam)
- "Biomimetic Masks" (Hydrogel sheet masks, EGF masks)
- "Lip & Eye" (Lip & Eye renewal complex)
- "Specialised Care" (Hyal essence, hair, essence, etc.)

Categories must be one of: "sunscreen", "serums", "cleansers", "masks", "daily", "body"
Prices in GBP (e.g. £10 for single sheet masks, £38 - £62 for 50ml/100ml professional bottles).

Here are the 30 images:`
  });

  for (let i = 0; i < 30; i++) {
    const fn = `/tmp/small_imgs/${String(i).padStart(2, "0")}.jpg`;
    if (fs.existsSync(fn)) {
      const b64 = fs.readFileSync(fn).toString("base64");
      parts.push({ text: `=== IMAGE ${i} ===` });
      parts.push({ inlineData: { mimeType: "image/jpeg", data: b64 } });
    }
  }

  parts.push({ text: "Now output lines for IMAGE 0 through IMAGE 29 in numerical order:" });

  console.log("Sending single request with all 30 images to Gemini 3.5 Flash...");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] })
  });

  const d = await res.json();
  if (d.error) {
    console.error("API Error:", d.error);
    return;
  }

  const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log("Received response!");
  fs.writeFileSync("/tmp/all_30_identified.txt", text);
  console.log(text);
}

main().catch(console.error);
