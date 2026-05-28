import { describe, it, expect } from 'vitest'
import { parseChannelInput } from './youtubeChannelInput'

describe('parseChannelInput', () => {
  it('"@xxx" 形式はハンドルとして解釈', () => {
    expect(parseChannelInput('@SomeChannel')).toEqual({
      kind: 'handle',
      handle: '@SomeChannel',
    })
  })

  it('"@" なしの素のハンドル候補は "@" を補完してハンドル扱い', () => {
    expect(parseChannelInput('SomeChannel')).toEqual({
      kind: 'handle',
      handle: '@SomeChannel',
    })
  })

  it('UC で始まるチャンネルIDはIDとして解釈', () => {
    expect(parseChannelInput('UC1234567890abcdefghij_-')).toEqual({
      kind: 'id',
      id: 'UC1234567890abcdefghij_-',
    })
  })

  it('youtube.com/@xxx の URL はハンドルとして抽出', () => {
    expect(
      parseChannelInput('https://www.youtube.com/@SomeChannel'),
    ).toEqual({
      kind: 'handle',
      handle: '@SomeChannel',
    })
  })

  it('youtube.com/@xxx/videos のような末尾パス付き URL でもハンドル抽出', () => {
    expect(
      parseChannelInput('https://www.youtube.com/@SomeChannel/videos'),
    ).toEqual({
      kind: 'handle',
      handle: '@SomeChannel',
    })
  })

  it('youtube.com/channel/UC... の URL はIDとして抽出', () => {
    expect(
      parseChannelInput(
        'https://www.youtube.com/channel/UC1234567890abcdefghij_-',
      ),
    ).toEqual({
      kind: 'id',
      id: 'UC1234567890abcdefghij_-',
    })
  })

  it('m.youtube.com サブドメインも対応する', () => {
    expect(
      parseChannelInput('https://m.youtube.com/@SomeChannel'),
    ).toEqual({
      kind: 'handle',
      handle: '@SomeChannel',
    })
  })

  it('空文字や空白のみは unknown', () => {
    expect(parseChannelInput('')).toEqual({ kind: 'unknown' })
    expect(parseChannelInput('   ')).toEqual({ kind: 'unknown' })
  })

  it('短すぎるハンドル候補は弾く', () => {
    expect(parseChannelInput('ab')).toEqual({ kind: 'unknown' })
  })

  it('youtu.be 短縮 URL はチャンネル判定できないため unknown', () => {
    expect(
      parseChannelInput('https://youtu.be/abcd1234'),
    ).toEqual({ kind: 'unknown' })
  })

  it('youtube.com/watch?v=... はチャンネル判定できないため unknown', () => {
    expect(
      parseChannelInput('https://www.youtube.com/watch?v=abcd1234'),
    ).toEqual({ kind: 'unknown' })
  })

  it('前後の空白はトリムされる', () => {
    expect(parseChannelInput('   @SomeChannel   ')).toEqual({
      kind: 'handle',
      handle: '@SomeChannel',
    })
  })
})
