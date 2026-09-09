import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nexaChannel, releaseAssets, loadNexaCatalog } from '../src/utils/nexaReleases.ts';

test('Nexa dotted channels never label Alpha or CI as a stable release',()=>{
  for(const [tag,expected] of [['v2.0.0.alpha.1','alpha'],['2.0.0.beta.2','beta'],['2.0.0.ci.abcdef','ci'],['2.0.0','release'],['v1.3.20-beta',null],['2.0.0.alpha.0',null],['2.0.0-bogus',null]]) assert.equal(nexaChannel(tag),expected);
});
test('Every platform uses real matching published assets, never invented filenames',()=>{
  const release=JSON.parse(readFileSync(new URL('../public/nexa-releases.json',import.meta.url))).releases[0];
  let count=0;
  for(const platform of ['win','osx','linux']) for(const arch of ['x64','arm64']) {
    const assets=releaseAssets(release,platform,arch);
    assert.ok(assets.length>0,`${platform}-${arch} has published downloads`);
    assert.ok(assets.some(a=>a.name.includes('.portable.')));
    count+=assets.length;
  }
  assert.equal(count,18);
  assert.deepEqual(releaseAssets({...release,assets:[]},'win','x64'),[]);
  const tampered={...release,assets:release.assets.map(a=>({...a,browser_download_url:'https://example.invalid/payload'}))};
  assert.deepEqual(releaseAssets(tampered,'win','x64'),[]);
});


test('live releases revalidate, coalesce requests, isolate snapshots and respect cancellation', async t => {
  let now = 1000000; let calls = 0; let offline = false; let tag = '2.0.0.alpha.99';
  const makeRelease = () => ({ tag_name: tag, name: tag, body: 'Fresh release notes', published_at: '2026-09-09T00:00:00Z', html_url: `https://github.com/PCL-N-Edition/PCL-N/releases/tag/${tag}`, assets: [] });
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'fetch', async url => {
    calls++;
    if (String(url).startsWith('https://api.github.com/')) {
      if (offline) return new Response('', {status: 503});
      return Response.json([makeRelease(), {...makeRelease(), draft:true, tag_name:'2.0.0.alpha.1000'}]);
    }
    assert.equal(String(url), '/nexa-releases.json');
    return Response.json({releases:[{...makeRelease(),body:'Saved notes'}]});
  });
  const [first, same] = await Promise.all([loadNexaCatalog(), loadNexaCatalog()]);
  assert.equal(calls,1); assert.equal(first.source,'github'); assert.equal(first.releases.length,1); assert.equal(same.releases[0].tag_name,tag);
  now += 61000; tag = '2.0.0.alpha.100';
  assert.equal((await loadNexaCatalog()).releases[0].tag_name,tag); assert.equal(calls,2);
  now += 61000; offline = true;
  const fallback = await loadNexaCatalog(); assert.equal(fallback.source,'snapshot'); assert.equal(fallback.releases[0].body,'Saved notes');
  const controller = new AbortController(); controller.abort(); const previous = calls;
  await assert.rejects(loadNexaCatalog(controller.signal), {name:'AbortError'}); assert.equal(calls,previous);
});
