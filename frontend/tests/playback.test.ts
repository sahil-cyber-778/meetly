import assert from "node:assert/strict";
import test from "node:test";
import { activeSegment, clampTime, formatTime } from "../lib/playback.ts";

const segments=[{id:1,speaker:"A",text:"First",start_time:0,end_time:10},{id:2,speaker:"B",text:"Second",start_time:15,end_time:30}];
test("seeking selects the correct speaker at each boundary",()=>{
  assert.equal(activeSegment(segments,0,30)?.id,1);
  assert.equal(activeSegment(segments,9.99,30)?.id,1);
  assert.equal(activeSegment(segments,10,30),undefined);
  assert.equal(activeSegment(segments,15,30)?.id,2);
  assert.equal(activeSegment(segments,30,30)?.id,2);
});
test("a silent gap never falls back to the final segment",()=>assert.equal(activeSegment(segments,12,30),undefined));
test("empty transcripts and invalid deep links are safe",()=>{
  assert.equal(activeSegment([],0,30),undefined);
  assert.equal(clampTime(NaN,30),0);
  assert.equal(clampTime(-10,30),0);
  assert.equal(clampTime(400,30),30);
});
test("timestamps format without rounding into the next segment",()=>assert.equal(formatTime(69.99),"1:09"));
