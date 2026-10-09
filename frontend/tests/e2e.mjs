import assert from "node:assert/strict";
import { chromium } from "playwright";

// Run only against the separate seeded QA database described in README.
const base=process.env.E2E_BASE_URL||"http://localhost:3001";
const api=process.env.E2E_API_URL||"http://127.0.0.1:8001/api";
const browser=await chromium.launch({channel:process.env.E2E_BROWSER||"chrome",headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on("pageerror",e=>errors.push(e.message));
const title=`Browser QA ${Date.now()}`;
let createdId;
async function visible(locator){await locator.waitFor({state:"visible"});}
async function poll(fn){for(let i=0;i<50;i++){if(await fn())return;await page.waitForTimeout(100);}throw new Error("Condition did not become true");}
if(process.argv.includes("--timestamp-only")){
  try{
    const response=await fetch(`${api}/meetings`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,meeting_date:"2026-10-09",duration:60,participants:["Bob"],transcript_text:"[00:00] Bob: Hello.\n[00:15] Bob: The nebula milestone is approved."})});
    assert.equal(response.status,201);createdId=(await response.json()).id;
    await page.goto(`${base}/meetings/${createdId}`);
    await visible(page.getByTestId("player-time"));
    await page.getByRole("button",{name:/Search all meetings/}).click();
    await page.getByLabel("Global search",{exact:true}).fill("nebula milestone");
    await page.getByRole("link",{name:/Jump to 0:15/}).click();
    await page.waitForURL(url=>url.searchParams.get("t")==="15");
    await poll(async()=>await page.getByTestId("player-time").textContent()==="0:15");
    await page.reload();
    await poll(async()=>await page.getByTestId("player-time").textContent()==="0:15");
    console.log("PASS: global-search timestamp navigation and refresh");
  }catch(e){console.error(`FAIL: ${e.message}; URL=${page.url()}; player=${await page.getByTestId("player-time").textContent().catch(()=>"unavailable")}`);process.exitCode=1;}
  finally{if(createdId)await fetch(`${api}/meetings/${createdId}`,{method:"DELETE"});await browser.close();}
  process.exit(process.exitCode||0);
}
try{
  await page.goto(base);
  await visible(page.getByRole("link",{name:/Q4 Product/}));
  await page.getByLabel("Filter by participant").fill("Maya");
  await poll(async()=>await page.locator("article").count()===2);
  await page.getByRole("button",{name:"Clear all filters"}).click();
  await poll(async()=>await page.locator("article").count()===5);
  await page.getByRole("button",{name:"Grid view"}).click();
  await visible(page.getByRole("heading",{name:/Q4 Product/}));
  await page.getByRole("button",{name:"List view"}).click();
  await page.screenshot({path:"test-results/dashboard-desktop.png",fullPage:true});
  await page.getByRole("button",{name:"Add meeting",exact:true}).click();
  await page.getByLabel("Meeting title",{exact:true}).fill(title);
  await page.getByLabel("Duration (minutes)").fill("1");
  await page.getByLabel("Upload transcript").setInputFiles({name:"conversation.vtt",mimeType:"text/vtt",buffer:Buffer.from("WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n<v Ada>Hello launch team.</v>\n\n00:00:15.000 --> 00:01:00.000\n<v Bob>The nebula milestone is approved.</v>")});
  await page.getByRole("button",{name:"Create meeting",exact:true}).click();
  await visible(page.getByRole("link",{name:new RegExp(title)}));
  createdId=(await (await fetch(`${api}/meetings?search=${encodeURIComponent(title)}`)).json())[0].id;
  await page.getByRole("link",{name:new RegExp(title)}).click();
  await page.getByRole("button",{name:"Seek to 0:15: Bob"}).click();
  assert.equal(await page.getByTestId("player-time").textContent(),"0:15");
  assert.equal(await page.locator('[data-active="true"]').count(),1);
  const seek=page.getByRole("slider",{name:"Meeting playback position"});
  await seek.fill("12");
  assert.equal(await page.locator('[data-active="true"]').count(),0);
  await seek.fill("3");
  assert.match(await page.locator('[data-active="true"]').textContent(),/Ada/);
  await page.getByRole("button",{name:"Play",exact:true}).click();
  await poll(async()=>await page.getByTestId("player-time").textContent()!=="0:03");
  await page.getByRole("button",{name:"Pause",exact:true}).click();
  const paused=await page.getByTestId("player-time").textContent();
  await page.waitForTimeout(400);
  assert.equal(await page.getByTestId("player-time").textContent(),paused);
  await page.getByLabel("Search transcript",{exact:true}).fill("nebula");
  assert.equal(await page.locator("mark").count(),1);
  await page.getByRole("button",{name:"Next match"}).click();
  assert.equal(await page.getByTestId("player-time").textContent(),"0:15");
  await page.getByRole("tab",{name:/Actions/}).click();
  await page.getByRole("button",{name:"Add",exact:true}).click();
  await page.getByLabel("Task",{exact:true}).fill("Send QA launch notes");
  await page.getByLabel("Assignee",{exact:true}).fill("Ada");
  await page.getByRole("button",{name:"Save action"}).click();
  await page.getByRole("button",{name:"Complete Send QA launch notes",exact:true}).click();
  await visible(page.getByRole("button",{name:"Reopen Send QA launch notes",exact:true}));
  await page.reload();
  await page.getByRole("tab",{name:/Actions/}).click();
  await visible(page.getByRole("button",{name:"Reopen Send QA launch notes",exact:true}));
  await page.getByRole("button",{name:"Edit action Send QA launch notes",exact:true}).click();
  await page.getByLabel("Task",{exact:true}).fill("Send final QA notes");
  await page.getByRole("button",{name:"Save action"}).click();
  await visible(page.getByRole("button",{name:"Reopen Send final QA notes",exact:true}));
  await page.getByRole("tab",{name:"Summary",exact:true}).click();
  await page.getByRole("button",{name:"Edit notes"}).click();
  await page.getByLabel("Notes",{exact:true}).fill("QA decision persists.");
  await page.getByRole("button",{name:"Save notes"}).click();
  await visible(page.getByText("QA decision persists.",{exact:true}));
  const download=page.waitForEvent("download");
  await page.getByRole("button",{name:"Export",exact:true}).click();
  assert.match((await download).suggestedFilename(),/\.md$/);
  await page.getByRole("button",{name:"Edit meeting",exact:true}).click();
  await page.getByLabel("Meeting title",{exact:true}).fill(`${title} edited`);
  await page.getByRole("button",{name:"Save changes"}).click();
  await visible(page.getByRole("heading",{name:`${title} edited`,exact:true}));
  await page.getByRole("button",{name:/Search all meetings/}).click();
  await page.getByLabel("Global search",{exact:true}).fill("nebula milestone");
  await page.getByRole("link",{name:/Jump to 0:15/}).click();
  await page.waitForURL(url=>url.searchParams.get("t")==="15");
  await poll(async()=>await page.getByTestId("player-time").textContent()==="0:15");
  await page.reload();
  await poll(async()=>await page.getByTestId("player-time").textContent()==="0:15");
  await page.screenshot({path:"test-results/detail-desktop.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:"test-results/detail-mobile.png",fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.getByRole("button",{name:"Open navigation"}).click();
  await visible(page.getByRole("navigation",{name:"Main navigation"}));
  await page.getByRole("button",{name:"Close navigation",exact:true}).click();
  await page.getByRole("button",{name:"Delete meeting",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Delete meeting",exact:true}).click();
  await page.waitForURL(base+"/");
  assert.equal((await fetch(`${api}/meetings/${createdId}`)).status,404);
  await page.screenshot({path:"test-results/dashboard-mobile.png",fullPage:true});
  assert.deepEqual(errors,[]);
  console.log("PASS: dashboard filters/views, VTT upload, seeking/gaps/play/pause, transcript search, action CRUD persistence, notes, metadata editing, export, global timestamp link, mobile navigation/layout, meeting deletion, no browser runtime errors.");
}finally{
  if(createdId)await fetch(`${api}/meetings/${createdId}`,{method:"DELETE"});
  await browser.close();
}
