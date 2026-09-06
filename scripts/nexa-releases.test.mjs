import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nexaChannel, releaseAssets } from '../src/utils/nexaReleases.ts';

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
